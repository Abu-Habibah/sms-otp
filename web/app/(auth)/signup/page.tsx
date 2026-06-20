import type { Metadata } from 'next';
import Link from 'next/link';
import { SignupForm } from './SignupForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import versionInfo from '../../../version.json';

export const metadata: Metadata = { title: 'Sign up — SMS Monitor' };

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-[#F5F3FF] flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center mb-2">
            <span className="text-white text-sm font-bold">SM</span>
          </div>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Set up your tenant and admin user</CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm />
          <p className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-600 hover:underline">Sign in</Link>
          </p>
          <Badge variant="secondary" className="mt-4 font-mono text-xs">
            v{versionInfo.version} (Build: {versionInfo.build})
          </Badge>
        </CardContent>
      </Card>
    </main>
  );
}
