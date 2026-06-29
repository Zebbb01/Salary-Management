'use client';

import { useEffect, useLayoutEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import { successAnimation, warningAnimation } from '@/components/ui/lottie-animations';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import {
  DollarSign,
  Receipt,
  ArrowDownRight,
  Sparkles,
  TrendingUp,
  Settings,
  Briefcase,
  Wallet,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Circle,
  Landmark,
  BarChart3,
  CalendarRange,
  Filter,
  Lock,
  ChevronRight,
  ShoppingCart,
  HandCoins,
  Info,
} from 'lucide-react';
import {
  Tooltip as UITooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { toast } from 'sonner';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  getSpareTotal,
  getSpareTransactionsInRange,
  getCurrentUser,
  initMonthlyBills,
  upsertBillPayment,
  getFinancialSummary,
  getPayPeriodTrend,
  getLatestPeriodInRange,
  getAllocationTypes,
  getPayPeriods,
  getConsumableBudgetSummary,
  getBorrowingSummary,
  getSalaryConfig,
} from '@/features/salary/services/salary.service';
import type {
  SalaryConfig,
  BudgetAllocationWithAmount,
  PayPeriod,
  BillPayment,
  FinancialSummary,
  AllocationType,
  SpareTransaction,
  ConsumableBudgetSummary,
  BorrowingSummary,
} from '@/features/salary/types/salary.types';
import {
  computeAllocations,
  formatPHP,
  formatPercentage,
} from '@/features/salary/utils/calculations';
import { cn } from '@/lib/utils';
import { CategoryIcon } from '@/components/ui/category-icon';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { MonthYearPicker, monthYearToDateRange, type MonthYearSelection } from '@/components/ui/month-year-picker';
import { Input } from '@/components/ui/input';

// ============================================
// CONSTANTS
// ============================================

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

// ============================================
// ANIMATED NUMBER
// ============================================

function AnimatedNumber({ value, prefix = '' }: { value: number; prefix?: string }) {
  const [displayed, setDisplayed] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const duration = 600;
    const start = performance.now();
    const from = displayed;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(from + (value - from) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
    // Only re-run when value changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span className="tabular-nums font-display">
      {prefix}{formatPHP(displayed)}
    </span>
  );
}

// ============================================
// STAT CARD
// ============================================

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  colorTheme: 'indigo' | 'sky' | 'teal' | 'rose' | 'amber' | 'purple' | 'emerald' | 'violet';
  index: number;
  editable?: boolean;
  onSave?: (value: number) => void;
  subtitle?: string;
  tooltip?: React.ReactNode;
}

