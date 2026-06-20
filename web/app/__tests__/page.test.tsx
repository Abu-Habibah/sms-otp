import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from '../page';
import versionInfo from '../../version.json';

describe('HomePage', () => {
  it('renders the hero section with main heading', () => {
    render(<HomePage />);

    expect(screen.getByText(/multi-tenant/i)).toBeInTheDocument();
    expect(screen.getByText(/sms forwarding/i)).toBeInTheDocument();
    expect(screen.getByText(/at scale/i)).toBeInTheDocument();
  });

  it('displays the version badge', () => {
    render(<HomePage />);

    expect(screen.getByText(new RegExp(`v${versionInfo.version}`))).toBeInTheDocument();
  });

  it('displays the stats section', () => {
    render(<HomePage />);

    expect(screen.getByText('Tenants')).toBeInTheDocument();
    expect(screen.getByText('Multi')).toBeInTheDocument();
    expect(screen.getByText('Devices')).toBeInTheDocument();
    expect(screen.getByText('Unlimited')).toBeInTheDocument();
    expect(screen.getByText('Latency')).toBeInTheDocument();
    expect(screen.getByText('< 1s')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<HomePage />);

    const signInLinks = screen.getAllByText(/sign in/i);
    expect(signInLinks.length).toBeGreaterThan(0);

    expect(screen.getByText(/go to admin/i)).toBeInTheDocument();
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it('displays the SMS Monitor branding', () => {
    render(<HomePage />);

    expect(screen.getByText('SMS Monitor')).toBeInTheDocument();
    expect(screen.getByText('SM')).toBeInTheDocument();
  });

  it('displays the enterprise badge', () => {
    render(<HomePage />);

    expect(screen.getByText(/enterprise sms platform/i)).toBeInTheDocument();
  });

  it('displays the description text', () => {
    render(<HomePage />);

    expect(screen.getByText(/deploy a carrier-grade sms monitoring platform/i)).toBeInTheDocument();
  });
});
