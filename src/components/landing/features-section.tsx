'use client';

import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import {
  Calculator,
  PieChart,
  Receipt,
  TrendingUp,
  History,
  Wallet,
  Check,
  HandCoins,
  Coins,
} from 'lucide-react';
import { useRef, useEffect } from 'react';

/* ------------------------------------------------
   CSS-based mini visualizations for each feature
   ------------------------------------------------ */

function SalaryCalcVisual() {
  return (
    <div className="space-y-1.5">
      {[
        { label: 'Gross Pay', value: 'PHP 25,000', color: 'text-emerald-400' },
        { label: 'Tax (10%)', value: '- PHP 2,500', color: 'text-red-400/70' },
        { label: 'SSS/Phil/Pag', value: '- PHP 1,200', color: 'text-red-400/70' },
      ].map((row, i) => (
        <motion.div
          key={row.label}
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
          className="flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/[0.04] px-3 py-1.5"
        >
          <span className="text-[10px] text-muted-foreground/50">{row.label}</span>
          <span className={`text-[11px] font-mono font-medium ${row.color}`}>{row.value}</span>
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8, duration: 0.4 }}
        className="flex items-center justify-between rounded-lg bg-emerald-500/[0.08] border border-emerald-500/20 px-3 py-1.5"
      >
        <span className="text-[10px] font-medium text-emerald-400/80">Net Take-Home</span>
        <span className="text-[12px] font-bold font-mono text-emerald-400">PHP 21,300</span>
      </motion.div>
    </div>
  );
}

function BudgetAllocVisual() {
  const segments = [
    { pct: 40, color: '#10b981', label: 'Investments' },
    { pct: 25, color: '#3b82f6', label: 'Utilities' },
    { pct: 20, color: '#f59e0b', label: 'Consumable' },
    { pct: 10, color: '#ef4444', label: 'Emergency' },
    { pct: 5, color: '#8b5cf6', label: 'Spare' },
  ];

  let cumulative = 0;
  const stops = segments.map(seg => {
    const start = cumulative;
    cumulative += seg.pct;
    return `${seg.color} ${start}% ${cumulative}%`;
  });

  return (
    <div className="flex items-center gap-4">
      <motion.div
        initial={{ scale: 0, rotate: -90 }}
        whileInView={{ scale: 1, rotate: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative h-[68px] w-[68px] shrink-0 rounded-full"
        style={{ background: `conic-gradient(${stops.join(', ')})` }}
      >
        <div className="absolute inset-[6px] rounded-full bg-card flex items-center justify-center">
          <span className="text-[9px] font-bold text-foreground/60">100%</span>
        </div>
      </motion.div>
      <div className="space-y-1 flex-1 min-w-0">
        {segments.map((seg, i) => (
          <motion.div
            key={seg.label}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 + i * 0.08, duration: 0.4 }}
            className="flex items-center gap-1.5"
          >
            <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-[9px] text-muted-foreground/50 flex-1 truncate">{seg.label}</span>
            <span className="text-[9px] font-mono text-muted-foreground/70">{seg.pct}%</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function BillTrackVisual() {
  const bills = [
    { name: 'Electric Bill', amount: 'PHP 2,500', paid: true },
    { name: 'Internet', amount: 'PHP 1,699', paid: true },
    { name: 'Water Bill', amount: 'PHP 450', paid: false },
    { name: 'Rent', amount: 'PHP 5,000', paid: false },
  ];
  return (
    <div className="space-y-1.5">
      {bills.map((bill, i) => (
        <motion.div
          key={bill.name}
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 border ${
            bill.paid
              ? 'bg-emerald-500/[0.04] border-emerald-500/10'
              : 'bg-amber-500/[0.04] border-amber-500/10'
          }`}
        >
          <div className={`flex h-3.5 w-3.5 items-center justify-center rounded-full shrink-0 ${
            bill.paid ? 'bg-emerald-500/20' : 'bg-amber-500/20'
          }`}>
            {bill.paid ? (
              <Check className="h-2 w-2 text-emerald-400" />
            ) : (
              <div className="h-1 w-1 rounded-full bg-amber-400" />
            )}
          </div>
          <span className={`text-[10px] flex-1 truncate ${bill.paid ? 'text-muted-foreground/40 line-through' : 'text-muted-foreground/60'}`}>
            {bill.name}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground/50">{bill.amount}</span>
        </motion.div>
      ))}
    </div>
  );
}

function ExpenseAssetsVisual() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="rounded-lg bg-red-500/[0.05] border border-red-500/10 p-2.5 text-center"
      >
        <div className="text-[9px] text-red-400/60 mb-0.5">Expenses</div>
        <div className="text-sm font-bold font-mono text-red-400">PHP 8,200</div>
        <div className="mt-1.5 flex justify-center gap-0.5">
          {[60, 40, 80, 55, 70].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              whileInView={{ height: `${h * 0.2}px` }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 + i * 0.05, duration: 0.4 }}
              className="w-2.5 rounded-t-sm bg-gradient-to-t from-red-500/60 to-red-400/30"
            />
          ))}
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="rounded-lg bg-emerald-500/[0.05] border border-emerald-500/10 p-2.5 text-center"
      >
        <div className="text-[9px] text-emerald-400/60 mb-0.5">Assets</div>
        <div className="text-sm font-bold font-mono text-emerald-400">PHP 12,800</div>
        <div className="mt-1.5 flex justify-center gap-0.5">
          {[45, 65, 50, 75, 90].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              whileInView={{ height: `${h * 0.2}px` }}
              viewport={{ once: true }}
              transition={{ delay: 0.7 + i * 0.05, duration: 0.4 }}
              className="w-2.5 rounded-t-sm bg-gradient-to-t from-emerald-500/60 to-emerald-400/30"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function PayHistoryVisual() {
  const periods = [
    { month: 'Jan', amount: 21300 },
    { month: 'Feb', amount: 22100 },
    { month: 'Mar', amount: 20800 },
    { month: 'Apr', amount: 23500 },
    { month: 'May', amount: 21900 },
    { month: 'Jun', amount: 24200 },
  ];
  const max = Math.max(...periods.map(p => p.amount));
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1.5 h-14">
        {periods.map((p, i) => (
          <div key={p.month} className="flex flex-col items-center flex-1 gap-1">
            <motion.div
              initial={{ height: 0 }}
              whileInView={{ height: `${(p.amount / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-full rounded-t-sm bg-gradient-to-t from-rose-500/50 to-rose-400/20 min-h-[4px]"
            />
            <span className="text-[8px] text-muted-foreground/40">{p.month}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between px-1">
        <span className="text-[9px] text-muted-foreground/40">6 pay periods</span>
        <span className="text-[10px] font-mono text-rose-400/70">Avg: PHP 22,300</span>
      </div>
    </div>
  );
}

function SpareTrackerVisual() {
  return (
    <div className="space-y-2">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="rounded-lg bg-cyan-500/[0.05] border border-cyan-500/10 px-3 py-2 text-center"
      >
        <div className="text-[9px] text-cyan-400/50 mb-0.5">Available Spare</div>
        <div className="text-base font-bold font-mono text-cyan-400">PHP 3,450.00</div>
      </motion.div>
      <div className="space-y-1">
        {[
          { label: 'Coffee Fund', amount: '+ PHP 150', time: 'Today' },
          { label: 'Snacks', amount: '- PHP 85', time: 'Yesterday' },
        ].map((tx, i) => (
          <motion.div
            key={tx.label}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 + i * 0.1, duration: 0.3 }}
            className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/[0.04] px-2.5 py-1.5"
          >
            <div>
              <div className="text-[9px] text-muted-foreground/50">{tx.label}</div>
              <div className="text-[8px] text-muted-foreground/30">{tx.time}</div>
            </div>
            <span className={`text-[10px] font-mono ${tx.amount.startsWith('+') ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
              {tx.amount}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function BorrowingVisual() {
  return (
    <div className="space-y-1.5">
      {[
        { name: 'Lent to Alice (Lunch)', amount: 'PHP 450.00', type: 'lent', status: 'Active' },
        { name: 'Borrowed from Bob', amount: 'PHP 2,500.00', type: 'borrowed', status: 'Settled' },
      ].map((row, i) => (
        <motion.div
          key={row.name}
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
          className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/[0.04] px-2.5 py-1.5"
        >
          <div className="min-w-0 flex-1 pr-2">
            <span className="text-[9px] text-muted-foreground/60 block truncate">{row.name}</span>
            <span className="text-[8px] text-muted-foreground/30 capitalize">{row.type}</span>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[9px] font-mono font-medium block text-foreground">{row.amount}</span>
            <span className={`text-[8px] font-medium px-1 rounded-sm ${row.status === 'Active' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {row.status}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ConsumableBudgetVisual() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[9px] text-muted-foreground/60">
        <span>Consumable Remaining</span>
        <span className="font-mono text-emerald-400 font-bold">PHP 1,250 / 4,500</span>
      </div>
      {/* Progress bar */}
      <div className="h-2 w-full bg-white/[0.03] border border-white/[0.04] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: '72%' }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
        />
      </div>
      <div className="flex justify-between items-center text-[8px] text-muted-foreground/30">
        <span>72% Spent</span>
        <span>Rollover active</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------
   Feature definitions
   ------------------------------------------------ */
const features = [
  {
    icon: Calculator,
    title: 'Salary Calculator',
    description: 'Split wages across pay periods, track tax deductions, and see your real take-home pay instantly.',
    gradient: 'from-emerald-500 to-teal-400',
    glowColor: 'emerald',
    accentRgb: '16, 185, 129',
    visual: SalaryCalcVisual,
  },
  {
    icon: PieChart,
    title: 'Budget Allocation',
    description: 'Divide your salary into categories with percentage-based budgets. Visualize where every peso goes.',
    gradient: 'from-blue-500 to-indigo-400',
    glowColor: 'blue',
    accentRgb: '59, 130, 246',
    visual: BudgetAllocVisual,
  },
  {
    icon: Receipt,
    title: 'Bill Tracking',
    description: 'Never miss a payment with monthly bill checklists and automated email reminders.',
    gradient: 'from-amber-500 to-orange-400',
    glowColor: 'amber',
    accentRgb: '245, 158, 11',
    visual: BillTrackVisual,
  },
  {
    icon: TrendingUp,
    title: 'Expense vs Assets',
    description: 'Classify spending as expenses or assets. Make smarter financial decisions with clear categorization.',
    gradient: 'from-violet-500 to-purple-400',
    glowColor: 'violet',
    accentRgb: '139, 92, 246',
    visual: ExpenseAssetsVisual,
  },
  {
    icon: History,
    title: 'Pay Period History',
    description: 'Review past pay periods with detailed breakdowns, searchable records, and trend charts.',
    gradient: 'from-rose-500 to-pink-400',
    glowColor: 'rose',
    accentRgb: '244, 63, 94',
    visual: PayHistoryVisual,
  },
  {
    icon: Wallet,
    title: 'Spare Tracker',
    description: 'Track leftover money after all allocations. Record spare transactions and watch your balance grow.',
    gradient: 'from-cyan-500 to-sky-400',
    glowColor: 'cyan',
    accentRgb: '6, 182, 212',
    visual: SpareTrackerVisual,
  },
  {
    icon: HandCoins,
    title: 'Borrowing & Debt',
    description: 'Track money borrowed or lent. Manage active debts, link them to allocations, and settle or gift them easily.',
    gradient: 'from-rose-500 to-pink-400',
    glowColor: 'rose',
    accentRgb: '244, 63, 94',
    visual: BorrowingVisual,
  },
  {
    icon: Coins,
    title: 'Consumable Budget',
    description: 'Manage monthly allowances for daily expenses, track limits, and enable automatic rollover of savings.',
    gradient: 'from-emerald-500 to-teal-400',
    glowColor: 'emerald',
    accentRgb: '16, 185, 129',
    visual: ConsumableBudgetVisual,
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

/* ------------------------------------------------
   Feature Card
   ------------------------------------------------ */
function FeatureCard({ feature, index }: { feature: (typeof features)[0]; index: number }) {
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
      initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
      className="group relative rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden transition-colors duration-300 hover:border-white/10 flex flex-col"
    >
      {/* Mouse-tracking spotlight */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: spotlight }}
      />

      {/* Top accent glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background: `radial-gradient(ellipse at top center, rgba(${feature.accentRgb}, 0.06), transparent 60%)`,
        }}
      />

      {/* Visual area - fixed height for cross-card alignment */}
      <div className="relative px-5 pt-5">
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-3 h-[160px] flex flex-col justify-center">
          <feature.visual />
        </div>
      </div>

      {/* Separator */}
      <div className="mx-5 mt-4 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

      {/* Text content */}
      <div className="relative px-5 pt-4 pb-5 flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 shrink-0 transition-transform duration-300 group-hover:scale-110"
            style={{ backgroundColor: `rgba(${feature.accentRgb}, 0.1)` }}
          >
            <feature.icon className="h-4 w-4" style={{ color: `rgb(${feature.accentRgb})` }} />
          </div>
          <h3 className="text-base font-semibold">{feature.title}</h3>
        </div>
        <p className="text-sm text-muted-foreground/70 leading-relaxed flex-1">
          {feature.description}
        </p>

        {/* Bottom gradient line */}
        <div className="mt-4 h-px w-full overflow-hidden rounded-full bg-border/20">
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
      <motion.div
        animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-12 -right-12 w-64 h-64 rounded-full border border-primary/[0.05]"
      />
      <motion.div
        animate={{ y: [0, 15, 0], rotate: [0, -3, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full border border-violet-500/[0.05]"
      />
      <div className="absolute top-20 left-8 grid grid-cols-3 gap-2 opacity-[0.06]">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary" />
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

        {/* Uniform 3-column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
