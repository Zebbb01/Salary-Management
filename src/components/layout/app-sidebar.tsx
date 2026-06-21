'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Wallet,
  LayoutDashboard,
  Calculator,
  History,
  HandCoins,
  Settings,
  LogOut,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Payroll', href: '/dashboard/calculator', icon: Calculator },
  { label: 'History', href: '/dashboard/history', icon: History },
  { label: 'Borrowing', href: '/dashboard/borrowing', icon: HandCoins },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <aside className="hidden lg:flex lg:flex-col fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Wallet className="size-5 text-primary" />
        </div>
        <span className="text-base font-semibold tracking-tight text-sidebar-foreground">
          Salary Dashboard
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 px-3 pt-2">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-sidebar-accent text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
              {...(item.label === 'Payroll' ? { 'data-onboarding': 'calculator-link' } : {})}
              {...(item.label === 'Settings' ? { 'data-onboarding': 'settings-link' } : {})}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <Separator />
      <div className="p-3">
        <button
          onClick={handleSignOut}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
            'text-muted-foreground transition-colors duration-150',
            'hover:bg-destructive/10 hover:text-destructive'
          )}
        >
          <LogOut className="size-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
