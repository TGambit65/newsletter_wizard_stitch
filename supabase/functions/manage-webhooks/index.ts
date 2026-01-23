import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE',
};

// Generate cryptographically secure webhook secret
function generateSecret(): string {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  return 'whsec_' + Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return new Response(JSON.stringify({ error: 'No tenant found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tenantId = profile.tenant_id;
    const body = await req.json().catch(() => ({}));
    const { action, webhookId, url, events, enabled } = body;

    const validEvents = ['newsletter.sent', 'newsletter.opened', 'newsletter.clicked', 'source.processed'];

    // LIST webhooks
    if (action === 'list') {
      const { data, error } = await supabase
        .from('webhooks')
        .select('id, url, events, enabled, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ webhooks: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // CREATE webhook
    if (action === 'create') {
      if (!url) {
        return new Response(JSON.stringify({ error: 'URL is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Validate URL format and require HTTPS
      try {
        const parsedUrl = new URL(url);
        if (parsedUrl.protocol !== 'https:') {
          return new Response(JSON.stringify({ error: 'Webhook URL must use HTTPS' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid URL format' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const secret = generateSecret();
      const filteredEvents = (events || ['newsletter.sent'])
        .filter((e: string) => validEvents.includes(e));

      const { data, error } = await supabase
        .from('webhooks')
        .insert({
          tenant_id: tenantId,
          url,
          events: filteredEvents,
          secret,
          enabled: enabled !== false,
        })
        .select('id, url, events, enabled, created_at')
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ 
        webhook: { ...data, secret },
        message: 'Store the secret securely. It will not be shown again.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // UPDATE webhook
    if (action === 'update' && webhookId) {
      const updates: Record<string, unknown> = {};
      if (url) updates.url = url;
      if (events) updates.events = events.filter((e: string) => validEvents.includes(e));
      if (typeof enabled === 'boolean') updates.enabled = enabled;

      const { data, error } = await supabase
        .from('webhooks')
        .update(updates)
        .eq('id', webhookId)
        .eq('tenant_id', tenantId)
        .select('id, url, events, enabled, created_at')
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ webhook: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE webhook
    if (action === 'delete' && webhookId) {
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', webhookId)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET delivery logs
    if (action === 'deliveries' && webhookId) {
      const { data, error } = await supabase
        .from('webhook_deliveries')
        .select('id, event_type, status, attempts, response_code, delivered_at')
        .eq('webhook_id', webhookId)
        .order('delivered_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return new Response(JSON.stringify({ deliveries: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
