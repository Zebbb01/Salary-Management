'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ------------------------------------------------
   Floating decorative shapes
   ------------------------------------------------ */
function FloatingShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Large gradient blobs */}
      <motion.div
        animate={{ y: [0, -30, 0], x: [0, 15, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-20 -right-20 w-80 h-80 rounded-full"
        style={{
          background: 'radial-gradient(circle, oklch(0.556 0.17 165 / 0.15) 0%, transparent 70%)',
        }}
      />
      <motion.div
        animate={{ y: [0, 20, 0], x: [0, -10, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full"
        style={{
          background: 'radial-gradient(circle, oklch(0.555 0.175 262 / 0.12) 0%, transparent 70%)',
        }}
      />

      {/* Floating geometric shapes */}
      <motion.div
        animate={{ rotate: [0, 90, 180, 270, 360], y: [0, -15, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute top-16 left-[15%] w-8 h-8 rounded-lg border border-primary/10 bg-primary/5"
      />
      <motion.div
        animate={{ rotate: [0, -60, -120, -180], y: [0, 10, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        className="absolute bottom-20 right-[20%] w-6 h-6 rounded-md border border-violet-500/10 bg-violet-500/5"
      />

      {/* Cross/plus shapes */}
      <motion.div
        animate={{ rotate: [0, 90, 0], opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-24 right-[12%]"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 4v16M4 12h16" stroke="oklch(0.556 0.17 165)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </motion.div>
      <motion.div
        animate={{ rotate: [0, -90, 0], opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute bottom-12 left-[10%]"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 4v16M4 12h16" stroke="oklch(0.555 0.175 262)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </motion.div>

      {/* Dot ring */}
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px]"
      >
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * 360;
          const rad = (angle * Math.PI) / 180;
          const x = Math.round(Math.cos(rad) * 250);
          const y = Math.round(Math.sin(rad) * 250);
          return (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary/10"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
              }}
            />
          );
        })}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------
   Trust badges
   ------------------------------------------------ */
function TrustBadges() {
  const badges = [
    { icon: Shield, label: 'Bank-level Security' },
    { icon: Zap, label: 'Instant Setup' },
    { icon: Star, label: 'Always Free' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="flex flex-wrap items-center justify-center gap-6 mt-8"
    >
      {badges.map((badge) => (
        <div key={badge.label} className="flex items-center gap-2 text-xs text-muted-foreground/60">
          <badge.icon className="h-3.5 w-3.5 text-primary/50" />
          {badge.label}
        </div>
      ))}
    </motion.div>
  );
}

/* ------------------------------------------------
   CTA Section
   ------------------------------------------------ */
export function CTASection() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl"
        >
          {/* Multi-layer gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-card/80 to-violet-500/15" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-background/20" />
          <div className="absolute inset-0 border border-primary/15 rounded-3xl" />

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: 'radial-gradient(circle, oklch(0.95 0 0) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <FloatingShapes />

          <div className="relative px-8 py-16 sm:px-16 sm:py-24 text-center">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary border border-primary/20 mb-8"
            >
              <Zap className="h-3.5 w-3.5" />
              No credit card required
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight font-display mb-5"
            >
              Start Managing Your Salary{' '}
              <span className="gradient-text">Today</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto max-w-lg text-muted-foreground text-base sm:text-lg mb-10"
            >
              Join and take control of your finances. Set up your budget in minutes
              and start making smarter decisions with your money.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/signup">
                <Button
                  size="lg"
                  className="text-base px-10 h-13 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Create Free Account
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-base px-8 h-13 hover:bg-primary/5 transition-all duration-300"
                >
                  Already have an account? Sign in
                </Button>
              </Link>
            </motion.div>

            <TrustBadges />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
