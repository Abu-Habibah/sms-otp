import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { smsLogSchema } from '@sms-monitor/shared-types';
import { z } from 'zod';
import { SmsLogsClient } from './SmsLogsClient';

export const dynamic = 'force-dynamic';

const SmsLogsResponseSchema = z.array(smsLogSchema);

export default async function SmsLogsPage() {
  const jwt = cookies().get('jwt')?.value;
  if (!jwt) redirect('/login');

  const res = await apiGet<unknown>('/v1/sms-logs', { jwt });
  if (!res.ok) redirect('/login');

  const parsed = SmsLogsResponseSchema.safeParse(res.data);
  if (!parsed.success) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">SMS Logs</h1>
        <p className="text-sm text-destructive">Failed to load SMS logs. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">SMS Logs</h1>
        <p className="text-sm text-muted-foreground mt-1">View forwarded SMS messages and their status</p>
      </div>
      <SmsLogsClient initialLogs={parsed.data} />
    </div>
  );
}
