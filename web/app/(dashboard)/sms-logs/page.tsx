import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { listSmsLogsResponseSchema } from '@sms-monitor/shared-types';
import { SmsLogsClient } from './SmsLogsClient';

export const dynamic = 'force-dynamic';

export default async function SmsLogsPage() {
  const jwt = cookies().get('jwt')?.value;
  if (!jwt) redirect('/login');

  const res = await apiGet<unknown>('/v1/sms-logs?page=1&limit=20', { jwt });
  if (!res.ok) redirect('/login');

  const parsed = listSmsLogsResponseSchema.safeParse(res.data);
  const initialLogs = parsed.success ? parsed.data.logs : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">SMS Logs</h1>
        <p className="text-sm text-muted-foreground mt-1">View forwarded SMS messages and their status</p>
      </div>
      <SmsLogsClient initialLogs={initialLogs} />
    </div>
  );
}
