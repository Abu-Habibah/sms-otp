'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Tenant, User, ApiErrorSchema, userRoleSchema } from '@sms-monitor/shared-types';
import { Building2, Plus, Loader2, X, Edit3, FolderKanban, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface TenantsClientProps {
  initialTenants: Tenant[];
  jwt: string;
}

const CreateFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  slug: z.string().min(2, 'Slug must be at least 2 characters').max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, digits, and hyphens'),
  publicApiUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});
type CreateFormValues = z.infer<typeof CreateFormSchema>;

const EditFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  publicApiUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});
type EditFormValues = z.infer<typeof EditFormSchema>;

const InviteFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100),
  role: userRoleSchema.default('VIEWER'),
  tempPassword: z.string().min(8, 'Password must be at least 8 characters').max(100),
});
type InviteFormValues = z.infer<typeof InviteFormSchema>;

function CreateTenantModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<CreateFormValues>({ resolver: zodResolver(CreateFormSchema) });

  const onSubmit = useCallback(async (values: CreateFormValues) => {
    setError(null);
    try {
      const body: Record<string, unknown> = { name: values.name, slug: values.slug };
      if (values.publicApiUrl) body.publicApiUrl = values.publicApiUrl;
      const res = await fetch('/api/v1/tenants', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        const parsed = ApiErrorSchema.safeParse(errBody);
        throw new Error(parsed.success ? parsed.data.message : 'Failed to create tenant');
      }
      reset();
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tenant');
    }
  }, [reset, onCreated, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Create Tenant</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="name" className="block text-sm font-medium">Tenant Name</label>
            <input id="name" type="text" className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('name')} />
            {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="slug" className="block text-sm font-medium">Slug</label>
            <input id="slug" type="text" className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono" placeholder="my-tenant" {...register('slug')} />
            {errors.slug && <p className="mt-1 text-sm text-destructive">{errors.slug.message}</p>}
            <p className="mt-1 text-xs text-muted-foreground">Lowercase letters, digits, and hyphens only</p>
          </div>
          <div>
            <label htmlFor="publicApiUrl" className="block text-sm font-medium">Public API URL</label>
            <input id="publicApiUrl" type="url" className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono" placeholder="https://api.example.com" {...register('publicApiUrl')} />
            {errors.publicApiUrl && <p className="mt-1 text-sm text-destructive">{errors.publicApiUrl.message}</p>}
            <p className="mt-1 text-xs text-muted-foreground">External URL for device claim QR codes (optional)</p>
          </div>
          {error && <p className="text-sm text-destructive rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2">{error}</p>}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Tenant</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditTenantModal({ tenant, open, onClose, onSaved }: { tenant: Tenant | null; open: boolean; onClose: () => void; onSaved: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EditFormValues>({
    resolver: zodResolver(EditFormSchema),
    values: tenant ? { name: tenant.name, publicApiUrl: tenant.publicApiUrl ?? '' } : undefined,
  });

  const onSubmit = useCallback(async (values: EditFormValues) => {
    if (!tenant) return;
    setError(null);
    try {
      const body: Record<string, unknown> = { name: values.name, publicApiUrl: values.publicApiUrl || null };
      const res = await fetch(`/api/v1/tenants/${tenant.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        const parsed = ApiErrorSchema.safeParse(errBody);
        throw new Error(parsed.success ? parsed.data.message : 'Failed to update tenant');
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tenant');
    }
  }, [tenant, onSaved, onClose]);

  if (!open || !tenant) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit Tenant</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="edit-name" className="block text-sm font-medium">Tenant Name</label>
            <input id="edit-name" type="text" className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('name')} />
            {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="edit-publicApiUrl" className="block text-sm font-medium">Public API URL</label>
            <input id="edit-publicApiUrl" type="url" className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono" placeholder={typeof window !== 'undefined' ? window.location.origin : 'https://api.example.com'} {...register('publicApiUrl')} />
            {errors.publicApiUrl && <p className="mt-1 text-sm text-destructive">{errors.publicApiUrl.message}</p>}
            <p className="mt-1 text-xs text-muted-foreground">External URL for device claim QR codes (leave empty to auto-detect)</p>
          </div>
          {error && <p className="text-sm text-destructive rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2">{error}</p>}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InviteUserModal({ open, onClose, onInvited }: { open: boolean; onClose: () => void; onInvited: () => void }) {
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
          <h3 className="text-lg font-semibold">Add User</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium">Email</label>
            <input id="email" type="email" className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('email')} />
            {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium">Display Name</label>
            <input id="name" type="text" className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('name')} />
            {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium">Role</label>
            <select id="role" className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('role')}>
              <option value="VIEWER">Viewer</option>
              <option value="ADMIN">Admin</option>
              <option value="OWNER">Owner</option>
            </select>
          </div>
          <div>
            <label htmlFor="tempPassword" className="block text-sm font-medium">Temporary Password</label>
            <input id="tempPassword" type="text" className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono" placeholder="At least 8 characters" {...register('tempPassword')} />
            {errors.tempPassword && <p className="mt-1 text-sm text-destructive">{errors.tempPassword.message}</p>}
          </div>
          {error && <p className="text-sm text-destructive rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2">{error}</p>}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add User</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TenantsClient({ initialTenants, jwt }: TenantsClientProps) {
  const router = useRouter();
  const [tenants, setTenants] = useState(initialTenants);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch('/api/v1/tenants');
    if (res.ok) {
      const data = await res.json();
      setTenants(Array.isArray(data) ? data : data.tenants ?? []);
    }
    router.refresh();
  }, [router]);

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <Button onClick={() => setShowInviteModal(true)}>
          <Users className="mr-2 h-4 w-4" />
          Add User
        </Button>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Tenant
        </Button>
      </div>

      {tenants.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No tenants</h3>
          <p className="mt-1 text-sm text-muted-foreground">Create your first tenant to get started.</p>
          <Button onClick={() => setShowCreateModal(true)} className="mt-4"><Plus className="mr-2 h-4 w-4" />Create Tenant</Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Plan</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Retention</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Forward URL</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="text-sm">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="font-medium">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{tenant.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{tenant.slug}</td>
                  <td className="px-4 py-3 hidden sm:table-cell"><span className="inline-block rounded-md border px-2.5 py-0.5 text-xs font-medium">{tenant.plan}</span></td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{tenant.retentionDays}d</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell max-w-[200px] truncate">{tenant.forwardUrl ?? '---'}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" title="Workspaces" onClick={() => router.push('/workspaces')}>
                      <FolderKanban className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Edit" onClick={() => setEditingTenant(tenant)}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateTenantModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onCreated={refresh} />
      <EditTenantModal tenant={editingTenant} open={editingTenant !== null} onClose={() => setEditingTenant(null)} onSaved={refresh} />
      <InviteUserModal open={showInviteModal} onClose={() => setShowInviteModal(false)} onInvited={refresh} />
    </>
  );
}
