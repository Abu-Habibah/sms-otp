import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../LoginForm';

const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
}));

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LoginForm', () => {
  it('renders all form fields', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/tenant/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      // tenantSlug error is "Invalid", email error is "Invalid email" - both contain "Invalid"
      const invalidErrors = screen.getAllByText(/invalid/i);
      expect(invalidErrors.length).toBeGreaterThanOrEqual(2);
      // Password error
      expect(screen.getByText(/at least 1 character/i)).toBeInTheDocument();
    });
  });

  it('submits form and redirects on success', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ user: { id: '1' } }),
    } as Response);

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/tenant/i), 'my-tenant');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }));
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('displays error message on login failure', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid credentials' }),
    } as Response);

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/tenant/i), 'my-tenant');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Login failed')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('shows submitting state while request is in progress', async () => {
    const user = userEvent.setup();
    let resolveFetch: (value: Response) => void;
    mockFetch.mockReturnValueOnce(new Promise((resolve) => {
      resolveFetch = resolve;
    }));

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/tenant/i), 'my-tenant');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    resolveFetch!({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);
  });
});
