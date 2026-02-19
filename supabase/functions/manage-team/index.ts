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

    // ── JWT auth ─────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) return json({ error: 'Unauthorized' }, 401);

    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('id, tenant_id, full_name, email, role')
      .eq('id', user.id)
      .single();
    if (!callerProfile) return json({ error: 'Profile not found' }, 404);

    const tenantId = callerProfile.tenant_id;
    const userId   = callerProfile.id;
    const callerRole: string = callerProfile.role || 'editor';

    const body = await req.json();
    const { action } = body;

    // ── invite ────────────────────────────────────────────────────────────────
    if (action === 'invite') {
      // Only owner/admin can invite
      if (!['owner', 'admin'].includes(callerRole)) {
        return json({ error: 'Only owners and admins can invite members' }, 403);
      }

      const { email, role = 'editor' } = body;
      if (!email) return json({ error: 'email is required' }, 400);
      if (!['admin', 'editor', 'viewer'].includes(role)) {
        return json({ error: 'role must be admin, editor, or viewer' }, 400);
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Check for existing pending invitation
      const { data: existing } = await supabase
        .from('team_invitations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('email', normalizedEmail)
        .eq('status', 'pending')
        .maybeSingle();

      if (existing) {
        return json({ success: true, already_invited: true });
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('profiles')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (existingMember) {
        return json({ error: 'This person is already a member of your workspace' }, 409);
      }

      // Generate secure token
      const tokenBytes = new Uint8Array(32);
      crypto.getRandomValues(tokenBytes);
      const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');

      const { data: invitation, error: inviteError } = await supabase
        .from('team_invitations')
        .insert({
          tenant_id:  tenantId,
          email:      normalizedEmail,
          role,
          invited_by: userId,
          token,
          status:     'pending',
        })
        .select()
        .single();

      if (inviteError || !invitation) {
        return json({ error: 'Failed to create invitation' }, 500);
      }

      // Send email via Resend (no-op if key not configured)
      const resendKey = Deno.env.get('RESEND_API_KEY');
      if (resendKey) {
        const appUrl    = Deno.env.get('APP_URL') || 'https://app.newsletterwizard.io';
        const inviteUrl = `${appUrl}/accept-invite?token=${token}`;
        const inviterName = callerProfile.full_name || callerProfile.email;

        await fetch('https://api.resend.com/emails', {
          method:  'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({
            from:    'Newsletter Wizard <noreply@newsletterwizard.io>',
            to:      [normalizedEmail],
            subject: `${inviterName} invited you to join Newsletter Wizard`,
            html:    `
              <h2>You've been invited to Newsletter Wizard</h2>
              <p><strong>${inviterName}</strong> has invited you to join their workspace as <strong>${role}</strong>.</p>
              <p>
                <a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:8px;font-weight:600;">
                  Accept Invitation
                </a>
              </p>
              <p style="color:#666;font-size:14px;">This invitation expires in 7 days. If you didn't expect this, you can ignore this email.</p>
            `,
          }),
        }).catch(e => console.error('Email send error:', e));
      }

      return json({ success: true, already_invited: false, invitation_id: invitation.id });
    }

    // ── list_invitations ──────────────────────────────────────────────────────
    if (action === 'list_invitations') {
      const { data: invitations } = await supabase
        .from('team_invitations')
        .select('id, email, role, status, created_at, expires_at')
        .eq('tenant_id', tenantId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      return json({ invitations: invitations || [] });
    }

    // ── revoke ────────────────────────────────────────────────────────────────
    if (action === 'revoke') {
      if (!['owner', 'admin'].includes(callerRole)) {
        return json({ error: 'Only owners and admins can revoke invitations' }, 403);
      }

      const { invitation_id } = body;
      if (!invitation_id) return json({ error: 'invitation_id is required' }, 400);

      await supabase
        .from('team_invitations')
        .update({ status: 'revoked' })
        .eq('id', invitation_id)
        .eq('tenant_id', tenantId);

      return json({ success: true });
    }

    // ── change_role ───────────────────────────────────────────────────────────
    if (action === 'change_role') {
      if (!['owner', 'admin'].includes(callerRole)) {
        return json({ error: 'Only owners and admins can change roles' }, 403);
      }

      const { member_id, role } = body;
      if (!member_id || !role) return json({ error: 'member_id and role are required' }, 400);
      if (!['admin', 'editor', 'viewer'].includes(role)) {
        return json({ error: 'Invalid role' }, 400);
      }
      if (member_id === userId) return json({ error: 'Cannot change your own role' }, 400);

      await supabase
        .from('profiles')
        .update({ role })
        .eq('id', member_id)
        .eq('tenant_id', tenantId);

      return json({ success: true });
    }

    return json({ error: `Unknown action: ${action}` }, 400);

  } catch (error) {
    console.error('manage-team error:', error);
    return json({ error: { code: 'TEAM_ERROR', message: (error as Error).message } }, 500);
  }
});
