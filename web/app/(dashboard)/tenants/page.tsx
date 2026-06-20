import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { TenantSchema } from '@sms-monitor/shared-types';
import { z } from 'zod';
import { TenantsClient } from './TenantsClient';

export const dynamic = 'force-dynamic';

const ListTenantsResponseSchema = z.array(TenantSchema);

export default async function TenantsPage() {
  const jwt = cookies().get('jwt')?.value;
  if (!jwt) redirect('/login');

  const res = await apiGet<unknown>('/v1/tenants', { jwt });
  if (!res.ok) redirect('/login');

  const parsed = ListTenantsResponseSchema.safeParse(res.data);
  const tenants = parsed.success ? parsed.data : [];
  const total = tenants.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tenants</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total} tenant{total !== 1 ? 's' : ''} total
        </p>
      </div>
      <TenantsClient initialTenants={tenants} jwt={jwt} />
    </div>
  );
}
