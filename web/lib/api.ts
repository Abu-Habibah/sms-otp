import { cookies } from 'next/headers';

const BACKEND_URL = process.env['BACKEND_URL'] ?? process.env['NEXT_PUBLIC_API_BASE_URL'] ?? 'http://localhost:3000';

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data: T;
}

export async function apiGet<T>(path: string, opts?: { jwt?: string }): Promise<ApiResult<T>> {
  const headers: Record<string, string> = {};
  if (opts?.jwt) headers['Authorization'] = `Bearer ${opts.jwt}`;
  const res = await fetch(`${BACKEND_URL}${path}`, { headers, cache: 'no-store' });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

export async function apiPost<T>(path: string, body: unknown, opts?: { jwt?: string }): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts?.jwt) headers['Authorization'] = `Bearer ${opts.jwt}`;
  const res = await fetch(`${BACKEND_URL}${path}`, { method: 'POST', headers, body: JSON.stringify(body), cache: 'no-store' });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

export function getJwtFromCookies(): string | undefined {
  return cookies().get('jwt')?.value;
}
