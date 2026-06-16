'use client';

import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import {
  Calculator,
  PieChart,
  Receipt,
  TrendingUp,
  History,
  Wallet,
  ArrowUpRight,
} from 'lucide-react';
import { useRef, useEffect } from 'react';

const features = [
  {
    icon: Calculator,
    title: 'Salary Calculator',
    description:
      'Split wages across pay periods, track tax deductions, and see your real take-home pay instantly.',
    gradient: 'from-emerald-500 to-teal-400',
    glowColor: 'emerald',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    borderHover: 'group-hover:border-emerald-500/30',
  },
  {
    icon: PieChart,
    title: 'Budget Allocation',
    description:
      'Divide your salary into categories with percentage-based budgets. Visualize where every peso goes.',
    gradient: 'from-blue-500 to-indigo-400',
    glowColor: 'blue',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
    borderHover: 'group-hover:border-blue-500/30',
  },
  {
    icon: Receipt,
    title: 'Bill Tracking',
    description:
      'Never miss a payment with monthly bill checklists and automated email reminders.',
    gradient: 'from-amber-500 to-orange-400',
    glowColor: 'amber',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    borderHover: 'group-hover:border-amber-500/30',
  },
  {
    icon: TrendingUp,
    title: 'Expense vs Assets',
    description:
      'Classify spending as expenses or assets. Make smarter financial decisions with clear categorization.',
    gradient: 'from-violet-500 to-purple-400',
    glowColor: 'violet',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-400',
    borderHover: 'group-hover:border-violet-500/30',
  },
  {
    icon: History,
    title: 'Pay Period History',
    description:
      'Review past pay periods with detailed breakdowns, searchable records, and trend charts.',
    gradient: 'from-rose-500 to-pink-400',
    glowColor: 'rose',
    iconBg: 'bg-rose-500/10',
    iconColor: 'text-rose-400',
    borderHover: 'group-hover:border-rose-500/30',
  },
  {
    icon: Wallet,
    title: 'Spare Tracker',
    description:
      'Track leftover money after all allocations. Record spare transactions and watch your balance grow.',
    gradient: 'from-cyan-500 to-sky-400',
    glowColor: 'cyan',
    iconBg: 'bg-cyan-500/10',
    iconColor: 'text-cyan-400',
    borderHover: 'group-hover:border-cyan-500/30',
  },
];

const glowColors: Record<string, string> = {
  emerald: 'rgba(16, 185, 129, 0.08)',
  blue: 'rgba(59, 130, 246, 0.08)',
  amber: 'rgba(245, 158, 11, 0.08)',
  violet: 'rgba(139, 92, 246, 0.08)',
  rose: 'rgba(244, 63, 94, 0.08)',
  cyan: 'rgba(6, 182, 212, 0.08)',
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: 'easeOut' as const },
  },
};

/* ------------------------------------------------
   Individual Feature Card with mouse-tracking glow
   ------------------------------------------------ */
function FeatureCard({
  feature,
}: {
  feature: (typeof features)[0];
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const spotlightX = useSpring(mouseX, { stiffness: 200, damping: 40 });
  const spotlightY = useSpring(mouseY, { stiffness: 200, damping: 40 });

  const spotlight = useTransform(
    [spotlightX, spotlightY],
    ([x, y]: number[]) =>
      `radial-gradient(400px circle at ${x}px ${y}px, ${glowColors[feature.glowColor]}, transparent 70%)`
  );

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    function handleMove(e: MouseEvent) {
      const rect = el!.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    }
    el.addEventListener('mousemove', handleMove, { passive: true });
    return () => el.removeEventListener('mousemove', handleMove);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      ref={cardRef}
      variants={cardVariants}
      whileHover={{ y: -6, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
      className={`group relative rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden transition-colors duration-300 ${feature.borderHover}`}
    >
      {/* Mouse-tracking spotlight */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: spotlight }}
      />

      {/* Gradient border glow on hover */}
      <div
        className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
        style={{
          background: `linear-gradient(135deg, ${glowColors[feature.glowColor]}, transparent 60%)`,
        }}
      />

      {/* Content */}
      <div className="relative p-6">
        {/* Icon with gradient background */}
        <div className="relative mb-5">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.iconBg} border border-white/5 transition-all duration-300 group-hover:scale-110`}
          >
            <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
          </div>
          {/* Corner arrow indicator */}
          <motion.div
            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            initial={false}
          >
            <ArrowUpRight className="h-4 w-4 text-muted-foreground/40" />
          </motion.div>
        </div>

        <h3 className="text-lg font-semibold mb-2 group-hover:text-foreground transition-colors duration-200">
          {feature.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {feature.description}
        </p>

        {/* Bottom gradient line */}
        <div className="mt-5 h-px w-full overflow-hidden rounded-full bg-border/30">
          <motion.div
            className={`h-full bg-gradient-to-r ${feature.gradient} rounded-full`}
            initial={{ width: '0%' }}
            whileInView={{ width: '100%' }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------
   Decorative floating shapes
   ------------------------------------------------ */
function DecorativeShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Top-right circle */}
      <motion.div
        animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-12 -right-12 w-64 h-64 rounded-full border border-primary/[0.05]"
      />
      {/* Bottom-left circle */}
      <motion.div
        animate={{ y: [0, 15, 0], rotate: [0, -3, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full border border-violet-500/[0.05]"
      />
      {/* Dot cluster */}
      <div className="absolute top-20 left-8 grid grid-cols-3 gap-2 opacity-[0.06]">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary" />
        ))}
      </div>
      <div className="absolute bottom-16 right-12 grid grid-cols-3 gap-2 opacity-[0.06]">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-500" />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------
   Features Section
   ------------------------------------------------ */
export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 sm:py-32 overflow-hidden">
      <DecorativeShapes />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.p
            initial={{ opacity: 0, letterSpacing: '0.2em' }}
            whileInView={{ opacity: 1, letterSpacing: '0.15em' }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-sm font-medium text-primary uppercase tracking-wider mb-3"
          >
            Features
          </motion.p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight font-display mb-4">
            Everything You Need to{' '}
            <span className="gradient-text">Manage Your Salary</span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-base sm:text-lg">
            A complete toolkit to track income, allocate budgets, pay bills, and grow your savings
            -- all in one dashboard.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
