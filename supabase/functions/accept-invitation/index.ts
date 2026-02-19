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

    const body = await req.json();
    const { action, token } = body;

    if (!token) return json({ error: 'token is required' }, 400);

    // ── Resolve invitation ────────────────────────────────────────────────────
    const { data: invitation } = await supabase
      .from('team_invitations')
      .select('id, tenant_id, email, role, status, expires_at')
      .eq('token', token)
      .maybeSingle();

    if (!invitation) {
      return json({ valid: false, reason: 'Invitation not found' }, 404);
    }
    if (invitation.status !== 'pending') {
      return json({ valid: false, reason: 'Invitation has already been used or revoked' }, 410);
    }
    if (new Date(invitation.expires_at) < new Date()) {
      return json({ valid: false, reason: 'Invitation has expired' }, 410);
    }

    // ── validate: return details without accepting ────────────────────────────
    if (action === 'validate') {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('name')
        .eq('id', invitation.tenant_id)
        .maybeSingle();

      return json({
        valid:       true,
        email:       invitation.email,
        role:        invitation.role,
        tenant_name: tenant?.name ?? 'Unknown Workspace',
      });
    }

    // ── accept: requires JWT ──────────────────────────────────────────────────
    if (action === 'accept') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) return json({ error: 'Unauthorized' }, 401);

      const { data: { user }, error: authError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      if (authError || !user) return json({ error: 'Unauthorized' }, 401);

      const userEmail    = (user.email ?? '').toLowerCase();
      const invitedEmail = invitation.email.toLowerCase();

      if (userEmail !== invitedEmail) {
        return json({ error: 'This invitation was sent to a different email address' }, 403);
      }

      // Check if user already has a profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, tenant_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        if (profile.tenant_id === invitation.tenant_id) {
          // Already a member — idempotent success
          await supabase
            .from('team_invitations')
            .update({ status: 'accepted' })
            .eq('id', invitation.id);
          return json({ success: true, tenant_id: invitation.tenant_id });
        }
        return json({ error: 'You are already a member of a different workspace' }, 409);
      }

      // New user — create profile in invitation tenant (no personal tenant created)
      const { error: profileError } = await supabase.from('profiles').insert({
        id:        user.id,
        tenant_id: invitation.tenant_id,
        email:     userEmail,
        full_name: user.user_metadata?.full_name ?? null,
        role:      invitation.role,
        is_active: true,
      });

      if (profileError) {
        console.error('profile insert error:', profileError);
        return json({ error: 'Failed to create profile' }, 500);
      }

      // Mark accepted
      await supabase
        .from('team_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      return json({ success: true, tenant_id: invitation.tenant_id });
    }

    return json({ error: `Unknown action: ${action}` }, 400);

  } catch (error) {
    console.error('accept-invitation error:', error);
    return json({ error: { code: 'ACCEPT_FAILED', message: (error as Error).message } }, 500);
  }
});
