'use client';

import { cn } from '@/lib/utils';

interface OrbConfig {
  className: string;
  style: React.CSSProperties;
}

const LANDING_ORBS: OrbConfig[] = [
  {
    className: 'animate-float-slow',
    style: {
      width: 600, height: 600,
      top: '-10%', left: '-5%',
      background: 'radial-gradient(circle, oklch(0.556 0.17 165 / 0.15) 0%, transparent 70%)',
    },
  },
  {
    className: 'animate-float-medium',
    style: {
      width: 500, height: 500,
      top: '30%', right: '-10%',
      background: 'radial-gradient(circle, oklch(0.555 0.175 262 / 0.12) 0%, transparent 70%)',
    },
  },
  {
    className: 'animate-float-reverse',
    style: {
      width: 400, height: 400,
      bottom: '5%', left: '20%',
      background: 'radial-gradient(circle, oklch(0.688 0.168 56 / 0.08) 0%, transparent 70%)',
    },
  },
  {
    className: 'animate-float-slow',
    style: {
      width: 350, height: 350,
      top: '60%', right: '15%',
      background: 'radial-gradient(circle, oklch(0.556 0.17 165 / 0.1) 0%, transparent 70%)',
      animationDelay: '-7s',
    },
  },
];

const AUTH_ORBS: OrbConfig[] = [
  {
    className: 'animate-float-slow',
    style: {
      width: 400, height: 400,
      top: '-15%', left: '10%',
      background: 'radial-gradient(circle, oklch(0.556 0.17 165 / 0.12) 0%, transparent 70%)',
    },
  },
  {
    className: 'animate-float-medium',
    style: {
      width: 300, height: 300,
      bottom: '10%', right: '5%',
      background: 'radial-gradient(circle, oklch(0.555 0.175 262 / 0.08) 0%, transparent 70%)',
    },
  },
];

const DASHBOARD_ORBS: OrbConfig[] = [
  {
    className: 'animate-float-slow',
    style: {
      width: 500, height: 500,
      top: '-20%', right: '-15%',
      background: 'radial-gradient(circle, oklch(0.556 0.17 165 / 0.04) 0%, transparent 70%)',
    },
  },
  {
    className: 'animate-float-reverse',
    style: {
      width: 400, height: 400,
      bottom: '-10%', left: '-10%',
      background: 'radial-gradient(circle, oklch(0.555 0.175 262 / 0.03) 0%, transparent 70%)',
    },
  },
];

const orbSets = {
  landing: LANDING_ORBS,
  auth: AUTH_ORBS,
  dashboard: DASHBOARD_ORBS,
};

interface AnimatedBackgroundProps {
  variant?: 'landing' | 'auth' | 'dashboard';
  className?: string;
}

export function AnimatedBackground({ variant = 'landing', className }: AnimatedBackgroundProps) {
  const orbs = orbSets[variant];

  return (
    <div
      className={cn('pointer-events-none fixed inset-0 overflow-hidden', className)}
      aria-hidden="true"
    >
      {/* Grid dot pattern */}
      {variant === 'landing' && (
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, oklch(0.95 0 0) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      )}

      {/* Floating gradient orbs */}
      {orbs.map((orb, i) => (
        <div
          key={i}
          className={cn('absolute rounded-full blur-3xl', orb.className)}
          style={orb.style}
        />
      ))}

      {/* Top gradient wash */}
      {variant === 'landing' && (
        <div
          className="absolute top-0 left-0 right-0 h-[60vh]"
          style={{
            background: 'linear-gradient(180deg, oklch(0.556 0.17 165 / 0.05) 0%, transparent 100%)',
          }}
        />
      )}
    </div>
  );
}
