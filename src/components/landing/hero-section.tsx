'use client';

import Link from 'next/link';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { ArrowRight, Sparkles, TrendingUp, DollarSign, PieChart, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------
   Decorative Floating Particles
   ------------------------------------------------ */
function FloatingParticles() {
  const particles = [
    { size: 4, x: '10%', y: '20%', delay: 0, duration: 6 },
    { size: 3, x: '85%', y: '15%', delay: 1.5, duration: 7 },
    { size: 5, x: '70%', y: '60%', delay: 0.8, duration: 5.5 },
    { size: 3, x: '25%', y: '70%', delay: 2.2, duration: 8 },
    { size: 4, x: '50%', y: '30%', delay: 1, duration: 6.5 },
    { size: 3, x: '90%', y: '75%', delay: 3, duration: 7.5 },
    { size: 2, x: '15%', y: '50%', delay: 0.5, duration: 9 },
    { size: 3, x: '60%', y: '85%', delay: 2, duration: 6 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-primary/20"
          style={{ width: p.size, height: p.size, left: p.x, top: p.y }}
          animate={{
            y: [0, -30, 0, 20, 0],
            x: [0, 15, -10, 5, 0],
            opacity: [0.2, 0.6, 0.3, 0.5, 0.2],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------
   Grid background pattern
   ------------------------------------------------ */
function GridPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Vertical lines */}
      <div className="absolute inset-0 opacity-[0.03]">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute top-0 bottom-0 w-px bg-primary"
            style={{ left: `${(i + 1) * 5}%` }}
          />
        ))}
      </div>
      {/* Horizontal lines */}
      <div className="absolute inset-0 opacity-[0.03]">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute left-0 right-0 h-px bg-primary"
            style={{ top: `${(i + 1) * 8}%` }}
          />
        ))}
      </div>
      {/* Radial fade overlay to soften grid edges */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,var(--background)_75%)]" />
    </div>
  );
}

/* ------------------------------------------------
   Dashboard Mockup Illustration (CSS-based)
   ------------------------------------------------ */
function DashboardMockup() {
  const [salary, setSalary] = useState(45000);
  const [selectedDay, setSelectedDay] = useState(3); // Default to Thursday (index 3)

  const barHeights = [45, 70, 55, 85, 65, 90, 75];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Calculate dynamic values
  const monthlySalaryStr = `PHP ${salary.toLocaleString()}`;
  const budgetUsedStr = `PHP ${(Math.round(salary * 0.68)).toLocaleString()}`;
  const savingsStr = `PHP ${(Math.round(salary * 0.28)).toLocaleString()}`;
  const selectedDaySpending = Math.round(salary * (barHeights[selectedDay] / 100) * 0.08);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative mx-auto mt-16 max-w-4xl"
    >
      {/* Glow behind the card */}
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary/20 via-violet-500/10 to-primary/20 blur-2xl opacity-60" />

      {/* Main card */}
      <div className="relative rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl overflow-hidden shadow-2xl shadow-primary/5">
        {/* Titlebar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-b border-border/40 bg-muted/30">
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-amber-500/60" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
          </div>

          {/* Salary Slider (Try it) */}
          <div className="flex items-center gap-2 bg-background/50 border border-border/50 px-3 py-1 rounded-full text-[11px]">
            <span className="text-muted-foreground/80 font-medium">Try Salary:</span>
            <input
              type="range"
              min="15000"
              max="150000"
              step="5000"
              value={salary}
              onChange={(e) => setSalary(Number(e.target.value))}
              className="w-20 sm:w-28 h-1 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <span className="font-mono font-bold text-primary tabular-nums">
              PHP {salary.toLocaleString()}
            </span>
          </div>

          <div className="hidden sm:block text-xs text-muted-foreground/40 font-mono">
            dashboard.salarymgr.app
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6">
          {/* Top stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Monthly Salary', value: monthlySalaryStr, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Budget Used (68%)', value: budgetUsedStr, icon: PieChart, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Bills Paid', value: '8 / 12', icon: Wallet, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { label: 'Savings (28%)', value: savingsStr, icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-500/10' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1 + i * 0.1 }}
                className="rounded-xl border border-border/30 bg-muted/20 p-3 hover:bg-muted/30 transition-all cursor-default"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-md ${stat.bg}`}>
                    <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-sm sm:text-base font-bold font-display tabular-nums truncate text-foreground">{stat.value}</p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground/60 truncate">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Mini chart */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.4 }}
            className="rounded-xl border border-border/30 bg-muted/10 p-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-4">
              <div>
                <span className="text-xs font-semibold text-muted-foreground/80 block">Weekly Spending Demo</span>
                <span className="text-[10px] text-muted-foreground/40 block">Click bars to view details</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-emerald-400 font-mono block">
                  {dayNames[selectedDay]}: PHP {selectedDaySpending.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex items-end justify-between gap-2 h-24 pt-2">
              {barHeights.map((h, i) => (
                <motion.div
                  key={i}
                  onClick={() => setSelectedDay(i)}
                  className={cn(
                    "flex-1 rounded-t-md cursor-pointer transition-all duration-200 relative group",
                    selectedDay === i
                      ? "bg-gradient-to-t from-primary to-primary/45 shadow-lg shadow-primary/20 scale-x-105"
                      : "bg-gradient-to-t from-primary/30 to-primary/10 hover:from-primary/50 hover:to-primary/25"
                  )}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.7, delay: 1.6 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* Floating value tag on hover */}
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-transform bg-popover text-popover-foreground border border-border text-[8px] font-mono font-bold px-1 py-0.5 rounded shadow-md pointer-events-none">
                    PHP {Math.round(salary * (h / 100) * 0.08).toLocaleString()}
                  </span>
                </motion.div>
              ))}
            </div>
            <div className="flex justify-between mt-2.5">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
                <span
                  key={i}
                  onClick={() => setSelectedDay(i)}
                  className={cn(
                    "flex-1 text-center text-[9px] cursor-pointer transition-colors",
                    selectedDay === i
                      ? "text-primary font-bold"
                      : "text-muted-foreground/40 hover:text-muted-foreground"
                  )}
                >
                  {d}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating decorative elements */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-6 -right-6 w-20 h-20 rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-sm flex items-center justify-center"
      >
        <TrendingUp className="w-8 h-8 text-primary/40" />
      </motion.div>

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -bottom-4 -left-4 w-16 h-16 rounded-xl border border-violet-500/20 bg-violet-500/5 backdrop-blur-sm flex items-center justify-center"
      >
        <PieChart className="w-6 h-6 text-violet-400/40" />
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------
   Main Hero Section
   ------------------------------------------------ */
