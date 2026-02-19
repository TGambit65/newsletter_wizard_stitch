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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase    = createClient(supabaseUrl, serviceKey);

    // ── Auth ──────────────────────────────────────────────────────────────────
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

    // ── Resolve tenant ────────────────────────────────────────────────────────
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, tenant_id, email, full_name, role, created_at')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tenantId = profile.tenant_id;

    // ── Parallel fetch all tenant data ────────────────────────────────────────
    const [
      tenantResult,
      newslettersResult,
      sourcesResult,
      statsResult,
      voiceResult,
      apiKeysResult,
      referralCodesResult,
      referralsResult,
      feedbackResult,
    ] = await Promise.all([
      supabase
        .from('tenants')
        .select('id, name, slug, subscription_tier, created_at')
        .eq('id', tenantId)
        .single(),

      supabase
        .from('newsletters')
        .select('id, title, subject_line, preheader, content_html, status, scheduled_at, sent_at, created_at, updated_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false }),

      supabase
        .from('knowledge_sources')
        .select('id, source_type, source_uri, title, description, status, token_count, chunk_count, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false }),

      supabase
        .from('newsletter_stats')
        .select('id, newsletter_id, total_sent, unique_opens, open_rate, unique_clicks, click_rate, unsubscribes')
        .in(
          'newsletter_id',
          // sub-select newsletter IDs for this tenant — use a simple array approach
          (await supabase.from('newsletters').select('id').eq('tenant_id', tenantId)).data?.map((n: { id: string }) => n.id) ?? []
        ),

      supabase
        .from('voice_profiles')
        .select('id, voice_prompt, tone_markers, created_at')
        .eq('tenant_id', tenantId),

      supabase
        .from('api_keys')
        .select('id, name, key_prefix, permissions, rate_limit, last_used_at, created_at, revoked_at')
        .eq('tenant_id', tenantId),

      supabase
        .from('referral_codes')
        .select('id, code, created_at')
        .eq('tenant_id', tenantId),

      supabase
        .from('referrals')
        .select('id, referee_email, status, created_at, converted_at')
        .eq('referrer_tenant_id', tenantId),

      supabase
        .from('feedback')
        .select('id, mood, comment, created_at')
        .eq('tenant_id', tenantId),
    ]);

    // ── Build export payload ──────────────────────────────────────────────────
    const exportPayload = {
      exported_at:        new Date().toISOString(),
      export_version:     '1.0',
      profile: {
        id:           profile.id,
        email:        profile.email,
        full_name:    profile.full_name,
        role:         profile.role,
        created_at:   profile.created_at,
      },
      tenant:             tenantResult.data,
      newsletters:        newslettersResult.data        ?? [],
      newsletter_stats:   statsResult.data              ?? [],
      knowledge_sources:  sourcesResult.data            ?? [],
      voice_profiles:     voiceResult.data              ?? [],
      api_keys:           apiKeysResult.data            ?? [],
      referral_codes:     referralCodesResult.data      ?? [],
      referrals:          referralsResult.data          ?? [],
      feedback:           feedbackResult.data           ?? [],
    };

    return new Response(JSON.stringify(exportPayload, null, 2), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="newsletter-wizard-export.json"',
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
