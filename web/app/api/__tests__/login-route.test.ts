import { NextRequest } from 'next/server';
import { POST } from '../auth/login/route';

global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

beforeEach(() => {
  jest.clearAllMocks();
});

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/login', () => {
  it('returns 400 for invalid input', async () => {
    const request = createRequest({ email: 'invalid' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('proxies valid login to backend and forwards cookies', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ user: { id: '1', email: 'test@example.com' } }),
      headers: {
        get: (name: string) => {
          if (name === 'set-cookie') return 'jwt=token123; Path=/; HttpOnly';
          return null;
        },
      },
    } as unknown as Response);

    const request = createRequest({
      tenantSlug: 'my-tenant',
      email: 'test@example.com',
      password: 'password123',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user).toBeDefined();
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/v1/auth/login',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('returns backend error status on failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid credentials' }),
      headers: {
        get: () => null,
      },
    } as unknown as Response);

    const request = createRequest({
      tenantSlug: 'my-tenant',
      email: 'test@example.com',
      password: 'wrongpass',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toBe('Invalid credentials');
  });
});
