import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Home, Smartphone, Building2, Users as UsersIcon, Tag, MessageSquare, LogOut, FolderKanban } from 'lucide-react';
import versionInfo from '../../version.json';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/workspaces', label: 'Workspaces', icon: FolderKanban },
  { href: '/devices', label: 'Devices', icon: Smartphone },
  { href: '/keywords', label: 'Keywords', icon: Tag },
  { href: '/sms-logs', label: 'SMS Logs', icon: MessageSquare },
  { href: '/users', label: 'Users', icon: UsersIcon },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F5F3FF]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-indigo-100 bg-white/60 backdrop-blur-md hidden lg:flex flex-col">
        <div className="px-4 py-5 border-b border-indigo-100">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">SM</span>
            </div>
            <span className="font-semibold text-gray-900">SMS Monitor</span>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-indigo-100">
          <Link
            href="/login"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Link>
          <Badge variant="secondary" className="mt-2 font-mono text-xs">
            v{versionInfo.version} (Build: {versionInfo.build})
          </Badge>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 border-b border-indigo-100 bg-white/60 backdrop-blur-md lg:hidden flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">SM</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">SMS Monitor</span>
        </div>
        <Badge variant="secondary" className="font-mono text-xs">
          v{versionInfo.version}
        </Badge>
      </div>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-indigo-100 bg-white/60 backdrop-blur-sm lg:hidden flex">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-gray-400 hover:text-indigo-600 transition-colors"
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 pt-14 lg:pt-0 pb-16 lg:pb-0">
        <main className="px-6 py-8 lg:px-10 lg:py-10 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
