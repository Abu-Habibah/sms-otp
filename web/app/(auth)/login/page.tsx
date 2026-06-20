import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from './LoginForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import versionInfo from '../../../version.json';

export const metadata: Metadata = { title: 'Sign in — SMS Monitor' };

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#F5F3FF] flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center mb-2">
            <span className="text-white text-sm font-bold">SM</span>
          </div>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>SMS Monitor tenant admin</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <p className="mt-4 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-indigo-600 hover:underline">Sign up</Link>
          </p>
          <Badge variant="secondary" className="mt-4 font-mono text-xs flex justify-center w-fit mx-auto">
            v{versionInfo.version} (Build: {versionInfo.build})
          </Badge>
        </CardContent>
      </Card>
    </main>
  );
}