export function HeroSection() {
  /* Mouse parallax for floating elements */
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const containerRef = useRef<HTMLElement>(null);

  const springConfig = { stiffness: 50, damping: 30 };
  const parallaxX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), springConfig);
  const parallaxY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-15, 15]), springConfig);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
      mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  /* Typewriter-style counter animation */
  const [statIndex, setStatIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setStatIndex((i) => (i + 1) % 4), 3000);
    return () => clearInterval(timer);
  }, []);

  const stats = [
    { value: '100%', label: 'Free to Use' },
    { value: 'Real-time', label: 'Budget Tracking' },
    { value: 'Automated', label: 'Bill Reminders' },
    { value: 'Secure', label: 'Data Encryption' },
  ];

  return (
    <section
      ref={containerRef}
      className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden pt-16"
    >
      {/* Decorative Background Layers */}
      <GridPattern />
      <FloatingParticles />

      {/* Large gradient ring */}
      <motion.div
        style={{ x: parallaxX, y: parallaxY }}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-primary/[0.07] pointer-events-none"
        aria-hidden="true"
      />
      <motion.div
        style={{ x: parallaxX, y: parallaxY }}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-primary/[0.04] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-20 w-full">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7 }}
          className="mb-8 text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary border border-primary/20 backdrop-blur-sm">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="h-3.5 w-3.5" />
            </motion.div>
            Smart Salary Management for Filipino Professionals
          </div>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight font-display leading-[1.08] mb-6 text-center"
        >
          Take Control of{' '}
          <br className="hidden sm:block" />
          <span className="gradient-text">Every Peso</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed mb-10 text-center"
        >
          Track your salary, allocate budgets, monitor bills, and watch your savings grow.
          A personal finance dashboard designed to help you make smarter decisions with your money.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/signup">
            <Button
              size="lg"
              className="text-base px-8 h-12 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
          <a href="#features">
            <Button
              variant="outline"
              size="lg"
              className="text-base px-8 h-12 hover:bg-primary/5 transition-all duration-300"
            >
              See Features
            </Button>
          </a>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-3xl mx-auto"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              className="relative text-center group"
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <div className="relative rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm px-4 py-3.5 transition-colors duration-300 group-hover:border-primary/20 group-hover:bg-card/50">
                <motion.p
                  className="text-xl sm:text-2xl font-bold font-display gradient-text"
                  animate={statIndex === i ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  {stat.value}
                </motion.p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Dashboard Mockup */}
        <DashboardMockup />
      </div>
    </section>
  );
}
