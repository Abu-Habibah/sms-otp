import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { UserSchema } from '@sms-monitor/shared-types';
import { z } from 'zod';
import { UsersClient } from './UsersClient';

export const dynamic = 'force-dynamic';

const ListUsersResponseSchema = z.array(UserSchema);

export default async function UsersPage() {
  const jwt = cookies().get('jwt')?.value;
  if (!jwt) redirect('/login');

  const res = await apiGet<unknown>('/v1/users', { jwt });
  if (!res.ok) redirect('/login');

  const parsed = ListUsersResponseSchema.safeParse(res.data);
  const users = parsed.success ? parsed.data : [];
  const total = users.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total} user{total !== 1 ? 's' : ''} in this tenant
        </p>
      </div>
      <UsersClient initialUsers={users} jwt={jwt} />
    </div>
  );
}
