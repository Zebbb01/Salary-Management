'use client';

import { motion } from 'framer-motion';

type DividerVariant = 'wave' | 'curve' | 'angle';

interface SectionDividerProps {
  variant?: DividerVariant;
  flip?: boolean;
  className?: string;
}

export function SectionDivider({ variant = 'wave', flip = false, className = '' }: SectionDividerProps) {
  return (
    <div
      className={`relative w-full overflow-hidden pointer-events-none select-none ${flip ? 'rotate-180' : ''} ${className}`}
      aria-hidden="true"
    >
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        {variant === 'wave' && <WaveDivider />}
        {variant === 'curve' && <CurveDivider />}
        {variant === 'angle' && <AngleDivider />}
      </motion.div>
    </div>
  );
}

function WaveDivider() {
  return (
    <svg
      viewBox="0 0 1440 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-[60px] sm:h-[80px] lg:h-[100px]"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="oklch(0.556 0.17 165 / 0.15)" />
          <stop offset="50%" stopColor="oklch(0.555 0.175 262 / 0.1)" />
          <stop offset="100%" stopColor="oklch(0.556 0.17 165 / 0.15)" />
        </linearGradient>
        <linearGradient id="wave-gradient-subtle" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="oklch(0.556 0.17 165 / 0.06)" />
          <stop offset="50%" stopColor="oklch(0.555 0.175 262 / 0.04)" />
          <stop offset="100%" stopColor="oklch(0.556 0.17 165 / 0.06)" />
        </linearGradient>
      </defs>
      {/* Background wave */}
      <path
        d="M0 80L48 73.3C96 66.7 192 53.3 288 48C384 42.7 480 45.3 576 53.3C672 61.3 768 74.7 864 77.3C960 80 1056 72 1152 64C1248 56 1344 48 1392 44L1440 40V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V80Z"
        fill="url(#wave-gradient-subtle)"
      />
      {/* Foreground wave */}
      <path
        d="M0 90L48 85C96 80 192 70 288 65C384 60 480 60 576 65C672 70 768 80 864 82.5C960 85 1056 80 1152 73C1248 66 1344 58 1392 54L1440 50V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V90Z"
        fill="url(#wave-gradient)"
      />
      {/* Stroke line */}
      <path
        d="M0 90L48 85C96 80 192 70 288 65C384 60 480 60 576 65C672 70 768 80 864 82.5C960 85 1056 80 1152 73C1248 66 1344 58 1392 54L1440 50"
        stroke="oklch(0.556 0.17 165 / 0.2)"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}

function CurveDivider() {
  return (
    <svg
      viewBox="0 0 1440 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-[50px] sm:h-[70px] lg:h-[90px]"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="curve-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="oklch(0.556 0.17 165 / 0.12)" />
          <stop offset="33%" stopColor="oklch(0.555 0.175 262 / 0.08)" />
          <stop offset="66%" stopColor="oklch(0.688 0.168 56 / 0.06)" />
          <stop offset="100%" stopColor="oklch(0.556 0.17 165 / 0.12)" />
        </linearGradient>
      </defs>
      <path
        d="M0 60C240 20 480 0 720 10C960 20 1200 50 1440 40V100H0V60Z"
        fill="url(#curve-gradient)"
      />
      <path
        d="M0 60C240 20 480 0 720 10C960 20 1200 50 1440 40"
        stroke="oklch(0.556 0.17 165 / 0.15)"
        strokeWidth="0.8"
        fill="none"
      />
    </svg>
  );
}

function AngleDivider() {
  return (
    <svg
      viewBox="0 0 1440 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-[40px] sm:h-[60px] lg:h-[70px]"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="angle-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="oklch(0.556 0.17 165 / 0.1)" />
          <stop offset="50%" stopColor="oklch(0.555 0.175 262 / 0.08)" />
          <stop offset="100%" stopColor="oklch(0.556 0.17 165 / 0.1)" />
        </linearGradient>
      </defs>
      <polygon
        points="0,80 1440,80 1440,30 0,60"
        fill="url(#angle-gradient)"
      />
      <line
        x1="0"
        y1="60"
        x2="1440"
        y2="30"
        stroke="oklch(0.556 0.17 165 / 0.15)"
        strokeWidth="0.8"
      />
    </svg>
  );
}
