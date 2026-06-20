import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { workspaceSchema } from '@sms-monitor/shared-types';
import { z } from 'zod';
import { WorkspaceDetailClient } from './WorkspaceDetailClient';

export const dynamic = 'force-dynamic';

const WorkspaceDetailResponseSchema = workspaceSchema;

export default async function WorkspaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const jwt = cookies().get('jwt')?.value;
  if (!jwt) redirect('/login');

  const { id } = await params;

  const res = await apiGet<unknown>(`/v1/workspaces/${id}`, { jwt });
  if (!res.ok) notFound();

  const parsed = WorkspaceDetailResponseSchema.safeParse(res.data);
  if (!parsed.success) notFound();

  const workspace = parsed.data;

  const tenantRes = await apiGet<unknown>('/v1/tenants/me', { jwt });
  let tenantPublicApiUrl: string | null = null;
  if (tenantRes.ok) {
    const tenantData = tenantRes.data as { publicApiUrl?: string | null };
    tenantPublicApiUrl = tenantData?.publicApiUrl ?? null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{workspace.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">Workspace ID: {workspace.id}</p>
      </div>
      <WorkspaceDetailClient workspace={workspace} jwt={jwt} tenantPublicApiUrl={tenantPublicApiUrl} />
    </div>
  );
}