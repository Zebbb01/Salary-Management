'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { OnboardingProvider } from '@/components/onboarding/onboarding-provider';
import { OnboardingSpotlight } from '@/components/onboarding/onboarding-spotlight';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setIsAuthenticated(true);
      setIsLoading(false);
    }

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <OnboardingProvider>
      <div className="flex min-h-screen bg-background">
        <AnimatedBackground variant="dashboard" />
        <div data-onboarding="sidebar">
          <AppSidebar />
        </div>
        <div className="flex min-w-0 flex-1 flex-col overflow-x-clip lg:ml-64">
          <Header />
          <main className="min-w-0 flex-1 p-4 pb-20 sm:p-6 lg:pb-6">
            {children}
          </main>
          <MobileNav />
        </div>
      </div>
      <OnboardingSpotlight />
    </OnboardingProvider>
  );
}
