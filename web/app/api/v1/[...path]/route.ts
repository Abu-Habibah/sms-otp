import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env['BACKEND_URL'] ?? 'http://localhost:3000';

/**
 * Generic proxy for authenticated API calls from client components.
 * Reads the JWT cookie and forwards the request to the NestJS backend.
 */
export async function GET(request: NextRequest) {
  return proxy(request);
}

export async function POST(request: NextRequest) {
  return proxy(request);
}

export async function PATCH(request: NextRequest) {
  return proxy(request);
}

export async function DELETE(request: NextRequest) {
  return proxy(request);
}

async function proxy(request: NextRequest) {
  // Reconstruct the backend path from the captured [...path] segments
  const pathSegments = request.nextUrl.pathname.replace('/api/v1/', '').split('/');
  const backendPath = `/v1/${pathSegments.join('/')}`;

  // Health endpoints are @Public() — skip JWT check
  const isPublicEndpoint = backendPath.startsWith('/v1/health');

  const jwt = request.cookies.get('jwt')?.value;
  if (!jwt && !isPublicEndpoint) {
    return NextResponse.json({ statusCode: 401, error: 'Unauthorized', message: 'Not authenticated' }, { status: 401 });
  }

  // Forward query parameters
  const searchParams = request.nextUrl.searchParams.toString();
  const backendUrl = `${BACKEND_URL}${backendPath}${searchParams ? `?${searchParams}` : ''}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${jwt}`,
  };

  // Only set Content-Type for requests that have a body
  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'DELETE') {
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      headers['Content-Type'] = 'application/json';
      body = await request.text();
    }
  }

  try {
    const backendRes = await fetch(backendUrl, {
      method: request.method,
      headers,
      body: body ?? undefined,
      cache: 'no-store',
    });

    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error('Proxy error:', err);
    return NextResponse.json(
      { statusCode: 502, error: 'Bad Gateway', message: err instanceof Error ? err.message : 'Backend unavailable' },
      { status: 502 },
    );
  }
}
