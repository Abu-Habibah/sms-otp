import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { workspaceSchema } from '@sms-monitor/shared-types';
import { z } from 'zod';
import { WorkspacesClient } from './WorkspacesClient';

export const dynamic = 'force-dynamic';

const ListWorkspacesResponseSchema = z.array(workspaceSchema);

export default async function WorkspacesPage() {
  const jwt = cookies().get('jwt')?.value;
  if (!jwt) redirect('/login');

  const res = await apiGet<unknown>('/v1/workspaces', { jwt });

  const parsed = res.ok ? ListWorkspacesResponseSchema.safeParse(res.data) : null;
  const workspaces = parsed?.success ? parsed.data : [];
  const total = workspaces.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Workspaces</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total} workspace{total !== 1 ? 's' : ''} total
        </p>
      </div>
      {!res.ok && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load workspaces. The workspace API may not be available yet.
        </div>
      )}
      <WorkspacesClient initialWorkspaces={workspaces} jwt={jwt} />
    </div>
  );
}