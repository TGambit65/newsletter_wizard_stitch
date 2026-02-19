import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey     = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Use anon client for auth check (respects JWT)
    const supabaseAuth = createClient(supabaseUrl, anonKey);
    // Use service role client for data deletion (bypasses RLS)
    const supabase     = createClient(supabaseUrl, serviceKey);

    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) return json({ error: 'Unauthorized' }, 401);

    // ── Parse body ────────────────────────────────────────────────────────────
    const body = await req.json();
    const { confirmation, reason, comment } = body as {
      confirmation: string;
      reason?:      string;
      comment?:     string;
    };

    if (confirmation !== 'DELETE') {
      return json({ error: 'Confirmation required: send { confirmation: "DELETE" }' }, 400);
    }

    // ── Resolve profile + tenant ──────────────────────────────────────────────
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, tenant_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) return json({ error: 'Profile not found' }, 404);

    const tenantId = profile.tenant_id;
    const userId   = profile.id;

    // ── Log deletion to audit trail before deleting ───────────────────────────
    await supabase.from('audit_logs').insert({
      tenant_id:     tenantId,
      user_id:       userId,
      action:        'account.delete',
      resource_type: 'account',
      resource_id:   tenantId,
      details:       { reason: reason ?? null, comment: comment ?? null },
      ip_address:    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown',
    });

    // ── Get newsletter IDs for FK references ──────────────────────────────────
    const { data: newsletters } = await supabase
      .from('newsletters')
      .select('id')
      .eq('tenant_id', tenantId);
    const newsletterIds = (newsletters ?? []).map((n: { id: string }) => n.id);

    // ── Cascade delete — most dependent tables first ───────────────────────────

    // 1. Source chunks (child of knowledge_sources + tenant)
    await supabase.from('source_chunks').delete().eq('tenant_id', tenantId);

    // 2. Knowledge sources
    await supabase.from('knowledge_sources').delete().eq('tenant_id', tenantId);

    // 3. Newsletter stats (child of newsletters)
    if (newsletterIds.length > 0) {
      await supabase.from('newsletter_stats').delete().in('newsletter_id', newsletterIds);
    }

    // 4. Newsletters
    await supabase.from('newsletters').delete().eq('tenant_id', tenantId);

    // 5. Voice profiles
    await supabase.from('voice_profiles').delete().eq('tenant_id', tenantId);

    // 6. API keys + usage
    const { data: apiKeys } = await supabase
      .from('api_keys')
      .select('id')
      .eq('tenant_id', tenantId);
    const apiKeyIds = (apiKeys ?? []).map((k: { id: string }) => k.id);
    if (apiKeyIds.length > 0) {
      await supabase.from('api_key_usage').delete().in('api_key_id', apiKeyIds);
    }
    await supabase.from('api_keys').delete().eq('tenant_id', tenantId);

    // 7. Webhooks
    await supabase.from('webhooks').delete().eq('tenant_id', tenantId);

    // 8. Tenant settings
    await supabase.from('tenant_settings').delete().eq('tenant_id', tenantId);

    // 9. Referral rewards → referrals → referral codes
    const { data: refCodes } = await supabase
      .from('referral_codes')
      .select('id')
      .eq('tenant_id', tenantId);
    const refCodeIds = (refCodes ?? []).map((c: { id: string }) => c.id);
    if (refCodeIds.length > 0) {
      const { data: refRows } = await supabase
        .from('referrals')
        .select('id')
        .in('referrer_code_id', refCodeIds);
      const refIds = (refRows ?? []).map((r: { id: string }) => r.id);
      if (refIds.length > 0) {
        await supabase.from('referral_rewards').delete().in('referral_id', refIds);
      }
      await supabase.from('referrals').delete().in('referrer_code_id', refCodeIds);
    }
    await supabase.from('referral_codes').delete().eq('tenant_id', tenantId);

    // 10. Beta feature states and feedback
    await supabase.from('tenant_beta_features').delete().eq('tenant_id', tenantId);
    await supabase.from('feature_request_votes').delete().eq('tenant_id', tenantId);
    await supabase.from('feedback').delete().eq('tenant_id', tenantId);

    // 11. Audit logs for this tenant
    await supabase.from('audit_logs').delete().eq('tenant_id', tenantId);

    // 12. Profile
    await supabase.from('profiles').delete().eq('id', userId);

    // 13. Tenant
    await supabase.from('tenants').delete().eq('id', tenantId);

    // 14. Delete from Supabase Auth (must be last)
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(user.id);
    if (deleteAuthError) {
      // Log but don't fail — data is already deleted
      console.error('auth.admin.deleteUser failed:', deleteAuthError.message);
    }

    return json({ success: true });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
