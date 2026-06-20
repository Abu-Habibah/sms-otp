import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignupForm } from '../SignupForm';

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

describe('SignupForm', () => {
  it('renders all form fields', () => {
    render(<SignupForm />);

    expect(screen.getByLabelText(/tenant slug/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      // "at least 2 characters" appears twice (tenantSlug + name)
      const minCharErrors = screen.getAllByText(/at least 2 characters/i);
      expect(minCharErrors.length).toBe(2);
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('validates tenant slug format', async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText(/tenant slug/i), 'INVALID SLUG!');
    await user.type(screen.getByLabelText(/your name/i), 'John');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/lowercase letters, digits, and hyphens/i)).toBeInTheDocument();
    });
  });

  it('submits form and redirects on success', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ user: { id: '1' }, tenant: { id: 't1' } }),
    } as Response);

    render(<SignupForm />);

    await user.type(screen.getByLabelText(/tenant slug/i), 'acme-corp');
    await user.type(screen.getByLabelText(/your name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@acme.com');
    await user.type(screen.getByLabelText(/password/i), 'securepass123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/signup', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }));
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('displays error message on signup failure', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ message: 'Tenant slug already exists' }),
    } as Response);

    render(<SignupForm />);

    await user.type(screen.getByLabelText(/tenant slug/i), 'existing-tenant');
    await user.type(screen.getByLabelText(/your name/i), 'John');
    await user.type(screen.getByLabelText(/email/i), 'john@test.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Signup failed')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('shows submitting state while request is in progress', async () => {
    const user = userEvent.setup();
    let resolveFetch: (value: Response) => void;
    mockFetch.mockReturnValueOnce(new Promise((resolve) => {
      resolveFetch = resolve;
    }));

    render(<SignupForm />);

    await user.type(screen.getByLabelText(/tenant slug/i), 'new-tenant');
    await user.type(screen.getByLabelText(/your name/i), 'Jane');
    await user.type(screen.getByLabelText(/email/i), 'jane@test.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/creating account/i)).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    resolveFetch!({
      ok: true,
      status: 201,
      json: async () => ({}),
    } as Response);
  });
});
