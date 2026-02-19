import { callAuthEdgeFunction, callEdgeFunction } from './core';

export interface TeamInvitation {
  id:         string;
  email:      string;
  role:       'admin' | 'editor' | 'viewer';
  status:     string;
  created_at: string;
  expires_at: string;
}

export interface InvitationDetails {
  valid:        boolean;
  email?:       string;
  role?:        string;
  tenant_name?: string;
  reason?:      string;
}

export async function inviteTeamMember(body: {
  email: string;
  role:  'admin' | 'editor' | 'viewer';
}): Promise<{ success: boolean; already_invited: boolean; invitation_id?: string }> {
  return callAuthEdgeFunction('manage-team', { action: 'invite', ...body });
}

export async function getTeamInvitations(): Promise<{ invitations: TeamInvitation[] }> {
  return callAuthEdgeFunction('manage-team', { action: 'list_invitations' });
}

export async function revokeInvitation(invitation_id: string): Promise<{ success: boolean }> {
  return callAuthEdgeFunction('manage-team', { action: 'revoke', invitation_id });
}

export async function changeTeamMemberRole(member_id: string, role: string): Promise<{ success: boolean }> {
  return callAuthEdgeFunction('manage-team', { action: 'change_role', member_id, role });
}

export async function validateInvitation(token: string): Promise<InvitationDetails> {
  return callEdgeFunction('accept-invitation', { action: 'validate', token });
}

export async function acceptInvitation(token: string): Promise<{ success: boolean; tenant_id?: string }> {
  return callAuthEdgeFunction('accept-invitation', { action: 'accept', token });
}
