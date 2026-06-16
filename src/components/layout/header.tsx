'use client';

import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/layout/theme-toggle';

const PAGE_META: Record<string, { title: string; description: string }> = {
  '/dashboard': {
    title: 'Dashboard',
    description: 'Overview of your salary and budget allocation',
  },
  '/dashboard/calculator': {
    title: 'Payroll',
    description: 'Calculate your pay period breakdown',
  },
  '/dashboard/history': {
    title: 'History',
    description: 'View past pay period records',
  },
  '/dashboard/settings': {
    title: 'Settings',
    description: 'Manage your salary configuration and preferences',
  },
};

export function Header() {
  const pathname = usePathname();
  const meta = PAGE_META[pathname] ?? { title: 'Dashboard', description: '' };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold tracking-tight text-foreground">
            {meta.title}
          </h1>
          {meta.description && (
            <p className="hidden text-xs text-muted-foreground sm:block">
              {meta.description}
            </p>
          )}
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
