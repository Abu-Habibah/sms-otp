'use client';

import { useEffect, useState } from 'react';
import { Workspace, WorkspaceRole } from '@sms-monitor/shared-types';
import { Users, Plus, X, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface MembersTabProps {
  workspace: Workspace;
  jwt: string;
}

interface WorkspaceMember {
  id: string;
  displayName: string;
  email: string;
  createdAt: string;
  workspaceRole: WorkspaceRole;
}

const ROLES: WorkspaceRole[] = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];

const roleColors: Record<WorkspaceRole, string> = {
  OWNER: 'text-[#6366F1] bg-[#EEF2FF] border-[#6366F1]/20',
  ADMIN: 'text-[#10B981] bg-[#ECFDF5] border-[#10B981]/20',
  MEMBER: 'text-[#F59E0B] bg-[#FFFBEB] border-[#F59E0B]/20',
  VIEWER: 'text-[#6B7280] bg-[#F3F4F6] border-[#6B7280]/20',
};

function AddMemberModal({ open, onClose, workspaceId, onAdded }: {
  open: boolean; onClose: () => void; workspaceId: string; onAdded: () => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('MEMBER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/workspaces/${workspaceId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? 'Failed to add member');
      }
      onAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Add Member</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as WorkspaceRole)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {ROLES.map((r) => (<option key={r} value={r}>{r}</option>))}
            </select>
            <p className="text-xs text-muted-foreground">OWNER &gt; ADMIN &gt; MEMBER &gt; VIEWER</p>
          </div>
          {error && <p className="text-sm text-destructive rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2">{error}</p>}
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !email}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Member
          </Button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({ open, title, message, onConfirm, onCancel, loading }: {
  open: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-lg space-y-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MembersTab({ workspace, jwt }: MembersTabProps) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WorkspaceMember | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/workspaces/${workspace.id}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(Array.isArray(data) ? data : data.members ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshMembers(); }, [workspace.id]);

  const handleRoleChange = async (userId: string, newRole: WorkspaceRole) => {
    setActionLoading(userId);
    setError(null);
    try {
      const res = await fetch(`/api/v1/workspaces/${workspace.id}/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error('Failed to update role');
      await refreshMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async () => {
    if (!deleteTarget) return;
    setActionLoading(deleteTarget.id);
    setError(null);
    try {
      const res = await fetch(`/api/v1/workspaces/${workspace.id}/members/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove member');
      await refreshMembers();
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center justify-between mb-4">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>
      {members.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No members</h3>
          <p className="mt-1 text-sm text-muted-foreground">Add members to collaborate on this workspace.</p>
          <Button onClick={() => setShowAddModal(true)} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Added</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {members.map((member) => (
                <tr key={member.id} className="text-sm">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{member.displayName || '�'}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-md border px-2.5 py-0.5 text-xs font-medium ${roleColors[member.workspaceRole]}`}>
                      {member.workspaceRole}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell text-xs">
                    {new Date(member.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {member.workspaceRole !== 'OWNER' && (
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(member)} disabled={actionLoading === member.id} title="Remove member" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AddMemberModal open={showAddModal} onClose={() => setShowAddModal(false)} workspaceId={workspace.id} onAdded={refreshMembers} />
      <ConfirmDialog open={deleteTarget !== null} title="Remove Member" message={`Are you sure you want to remove "${deleteTarget?.displayName || deleteTarget?.email}" from this workspace?`} onConfirm={handleRemove} onCancel={() => setDeleteTarget(null)} loading={deleteTarget ? actionLoading === deleteTarget.id : false} />
    </>
  );
}
