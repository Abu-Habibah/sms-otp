import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { keywordSchema } from '@sms-monitor/shared-types';
import { z } from 'zod';
import { KeywordsClient } from './KeywordsClient';

export const dynamic = 'force-dynamic';

const KeywordsResponseSchema = z.array(keywordSchema);

export default async function KeywordsPage() {
  const jwt = cookies().get('jwt')?.value;
  if (!jwt) redirect('/login');

  const res = await apiGet<unknown>('/v1/keywords', { jwt });
  if (!res.ok) redirect('/login');

  const data = res.data as { keywords?: unknown[] };
  const parsed = KeywordsResponseSchema.safeParse(data?.keywords ?? data);
  if (!parsed.success) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Keywords</h1>
        <p className="text-sm text-destructive">Failed to load keywords. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Keywords</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage keyword filters for SMS forwarding</p>
      </div>
      <KeywordsClient initialKeywords={parsed.data} />
    </div>
  );
}
