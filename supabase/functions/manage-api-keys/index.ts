import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * API Key Validation Guide for External API Requests
 * 
 * When building edge functions that need API key authentication:
 * 
 * 1. Extract the X-API-Key header from the request:
 *    const apiKey = req.headers.get('X-API-Key');
 * 
 * 2. Hash the key using SHA-256:
 *    const encoder = new TextEncoder();
 *    const data = encoder.encode(apiKey);
 *    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
 *    const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
 * 
 * 3. Look up the key in the api_keys table:
 *    const { data: keyData } = await supabase
 *      .from('api_keys')
 *      .select('id, tenant_id, permissions, rate_limit, revoked_at')
 *      .eq('key_hash', keyHash)
 *      .maybeSingle();
 * 
 * 4. Validate the key:
 *    - Check keyData exists
 *    - Check revoked_at is null (key not revoked)
 *    - Check permissions array includes required permission
 *    - Implement rate limiting based on rate_limit field
 * 
 * 5. Update last_used_at:
 *    await supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', keyData.id);
 * 
 * 6. Use tenant_id from keyData to scope all database queries
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// Simple hash function for API keys
async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate cryptographically secure API key
function generateApiKey(): string {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  return 'nw_' + Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
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

    // Get user's tenant
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
    const { action, keyId, name, permissions, rate_limit } = body;

    // LIST API keys
    if (req.method === 'GET' || action === 'list') {
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, name, key_prefix, permissions, rate_limit, last_used_at, created_at, revoked_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ keys: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // CREATE API key
    if (action === 'create') {
      const apiKey = generateApiKey();
      const keyHash = await hashKey(apiKey);
      const keyPrefix = apiKey.substring(0, 7);

      const validPermissions = [
        'sources:read', 'sources:write',
        'newsletters:read', 'newsletters:write',
        'analytics:read'
      ];
      const filteredPermissions = (permissions || validPermissions.slice(0, 3))
        .filter((p: string) => validPermissions.includes(p));

      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          tenant_id: tenantId,
          name: name || 'API Key',
          key_prefix: keyPrefix,
          key_hash: keyHash,
          permissions: filteredPermissions,
          rate_limit: rate_limit || 1000,
        })
        .select('id, name, key_prefix, permissions, rate_limit, created_at')
        .single();

      if (error) throw error;

      // Return full key only once
      return new Response(JSON.stringify({ 
        key: { ...data, full_key: apiKey },
        message: 'Store this key securely. It will not be shown again.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // REVOKE API key
    if (action === 'revoke' && keyId) {
      const { error } = await supabase
        .from('api_keys')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', keyId)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE API key
    if (action === 'delete' && keyId) {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
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
