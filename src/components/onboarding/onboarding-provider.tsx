'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';

// ============================================
// STEP DEFINITIONS
// ============================================

interface OnboardingStep {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  route: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'salary-config',
    targetSelector: '[data-onboarding="salary-config"]',
    title: 'Step 1: Set Up Your Salary',
    description:
      'This is where you start. Enter your full-time and part-time wages, tax rate, and deductions. This is the foundation of all your calculations.',
    position: 'right',
    route: '/dashboard/settings',
  },
  {
    id: 'budget-tab',
    targetSelector: '[data-onboarding="budget-tab"]',
    title: 'Step 2: Budget Allocations',
    description:
      'Switch to the Budget tab to set how much you allocate for each category like rent, bills, savings, and daily expenses.',
    position: 'bottom',
    route: '/dashboard/settings',
  },
  {
    id: 'calculator-link',
    targetSelector: '[data-onboarding="calculator-link"]',
    title: 'Step 3: Payroll Calculator',
    description:
      'Once your salary is set, head to Payroll to calculate your pay period breakdown.',
    position: 'right',
    route: '/dashboard/settings',
  },
  {
    id: 'calculator-save',
    targetSelector: '[data-onboarding="calculator-save"]',
    title: 'Step 4: Save Pay Period',
    description:
      'Fill in your pay period details and hit Save to record it. Your dashboard charts and data will populate automatically.',
    position: 'top',
    route: '/dashboard/calculator',
  },
  {
    id: 'dashboard-overview',
    targetSelector: '[data-onboarding="date-filter"]',
    title: 'Step 5: Your Dashboard',
    description:
      'This is your financial command center. Once you save a pay period, your income, expenses, budget breakdown, bills, and trends will all show up here.',
    position: 'bottom',
    route: '/dashboard',
  },
];

const SESSION_KEY = 'salary-dashboard-onboarded';

// ============================================
// CONTEXT
// ============================================

interface OnboardingContextValue {
  isOnboarding: boolean;
  currentStep: number;
  totalSteps: number;
  steps: OnboardingStep[];
  nextStep: () => void;
  prevStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  // Check localStorage on mount -- run tour once ever
  useEffect(() => {
    try {
      const completed = localStorage.getItem(SESSION_KEY);
      if (!completed) {
        setIsOnboarding(true);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  // Navigate to the correct page when step changes
  useEffect(() => {
    if (!isOnboarding) return;

    const step = ONBOARDING_STEPS[currentStep];
    if (!step) return;

    if (pathname !== step.route) {
      setIsNavigating(true);
      router.push(step.route);
    } else {
      setIsNavigating(false);
    }
  }, [isOnboarding, currentStep, pathname, router]);

  const markComplete = useCallback(() => {
    try {
      localStorage.setItem(SESSION_KEY, 'true');
    } catch {
      // localStorage unavailable
    }
    setIsOnboarding(false);
    setCurrentStep(0);
    setIsNavigating(false);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev >= ONBOARDING_STEPS.length - 1) {
        return prev;
      }
      return prev + 1;
    });
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const skipOnboarding = useCallback(() => {
    markComplete();
    if (pathname !== '/dashboard') {
      router.push('/dashboard');
    }
  }, [markComplete, pathname, router]);

  const completeOnboarding = useCallback(() => {
    markComplete();
    if (pathname !== '/dashboard') {
      router.push('/dashboard');
    }
  }, [markComplete, pathname, router]);

  return (
    <OnboardingContext.Provider
      value={{
        isOnboarding: isOnboarding && !isNavigating,
        currentStep,
        totalSteps: ONBOARDING_STEPS.length,
        steps: ONBOARDING_STEPS,
        nextStep,
        prevStep,
        skipOnboarding,
        completeOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
