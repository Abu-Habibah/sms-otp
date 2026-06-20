import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env['BACKEND_URL'] ?? 'http://localhost:3000';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.url) {
    return NextResponse.json({ reachable: false, error: 'URL is required' }, { status: 400 });
  }

  try {
    const backendRes = await fetch(`${BACKEND_URL}/health/check-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { reachable: false, error: err instanceof Error ? err.message : 'Backend unavailable' },
      { status: 502 },
    );
  }
}
