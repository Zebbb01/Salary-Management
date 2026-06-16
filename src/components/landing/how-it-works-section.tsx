'use client';

import { motion } from 'framer-motion';
import { Settings, LayoutDashboard, TrendingUp, Check, ChevronRight } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Settings,
    title: 'Set Up Your Salary',
    description:
      'Configure your full-time wages, part-time income, tax rates, and deductions. Set up your budget allocation categories with target percentages.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-teal-400',
    ringColor: 'ring-emerald-500/20',
    items: ['Salary configuration', 'Tax deductions', 'Pay period setup'],
  },
  {
    number: '02',
    icon: LayoutDashboard,
    title: 'Allocate Your Budget',
    description:
      'Divide your salary into categories like rent, bills, savings, and daily expenses. Track each allocation as an expense or asset for better clarity.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-indigo-400',
    ringColor: 'ring-blue-500/20',
    items: ['Category budgets', 'Expense tracking', 'Asset classification'],
  },
  {
    number: '03',
    icon: TrendingUp,
    title: 'Track and Save',
    description:
      'Monitor your monthly bills, record spare transactions, and review your financial history with trends and insights over time.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    gradientFrom: 'from-violet-500',
    gradientTo: 'to-purple-400',
    ringColor: 'ring-violet-500/20',
    items: ['Bill monitoring', 'Spare tracking', 'Historical trends'],
  },
];

/* ------------------------------------------------
   Timeline connector (desktop)
   ------------------------------------------------ */
function TimelineConnector() {
  return (
    <div className="hidden lg:block absolute top-[52px] left-[calc(16.66%+52px)] right-[calc(16.66%+52px)] z-0" aria-hidden="true">
      {/* Main line */}
      <motion.div
        className="h-[2px] w-full rounded-full"
        style={{
          background:
            'linear-gradient(90deg, oklch(0.556 0.17 165 / 0.4), oklch(0.555 0.175 262 / 0.3), oklch(0.585 0.19 292 / 0.4))',
        }}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Animated dot traveling along the line */}
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-primary shadow-lg shadow-primary/50"
        initial={{ left: '0%' }}
        whileInView={{
          left: ['0%', '50%', '100%'],
        }}
        viewport={{ once: true }}
        transition={{
          duration: 2.5,
          delay: 0.8,
          ease: 'easeInOut',
          times: [0, 0.5, 1],
        }}
      />
    </div>
  );
}

/* ------------------------------------------------
   Mobile connector line
   ------------------------------------------------ */
function MobileConnector() {
  return (
    <div className="lg:hidden flex justify-center py-2" aria-hidden="true">
      <motion.div
        className="w-[2px] h-8 rounded-full"
        style={{
          background: 'linear-gradient(180deg, oklch(0.556 0.17 165 / 0.3), oklch(0.555 0.175 262 / 0.3))',
        }}
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      />
    </div>
  );
}

/* ------------------------------------------------
   Step Card
   ------------------------------------------------ */
function StepCard({ step, index }: { step: (typeof steps)[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: index * 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="relative group"
    >
      <div className={`relative rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-6 transition-all duration-300 hover:border-primary/20 hover:bg-card/60 overflow-hidden`}>
        {/* Subtle gradient bg on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at top left, ${
              step.color.includes('emerald') ? 'rgba(16, 185, 129, 0.05)' :
              step.color.includes('blue') ? 'rgba(59, 130, 246, 0.05)' :
              'rgba(139, 92, 246, 0.05)'
            }, transparent 60%)`,
          }}
        />

        <div className="relative">
          {/* Number + Icon row */}
          <div className="flex items-center gap-4 mb-5">
            {/* Number badge */}
            <div className={`relative flex h-14 w-14 items-center justify-center rounded-2xl ${step.bg} border ${step.border}`}>
              <step.icon className={`h-7 w-7 ${step.color}`} />

              {/* Floating number */}
              <motion.span
                className={`absolute -top-2.5 -right-2.5 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white bg-gradient-to-br ${step.gradientFrom} ${step.gradientTo} shadow-lg`}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                {step.number}
              </motion.span>
            </div>

            {/* Arrow for non-last (desktop only) */}
            {index < steps.length - 1 && (
              <motion.div
                className="hidden lg:flex items-center text-muted-foreground/20 absolute -right-8 top-10"
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ChevronRight className="w-5 h-5" />
              </motion.div>
            )}
          </div>

          <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {step.description}
          </p>

          {/* Mini checklist */}
          <div className="space-y-2">
            {step.items.map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.2 + i * 0.1 }}
                className="flex items-center gap-2 text-xs text-muted-foreground/70"
              >
                <div className={`flex h-4 w-4 items-center justify-center rounded-full ${step.bg}`}>
                  <Check className={`h-2.5 w-2.5 ${step.color}`} />
                </div>
                {item}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------
   How It Works Section
   ------------------------------------------------ */
export function HowItWorksSection() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/4 right-0 w-96 h-96 rounded-full border border-primary/[0.03]"
        />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full border border-violet-500/[0.03]" />
      </div>

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
            How It Works
          </motion.p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight font-display mb-4">
            Get Started in{' '}
            <span className="gradient-text">Three Simple Steps</span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-base sm:text-lg">
            From setup to savings -- manage your entire salary lifecycle in minutes.
          </p>
        </motion.div>

        {/* Steps Grid with Timeline */}
        <div className="relative">
          <TimelineConnector />

          <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {steps.map((step, i) => (
              <div key={step.number}>
                <StepCard step={step} index={i} />
                {i < steps.length - 1 && <MobileConnector />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
