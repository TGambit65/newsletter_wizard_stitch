import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase    = createClient(supabaseUrl, serviceKey);

    // ── JWT auth ──────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) return json({ error: 'Unauthorized' }, 401);

    // ── Idempotency check: profile already exists ─────────────────────────────
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, tenant_id')
      .eq('id', user.id)
      .maybeSingle();

    if (existingProfile) {
      return json({ success: true, already_exists: true });
    }

    // ── Derive workspace name and slug from user metadata ─────────────────────
    const fullName    = (user.user_metadata?.full_name as string | undefined) || null;
    const emailHandle = (user.email ?? '').split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
    const tenantName  = fullName || emailHandle;
    const tenantSlug  = `${emailHandle}-${Date.now()}`;

    // ── Create tenant ─────────────────────────────────────────────────────────
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name:             tenantName,
        slug:             tenantSlug,
        subscription_tier: 'free',
      })
      .select()
      .single();

    if (tenantError || !tenant) {
      console.error('tenant create error:', tenantError);
      return json({ error: 'Failed to create workspace' }, 500);
    }

    // ── Create profile ────────────────────────────────────────────────────────
    const { error: profileError } = await supabase.from('profiles').insert({
      id:        user.id,
      tenant_id: tenant.id,
      email:     user.email ?? '',
      full_name: fullName,
      role:      'owner',
      timezone:  'UTC',
      is_active: true,
    });

    if (profileError) {
      // Rollback: remove the tenant to avoid orphaned records
      await supabase.from('tenants').delete().eq('id', tenant.id);
      console.error('profile create error:', profileError);
      return json({ error: 'Failed to create profile' }, 500);
    }

    return json({ success: true, already_exists: false });

  } catch (error) {
    console.error('create-workspace error:', error);
    return json({ error: { code: 'WORKSPACE_FAILED', message: (error as Error).message } }, 500);
  }
});
