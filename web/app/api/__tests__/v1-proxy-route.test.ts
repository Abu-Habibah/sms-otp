import { NextRequest } from 'next/server';
import { GET, POST, PATCH, DELETE } from '../v1/[...path]/route';

global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

beforeEach(() => {
  jest.clearAllMocks();
});

function createRequest(path: string, options?: { method?: string; body?: unknown; cookie?: string }): NextRequest {
  const url = `http://localhost:3001/api/v1/${path}`;
  const headers: Record<string, string> = {};
  if (options?.cookie) {
    headers['cookie'] = `jwt=${options.cookie}`;
  }
  if (options?.body) {
    headers['content-type'] = 'application/json';
  }

  return new NextRequest(url, {
    method: (options?.method ?? 'GET') as string,
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
}

describe('GET /api/v1/[...path]', () => {
  it('returns 401 when no JWT cookie is present', async () => {
    const request = createRequest('devices');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('proxies authenticated request to backend', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ devices: [] }),
    } as Response);

    const request = createRequest('devices', { cookie: 'valid-token' });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.devices).toEqual([]);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/v1/devices',
      expect.objectContaining({
        headers: { Authorization: 'Bearer valid-token' },
      })
    );
  });

  it('forwards query parameters', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ keywords: [] }),
    } as Response);

    const request = new NextRequest('http://localhost:3001/api/v1/keywords?enabled=true', {
      headers: { cookie: 'jwt=token' },
    });
    await GET(request);

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/v1/keywords?enabled=true',
      expect.anything()
    );
  });

  it('returns 502 when backend is unavailable', async () => {
    mockFetch.mockRejectedValueOnce(new Error('fetch failed'));

    const request = createRequest('devices', { cookie: 'token' });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.error).toBe('Bad Gateway');
  });
});

describe('POST /api/v1/[...path]', () => {
  it('forwards POST request with body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: '123' }),
    } as Response);

    const request = createRequest('keywords', {
      method: 'POST',
      body: { word: 'test', matchMode: 'CONTAINS' },
      cookie: 'token',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe('123');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/v1/keywords',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer token',
        }),
      })
    );
  });
});

describe('PATCH /api/v1/[...path]', () => {
  it('forwards PATCH request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ updated: true }),
    } as Response);

    const request = createRequest('keywords/123', {
      method: 'PATCH',
      body: { word: 'updated' },
      cookie: 'token',
    });

    const response = await PATCH(request);

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/v1/keywords/123',
      expect.objectContaining({ method: 'PATCH' })
    );
  });
});

describe('DELETE /api/v1/[...path]', () => {
  it('forwards DELETE request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ deleted: true }),
    } as Response);

    const request = createRequest('keywords/123', {
      method: 'DELETE',
      cookie: 'token',
    });

    const response = await DELETE(request);

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/v1/keywords/123',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});
