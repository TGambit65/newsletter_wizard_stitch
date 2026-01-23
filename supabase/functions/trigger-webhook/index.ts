import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sign payload with secret using HMAC-SHA256
async function signPayload(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Deliver webhook with retry logic
async function deliverWebhook(
  supabase: any,
  webhook: { id: string; url: string; secret: string },
  eventType: string,
  payload: Record<string, unknown>,
  attempt: number = 1
): Promise<{ success: boolean; responseCode?: number }> {
  const maxAttempts = 3;
  const payloadStr = JSON.stringify({ event: eventType, data: payload, timestamp: new Date().toISOString() });
  const signature = await signPayload(payloadStr, webhook.secret);

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': eventType,
      },
      body: payloadStr,
    });

    const responseCode = response.status;
    const success = response.ok;

    // Record delivery
    await supabase.from('webhook_deliveries').insert({
      webhook_id: webhook.id,
      event_type: eventType,
      payload,
      status: success ? 'delivered' : 'failed',
      attempts: attempt,
      response_code: responseCode,
      delivered_at: new Date().toISOString(),
    });

    // Retry with exponential backoff if failed and attempts remain
    if (!success && attempt < maxAttempts) {
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      await new Promise(resolve => setTimeout(resolve, delay));
      return deliverWebhook(supabase, webhook, eventType, payload, attempt + 1);
    }

    return { success, responseCode };
  } catch (error) {
    // Record failed attempt
    await supabase.from('webhook_deliveries').insert({
      webhook_id: webhook.id,
      event_type: eventType,
      payload,
      status: 'failed',
      attempts: attempt,
      response_code: 0,
      delivered_at: new Date().toISOString(),
    });

    if (attempt < maxAttempts) {
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return deliverWebhook(supabase, webhook, eventType, payload, attempt + 1);
    }

    return { success: false, responseCode: 0 };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Authenticate - this endpoint is for internal use only
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${supabaseKey}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized - internal use only' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { tenant_id, event_type, payload } = await req.json();

    if (!tenant_id || !event_type || !payload) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find all enabled webhooks for this tenant subscribed to this event
    const { data: webhooks, error } = await supabase
      .from('webhooks')
      .select('id, url, secret')
      .eq('tenant_id', tenant_id)
      .eq('enabled', true)
      .contains('events', [event_type]);

    if (error) throw error;

    if (!webhooks || webhooks.length === 0) {
      return new Response(JSON.stringify({ message: 'No webhooks registered for this event' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Deliver to all matching webhooks in parallel
    const results = await Promise.all(
      webhooks.map(webhook => deliverWebhook(supabase, webhook, event_type, payload))
    );

    const successCount = results.filter(r => r.success).length;

    return new Response(JSON.stringify({ 
      delivered: successCount,
      total: webhooks.length,
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
