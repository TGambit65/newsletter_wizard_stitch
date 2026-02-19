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

/** Generate a short, unique, uppercase referral code from a UUID fragment. */
function generateCode(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
}

/** Simple email send via Resend. No-ops gracefully if RESEND_API_KEY not set. */
async function sendInviteEmail(toEmail: string, referralLink: string) {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!resendKey) {
    console.log(`[manage-referrals] RESEND_API_KEY not set — skipping email to ${toEmail}`);
    return;
  }

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:    'Newsletter Wizard <noreply@newsletterwizard.io>',
      to:      [toEmail],
      subject: "You've been invited to Newsletter Wizard",
      html: `
        <p>Hey there,</p>
        <p>A friend invited you to try Newsletter Wizard — the AI-powered newsletter platform.</p>
        <p><a href="${referralLink}" style="background:#0066FF;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Accept your invite
        </a></p>
        <p style="color:#888;font-size:12px">Newsletter Wizard · <a href="https://newsletterwizard.io">newsletterwizard.io</a></p>
      `,
    }),
  });
}

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
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) return json({ error: 'Unauthorized' }, 401);

    // ── Resolve profile + tenant ──────────────────────────────────────────────
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, tenant_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) return json({ error: 'Profile not found' }, 404);

    const tenantId = profile.tenant_id;
    const userId   = profile.id;

    // ── Parse body ────────────────────────────────────────────────────────────
    const body = await req.json();
    const { action, email } = body as { action: string; email?: string };

    // ─────────────────────────────────────────────────────────────────────────
    // Action: get_code
    // Returns (or creates) the referral code for this user/tenant.
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'get_code') {
      const { data: existing } = await supabase
        .from('referral_codes')
        .select('id, code')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const link = `https://newsletterwizard.io/signup?ref=${existing.code}`;
        return json({ code: existing.code, link });
      }

      // Create a new code — retry once on collision
      let code = generateCode();
      let { error: insertError } = await supabase
        .from('referral_codes')
        .insert({ tenant_id: tenantId, user_id: userId, code });

      if (insertError?.code === '23505') {
        // Unique violation — try a different code
        code = generateCode();
        const retry = await supabase
          .from('referral_codes')
          .insert({ tenant_id: tenantId, user_id: userId, code });
        if (retry.error) throw retry.error;
      } else if (insertError) {
        throw insertError;
      }

      const link = `https://newsletterwizard.io/signup?ref=${code}`;
      return json({ code, link });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Action: get_stats
    // Returns invitation + conversion counts for this tenant.
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'get_stats') {
      const { data: code } = await supabase
        .from('referral_codes')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!code) {
        return json({ sent: 0, converted: 0, earned: '$0' });
      }

      const { data: referrals } = await supabase
        .from('referrals')
        .select('status')
        .eq('referrer_code_id', code.id);

      const sent      = referrals?.length ?? 0;
      const converted = referrals?.filter((r: { status: string }) => r.status === 'converted').length ?? 0;

      // Rewards: $29/month per converted referral (simplified)
      const earnedDollars = converted * 29;
      const earned = earnedDollars > 0 ? `$${earnedDollars}` : '$0';

      return json({ sent, converted, earned });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Action: send_invite
    // Creates a referral row and emails the invitee.
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'send_invite') {
      if (!email?.trim()) {
        return json({ error: 'email is required for send_invite' }, 400);
      }

      // Ensure code exists
      let { data: codeRow } = await supabase
        .from('referral_codes')
        .select('id, code')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!codeRow) {
        const code = generateCode();
        const { data: newCode, error: codeErr } = await supabase
          .from('referral_codes')
          .insert({ tenant_id: tenantId, user_id: userId, code })
          .select('id, code')
          .single();
        if (codeErr) throw codeErr;
        codeRow = newCode;
      }

      const referralLink = `https://newsletterwizard.io/signup?ref=${codeRow.code}`;

      // Check for duplicate invite
      const { data: existing } = await supabase
        .from('referrals')
        .select('id')
        .eq('referrer_code_id', codeRow.id)
        .eq('referee_email', email.trim().toLowerCase())
        .maybeSingle();

      if (!existing) {
        const { error: insertErr } = await supabase.from('referrals').insert({
          referrer_code_id:   codeRow.id,
          referrer_tenant_id: tenantId,
          referee_email:      email.trim().toLowerCase(),
          status:             'invited',
        });
        if (insertErr) throw insertErr;
      }

      // Send email (no-op if RESEND_API_KEY not set)
      await sendInviteEmail(email.trim(), referralLink);

      return json({ success: true, already_invited: !!existing });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Action: get_leaderboard
    // Top 5 tenants by total referral count (any status).
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'get_leaderboard') {
      // Join referral_codes → referrals → count
      const { data: codes } = await supabase
        .from('referral_codes')
        .select('id, tenant_id, code');

      if (!codes || codes.length === 0) {
        return json({ leaderboard: [] });
      }

      const codeIds = codes.map((c: { id: string }) => c.id);

      const { data: referrals } = await supabase
        .from('referrals')
        .select('referrer_code_id, status')
        .in('referrer_code_id', codeIds);

      // Aggregate by code_id → tenant_id
      const countByCode: Record<string, number> = {};
      for (const r of referrals ?? []) {
        countByCode[r.referrer_code_id] = (countByCode[r.referrer_code_id] ?? 0) + 1;
      }

      // Map code_id → tenant_id
      const tenantCount: Record<string, number> = {};
      for (const code of codes) {
        tenantCount[code.tenant_id] = (tenantCount[code.tenant_id] ?? 0) + (countByCode[code.id] ?? 0);
      }

      // Fetch tenant names for top 5
      const sortedTenantIds = Object.entries(tenantCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([id]) => id);

      const { data: tenants } = await supabase
        .from('tenants')
        .select('id, name')
        .in('id', sortedTenantIds);

      const leaderboard = sortedTenantIds.map((tid, idx) => {
        const t = tenants?.find((ten: { id: string }) => ten.id === tid);
        // Anonymize: show only first word + last initial
        const nameParts = (t?.name ?? 'Anonymous').split(' ');
        const display = nameParts.length > 1
          ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
          : nameParts[0];
        return {
          rank:      idx + 1,
          name:      display,
          referrals: tenantCount[tid],
        };
      });

      return json({ leaderboard });
    }

    return json({ error: `Unknown action: ${action}` }, 400);

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
