import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  redirect: jest.fn(),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: () => ({
    get: jest.fn(),
    getAll: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }),
  headers: () => ({
    get: jest.fn(),
    entries: jest.fn(),
  }),
}));

// Mock next/link
jest.mock('next/link', () => {
  const React = require('react');
  return React.forwardRef(function MockLink({ children, href, ...props }: any, ref: any) {
    return React.createElement('a', { ref, href, ...props }, children);
  });
});

// Mock global fetch
global.fetch = jest.fn();
