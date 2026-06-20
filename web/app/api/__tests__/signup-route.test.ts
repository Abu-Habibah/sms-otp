import { NextRequest } from 'next/server';
import { POST } from '../auth/signup/route';

global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

beforeEach(() => {
  jest.clearAllMocks();
});

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3001/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/signup', () => {
  it('returns 400 for invalid input', async () => {
    const request = createRequest({ email: 'invalid' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Invalid signup payload');
  });

  it('returns 400 for invalid tenant slug format', async () => {
    const request = createRequest({
      tenantSlug: 'INVALID SLUG!',
      name: 'John',
      email: 'test@example.com',
      password: 'password123',
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('proxies valid signup to backend and forwards cookies', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ user: { id: '1' }, tenant: { id: 't1' } }),
      headers: {
        getSetCookie: () => ['jwt=token123; Path=/; HttpOnly'],
      },
    } as unknown as Response);

    const request = createRequest({
      tenantSlug: 'acme-corp',
      name: 'John Doe',
      email: 'john@acme.com',
      password: 'securepass123',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.user).toBeDefined();
    expect(data.tenant).toBeDefined();
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/v1/auth/signup',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('returns backend error status on failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ message: 'Tenant slug already exists' }),
      headers: {
        getSetCookie: () => [],
      },
    } as unknown as Response);

    const request = createRequest({
      tenantSlug: 'existing-tenant',
      name: 'John',
      email: 'john@test.com',
      password: 'password123',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.message).toBe('Tenant slug already exists');
  });
});
