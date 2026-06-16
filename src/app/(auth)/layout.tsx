'use client';

import { motion } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  Shield,
  PieChart,
  BarChart3,
  ArrowUpRight,
} from 'lucide-react';

const features = [
  {
    icon: TrendingUp,
    title: 'Real-Time Tracking',
    description: 'Monitor salary, deductions, and growth trends instantly',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Bank-grade encryption for your financial data',
  },
  {
    icon: PieChart,
    title: 'Smart Analytics',
    description: 'Visual breakdowns and intelligent insights',
  },
];

function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
      className="relative mx-auto mt-8 w-full max-w-sm"
    >
      {/* Mock dashboard card */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
        {/* Header row */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-200/60">
              Monthly Overview
            </p>
            <p className="text-xl font-bold text-white">$12,450.00</p>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-emerald-400/20 px-2 py-0.5 text-xs font-medium text-emerald-300">
            <ArrowUpRight className="h-3 w-3" />
            8.2%
          </div>
        </div>

        {/* Mini chart bars */}
        <div className="flex items-end gap-1.5">
          {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map(
            (height, i) => (
              <motion.div
                key={i}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.6 + i * 0.05, duration: 0.5, ease: 'easeOut' }}
                className="flex-1 origin-bottom rounded-sm"
                style={{
                  height: `${height * 0.6}px`,
                  background:
                    i >= 9
                      ? 'linear-gradient(to top, rgba(52, 211, 153, 0.8), rgba(16, 185, 129, 0.4))'
                      : 'linear-gradient(to top, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05))',
                }}
              />
            )
          )}
        </div>

        {/* Bottom stats row */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: 'Net Pay', value: '$9,840' },
            { label: 'Deductions', value: '$2,610' },
            { label: 'Savings', value: '$3,200' },
          ].map((stat, i) => (
            <div key={i} className="rounded-lg bg-white/5 p-2 text-center">
              <p className="text-[10px] text-emerald-200/50">{stat.label}</p>
              <p className="text-xs font-semibold text-white/80">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex min-h-dvh bg-background">
      {/* LEFT PANEL - visible on lg+ */}
      <div className="relative hidden w-[52%] overflow-hidden lg:flex lg:flex-col lg:items-center lg:justify-center">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Decorative gradient orbs */}
        <div className="animate-float-slow absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="animate-float-medium absolute -right-32 bottom-1/4 h-80 w-80 rounded-full bg-teal-400/15 blur-3xl" />
        <div className="animate-float-reverse absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

        {/* Floating accent shapes */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          className="absolute top-16 right-20 h-20 w-20 rounded-2xl border border-white/5 bg-white/[0.02]"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-32 left-16 h-14 w-14 rounded-full border border-white/5 bg-white/[0.02]"
        />

        {/* Content */}
        <div className="relative z-10 w-full max-w-md px-8">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                <Wallet className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Salary Dashboard
                </h1>
                <p className="text-xs text-emerald-200/60">
                  Financial management, simplified
                </p>
              </div>
            </div>
          </motion.div>

          {/* Dashboard preview */}
          <DashboardPreview />

          {/* Feature highlights */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-8 space-y-3"
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 1 + i * 0.15,
                  duration: 0.5,
                  ease: 'easeOut',
                }}
                className="flex items-start gap-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <feature.icon className="h-4 w-4 text-emerald-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/90">
                    {feature.title}
                  </p>
                  <p className="text-xs leading-relaxed text-emerald-200/50">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/5 bg-black/10 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5 text-emerald-300/40" />
              <span className="text-xs text-white/30">
                Trusted by professionals
              </span>
            </div>
            <div className="flex gap-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-6 w-6 rounded-full bg-white/10 ring-1 ring-white/5"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - form area */}
      <div className="relative flex flex-1 items-center justify-center overflow-y-auto p-4 sm:p-6 lg:p-8">
        {/* Subtle background pattern for right side */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.02]"
          aria-hidden="true"
          style={{
            backgroundImage:
              'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Subtle gradient accent bleeding in from left */}
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-32 bg-gradient-to-r from-emerald-500/[0.03] to-transparent lg:block" />

        <div className="relative z-10 w-full max-w-md">
          {/* Mobile brand header - hidden on lg+ */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 flex items-center justify-center gap-2.5 lg:hidden"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Salary Dashboard
            </span>
          </motion.div>

          {children}
        </div>
      </div>
    </div>
  );
}
