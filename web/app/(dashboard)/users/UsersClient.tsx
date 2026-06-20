'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { User, userRoleSchema, ApiErrorSchema } from '@sms-monitor/shared-types';
import { Users, Plus, Loader2, X, Shield, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface UsersClientProps {
  initialUsers: User[];
  jwt: string;
}

const InviteFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100),
  role: userRoleSchema.default('VIEWER'),
  tempPassword: z.string().min(8, 'Password must be at least 8 characters').max(100),
});
type InviteFormValues = z.infer<typeof InviteFormSchema>;

const roleIcons: Record<string, React.ReactNode> = {
  OWNER: <ShieldAlert className="h-4 w-4 text-destructive" />,
  ADMIN: <ShieldCheck className="h-4 w-4 text-amber-500" />,
  VIEWER: <Shield className="h-4 w-4 text-muted-foreground" />,
};

const roleColors: Record<string, string> = {
  OWNER: 'text-red-600 bg-red-50 border-red-200',
  ADMIN: 'text-amber-600 bg-amber-50 border-amber-200',
  VIEWER: 'text-gray-600 bg-gray-50 border-gray-200',
};

function InviteUserModal({ open, onClose, onInvited }: {
  open: boolean;
  onClose: () => void;
  onInvited: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<InviteFormValues>({
    resolver: zodResolver(InviteFormSchema),
    defaultValues: { role: 'VIEWER' },
  });

  const onSubmit = useCallback(async (values: InviteFormValues) => {
    setError(null);
    try {
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const parsed = ApiErrorSchema.safeParse(body);
        throw new Error(parsed.success ? parsed.data.message : 'Failed to invite user');
      }
      reset();
      onInvited();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite user');
    }
  }, [reset, onInvited, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Invite User</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register('email')}
            />
            {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium">Display Name</label>
            <input
              id="name"
              type="text"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register('name')}
            />
            {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium">Role</label>
            <select
              id="role"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register('role')}
            >
              <option value="VIEWER">Viewer</option>
              <option value="ADMIN">Admin</option>
              <option value="OWNER">Owner</option>
            </select>
          </div>
          <div>
            <label htmlFor="tempPassword" className="block text-sm font-medium">Temporary Password</label>
            <input
              id="tempPassword"
              type="text"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
              placeholder="At least 8 characters"
              {...register('tempPassword')}
            />
            {errors.tempPassword && <p className="mt-1 text-sm text-destructive">{errors.tempPassword.message}</p>}
          </div>
          {error && (
            <p className="text-sm text-destructive rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Invite User
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChangeRoleDialog({ open, user, onConfirm, onCancel, loading }: {
  open: boolean;
  user: User | null;
  onConfirm: (role: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [newRole, setNewRole] = useState<'OWNER' | 'ADMIN' | 'VIEWER'>(user?.role ?? 'VIEWER');

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-lg space-y-4">
        <h3 className="text-lg font-semibold">Change Role</h3>
        <p className="text-sm text-muted-foreground">
          Change role for <strong>{user.email}</strong>
        </p>
        <select
          value={newRole}
          onChange={(e) => setNewRole(e.target.value as 'OWNER' | 'ADMIN' | 'VIEWER')}
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="VIEWER">Viewer</option>
          <option value="ADMIN">Admin</option>
          <option value="OWNER">Owner</option>
        </select>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button onClick={() => onConfirm(newRole)} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export function UsersClient({ initialUsers, jwt }: UsersClientProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roleChangeUser, setRoleChangeUser] = useState<User | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch('/api/v1/users');
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users ?? []);
    }
    router.refresh();
  }, [router]);

  const handleChangeRole = useCallback(async (role: string) => {
    if (!roleChangeUser) return;
    setActionLoading(roleChangeUser.id);
    setError(null);
    try {
      const res = await fetch(`/api/v1/users/${roleChangeUser.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? 'Failed to change role');
      }
      setRoleChangeUser(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change role');
    } finally {
      setActionLoading(null);
    }
  }, [roleChangeUser, refresh]);

  const handleDeactivate = useCallback(async (id: string) => {
    setActionLoading(id);
    setError(null);
    try {
      const res = await fetch(`/api/v1/users/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? 'Failed to deactivate user');
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate user');
    } finally {
      setActionLoading(null);
    }
  }, [refresh]);

  return (
    <>
      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      <div className="flex items-center justify-end">
        <Button onClick={() => setShowInviteModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </div>

      {users.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No users</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Invite users to collaborate on this tenant.
          </p>
          <Button onClick={() => setShowInviteModal(true)} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Verified</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Created</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="text-sm">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="font-medium">{user.displayName}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-medium ${roleColors[user.role]}`}>
                      {roleIcons[user.role]}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {user.emailVerified ? (
                      <span className="text-green-600 font-medium">Verified</span>
                    ) : (
                      <span className="text-muted-foreground">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {user.role !== 'OWNER' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRoleChangeUser(user)}
                          disabled={actionLoading === user.id}
                          title="Change role"
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                      )}
                      {user.role !== 'OWNER' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Deactivate ${user.email}? This will revoke their access.`)) {
                              handleDeactivate(user.id);
                            }
                          }}
                          disabled={actionLoading === user.id}
                          title="Deactivate"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <InviteUserModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvited={refresh}
      />

      <ChangeRoleDialog
        open={roleChangeUser !== null}
        user={roleChangeUser}
        onConfirm={(role) => handleChangeRole(role)}
        onCancel={() => setRoleChangeUser(null)}
        loading={actionLoading === roleChangeUser?.id}
      />
    </>
  );
}
