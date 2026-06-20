import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SMS Monitor — Admin',
  description: 'Multi-tenant SMS forwarding platform — tenant admin dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        {children}
      </body>
    </html>
  );
}
