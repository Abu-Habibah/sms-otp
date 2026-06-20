'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Workspace, WorkspaceRole, ApiErrorSchema } from '@sms-monitor/shared-types';
import { FolderKanban, Plus, Loader2, X, Edit3, Trash2, Globe } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface WorkspacesClientProps {
  initialWorkspaces: Workspace[];
  jwt: string;
}

const CreateFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  forwardUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  retentionDays: z.number().int().min(1).max(365).optional(),
});
type CreateFormValues = z.infer<typeof CreateFormSchema>;

const EditFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  forwardUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  retentionDays: z.number().int().min(1).max(365).optional(),
});
type EditFormValues = z.infer<typeof EditFormSchema>;

function CreateWorkspaceModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<CreateFormValues>({ resolver: zodResolver(CreateFormSchema) });

  const onSubmit = useCallback(async (values: CreateFormValues) => {
    setError(null);
    try {
      const body: Record<string, unknown> = { name: values.name };
      if (values.forwardUrl) body.forwardUrl = values.forwardUrl;
      if (values.retentionDays) body.retentionDays = values.retentionDays;
      const res = await fetch('/api/v1/workspaces', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        const parsed = ApiErrorSchema.safeParse(errBody);
        throw new Error(parsed.success ? parsed.data.message : 'Failed to create workspace');
      }
      reset();
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workspace');
    }
  }, [reset, onCreated, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Create Workspace</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="name" className="block text-sm font-medium">Workspace Name</label>
            <input id="name" type="text" className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('name')} />
            {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="forwardUrl" className="block text-sm font-medium">Forward URL</label>
            <input id="forwardUrl" type="url" className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono" placeholder="https://api.example.com/forward" {...register('forwardUrl')} />
            {errors.forwardUrl && <p className="mt-1 text-sm text-destructive">{errors.forwardUrl.message}</p>}
            <p className="mt-1 text-xs text-muted-foreground">Override tenant forward URL for this workspace (optional)</p>
          </div>
          <div>
            <label htmlFor="retentionDays" className="block text-sm font-medium">Retention (days)</label>
            <input id="retentionDays" type="number" min="1" max="365" className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono" placeholder="90" {...register('retentionDays', { valueAsNumber: true })} />
            {errors.retentionDays && <p className="mt-1 text-sm text-destructive">{errors.retentionDays.message}</p>}
            <p className="mt-1 text-xs text-muted-foreground">How long to keep SMS logs (default: 90)</p>
          </div>
          {error && <p className="text-sm text-destructive rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2">{error}</p>}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Workspace</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditWorkspaceModal({ workspace, open, onClose, onSaved }: { workspace: Workspace | null; open: boolean; onClose: () => void; onSaved: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EditFormValues>({
    resolver: zodResolver(EditFormSchema),
    values: workspace ? { name: workspace.name, forwardUrl: workspace.forwardUrl ?? '', retentionDays: workspace.retentionDays } : undefined,
  });

  const onSubmit = useCallback(async (values: EditFormValues) => {
    if (!workspace) return;
    setError(null);
    try {
      const body: Record<string, unknown> = { name: values.name, forwardUrl: values.forwardUrl || null };
      if (values.retentionDays) body.retentionDays = values.retentionDays;
      const res = await fetch(`/api/v1/workspaces/${workspace.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        const parsed = ApiErrorSchema.safeParse(errBody);
        throw new Error(parsed.success ? parsed.data.message : 'Failed to update workspace');
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workspace');
    }
  }, [workspace, onSaved, onClose]);

  if (!open || !workspace) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit Workspace</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="edit-name" className="block text-sm font-medium">Workspace Name</label>
            <input id="edit-name" type="text" className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('name')} />
            {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="edit-forwardUrl" className="block text-sm font-medium">Forward URL</label>
            <input id="edit-forwardUrl" type="url" className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono" placeholder={typeof window !== 'undefined' ? window.location.origin : 'https://api.example.com'} {...register('forwardUrl')} />
            {errors.forwardUrl && <p className="mt-1 text-sm text-destructive">{errors.forwardUrl.message}</p>}
            <p className="mt-1 text-xs text-muted-foreground">Override tenant forward URL (leave empty to use tenant default)</p>
          </div>
          <div>
            <label htmlFor="edit-retentionDays" className="block text-sm font-medium">Retention (days)</label>
            <input id="edit-retentionDays" type="number" min="1" max="365" className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono" {...register('retentionDays', { valueAsNumber: true })} />
            {errors.retentionDays && <p className="mt-1 text-sm text-destructive">{errors.retentionDays.message}</p>}
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

function ConfirmDialog({ open, title, message, onConfirm, onCancel, loading }: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
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

export function WorkspacesClient({ initialWorkspaces, jwt }: WorkspacesClientProps) {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState(initialWorkspaces);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Workspace | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch('/api/v1/workspaces');
    if (res.ok) {
      const data = await res.json();
      setWorkspaces(Array.isArray(data) ? data : data.workspaces ?? []);
    }
    router.refresh();
  }, [router]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setActionLoading(deleteTarget.id);
    setError(null);
    try {
      const res = await fetch(`/api/v1/workspaces/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete workspace');
      await refresh();
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workspace');
    } finally {
      setActionLoading(null);
    }
  }, [deleteTarget, refresh]);

  return (
    <>
      <div className="flex items-center justify-end">
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Workspace
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {workspaces.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No workspaces</h3>
          <p className="mt-1 text-sm text-muted-foreground">Create your first workspace to organize devices.</p>
          <Button onClick={() => setShowCreateModal(true)} className="mt-4"><Plus className="mr-2 h-4 w-4" />Create Workspace</Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Forward URL</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Retention</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {workspaces.map((workspace) => (
                <tr key={workspace.id} className="text-sm">
                  <td className="px-4 py-3">
                    <Link href={`/workspaces/${workspace.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <FolderKanban className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="font-medium hover:underline">{workspace.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{workspace.id.slice(0, 8)}...</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell max-w-[200px] truncate">
                    {workspace.forwardUrl ? (
                      <a href={workspace.forwardUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
                        <Globe className="h-3 w-3" />
                        {workspace.forwardUrl}
                      </a>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{workspace.retentionDays}d</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" title="Edit" onClick={() => setEditingWorkspace(workspace)} disabled={actionLoading === workspace.id}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Delete" onClick={() => setDeleteTarget(workspace)} disabled={actionLoading === workspace.id} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateWorkspaceModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onCreated={refresh} />
      <EditWorkspaceModal workspace={editingWorkspace} open={editingWorkspace !== null} onClose={() => setEditingWorkspace(null)} onSaved={refresh} />
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Workspace"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will also delete all devices, keywords, and SMS logs in this workspace. This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteTarget ? actionLoading === deleteTarget.id : false}
      />
    </>
  );
}