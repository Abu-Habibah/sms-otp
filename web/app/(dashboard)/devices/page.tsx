import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { deviceSchema, tenantSchema } from '@sms-monitor/shared-types';
import { z } from 'zod';
import { DevicesClient } from './DevicesClient';

export const dynamic = 'force-dynamic';

const ListDevicesResponseSchema = z.array(deviceSchema);

export default async function DevicesPage() {
  const jwt = cookies().get('jwt')?.value;
  if (!jwt) redirect('/login');

  const [devicesRes, tenantRes] = await Promise.all([
    apiGet<unknown>('/v1/devices', { jwt }),
    apiGet<unknown>('/v1/tenants/me', { jwt }),
  ]);

  if (!devicesRes.ok) redirect('/login');

  const parsedDevices = ListDevicesResponseSchema.safeParse(devicesRes.data);
  const devices = parsedDevices.success ? parsedDevices.data : [];

  const parsedTenant = tenantSchema.safeParse(tenantRes.data);
  const tenant = parsedTenant.success ? parsedTenant.data : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Devices</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage devices and generate claim codes</p>
      </div>
      <DevicesClient initialDevices={devices} jwt={jwt} tenantPublicApiUrl={tenant?.publicApiUrl ?? null} />
    </div>
  );
}
