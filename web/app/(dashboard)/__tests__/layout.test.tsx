import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardLayout from '../layout';
import versionInfo from '../../../version.json';

describe('DashboardLayout', () => {
  it('renders the sidebar navigation', () => {
    render(
      <DashboardLayout>
        <div>Test content</div>
      </DashboardLayout>
    );

    // "SMS Monitor" appears in both sidebar and mobile header
    const brandings = screen.getAllByText('SMS Monitor');
    expect(brandings.length).toBeGreaterThanOrEqual(1);

    // Nav items appear in both sidebar and mobile bottom nav
    expect(screen.getAllByText('Home').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Devices').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Keywords').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('SMS Logs').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Tenants').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Users').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the sign out link', () => {
    render(
      <DashboardLayout>
        <div>Test content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Sign out')).toBeInTheDocument();
  });

  it('displays the version badge in sidebar', () => {
    render(
      <DashboardLayout>
        <div>Test content</div>
      </DashboardLayout>
    );

    const versionBadges = screen.getAllByText(new RegExp(`v${versionInfo.version}`));
    expect(versionBadges.length).toBeGreaterThanOrEqual(1);
  });

  it('renders children content', () => {
    render(
      <DashboardLayout>
        <div>Dashboard content here</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Dashboard content here')).toBeInTheDocument();
  });

  it('renders the SM logo', () => {
    render(
      <DashboardLayout>
        <div>Test</div>
      </DashboardLayout>
    );

    const logos = screen.getAllByText('SM');
    expect(logos.length).toBeGreaterThan(0);
  });

  it('renders mobile navigation items', () => {
    render(
      <DashboardLayout>
        <div>Test</div>
      </DashboardLayout>
    );

    // Mobile nav should also have the same items
    const homeLinks = screen.getAllByText('Home');
    expect(homeLinks.length).toBeGreaterThanOrEqual(1);
  });
});
