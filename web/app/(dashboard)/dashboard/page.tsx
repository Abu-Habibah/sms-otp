import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Activity, Database, Shield, FolderKanban, Tag, MessageSquare } from 'lucide-react';

export const dynamic = 'force-dynamic';

const MeResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    tenantId: z.string(),
    email: z.string(),
    name: z.string(),
    role: z.enum(['OWNER', 'ADMIN', 'VIEWER']),
    active: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  tenant: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    forwardUrl: z.string().nullable(),
    forwardUrlEnabled: z.boolean(),
    retentionDays: z.number(),
    publicApiUrl: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  role: z.enum(['OWNER', 'ADMIN', 'VIEWER']),
});

export default async function DashboardHome() {
  const cookieStore = cookies();
  const jwt = cookieStore.get('jwt')?.value;
  if (!jwt) redirect('/login');
  const res = await apiGet<unknown>('/v1/me', { jwt: jwt! });
  if (!res.ok) redirect('/login');
  const me = MeResponseSchema.safeParse(res.data);
  if (!me.success) redirect('/login');

  const [workspacesRes, devicesRes, keywordsRes, smsLogsRes] = await Promise.all([
    apiGet<unknown>('/v1/workspaces', { jwt: jwt! }),
    apiGet<unknown>('/v1/devices', { jwt: jwt! }),
    apiGet<unknown>('/v1/keywords', { jwt: jwt! }),
    apiGet<unknown>('/v1/sms-logs', { jwt: jwt! }),
  ]);

  const workspaces = workspacesRes.ok ? (Array.isArray(workspacesRes.data) ? workspacesRes.data : []) : [];
  const devices = devicesRes.ok ? (Array.isArray(devicesRes.data) ? devicesRes.data : []) : [];
  const keywords = keywordsRes.ok ? (Array.isArray(keywordsRes.data) ? keywordsRes.data : []) : [];
  const smsLogs = smsLogsRes.ok ? (Array.isArray(smsLogsRes.data) ? smsLogsRes.data : []) : [];

  const activeDevices = devices.filter((d: { status: string }) => d.status === 'ACTIVE').length;
  const latestSms = smsLogs.length > 0 ? smsLogs[0] as { sender?: string; message?: string; createdAt?: string; matchedKeyword?: string } : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{me.data.tenant.name}</h1>
        <div className="flex items-center gap-2 mt-1.5 text-sm text-gray-500">
          <code className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs">{me.data.tenant.slug}</code>
          <span className="text-gray-300">·</span>
          <span>{me.data.user.email}</span>
          <Badge variant="secondary" className="font-mono text-xs">
            {me.data.role}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Workspaces</CardTitle>
            <FolderKanban className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workspaces.length}</div>
            <p className="text-xs text-gray-400 mt-1">
              {workspaces.length === 0 ? 'Create your first workspace' : `${workspaces.length} active`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Devices</CardTitle>
            <Smartphone className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDevices} <span className="text-sm font-normal text-gray-400">/ {devices.length}</span></div>
            <p className="text-xs text-gray-400 mt-1">
              {devices.length === 0 ? 'Claim a device to start' : `${activeDevices} active`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Keywords</CardTitle>
            <Tag className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{keywords.length}</div>
            <p className="text-xs text-gray-400 mt-1">
              {keywords.length === 0 ? 'Add keywords to filter SMS' : 'active keywords'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">SMS Received</CardTitle>
            <MessageSquare className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{smsLogs.length}</div>
            <p className="text-xs text-gray-400 mt-1">
              {smsLogs.length === 0 ? 'No messages yet' : 'messages captured'}
            </p>
          </CardContent>
        </Card>
      </div>

      {latestSms && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Latest SMS</CardTitle>
            <MessageSquare className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  <span className="text-gray-500">From:</span> {latestSms.sender ?? 'Unknown'}
                </p>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {latestSms.message ?? 'No message content'}
                </p>
                {latestSms.matchedKeyword && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    Matched: {latestSms.matchedKeyword}
                  </Badge>
                )}
              </div>
              {latestSms.createdAt && (
                <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                  {new Date(latestSms.createdAt).toLocaleString()}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Forwarding</CardTitle>
            <Activity className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {me.data.tenant.forwardUrlEnabled ? (
                <span className="text-emerald-600">Active</span>
              ) : (
                <span className="text-gray-400">Paused</span>
              )}
            </div>
            <p className="text-xs text-gray-400 font-mono truncate mt-1">
              {me.data.tenant.forwardUrl ?? 'not configured'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Settings</CardTitle>
            <Database className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Retention:</span>
                <span className="font-medium">{me.data.tenant.retentionDays} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Public API:</span>
                <span className="font-medium font-mono text-xs truncate max-w-[150px]">
                  {me.data.tenant.publicApiUrl ?? 'auto-detect'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
