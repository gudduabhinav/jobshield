'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  AlertTriangle,
  Building2,
  Activity,
  HeartPulse,
  BarChart3,
  Shield,
  Zap,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/dashboard/high-risk', label: 'High Risk', icon: AlertTriangle },
  { href: '/dashboard/companies', label: 'Companies', icon: Building2 },
  { href: '/dashboard/scraper-health', label: 'Scraper Health', icon: Activity },
  { href: '/dashboard/healing-events', label: 'Healing Events', icon: HeartPulse },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border/50 bg-sidebar h-screen sticky top-0 flex flex-col">
      <div className="p-5 border-b border-border/50">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Shield className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <span className="text-lg font-bold tracking-tight">JobShield</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
              {item.href === '/dashboard/high-risk' && (
                <span className="ml-auto text-xs bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded font-mono">
                  120
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border/50 space-y-0.5">
        <Link
          href="/demo"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-amber-500 hover:bg-amber-500/10 transition-colors"
        >
          <Zap className="h-4 w-4" />
          Self-Healing Demo
        </Link>
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </aside>
  );
}
