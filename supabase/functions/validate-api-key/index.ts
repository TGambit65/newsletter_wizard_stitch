import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// Hash API key using SHA-256
async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract API key from header or body
    let apiKey = req.headers.get('X-API-Key');
    
    // Also accept in body for internal calls
    if (!apiKey) {
      const body = await req.json().catch(() => ({}));
      apiKey = body.api_key;
    }

    if (!apiKey) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'API key required. Provide X-API-Key header.' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Hash the key
    const keyHash = await hashKey(apiKey);

    // Look up key in database
    const { data: keyRecord, error: lookupError } = await supabase
      .from('api_keys')
      .select('id, tenant_id, permissions, rate_limit, revoked_at')
      .eq('key_hash', keyHash)
      .maybeSingle();

    if (lookupError) {
      console.error('Database error:', lookupError);
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Internal error' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!keyRecord) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Invalid API key' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (keyRecord.revoked_at) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'API key has been revoked' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check rate limit (sliding window - last hour)
    const hourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count, error: countError } = await supabase
      .from('api_key_usage')
      .select('*', { count: 'exact', head: true })
      .eq('api_key_id', keyRecord.id)
      .gte('created_at', hourAgo);

    if (countError) {
      console.error('Count error:', countError);
    }

    const currentUsage = count || 0;

    if (currentUsage >= keyRecord.rate_limit) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Rate limit exceeded. Try again later.',
        rate_limit: keyRecord.rate_limit,
        current_usage: currentUsage,
        retry_after: 3600
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': '3600'
        },
      });
    }

    // Log this usage
    await supabase.from('api_key_usage').insert({ 
      api_key_id: keyRecord.id 
    });

    // Update last_used_at
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyRecord.id);

    // Return success with tenant context
    return new Response(JSON.stringify({ 
      valid: true,
      tenant_id: keyRecord.tenant_id,
      permissions: keyRecord.permissions,
      rate_limit: keyRecord.rate_limit,
      current_usage: currentUsage + 1
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Validation error:', error);
    return new Response(JSON.stringify({ 
      valid: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
