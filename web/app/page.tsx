import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import versionInfo from '../version.json';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F5F3FF]">
      {/* Nav */}
      <nav className="border-b border-indigo-100 bg-white/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">SM</span>
            </div>
            <span className="font-semibold text-gray-900">SMS Monitor</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="font-mono">
              v{versionInfo.version} (Build: {versionInfo.build})
            </Badge>
            <Link href="/login">
              <Button size="sm">Sign in</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6 pt-20 pb-24">
        <div className="max-w-2xl">
          <Badge className="mb-4 bg-indigo-100 text-indigo-700 border-indigo-200">
            Enterprise SMS Platform
          </Badge>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
            Multi-tenant
            <br />
            <span className="text-indigo-600">SMS forwarding</span>
            <br />
            at scale.
          </h1>
          <p className="mt-6 text-lg text-gray-500 max-w-lg leading-relaxed">
            Deploy a carrier-grade SMS monitoring platform. Tenants register, claim Android devices, and forward matched messages to their own systems.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/login">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Go to admin
              </Button>
            </Link>
            <Link href="/user-guide">
              <Button variant="outline">
                User Guide
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mt-20 max-w-md">
          {[
            { label: 'Tenants', value: 'Multi' },
            { label: 'Devices', value: 'Unlimited' },
            { label: 'Latency', value: '< 1s' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-xs text-gray-400 font-mono uppercase tracking-widest">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
