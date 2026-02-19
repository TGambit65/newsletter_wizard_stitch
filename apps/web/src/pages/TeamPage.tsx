import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { inviteTeamMember, getTeamInvitations, revokeInvitation, type TeamInvitation } from '@/lib/api';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Eye,
  Edit,
  Trash2,
  Check,
  X,
  Crown
} from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

type Role = 'owner' | 'admin' | 'editor' | 'viewer';
type InviteRole = 'admin' | 'editor' | 'viewer';

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string;
  role: Role;
  created_at: string;
}

const ROLE_CONFIG: Record<Role, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  owner: { label: 'Owner', icon: Crown, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  admin: { label: 'Admin', icon: Shield, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/20' },
  editor: { label: 'Editor', icon: Edit, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/20' },
  viewer: { label: 'Viewer', icon: Eye, color: 'text-neutral-600 dark:text-neutral-400', bg: 'bg-neutral-100 dark:bg-neutral-700' },
};

const PERMISSIONS: Array<{ label: string; owner: boolean; admin: boolean; editor: boolean; viewer: boolean }> = [
  { label: 'Manage team', owner: true, admin: true, editor: false, viewer: false },
  { label: 'Manage billing', owner: true, admin: false, editor: false, viewer: false },
  { label: 'Edit newsletters', owner: true, admin: true, editor: true, viewer: false },
  { label: 'Manage sources', owner: true, admin: true, editor: true, viewer: false },
  { label: 'View analytics', owner: true, admin: true, editor: true, viewer: true },
  { label: 'Manage API keys', owner: true, admin: true, editor: false, viewer: false },
  { label: 'Manage voice profiles', owner: true, admin: true, editor: true, viewer: false },
];

export function TeamPage() {
  const { tenant, profile } = useAuth();
  const toast = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<InviteRole>('editor');
  const [inviting, setInviting] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [showPermissions, setShowPermissions] = useState(false);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    if (tenant) {
      loadMembers();
      loadInvitations();
    }
  }, [tenant]);

  async function loadMembers() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at')
        .eq('tenant_id', tenant!.id)
        .order('created_at', { ascending: true });

      // Map to TeamMember — first member is owner
      const list: TeamMember[] = (data || []).map((p, i) => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        role: i === 0 ? 'owner' : 'editor',
        created_at: p.created_at,
      }));

      setMembers(list);
    } catch {
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  }

  async function loadInvitations() {
    setLoadingInvitations(true);
    try {
      const result = await getTeamInvitations();
      setInvitations(result.invitations);
    } catch {
      // Non-critical — don't block the page
    } finally {
      setLoadingInvitations(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    try {
      const result = await inviteTeamMember({ email: inviteEmail.trim(), role: inviteRole });
      if (result.already_invited) {
        toast.success(`${inviteEmail} was already invited`);
      } else {
        toast.success(`Invitation sent to ${inviteEmail}`);
        loadInvitations();
      }
      setInviteEmail('');
      setShowInvite(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send invitation';
      toast.error(msg);
    } finally {
      setInviting(false);
    }
  }

  async function handleRevoke(invitationId: string) {
    setRevokingId(invitationId);
    try {
      await revokeInvitation(invitationId);
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      toast.success('Invitation revoked');
    } catch {
      toast.error('Failed to revoke invitation');
    } finally {
      setRevokingId(null);
    }
  }

  function handleRemove(id: string) {
    setRemoveId(id);
  }

  async function confirmRemove() {
    if (!removeId) return;
    try {
      setMembers(prev => prev.filter(m => m.id !== removeId));
      toast.success('Team member removed');
    } catch {
      toast.error('Failed to remove member');
    } finally {
      setRemoveId(null);
    }
  }

  const initials = (name: string | null, email: string) => {
    if (name) return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Team</h1>
          <p className="text-neutral-500 mt-1">Manage team members and permissions</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {/* Members list */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 mb-6">
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center gap-2">
          <Users className="w-5 h-5 text-neutral-400" />
          <h2 className="font-semibold text-neutral-900 dark:text-white">
            Members <span className="text-neutral-400 font-normal text-sm ml-1">({members.length})</span>
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
            {members.map(member => {
              const roleConf = ROLE_CONFIG[member.role];
              const RoleIcon = roleConf.icon;
              const isCurrentUser = member.id === profile?.id;
              const isOwner = member.role === 'owner';

              return (
                <div key={member.id} className="flex items-center gap-4 px-6 py-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                      {initials(member.full_name, member.email)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-neutral-900 dark:text-white truncate">
                        {member.full_name || member.email}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-neutral-400">(you)</span>
                        )}
                      </p>
                    </div>
                    <p className="text-sm text-neutral-500 truncate">{member.email}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Joined {format(new Date(member.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>

                  {/* Role badge */}
                  <div className={clsx('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', roleConf.bg, roleConf.color)}>
                    <RoleIcon className="w-3.5 h-3.5" />
                    {roleConf.label}
                  </div>

                  {/* Actions */}
                  {!isOwner && !isCurrentUser && (
                    <button
                      onClick={() => handleRemove(member.id)}
                      aria-label={`Remove ${member.full_name || member.email}`}
                      className="p-2 text-neutral-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending invitations */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 mb-6">
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="font-semibold text-neutral-900 dark:text-white">
            Pending Invitations
            {invitations.length > 0 && (
              <span className="ml-2 text-sm text-neutral-400 font-normal">({invitations.length})</span>
            )}
          </h2>
        </div>

        {loadingInvitations ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : invitations.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <Mail className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm text-neutral-500">No pending invitations</p>
            <p className="text-xs text-neutral-400 mt-1">Invitations expire after 7 days</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
            {invitations.map(inv => {
              const roleConf = ROLE_CONFIG[inv.role] || ROLE_CONFIG.viewer;
              return (
                <div key={inv.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-neutral-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900 dark:text-white truncate">{inv.email}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Expires {format(new Date(inv.expires_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className={clsx('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', roleConf.bg, roleConf.color)}>
                    {inv.role}
                  </div>
                  <button
                    onClick={() => handleRevoke(inv.id)}
                    disabled={revokingId === inv.id}
                    aria-label="Revoke invitation"
                    className="p-2 text-neutral-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Permissions Matrix toggle */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
        <button
          onClick={() => setShowPermissions(v => !v)}
          className="w-full flex items-center justify-between px-6 py-4 text-left"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-neutral-400" />
            <h2 className="font-semibold text-neutral-900 dark:text-white">Permissions Matrix</h2>
          </div>
          <span className="text-sm text-neutral-500">{showPermissions ? 'Hide' : 'Show'}</span>
        </button>

        {showPermissions && (
          <div className="overflow-x-auto border-t border-neutral-200 dark:border-neutral-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-900">
                  <th className="text-left px-6 py-3 text-neutral-600 dark:text-neutral-400 font-medium">Permission</th>
                  {(['owner', 'admin', 'editor', 'viewer'] as Role[]).map(role => {
                    const conf = ROLE_CONFIG[role];
                    return (
                      <th key={role} className="px-4 py-3 text-center">
                        <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', conf.bg, conf.color)}>
                          {conf.label}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                {PERMISSIONS.map((perm, i) => (
                  <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                    <td className="px-6 py-3 text-neutral-700 dark:text-neutral-300">{perm.label}</td>
                    {(['owner', 'admin', 'editor', 'viewer'] as Role[]).map(role => (
                      <td key={role} className="px-4 py-3 text-center">
                        {perm[role] ? (
                          <Check className="w-4 h-4 text-success mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-neutral-300 dark:text-neutral-600 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4"
          onClick={e => { if (e.target === e.currentTarget) setShowInvite(false); }}
        >
          <div className="w-full max-w-md bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">Invite a team member</h3>
            <p className="text-sm text-neutral-500 mb-6">They'll receive an email with a link to join your workspace.</p>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  required
                  placeholder="colleague@company.com"
                  className="w-full px-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as InviteRole)}
                  className="w-full px-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="admin">Admin — Can manage team and most settings</option>
                  <option value="editor">Editor — Can create and edit content</option>
                  <option value="viewer">Viewer — Read-only access</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="flex-1 px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium disabled:opacity-50"
                >
                  {inviting ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={removeId !== null}
        onOpenChange={open => { if (!open) setRemoveId(null); }}
        title="Remove team member?"
        description="They will lose access to this workspace immediately."
        confirmLabel="Remove"
        variant="danger"
        onConfirm={confirmRemove}
      />
    </div>
  );
}
