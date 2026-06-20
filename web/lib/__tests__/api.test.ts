import { apiGet, apiPost, getJwtFromCookies } from '../api';

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('apiGet', () => {
  it('returns ok true with data on successful response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ user: 'test' }),
    } as Response);

    const result = await apiGet<{ user: string }>('/v1/me');

    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.data).toEqual({ user: 'test' });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/v1/me',
      expect.objectContaining({ cache: 'no-store' })
    );
  });

  it('includes Authorization header when jwt is provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);

    await apiGet('/v1/me', { jwt: 'test-token' });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/v1/me',
      expect.objectContaining({
        headers: { Authorization: 'Bearer test-token' },
      })
    );
  });

  it('returns ok false on error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Unauthorized' }),
    } as Response);

    const result = await apiGet('/v1/me');

    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
  });

  it('returns empty object when json parse fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => { throw new Error('Invalid JSON'); },
    } as Response);

    const result = await apiGet('/v1/me');

    expect(result.data).toEqual({});
  });
});

describe('apiPost', () => {
  it('sends POST request with JSON body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: '123' }),
    } as Response);

    const body = { email: 'test@example.com', password: 'pass123' };
    const result = await apiPost<{ id: string }>('/v1/auth/login', body);

    expect(result.ok).toBe(true);
    expect(result.status).toBe(201);
    expect(result.data).toEqual({ id: '123' });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/v1/auth/login',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
      })
    );
  });

  it('includes Authorization header when jwt is provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);

    await apiPost('/v1/keywords', { word: 'test' }, { jwt: 'my-token' });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/v1/keywords',
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer my-token',
        },
      })
    );
  });

  it('returns ok false on error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ message: 'Duplicate keyword' }),
    } as Response);

    const result = await apiPost('/v1/keywords', { word: 'test' });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(409);
  });
});

describe('getJwtFromCookies', () => {
  it('is a function', () => {
    expect(typeof getJwtFromCookies).toBe('function');
  });
});
