import { NextResponse } from 'next/server';
import { z } from 'zod';

const BACKEND_URL = process.env['BACKEND_URL'] ?? process.env['NEXT_PUBLIC_API_BASE_URL'] ?? 'http://localhost:3000';

const SignupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export async function POST(req: Request): Promise<NextResponse> {
  const body = await req.json().catch(() => null);
  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid signup payload' }, { status: 400 });
  }

  const upstream = await fetch(`${BACKEND_URL}/v1/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed.data),
  });

  const responseBody = await upstream.json().catch(() => ({}));
  const response = NextResponse.json(responseBody, { status: upstream.status });

  const setCookies = upstream.headers.getSetCookie();
  for (const cookie of setCookies) {
    response.headers.append('set-cookie', cookie);
  }

  return response;
}