function StatCard({
  label,
  value,
  icon: Icon,
  colorTheme,
  index,
  editable,
  onSave,
  subtitle,
  tooltip,
}: StatCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const themeClasses = {
    indigo: {
      accent: 'bg-indigo-500',
      glow: 'from-indigo-500/10 via-indigo-500/5 to-transparent',
      cardBg: 'from-card via-card to-indigo-950/15',
      iconColor: 'text-indigo-500/5 dark:text-indigo-400/5 group-hover:text-indigo-500/10 dark:group-hover:text-indigo-400/10',
    },
    sky: {
      accent: 'bg-sky-500',
      glow: 'from-sky-500/10 via-sky-500/5 to-transparent',
      cardBg: 'from-card via-card to-sky-950/15',
      iconColor: 'text-sky-500/5 dark:text-sky-400/5 group-hover:text-sky-500/10 dark:group-hover:text-sky-400/10',
    },
    teal: {
      accent: 'bg-teal-500',
      glow: 'from-teal-500/10 via-teal-500/5 to-transparent',
      cardBg: 'from-card via-card to-teal-950/15',
      iconColor: 'text-teal-500/5 dark:text-teal-400/5 group-hover:text-teal-500/10 dark:group-hover:text-teal-400/10',
    },
    rose: {
      accent: 'bg-rose-500',
      glow: 'from-rose-500/10 via-rose-500/5 to-transparent',
      cardBg: 'from-card via-card to-rose-950/15',
      iconColor: 'text-rose-500/5 dark:text-rose-400/5 group-hover:text-rose-500/10 dark:group-hover:text-rose-400/10',
    },
    amber: {
      accent: 'bg-amber-500',
      glow: 'from-amber-500/10 via-amber-500/5 to-transparent',
      cardBg: 'from-card via-card to-amber-950/15',
      iconColor: 'text-amber-500/5 dark:text-amber-400/5 group-hover:text-amber-500/10 dark:group-hover:text-amber-400/10',
    },
    purple: {
      accent: 'bg-purple-500',
      glow: 'from-purple-500/10 via-purple-500/5 to-transparent',
      cardBg: 'from-card via-card to-purple-950/15',
      iconColor: 'text-purple-500/5 dark:text-purple-400/5 group-hover:text-purple-500/10 dark:group-hover:text-purple-400/10',
    },
    emerald: {
      accent: 'bg-emerald-500',
      glow: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
      cardBg: 'from-card via-card to-emerald-950/15',
      iconColor: 'text-emerald-500/5 dark:text-emerald-400/5 group-hover:text-emerald-500/10 dark:group-hover:text-emerald-400/10',
    },
    violet: {
      accent: 'bg-violet-500',
      glow: 'from-violet-500/10 via-violet-500/5 to-transparent',
      cardBg: 'from-card via-card to-violet-950/15',
      iconColor: 'text-violet-500/5 dark:text-violet-400/5 group-hover:text-violet-500/10 dark:group-hover:text-violet-400/10',
    },
  }[colorTheme];

  function handleStartEdit() {
    if (!editable) return;
    setEditValue(value.toString());
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleSave() {
    const parsed = parseFloat(editValue);
    if (isNaN(parsed) || parsed < 0) {
      toast.error('Please enter a valid amount');
      setIsEditing(false);
      return;
    }
    onSave?.(parsed);
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setIsEditing(false);
  }

  return (
    <motion.div variants={staggerItem} className="h-full">
      <Card
        className={cn(
          'group relative overflow-hidden border border-border/40 bg-gradient-to-br backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:border-border/80 h-full',
          themeClasses.cardBg,
          editable && 'cursor-pointer'
        )}
        onClick={handleStartEdit}
      >
        {/* Top Accent Line */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-[2px] opacity-35 group-hover:opacity-100 transition-opacity duration-300",
          themeClasses.accent
        )} />

        {/* Dotted Grid Background */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] transition-opacity duration-300 group-hover:opacity-[0.05] dark:group-hover:opacity-[0.09] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--foreground) 1px, transparent 1px)',
            backgroundSize: '12px 12px',
          }}
        />

        {/* Glow backdrop effect */}
        <div className={cn(
          "absolute -right-8 -top-8 h-20 w-20 rounded-full bg-gradient-to-br blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none",
          themeClasses.glow
        )} />

        {/* Large watermark icon in the background */}
        <div className={cn(
          "absolute -right-6 -bottom-6 transition-all duration-500 transform rotate-12 group-hover:scale-110 group-hover:rotate-[15deg] pointer-events-none",
          themeClasses.iconColor
        )}>
          <Icon className="h-28 w-28 stroke-[1.2]" />
        </div>

        <CardContent className="p-3.5 sm:p-5 h-full flex flex-col justify-between gap-3 relative z-10">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] sm:text-xs font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-1">
              {label}
              {editable && !isEditing && (
                <span className="text-[8px] sm:text-[10px] font-normal normal-case tracking-normal text-muted-foreground/50">(click to edit)</span>
              )}
            </span>

            {tooltip && (
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger className="flex shrink-0">
                    <Info className="h-3.5 w-3.5 text-muted-foreground/35 hover:text-muted-foreground/75 cursor-help transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px] text-[10px] leading-relaxed">
                    {tooltip}
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            )}
          </div>

          <div className="mt-1 sm:mt-2">
            {isEditing ? (
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground/60">PHP</span>
                <Input
                  ref={inputRef}
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleSave}
                  onKeyDown={handleKeyDown}
                  className="w-28 text-sm sm:text-base md:text-lg lg:text-xl font-bold tabular-nums font-display bg-transparent border-border/60"
                  min={0}
                  step={100}
                />
              </div>
            ) : (
              <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-foreground font-display tracking-tight flex items-baseline">
                <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground/60 mr-1">PHP</span>
                <AnimatedNumber value={value} />
              </p>
            )}
            {subtitle && !isEditing && (
              <p className="text-[10px] sm:text-[11px] text-muted-foreground/60 mt-1">{subtitle}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================
// FINANCIAL OVERVIEW CARD (read-only)
// ============================================

interface OverviewCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  colorTheme: 'teal' | 'emerald' | 'violet' | 'rose' | 'sky';
  tooltip?: React.ReactNode;
}

function OverviewCard({ label, value, icon: Icon, colorTheme, tooltip }: OverviewCardProps) {
  const themeClasses = {
    teal: {
      accent: 'bg-teal-500',
      glow: 'from-teal-500/10 via-teal-500/5 to-transparent',
      cardBg: 'from-card via-card to-teal-950/15',
      iconColor: 'text-teal-500/5 dark:text-teal-400/5 group-hover:text-teal-500/10 dark:group-hover:text-teal-400/10',
    },
    emerald: {
      accent: 'bg-emerald-500',
      glow: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
      cardBg: 'from-card via-card to-emerald-950/15',
      iconColor: 'text-emerald-500/5 dark:text-emerald-400/5 group-hover:text-emerald-500/10 dark:group-hover:text-emerald-400/10',
    },
    violet: {
      accent: 'bg-violet-500',
      glow: 'from-violet-500/10 via-violet-500/5 to-transparent',
      cardBg: 'from-card via-card to-violet-950/15',
      iconColor: 'text-violet-500/5 dark:text-violet-400/5 group-hover:text-violet-500/10 dark:group-hover:text-violet-400/10',
    },
    rose: {
      accent: 'bg-rose-500',
      glow: 'from-rose-500/10 via-rose-500/5 to-transparent',
      cardBg: 'from-card via-card to-rose-950/15',
      iconColor: 'text-rose-500/5 dark:text-rose-400/5 group-hover:text-rose-500/10 dark:group-hover:text-rose-400/10',
    },
    sky: {
      accent: 'bg-sky-500',
      glow: 'from-sky-500/10 via-sky-500/5 to-transparent',
      cardBg: 'from-card via-card to-sky-950/15',
      iconColor: 'text-sky-500/5 dark:text-sky-400/5 group-hover:text-sky-500/10 dark:group-hover:text-sky-400/10',
    },
  }[colorTheme];

  return (
    <motion.div variants={staggerItem} className="h-full">
      <Card className={cn(
        "group relative overflow-hidden border border-border/40 bg-gradient-to-br backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:border-border/80 h-full",
        themeClasses.cardBg
      )}>
        {/* Top Accent Line */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-[2px] opacity-35 group-hover:opacity-100 transition-opacity duration-300",
          themeClasses.accent
        )} />

        {/* Dotted Grid Background */}
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] transition-opacity duration-300 group-hover:opacity-[0.05] dark:group-hover:opacity-[0.09] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--foreground) 1px, transparent 1px)',
            backgroundSize: '12px 12px',
          }}
        />

        {/* Glow backdrop effect */}
        <div className={cn(
          "absolute -right-8 -top-8 h-20 w-20 rounded-full bg-gradient-to-br blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none",
          themeClasses.glow
        )} />
        
        {/* Large watermark icon in the background */}
        <div className={cn(
          "absolute -right-6 -bottom-6 transition-all duration-500 transform rotate-12 group-hover:scale-110 group-hover:rotate-[15deg] pointer-events-none",
          themeClasses.iconColor
        )}>
          <Icon className="h-28 w-28 stroke-[1.2]" />
        </div>

        <CardContent className="p-3.5 sm:p-5 h-full flex flex-col justify-between gap-4 relative z-10">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] sm:text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {label}
            </span>
            
            {tooltip && (
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger className="flex shrink-0">
                    <Info className="h-3.5 w-3.5 text-muted-foreground/35 hover:text-muted-foreground/75 cursor-help transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <div>{tooltip}</div>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            )}
          </div>

          <div className="mt-1 sm:mt-2">
            <p className="text-sm sm:text-base md:text-lg lg:text-2xl xl:text-3xl font-bold text-foreground font-display tracking-tight flex items-baseline">
              <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground/60 mr-1">PHP</span>
              <AnimatedNumber value={value} />
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================
// CUSTOM TOOLTIP (Pie)
// ============================================

interface ChartPayload {
  name: string;
  value: number;
  payload: {
    category: string;
    amount: number;
    percentage: number;
    fill: string;
  };
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ChartPayload[];
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !active) return;

    el.style.transform = '';
    const rect = el.getBoundingClientRect();
    const transforms: string[] = [];

    if (rect.right > window.innerWidth - 16) {
      transforms.push('translateX(calc(-100% - 30px))');
    } else if (rect.left < 16) {
      transforms.push('translateX(30px)');
    }

    if (rect.bottom > window.innerHeight - 16) {
      transforms.push('translateY(calc(-100% - 20px))');
    } else if (rect.top < 16) {
      transforms.push('translateY(20px)');
    }

    if (transforms.length) {
      el.style.transform = transforms.join(' ');
    }
  });

  if (!active || !payload?.length) return null;
  const data = payload[0].payload;

  return (
    <div ref={ref}>
      <Card className="shadow-xl border-border/50 bg-card/95 backdrop-blur-sm">
        <CardContent className="px-3 py-2.5">
          <p className="text-sm font-medium capitalize text-foreground">
            {data.category}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatPercentage(data.percentage)} - PHP {formatPHP(data.amount)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// CUSTOM TOOLTIP (Trend Chart)
// ============================================

interface TrendPayloadItem {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

function TrendChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TrendPayloadItem[];
  label?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !active) return;

    // Reset transform to measure natural position
    el.style.transform = '';
    const rect = el.getBoundingClientRect();
    const transforms: string[] = [];

    // Flip horizontally
    if (rect.right > window.innerWidth - 16) {
      transforms.push('translateX(calc(-100% - 30px))');
    } else if (rect.left < 16) {
      transforms.push('translateX(30px)');
    }

    // Flip vertically
    if (rect.bottom > window.innerHeight - 16) {
      transforms.push('translateY(calc(-100% - 20px))');
    } else if (rect.top < 16) {
      transforms.push('translateY(20px)');
    }

    if (transforms.length) {
      el.style.transform = transforms.join(' ');
    }
  });

  if (!active || !payload?.length) return null;

  const income = payload.find((p) => p.dataKey === 'income')?.value ?? 0;
  const expenses = payload.find((p) => p.dataKey === 'expenses')?.value ?? 0;
  const net = income - expenses;
  const showNet = payload.some(p => p.dataKey === 'income') && payload.some(p => p.dataKey === 'expenses');

  return (
    <div ref={ref}>
      <Card className="shadow-xl border-border/50 bg-card/95 backdrop-blur-sm">
        <CardContent className="px-3.5 py-3">
          <p className="text-sm font-semibold text-foreground mb-2">{label}</p>
          <div className="space-y-1.5">
            {payload.map((entry) => (
              <div key={entry.dataKey} className="flex items-center justify-between gap-6 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  {entry.name}
                </span>
                <span className="font-semibold tabular-nums text-foreground">
                  PHP {formatPHP(entry.value)}
                </span>
              </div>
            ))}
          </div>
          {showNet && (
            <>
              <Separator className="my-2" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Cashflow Net</span>
                <span className={cn(
                  'font-bold tabular-nums',
                  net >= 0 ? 'text-emerald-500' : 'text-rose-500'
                )}>
                  {net >= 0 ? '+' : ''}PHP {formatPHP(net)}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// DONUT CHART CENTER LABEL
// ============================================

function CenterLabel({ salary }: { salary: number }) {
  return (
    <text
      x="50%"
      y="50%"
      textAnchor="middle"
      dominantBaseline="middle"
      className="fill-foreground"
    >
      <tspan x="50%" dy="-8" className="text-xs fill-muted-foreground">
        Total
      </tspan>
      <tspan x="50%" dy="20" className="text-sm font-semibold fill-foreground">
        PHP {formatPHP(salary)}
      </tspan>
    </text>
  );
}

// ============================================
// EMPTY STATE
// ============================================

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card className="px-6 py-16">
        <CardContent className="flex flex-col items-center justify-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Settings className="h-7 w-7 text-primary" />
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-lg font-semibold text-foreground">
              No salary configured yet
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Set up your salary and budget allocations in Settings to see your
              dashboard overview and budget breakdown.
            </p>
          </div>
          <Link href="/dashboard/settings" className={cn(buttonVariants({ size: "lg" }), "gap-1.5")}>
            <Settings className="h-4 w-4" />
            Go to Settings
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================
// LOADING SKELETON
// ============================================

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-7 w-32" />
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Hero */}
      <Skeleton className="h-28 rounded-xl" />
      {/* Two columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

// ============================================
// DATE FILTER TYPES
// ============================================

type DateFilterPreset = 'this-month' | 'last-month' | 'last-3-months' | 'this-year' | 'all-time' | 'custom';

function getDateRange(preset: DateFilterPreset, customRange?: MonthYearSelection | null): { dateFrom?: string; dateTo?: string; billMonth: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (preset) {
    case 'this-month': {
      const from = new Date(year, month, 1).toISOString();
      const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      return { dateFrom: from, dateTo: to, billMonth: `${year}-${String(month + 1).padStart(2, '0')}` };
    }
    case 'last-month': {
      const from = new Date(year, month - 1, 1).toISOString();
      const to = new Date(year, month, 0, 23, 59, 59).toISOString();
      const m = month === 0 ? 12 : month;
      const y = month === 0 ? year - 1 : year;
      return { dateFrom: from, dateTo: to, billMonth: `${y}-${String(m).padStart(2, '0')}` };
    }
    case 'last-3-months': {
      const from = new Date(year, month - 2, 1).toISOString();
      return { dateFrom: from, billMonth: `${year}-${String(month + 1).padStart(2, '0')}` };
    }
    case 'this-year': {
      const from = new Date(year, 0, 1).toISOString();
      return { dateFrom: from, billMonth: `${year}-${String(month + 1).padStart(2, '0')}` };
    }
    case 'custom': {
      if (customRange) {
        const { dateFrom, dateTo } = monthYearToDateRange(customRange);
        const m = customRange.month + 1;
        const y = customRange.year;
        return { dateFrom, dateTo, billMonth: `${y}-${String(m).padStart(2, '0')}` };
      }
      return { billMonth: `${year}-${String(month + 1).padStart(2, '0')}` };
    }
    case 'all-time':
    default:
      return { billMonth: `${year}-${String(month + 1).padStart(2, '0')}` };
  }
}

const DATE_FILTER_OPTIONS: { value: DateFilterPreset; label: string }[] = [
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'last-3-months', label: 'Last 3 Months' },
  { value: 'this-year', label: 'This Year' },
  { value: 'all-time', label: 'All Time' },
];

// ============================================
// DASHBOARD PAGE
// ============================================

export default function DashboardPage() {
  const [salaryConfig, setSalaryConfig] = useState<SalaryConfig | null>(null);
  const [allocations, setAllocations] = useState<BudgetAllocationWithAmount[]>([]);
  const [latestPeriod, setLatestPeriod] = useState<PayPeriod | null>(null);
  const [spareSpent, setSpareSpent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Date filter
  const [dateFilter, setDateFilter] = useState<DateFilterPreset>('this-month');
  const [customMonth, setCustomMonth] = useState<MonthYearSelection | null>(null);

  // New state
  const [billPayments, setBillPayments] = useState<BillPayment[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [trendData, setTrendData] = useState<{ label: string; income: number; netPay: number; expenses: number; spare: number; tax: number; savings: number }[]>([]);
  const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>({
    income: true,
    netPay: true,
    expenses: true,
    spare: false,
    tax: false,
    savings: false,
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [trendLimit, setTrendLimit] = useState(6);
  const [allocationTypes, setAllocationTypes] = useState<AllocationType[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'expense' | 'asset'>('all');
  const [billFilter, setBillFilter] = useState<'all' | 'expense' | 'asset'>('all');
  const [spareTransactions, setSpareTransactions] = useState<SpareTransaction[]>([]);
  const [consumableSummary, setConsumableSummary] = useState<ConsumableBudgetSummary | null>(null);
  const [borrowingSummary, setBorrowingSummary] = useState<BorrowingSummary | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [pendingToggleBill, setPendingToggleBill] = useState<BillPayment | null>(null);

  // Detect mobile/touch devices to disable chart tooltips
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleLegendClick = useCallback((e: any) => {
    const dataKey = e.dataKey;
    if (!dataKey) return;
    setVisibleSeries((prev) => ({
      ...prev,
      [dataKey]: !prev[dataKey],
    }));
  }, []);

  // Handle trend filter change
  const handleTrendFilter = useCallback(async (limit: number) => {
    setTrendLimit(limit);
    try {
      const { dateFrom, dateTo } = getDateRange(dateFilter, customMonth);
      const trend = await getPayPeriodTrend(limit, { dateFrom, dateTo });
      setTrendData(trend);
    } catch {
      // Silently fail
    }
  }, [dateFilter, customMonth]);

  const fetchData = useCallback(async (filter: DateFilterPreset = 'this-month', custom?: MonthYearSelection | null) => {
    try {
      const supabase = createClient();
      const { dateFrom, dateTo, billMonth } = getDateRange(filter, custom);
      const dateOpts = { dateFrom, dateTo };

      // Get current user
      const user = await getCurrentUser();
      if (user) {
        setUserId(user.id);
      }

      // Fetch salary config
      const { data: configData, error: configError } = await supabase
        .from('salary_configs')
        .select('*')
        .single();

      if (configError && configError.code !== 'PGRST116') {
        throw configError;
      }

      if (!configData) {
        setSalaryConfig(null);
        setIsLoading(false);
        return;
      }

      setSalaryConfig(configData);

      // Fetch budget allocations
      const { data: allocData, error: allocError } = await supabase
        .from('budget_allocations')
        .select('*')
        .eq('salary_config_id', configData.id)
        .order('display_order', { ascending: true });

      if (allocError) throw allocError;

      // Use combined salary (full-time + part-time) for budget allocations
      const totalSalary = (configData.full_time_salary ?? 0) + (configData.part_time_salary ?? 0);
      const computed = computeAllocations(allocData ?? [], totalSalary);
      setAllocations(computed);

      // Fetch allocation types for classification filtering
      try {
        const types = await getAllocationTypes();
        setAllocationTypes(types);
      } catch {
        // Silently fail - filter will default to showing all
      }

      // Fetch latest pay period within selected date range
      const periodData = await getLatestPeriodInRange(dateOpts);
      setLatestPeriod(periodData);

      // Fetch spare transactions total for the latest pay period
      if (periodData?.id) {
        const spent = await getSpareTotal(periodData.id);
        setSpareSpent(spent);
      } else {
        setSpareSpent(0);
      }

      // Fetch financial summary with date filter
      const summary = await getFinancialSummary(dateOpts);
      setFinancialSummary(summary);

      // Fetch trend data with date filter
      const trend = await getPayPeriodTrend(6, dateOpts);
      setTrendData(trend);

      // Fetch spare transactions for the breakdown section
      try {
        const spareTxns = await getSpareTransactionsInRange(dateOpts);
        setSpareTransactions(spareTxns);
      } catch {
        setSpareTransactions([]);
      }

      // Fetch consumable budget summary for current month
      try {
        const cMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        const allowance = configData.consumable_allowance ?? 4500;
        const consumable = await getConsumableBudgetSummary(cMonth, allowance);
        setConsumableSummary(consumable);
      } catch {
        setConsumableSummary(null);
      }

      // Fetch borrowing summary
      try {
        const bSummary = await getBorrowingSummary();
        setBorrowingSummary(bSummary);
      } catch {
        setBorrowingSummary(null);
      }

      // Init and fetch monthly bills - always for the CURRENT month
      // Bills are a to-do checklist, not historical data, so they
      // should not change when the date filter changes.
      // Only init bills if the user has saved at least one pay period
      // (prevents new users from seeing bills before they've used the app).
      const currentMonth = (() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      })();
      const hasAnyPeriods = await getPayPeriods(1);
      if (user && computed.length > 0 && hasAnyPeriods.length > 0) {
        const allocationsWithIds = computed.map((a) => ({
          id: a.id,
          amount: a.amount,
        }));
        const bills = await initMonthlyBills(user.id, currentMonth, allocationsWithIds);
        setBillPayments(bills);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard data';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(dateFilter, customMonth);
  }, [fetchData, dateFilter, customMonth]);



  // Bills always use the current month (not the date filter)
  const activeBillMonth = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  })();

  // Handle marking a bill as paid
  async function handleMarkBillPaid(bill: BillPayment) {
    if (!userId) return;

    try {
      const updated = await upsertBillPayment(userId, bill.allocation_id, activeBillMonth, {
        amount: bill.amount,
        is_paid: true,
        paid_at: new Date().toISOString(),
      });
      setBillPayments((prev) =>
        prev.map((b) => (b.allocation_id === bill.allocation_id ? updated : b))
      );
      toast.success('Bill marked as paid');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update bill';
      toast.error(message);
    }
  }

  // Handle toggling a bill paid/unpaid
  async function handleToggleBill(bill: BillPayment) {
    if (!userId) return;

    const newIsPaid = !bill.is_paid;
    const alloc = allocationMap.get(bill.allocation_id);
    const fullAmount = alloc?.amount ?? bill.amount;

    try {
      const updated = await upsertBillPayment(userId, bill.allocation_id, activeBillMonth, {
        amount: newIsPaid ? fullAmount : 0,
        is_paid: newIsPaid,
        paid_at: newIsPaid ? new Date().toISOString() : null,
      });
      setBillPayments((prev) =>
        prev.map((b) => (b.allocation_id === bill.allocation_id ? updated : b))
      );
      toast.success(newIsPaid ? 'Bill marked as paid' : 'Bill marked as unpaid');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update bill';
      toast.error(message);
    }
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!salaryConfig) {
    return <EmptyState />;
  }

  // Use aggregated financial summary for card values (sums across ALL periods in range)
  // This prevents a spare-only period from zeroing out salary/expense cards
  const fullTimeSalary = financialSummary?.fullTimeSalary ?? 0;
  const partTimeSalary = financialSummary?.partTimeSalary ?? 0;
  // Show part-time cards if config has part-time salary (even if no period saved yet)
  const hasPartTime = (salaryConfig.part_time_salary ?? 0) > 0;
  const totalSalary = fullTimeSalary + partTimeSalary;
  const taxAmount = financialSummary?.totalTax ?? 0;
  const forgivenLent = financialSummary?.forgivenLent ?? 0;
  const giftedIncome = financialSummary?.giftedIncome ?? 0;
  
  const totalExpenses = (financialSummary?.totalExpensesSum ?? 0) + forgivenLent;

  // Spare: use aggregated spare and spent from ALL periods in range
  const spareAmount = (financialSummary?.totalSpare ?? 0) + giftedIncome;
  const totalSpareSpent = financialSummary?.totalSpareSpent ?? 0;
  
  // financialSummary.monthlyExpenses already includes totalSpareSpent, so we subtract it here
  // to get the pure "Fixed Allocations" (which is just expenses + assets without spare spent)
  const totalAllocated = (financialSummary?.monthlyExpenses ?? 0) + (financialSummary?.totalAssets ?? 0) - totalSpareSpent;
  const totalConsumableSpent = financialSummary?.totalConsumableSpent ?? 0;
  const totalBorrowedAmt = financialSummary?.totalBorrowed ?? 0;
  const totalBorrowingSpent = financialSummary?.totalBorrowingExpensesSpent ?? 0;

  const totalOutflow = totalAllocated + totalSpareSpent + totalConsumableSpent + totalBorrowingSpent + forgivenLent;
  const remainingSpare = spareAmount - totalSpareSpent - totalConsumableSpent - totalBorrowingSpent;

  // Build a map of allocation_type_id -> classification
  const typeClassificationMap = new Map(
    allocationTypes.map((t) => [t.id, t.classification])
  );

  // Helper to get classification for an allocation
  function getClassification(alloc: BudgetAllocationWithAmount): 'expense' | 'asset' | null {
    if (!alloc.allocation_type_id) return null;
    return typeClassificationMap.get(alloc.allocation_type_id) ?? null;
  }

  // Filter allocations based on category filter
  const filteredAllocations = categoryFilter === 'all'
    ? allocations
    : allocations.filter((a) => getClassification(a) === categoryFilter);

  // Chart data (uses filtered allocations)
  const chartData = filteredAllocations.map((a) => ({
    name: a.category,
    category: a.category,
    value: a.amount,
    amount: a.amount,
    percentage: a.percentage,
    fill: a.color || 'hsl(220, 15%, 50%)',
  }));

  // Unpaid bills
  const unpaidBills = billPayments.filter((b) => !b.is_paid);
  const paidCount = billPayments.filter((b) => b.is_paid).length;
  const partialCount = billPayments.filter((b) => !b.is_paid && Number(b.amount) > 0).length;

  // Map allocation_id -> allocation category name for bill display
  const allocationMap = new Map(allocations.map((a) => [a.id, a]));

  // Filter bills based on billFilter
  const filteredBillPayments = (billFilter === 'all'
    ? billPayments
    : billPayments.filter((bill) => {
        const alloc = allocationMap.get(bill.allocation_id);
        if (!alloc?.allocation_type_id) return false;
        return typeClassificationMap.get(alloc.allocation_type_id) === billFilter;
      })
  ).toSorted((a, b) => {
    // Unpaid first, paid last
    if (a.is_paid !== b.is_paid) return a.is_paid ? 1 : -1;
    // Among unpaid: sort by amount paid ascending (0 first, then lowest partial)
    if (!a.is_paid && !b.is_paid) {
      return Number(a.amount) - Number(b.amount);
    }
    return 0;
  });
  const filteredPaidCount = filteredBillPayments.filter((b) => b.is_paid).length;
  const filteredPartialCount = filteredBillPayments.filter((b) => !b.is_paid && Number(b.amount) > 0).length;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-6"
    >
      {/* Date Filter Bar */}
      <div data-onboarding="date-filter" className="sticky top-14 z-20 -mx-4 bg-background/80 px-4 py-3 backdrop-blur-md border-b border-border/20 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <motion.div
          variants={staggerItem}
          className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <CalendarRange className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-center gap-1.5">
            {DATE_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setDateFilter(opt.value); setCustomMonth(null); }}
                className={cn(
                  'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer',
                  dateFilter === opt.value && !customMonth
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {opt.label}
              </button>
            ))}
            <MonthYearPicker
              value={customMonth}
              onChange={(val) => {
                setCustomMonth(val);
                if (val) {
                  setDateFilter('custom');
                } else {
                  setDateFilter('this-month');
                }
              }}
              placeholder="Custom"
            />
          </div>
        </motion.div>
      </div>

      {/* Unpaid Bills Alert Banner - only show on This Month and when user has at least one pay period */}
      <AnimatePresence>
        {dateFilter === 'this-month' && unpaidBills.length > 0 && latestPeriod && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <Card className="overflow-hidden border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 dark:from-amber-500/15 dark:via-orange-500/15 dark:to-amber-500/5">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
                    <AlertTriangle className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                      {unpaidBills.length} bill{unpaidBills.length !== 1 ? 's' : ''} unpaid this month
                    </p>
                    {/* Expenses */}
                    {(() => {
                      const unpaidExpenses = unpaidBills.filter((b) => {
                        const alloc = allocationMap.get(b.allocation_id);
                        return alloc && getClassification(alloc) === 'expense';
                      });
                      const unpaidAssets = unpaidBills.filter((b) => {
                        const alloc = allocationMap.get(b.allocation_id);
                        return alloc && getClassification(alloc) === 'asset';
                      });
                      return (
                        <div className="mt-2 space-y-2">
                          {unpaidExpenses.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-400/80 mb-1">Expenses</p>
                              <div className="flex flex-wrap gap-2">
                                {unpaidExpenses.map((bill) => {
                                  const alloc = allocationMap.get(bill.allocation_id);
                                  const budgeted = alloc?.amount ?? Number(bill.amount);
                                  const paid = Number(bill.amount);
                                  const remaining = budgeted - paid;
                                  const isPartial = paid > 0;
                                  return (
                                    <div
                                      key={bill.id}
                                      className="flex items-center gap-2 rounded-lg bg-white/60 px-2.5 py-1.5 text-xs dark:bg-white/10"
                                    >
                                      <span className="font-medium text-foreground capitalize">
                                        {alloc?.category ?? 'Bill'}
                                      </span>
                                      <span className="text-muted-foreground tabular-nums">
                                        PHP {formatPHP(remaining)}{isPartial ? ' left' : ''}
                                      </span>
                                      <Button
                                        size="xs"
                                        variant="secondary"
                                        className="ml-0.5 h-5 px-1.5 text-[10px]"
                                        onClick={() => setPendingToggleBill(bill)}
                                      >
                                        Mark Paid
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {unpaidAssets.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-400/80 mb-1">Savings & Assets</p>
                              <div className="flex flex-wrap gap-2">
                                {unpaidAssets.map((bill) => {
                                  const alloc = allocationMap.get(bill.allocation_id);
                                  const budgeted = alloc?.amount ?? Number(bill.amount);
                                  const paid = Number(bill.amount);
                                  const remaining = budgeted - paid;
                                  const isPartial = paid > 0;
                                  return (
                                    <div
                                      key={bill.id}
                                      className="flex items-center gap-2 rounded-lg bg-white/60 px-2.5 py-1.5 text-xs dark:bg-white/10"
                                    >
                                      <span className="font-medium text-foreground capitalize">
                                        {alloc?.category ?? 'Bill'}
                                      </span>
                                      <span className="text-muted-foreground tabular-nums">
                                        PHP {formatPHP(remaining)}{isPartial ? ' left' : ''}
                                      </span>
                                      <Button
                                        size="xs"
                                        variant="secondary"
                                        className="ml-0.5 h-5 px-1.5 text-[10px]"
                                        onClick={() => setPendingToggleBill(bill)}
                                      >
                                        Mark Paid
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Financial Overview Cards */}
      {financialSummary && (
        <motion.div variants={staggerItem}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <OverviewCard
              label="Overall Wallet"
              value={financialSummary.netIncome + giftedIncome + forgivenLent}
              icon={Wallet}
              colorTheme="sky"
              tooltip="Net Pay + Gifted/Forgiven Borrowings"
            />
            <OverviewCard
              label="Total Expenditures"
              value={totalOutflow}
              icon={ArrowDownRight}
              colorTheme="rose"
              tooltip={
                <div className="space-y-1">
                  <p className="font-semibold mb-1">Calculation Breakdown:</p>
                  <div className="grid grid-cols-[1fr_auto] gap-x-4">
                    <span className="text-muted-foreground">Fixed Allocations:</span>
                    <span className="font-medium">PHP {formatPHP(totalAllocated)}</span>
                    
                    <span className="text-muted-foreground">Spare Spent:</span>
                    <span className="text-rose-500 font-medium">+ PHP {formatPHP(totalSpareSpent)}</span>
                    
                    <span className="text-muted-foreground">Consumables:</span>
                    <span className="text-rose-500 font-medium">+ PHP {formatPHP(totalConsumableSpent)}</span>
                    
                    <span className="text-muted-foreground">Borrowing Spent:</span>
                    <span className="text-rose-500 font-medium">+ PHP {formatPHP(totalBorrowingSpent)}</span>
                    
                    {forgivenLent > 0 && (
                      <>
                        <span className="text-rose-500/80">Forgiven Lent:</span>
                        <span className="text-rose-500 font-medium">+ PHP {formatPHP(forgivenLent)}</span>
                      </>
                    )}
                  </div>
                </div>
              }
            />
            <OverviewCard
              label="Tax Amount"
              value={taxAmount}
              icon={Receipt}
              colorTheme="violet"
              tooltip="Tax deducted from wages"
            />
            <div className="relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-emerald-600 to-emerald-500 p-5 shadow-lg dark:from-emerald-700 dark:to-emerald-600 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl h-full flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm font-medium text-white/90 leading-tight truncate whitespace-normal">
                    Available Spare
                  </span>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger className="flex cursor-help opacity-70 transition-opacity hover:opacity-100 shrink-0">
                        <Info className="h-3.5 w-3.5 text-white" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">
                        <div className="space-y-1">
                          <p className="font-semibold mb-1">Calculation Breakdown:</p>
                          <div className="grid grid-cols-[1fr_auto] gap-x-4">
                            <span className="text-muted-foreground">Total Budgeted Spare:</span>
                            <span className="font-medium">PHP {formatPHP(financialSummary?.totalSpare ?? 0)}</span>
                            
                            {giftedIncome > 0 && (
                              <>
                                <span className="text-emerald-500/80">Gifted/Forgiven Borrowings:</span>
                                <span className="text-emerald-500 font-medium">+ PHP {formatPHP(giftedIncome)}</span>
                              </>
                            )}
                            
                            <span className="text-muted-foreground">Spent from Spare:</span>
                            <span className="text-rose-500 font-medium">- PHP {formatPHP(totalSpareSpent)}</span>
                            
                            <span className="text-muted-foreground">Consumable Spent:</span>
                            <span className="text-rose-500 font-medium">- PHP {formatPHP(totalConsumableSpent)}</span>
                            
                            <span className="text-muted-foreground">Borrowing Spent:</span>
                            <span className="text-rose-500 font-medium">- PHP {formatPHP(totalBorrowingSpent)}</span>
                          </div>
                        </div>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 shrink-0">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </div>
              
              <div className="flex flex-col gap-0.5 mt-auto">
                <span className="text-2xl font-semibold tabular-nums font-display text-white">
                  PHP {formatPHP(remainingSpare)}
                </span>
                {(totalSpareSpent > 0 || totalConsumableSpent > 0 || totalBorrowingSpent > 0) && (
                  <span className="text-[11px] text-white/75 leading-tight">
                    PHP {formatPHP(totalSpareSpent + totalConsumableSpent + totalBorrowingSpent)} spent from spare
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Monthly Financial Breakdown */}
      {financialSummary && latestPeriod && (
        <motion.div variants={staggerItem}>
          <Card className="overflow-visible">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="flex items-center gap-2">Monthly Financial Breakdown
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger className="flex">
                        <Info className="h-3 w-3 text-muted-foreground/50 cursor-help shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Where your money goes this period
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </CardTitle>
              </div>
              <CardDescription>Where your money goes this period</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Financial Flow Summary */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {[
                  { label: 'Income', value: financialSummary.grossIncome, color: 'text-emerald-400', bg: 'bg-emerald-500/8' },
                  { label: 'Budget Expenses', value: totalExpenses, color: 'text-orange-400', bg: 'bg-orange-500/8' },
                  { label: 'Savings', value: financialSummary.totalAssets, color: 'text-violet-400', bg: 'bg-violet-500/8' },
                  { label: 'Spare Spent', value: totalSpareSpent + totalConsumableSpent + totalBorrowingSpent, color: 'text-amber-400', bg: 'bg-amber-500/8' },
                  { label: 'Remaining', value: remainingSpare, color: remainingSpare >= 0 ? 'text-emerald-400' : 'text-orange-400', bg: remainingSpare >= 0 ? 'bg-emerald-500/8' : 'bg-orange-500/8' },
                ].map((item, i) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className={cn('flex-1 rounded-lg p-3', item.bg)}>
                      <p className="text-[11px] font-medium text-muted-foreground">{item.label}</p>
                      <p className={cn('text-sm font-bold tabular-nums', item.color)}>
                        PHP {formatPHP(item.value)}
                      </p>
                    </div>
                    {i < 4 && (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30 hidden lg:block" />
                    )}
                  </div>
                ))}
              </div>

              <Separator />

              {/* 3 Column Grid */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Column 1: Budget Expenses */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Budget Expenses</h3>
                    <Badge variant="secondary" className="text-[10px]">
                      {billPayments.filter(b => b.is_paid && getClassification(allocationMap.get(b.allocation_id)!) === 'expense').length}/{allocations.filter(a => getClassification(a) === 'expense').length} paid
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                    {allocations
                      .filter((a) => getClassification(a) === 'expense')
                      .map((alloc) => {
                        const bill = billPayments.find((b) => b.allocation_id === alloc.id);
                        const isPaid = bill?.is_paid ?? false;
                        const isPartial = !isPaid && Number(bill?.amount ?? 0) > 0;
                        return (
                          <button
                            key={alloc.id}
                            type="button"
                            onClick={() => bill && setPendingToggleBill(bill)}
                            className={cn(
                              'flex items-center justify-between rounded-lg p-2.5 transition-colors duration-150 cursor-pointer text-left w-full',
                              isPaid
                                ? 'bg-emerald-500/5 hover:bg-emerald-500/10'
                                : 'hover:bg-muted/50'
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="shrink-0">
                                {isPaid ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                ) : isPartial ? (
                                  <Circle className="h-4 w-4 text-amber-400" strokeWidth={2.5} />
                                ) : (
                                  <Circle className="h-4 w-4 text-muted-foreground/40" />
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className={cn(
                                  'text-xs font-medium capitalize truncate',
                                  isPaid ? 'text-muted-foreground line-through' : 'text-foreground'
                                )}>
                                  {alloc.category}
                                </span>
                                {isPaid && bill?.paid_at && (
                                  <span className="text-[10px] text-muted-foreground">
                                    Paid {new Date(bill.paid_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                                {isPartial && (
                                  <span className="text-[10px] text-amber-500">
                                    Paid {formatPHP(Number(bill!.amount))} of {formatPHP(alloc.amount)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className={cn(
                              'text-xs font-semibold tabular-nums shrink-0',
                              isPaid ? 'text-muted-foreground' : 'text-foreground'
                            )}>
                              PHP {formatPHP(alloc.amount)}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] text-muted-foreground">Total Budget Expenses</span>
                    <span className="text-xs font-bold tabular-nums text-orange-400">
                      PHP {formatPHP(totalExpenses)}
                    </span>
                  </div>
                </div>

                {/* Column 2: Savings & Assets */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Savings & Assets</h3>
                    <Badge variant="secondary" className="text-[10px] bg-violet-500/10 text-violet-500">
                      {allocations.filter(a => getClassification(a) === 'asset').length} items
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1">
                    {allocations
                      .filter((a) => getClassification(a) === 'asset')
                      .map((alloc) => (
                        <div
                          key={alloc.id}
                          className="flex items-center justify-between rounded-lg p-2.5 hover:bg-muted/50 transition-colors duration-150"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500/10">
                              <Landmark className="h-3.5 w-3.5 text-violet-500" />
                            </div>
                            <span className="text-xs font-medium capitalize text-foreground">{alloc.category}</span>
                          </div>
                          <span className="text-xs font-semibold tabular-nums text-violet-500">
                            PHP {formatPHP(alloc.amount)}
                          </span>
                        </div>
                      ))}
                    {allocations.filter((a) => getClassification(a) === 'asset').length === 0 && (
                      <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                        No asset allocations configured
                      </div>
                    )}
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] text-muted-foreground">Total Savings</span>
                    <span className="text-xs font-bold tabular-nums text-violet-500">
                      PHP {formatPHP(financialSummary.totalAssets)}
                    </span>
                  </div>
                </div>

                {/* Column 3: Consumable Budget + Borrowing */}
                <div className="space-y-5">
                  {/* Consumable Budget */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">Consumable Budget</h3>
                      <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-500">
                        {consumableSummary?.expenses.length ?? 0} expenses
                      </Badge>
                    </div>
                    {consumableSummary ? (
                      <>
                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>{consumableSummary.allowance > 0 ? `${Math.min(Math.round((consumableSummary.totalSpent / consumableSummary.allowance) * 100), 100)}%` : '0%'} used</span>
                            <span className={cn('font-medium', consumableSummary.isOverBudget ? 'text-rose-500' : 'text-emerald-500')}>
                              {consumableSummary.isOverBudget ? 'Over budget' : `${formatPHP(consumableSummary.remaining)} left`}
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-500',
                                consumableSummary.isOverBudget ? 'bg-rose-500' : 
                                  (consumableSummary.totalSpent / consumableSummary.allowance) >= 0.8 ? 'bg-amber-500' : 'bg-emerald-500'
                              )}
                              style={{ width: `${Math.min((consumableSummary.totalSpent / Math.max(consumableSummary.allowance, 1)) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                        {/* Recent expenses */}
                        <div className="flex flex-col gap-0.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                          {consumableSummary.expenses.slice(0, 5).map((exp) => (
                            <div
                              key={exp.id}
                              className="flex items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-muted/50 transition-colors duration-150"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 w-12">
                                  {new Date(exp.expense_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                                </span>
                                <span className="text-xs text-foreground truncate">{exp.description}</span>
                              </div>
                              <span className="text-xs font-semibold tabular-nums text-amber-400/80 shrink-0">
                                -PHP {formatPHP(Number(exp.amount))}
                              </span>
                            </div>
                          ))}
                          {consumableSummary.expenses.length === 0 && (
                            <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
                              No consumable expenses this month
                            </div>
                          )}
                        </div>
                        <Separator />
                        <div className="space-y-1 px-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground">Allowance</span>
                            <span className="text-xs tabular-nums text-foreground">PHP {formatPHP(consumableSummary.allowance)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground">Total Spent</span>
                            <span className="text-xs tabular-nums text-amber-400/80">-PHP {formatPHP(consumableSummary.totalSpent)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-foreground">Remaining</span>
                            <span className={cn('text-xs font-bold tabular-nums', consumableSummary.remaining >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                              PHP {formatPHP(consumableSummary.remaining)}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                        Set your consumable budget in Settings
                      </div>
                    )}
                  </div>

                  {/* Borrowing Summary */}
                  {borrowingSummary && borrowingSummary.activeCount > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-foreground">Active Borrowings</h3>
                          <Badge variant="secondary" className="text-[10px]">
                            {borrowingSummary.activeCount} active
                          </Badge>
                        </div>
                        <div className="space-y-1.5">
                          {borrowingSummary.totalBorrowed > 0 && (
                            <div className="flex items-center justify-between rounded-lg bg-rose-500/5 px-2.5 py-2">
                              <span className="text-xs text-muted-foreground">I Owe Others</span>
                              <span className="text-xs font-semibold tabular-nums text-rose-500">PHP {formatPHP(borrowingSummary.totalBorrowed)}</span>
                            </div>
                          )}
                          {borrowingSummary.totalLent > 0 && (
                            <div className="flex items-center justify-between rounded-lg bg-emerald-500/5 px-2.5 py-2">
                              <span className="text-xs text-muted-foreground">Owed To Me</span>
                              <span className="text-xs font-semibold tabular-nums text-emerald-500">PHP {formatPHP(borrowingSummary.totalLent)}</span>
                            </div>
                          )}
                        </div>
                        <Link
                          href="/dashboard/borrowing"
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-border/50 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                        >
                          <HandCoins className="h-3.5 w-3.5" />
                          View All Borrowings
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Monthly Financial Breakdown */}
      <div
        className={cn(
          'grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4',
          hasPartTime ? 'lg:grid-cols-6' : 'lg:grid-cols-4'
        )}
      >
        <StatCard
          label="Gross Income"
          value={financialSummary?.grossIncome ?? 0}
          icon={TrendingUp}
          colorTheme="teal"
          index={0}
          tooltip="Total income before any deductions"
        />
        <StatCard
          label="Net Income"
          value={financialSummary?.netIncome ?? 0}
          icon={DollarSign}
          colorTheme="emerald"
          index={1}
          tooltip="Gross Income minus Tax and Deductions"
        />
        <StatCard
          label="Total Assets"
          value={financialSummary?.totalAssets ?? 0}
          icon={Landmark}
          colorTheme="violet"
          index={2}
          tooltip="Sum of all asset-type allocations"
        />
        <StatCard
          label="Full-time Salary"
          value={fullTimeSalary}
          icon={Briefcase}
          colorTheme="indigo"
          index={3}
          subtitle={hasPartTime ? undefined : 'Primary income'}
          tooltip="Sum of first and second wage"
        />
        {hasPartTime && (
          <StatCard
            label="Part-time Salary"
            value={partTimeSalary}
            icon={Briefcase}
            colorTheme="sky"
            index={4}
            tooltip="Income from secondary source"
          />
        )}
        {hasPartTime && (
          <StatCard
            label="Total Salary"
            value={totalSalary}
            icon={Wallet}
            colorTheme="teal"
            index={5}
            tooltip="Full-time + Part-time"
          />
        )}
      </div>



      {/* Active Borrowing Impact on Spare */}
      {borrowingSummary && borrowingSummary.activeCount > 0 && (
        <motion.div variants={staggerItem}>
          <Card className="border-rose-500/20 bg-gradient-to-r from-rose-500/5 to-amber-500/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-500/10">
                  <HandCoins className="h-4.5 w-4.5 text-rose-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Active Borrowings</p>
                  <p className="text-xs text-muted-foreground">
                    You owe <span className="text-rose-500 font-medium">PHP {formatPHP(borrowingSummary.totalBorrowed)}</span>
                    {borrowingSummary.totalLent > 0 && (
                      <> and are owed <span className="text-emerald-500 font-medium">PHP {formatPHP(borrowingSummary.totalLent)}</span></>
                    )}
                  </p>
                </div>
                <Link
                  href="/dashboard/borrowing"
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8 text-xs')}
                >
                  View
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Income vs Expenses Trend Chart */}
      <motion.div variants={staggerItem}>
        <Card className="overflow-visible">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <CardTitle>Financial Trend</CardTitle>
              </div>
              <div className="flex items-center gap-1">
                {[
                  { label: '3', value: 3 },
                  { label: '6', value: 6 },
                  { label: '12', value: 12 },
                  { label: 'All', value: 100 },
                ].map((filter) => (
                  <Button
                    key={filter.value}
                    variant={trendLimit === filter.value ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn(
                      'h-7 px-2.5 text-xs font-medium',
                      trendLimit === filter.value && 'bg-primary/10 text-primary'
                    )}
                    onClick={() => handleTrendFilter(filter.value)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>
            <CardDescription>
              {trendLimit >= 100
                ? `All ${trendData.length} pay periods`
                : `Last ${trendData.length} pay period${trendData.length !== 1 ? 's' : ''}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <div className="h-80 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#34d399" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="netPayGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f472b6" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#f472b6" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="spareGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="taxGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(220, 13%, 20%)"
                      strokeOpacity={0.5}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                      dy={8}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
                      width={45}
                    />
                    <Tooltip
                      content={<TrendChartTooltip />}
                      allowEscapeViewBox={{ x: true, y: true }}
                      offset={15}
                      isAnimationActive={false}
                      cursor={isMobile ? false : { stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                      wrapperStyle={{ outline: 'none', zIndex: 50 }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      onClick={handleLegendClick}
                      wrapperStyle={{ fontSize: 12, paddingTop: 16, cursor: 'pointer' }}
                      formatter={(value: string, entry: any) => {
                        const dataKey = entry.dataKey;
                        const isVisible = visibleSeries[dataKey];
                        return (
                          <span style={{ 
                            color: isVisible ? '#94a3b8' : '#475569', 
                            fontSize: 12, 
                            textDecoration: isVisible ? 'none' : 'line-through' 
                          }}>
                            {value}
                          </span>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      name="Gross Income"
                      stroke="#34d399"
                      strokeWidth={2.5}
                      fill="url(#incomeGradient)"
                      hide={!visibleSeries.income}
                      dot={{ r: 4, fill: '#34d399', stroke: '#1e293b', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#34d399', stroke: '#fff', strokeWidth: 2 }}
                      animationDuration={800}
                    />
                    <Area
                      type="monotone"
                      dataKey="netPay"
                      name="Net Pay"
                      stroke="#38bdf8"
                      strokeWidth={2.5}
                      fill="url(#netPayGradient)"
                      hide={!visibleSeries.netPay}
                      dot={{ r: 4, fill: '#38bdf8', stroke: '#1e293b', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#38bdf8', stroke: '#fff', strokeWidth: 2 }}
                      animationDuration={800}
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      name="Expenses"
                      stroke="#f472b6"
                      strokeWidth={2.5}
                      fill="url(#expensesGradient)"
                      hide={!visibleSeries.expenses}
                      dot={{ r: 4, fill: '#f472b6', stroke: '#1e293b', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#f472b6', stroke: '#fff', strokeWidth: 2 }}
                      animationDuration={800}
                    />
                    <Area
                      type="monotone"
                      dataKey="spare"
                      name="Spare"
                      stroke="#a78bfa"
                      strokeWidth={2.5}
                      fill="url(#spareGradient)"
                      hide={!visibleSeries.spare}
                      dot={{ r: 4, fill: '#a78bfa', stroke: '#1e293b', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#a78bfa', stroke: '#fff', strokeWidth: 2 }}
                      animationDuration={800}
                    />
                    <Area
                      type="monotone"
                      dataKey="tax"
                      name="Tax"
                      stroke="#fbbf24"
                      strokeWidth={2.5}
                      fill="url(#taxGradient)"
                      hide={!visibleSeries.tax}
                      dot={{ r: 4, fill: '#fbbf24', stroke: '#1e293b', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#fbbf24', stroke: '#fff', strokeWidth: 2 }}
                      animationDuration={800}
                    />
                    <Area
                      type="monotone"
                      dataKey="savings"
                      name="Savings"
                      stroke="#2dd4bf"
                      strokeWidth={2.5}
                      fill="url(#savingsGradient)"
                      hide={!visibleSeries.savings}
                      dot={{ r: 4, fill: '#2dd4bf', stroke: '#1e293b', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#2dd4bf', stroke: '#fff', strokeWidth: 2 }}
                      animationDuration={800}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-80 items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
                    <BarChart3 className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">No trend data yet</p>
                    <p className="text-xs text-muted-foreground/60">
                      Save your first pay period to see the trend
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Two Column Layout - only show when there's data for the selected period */}
      {latestPeriod ? (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Budget Donut Chart */}
        <motion.div variants={staggerItem} data-onboarding="budget-chart">
          <Card className="h-full overflow-visible">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Budget Allocation
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger className="flex">
                    <Info className="h-3 w-3 text-muted-foreground/50 cursor-help shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Detailed breakdown of expense allocations
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </CardTitle>
              <CardDescription>
                Percentage breakdown of your {hasPartTime ? 'combined ' : ''}salary
              </CardDescription>
            </CardHeader>

            <CardContent>
              {chartData.length > 0 ? (
                <div className="h-96 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={110}
                        outerRadius={160}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                        animationBegin={200}
                        animationDuration={800}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={<CustomTooltip />}
                        allowEscapeViewBox={{ x: true, y: true }}
                        offset={15}
                        isAnimationActive={false}
                        wrapperStyle={{ outline: 'none', zIndex: 50 }}
                      />
                      <CenterLabel salary={totalSalary} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-96 items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    No allocations configured
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Allocation Categories */}
        <motion.div variants={staggerItem}>
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Categories</CardTitle>
                  <CardDescription>
                    Budget allocation breakdown
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  {(['all', 'expense', 'asset'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setCategoryFilter(filter)}
                      className={cn(
                        'whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200 cursor-pointer capitalize',
                        categoryFilter === filter
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {filter === 'all' ? 'All' : filter === 'expense' ? 'Expenses' : 'Assets'}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {filteredAllocations.length > 0 ? (
                <div className="flex flex-col gap-1 max-h-96 overflow-y-auto pr-1 scrollbar-thin">
                  {filteredAllocations.map((allocation, index) => (
                    <motion.div
                      key={allocation.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.3 + index * 0.06,
                        duration: 0.3,
                        ease: 'easeOut',
                      }}
                      className="flex items-center justify-between rounded-lg p-3 transition-colors duration-150 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/65"
                          style={{ color: allocation.color || 'hsl(220, 15%, 50%)' }}
                        >
                          <CategoryIcon name={allocation.icon_name} className="h-4 w-4" />
                        </div>
                        <div className="flex min-w-0 flex-col">
                          <span className="flex items-center gap-1.5 text-sm font-medium capitalize text-foreground">
                            {allocation.category}
                            {allocation.is_fixed && (
                              <Lock className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                            )}
                          </span>
                          {allocation.description && (
                            <span className="truncate text-xs text-muted-foreground">
                              {allocation.description}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <Badge variant="secondary">
                          {formatPercentage(allocation.percentage)}
                        </Badge>
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          PHP {formatPHP(allocation.amount)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    No categories configured
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      ) : (
        <motion.div variants={staggerItem}>
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center text-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">No payroll data for this period</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Budget allocation and categories will appear once you save a pay period in this date range.
                  </p>
                </div>
                <Link href="/dashboard/calculator">
                  <Button variant="outline" size="sm" className="mt-2">
                    <Briefcase className="h-3.5 w-3.5 mr-1.5" />
                    Go to Calculator
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}



      {/* Confirmation Dialog for bill toggle/mark paid */}
      <AlertDialog
        open={!!pendingToggleBill}
        onOpenChange={(open) => { if (!open) setPendingToggleBill(null); }}
      >
        <AlertDialogContent size="sm">
          <div className="flex flex-col items-center text-center pt-2">
            {/* Animated Lottie icon */}
            <div className="h-16 w-16">
              {pendingToggleBill && (
                <Lottie
                  animationData={pendingToggleBill.is_paid ? warningAnimation : successAnimation}
                  loop={false}
                  autoplay
                  className="h-16 w-16"
                />
              )}
            </div>
            <h2 className="mt-3 text-base font-semibold text-foreground">
              {pendingToggleBill?.is_paid ? 'Mark as Unpaid?' : 'Mark as Paid?'}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed max-w-[260px]">
              {(() => {
                if (!pendingToggleBill) return '';
                const alloc = allocationMap.get(pendingToggleBill.allocation_id);
                const name = alloc?.category ?? 'This bill';
                if (pendingToggleBill.is_paid) {
                  return `This will mark "${name}" as unpaid and reset the payment record.`;
                }
                return `This will mark "${name}" as fully paid for this month.`;
              })()}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!pendingToggleBill) return;
                if (pendingToggleBill.is_paid) {
                  await handleToggleBill(pendingToggleBill);
                } else {
                  await handleMarkBillPaid(pendingToggleBill);
                }
                setPendingToggleBill(null);
              }}
              className={cn(
                pendingToggleBill?.is_paid
                  ? 'bg-amber-600 text-white shadow-sm hover:bg-amber-500'
                  : 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-500'
              )}
            >
              {pendingToggleBill?.is_paid ? 'Mark Unpaid' : 'Mark Paid'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </motion.div>
  );
}
