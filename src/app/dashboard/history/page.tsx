'use client';

import React, { useEffect, useLayoutEffect, useState, useCallback, useRef, useMemo, ReactNode } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Calculator,
  CalendarDays,
  CalendarRange,
  Loader2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Search,
  Lock,
  CheckCircle2,
  ArrowRight,
  DollarSign,
  PiggyBank,
  ShoppingBag,
  Clock,
  Receipt,
  ShoppingCart,
  HandCoins,
  Info,
  Scale,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import {
  Tooltip as UITooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { PayPeriod, SpareTransaction, BillPayment, ConsumableMonthlyRecord, Borrowing, ConsumableExpense, BorrowingWithExpenses } from '@/features/salary/types/salary.types';
import {
  getPayPeriods,
  deletePayPeriod,
  getSpareTransactions,
  getSpareTransactionsInRange,
  getBillPayments,
  getConsumableMonthlyRecords,
  getConsumableExpenses,
  getBorrowingsWithExpenses,
  snapshotConsumableMonth,
  autoSnapshotPreviousMonth,
  getCurrentUser,
  getSalaryConfig,
} from '@/features/salary/services/salary.service';
import { formatPHP } from '@/features/salary/utils/calculations';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { MonthYearPicker, monthYearToDateRange, type MonthYearSelection } from '@/components/ui/month-year-picker';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------
function HistorySkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-14 w-full rounded-lg"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------
function EmptyState() {
  return (
    <Card>
      <CardContent>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-5">
            <History className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            No pay periods recorded yet
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Start by creating your first pay period calculation to see your
            salary history here.
          </p>
          <Link href="/dashboard/calculator">
            <Button size="lg">
              <Calculator className="h-4 w-4" />
              Go to Calculator
            </Button>
          </Link>
        </motion.div>
      </CardContent>
    </Card>
  );
}


// ---------------------------------------------------------------------------
// ANIMATED NUMBER & STAT CARD
// ---------------------------------------------------------------------------
function AnimatedNumber({ value, isCurrency = true }: { value: number; isCurrency?: boolean }) {
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
  }, [value]);

  return (
    <span className="tabular-nums">
      {isCurrency ? formatPHP(displayed) : Math.round(displayed)}
    </span>
  );
}

const themeClasses = {
  indigo: {
    accent: 'bg-indigo-500',
    glow: 'from-indigo-500/10 via-indigo-500/5 to-transparent',
    cardBg: 'from-card via-card to-indigo-950/15',
    iconColor: 'text-indigo-500/5 dark:text-indigo-400/5 group-hover:text-indigo-500/10 dark:group-hover:text-indigo-400/10',
    textAccent: 'text-indigo-500 dark:text-indigo-400',
  },
  sky: {
    accent: 'bg-sky-500',
    glow: 'from-sky-500/10 via-sky-500/5 to-transparent',
    cardBg: 'from-card via-card to-sky-950/15',
    iconColor: 'text-sky-500/5 dark:text-sky-400/5 group-hover:text-sky-500/10 dark:group-hover:text-sky-400/10',
    textAccent: 'text-sky-500 dark:text-sky-400',
  },
  teal: {
    accent: 'bg-teal-500',
    glow: 'from-teal-500/10 via-teal-500/5 to-transparent',
    cardBg: 'from-card via-card to-teal-950/15',
    iconColor: 'text-teal-500/5 dark:text-teal-400/5 group-hover:text-teal-500/10 dark:group-hover:text-teal-400/10',
    textAccent: 'text-teal-500 dark:text-teal-400',
  },
  rose: {
    accent: 'bg-rose-500',
    glow: 'from-rose-500/10 via-rose-500/5 to-transparent',
    cardBg: 'from-card via-card to-rose-950/15',
    iconColor: 'text-rose-500/5 dark:text-rose-400/5 group-hover:text-rose-500/10 dark:group-hover:text-rose-400/10',
    textAccent: 'text-rose-500 dark:text-rose-400',
  },
  emerald: {
    accent: 'bg-emerald-500',
    glow: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    cardBg: 'from-card via-card to-emerald-950/15',
    iconColor: 'text-emerald-500/5 dark:text-emerald-400/5 group-hover:text-emerald-500/10 dark:group-hover:text-emerald-400/10',
    textAccent: 'text-emerald-500 dark:text-emerald-400',
  },
  amber: {
    accent: 'bg-amber-500',
    glow: 'from-amber-500/10 via-amber-500/5 to-transparent',
    cardBg: 'from-card via-card to-amber-950/15',
    iconColor: 'text-amber-500/5 dark:text-amber-400/5 group-hover:text-amber-500/10 dark:group-hover:text-amber-400/10',
    textAccent: 'text-amber-500 dark:text-amber-400',
  },
  violet: {
    accent: 'bg-violet-500',
    glow: 'from-violet-500/10 via-violet-500/5 to-transparent',
    cardBg: 'from-card via-card to-violet-950/15',
    iconColor: 'text-violet-500/5 dark:text-violet-400/5 group-hover:text-violet-500/10 dark:group-hover:text-violet-400/10',
    textAccent: 'text-violet-500 dark:text-violet-400',
  },
  orange: {
    accent: 'bg-orange-500',
    glow: 'from-orange-500/10 via-orange-500/5 to-transparent',
    cardBg: 'from-card via-card to-orange-950/15',
    iconColor: 'text-orange-500/5 dark:text-orange-400/5 group-hover:text-orange-500/10 dark:group-hover:text-orange-400/10',
    textAccent: 'text-orange-500 dark:text-orange-400',
  },
};

interface HistoryStatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  colorTheme: keyof typeof themeClasses;
  tooltip?: React.ReactNode;
  subtitle?: string;
  isCurrency?: boolean;
  textColorOverride?: string;
}

function HistoryStatCard({
  label,
  value,
  icon: Icon,
  colorTheme,
  tooltip,
  subtitle,
  isCurrency = true,
  textColorOverride,
}: HistoryStatCardProps) {
  const theme = themeClasses[colorTheme];

  return (
    <Card className={cn(
      "group relative overflow-hidden border border-border/40 bg-gradient-to-br backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:border-border/80 h-full",
      theme.cardBg
    )}>
      {/* Top Accent Line */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-[2px] opacity-35 group-hover:opacity-100 transition-opacity duration-300",
        theme.accent
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
        theme.glow
      )} />
      
      {/* Large watermark icon in the background */}
      <div className={cn(
        "absolute -right-6 -bottom-6 transition-all duration-500 transform rotate-12 group-hover:scale-110 group-hover:rotate-[15deg] pointer-events-none",
        theme.iconColor
      )}>
        <Icon className="h-28 w-28 stroke-[1.2]" />
      </div>

      <CardContent className="p-3.5 sm:p-5 h-full flex flex-col justify-between gap-3 relative z-10">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] sm:text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {label}
          </span>
          
          {tooltip && (
            <UITooltip>
              <TooltipTrigger className="flex shrink-0">
                <Info className="h-3.5 w-3.5 text-muted-foreground/35 hover:text-muted-foreground/75 cursor-help transition-colors" />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <div>{tooltip}</div>
              </TooltipContent>
            </UITooltip>
          )}
        </div>

        <div>
          <p className={cn(
            "text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-tight font-display flex items-baseline truncate",
            textColorOverride || theme.textAccent
          )}>
            {isCurrency && (
              <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground/60 mr-1 select-none">
                PHP
              </span>
            )}
            <AnimatedNumber value={value} isCurrency={isCurrency} />
          </p>
          {subtitle && (
            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1 font-normal">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Detail Row (expanded)
// ---------------------------------------------------------------------------
function DetailRow({ label, value }: { label: ReactNode; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-muted-foreground flex items-center gap-1">{label}</span>
      <span className="text-xs tabular-nums font-medium">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Spare Transactions Section (rendered inside expanded pay period)
// ---------------------------------------------------------------------------
function SpareTransactionsSection({
  payPeriodId,
  spareAmount,
  embedded = false,
  onSpentLoaded,
}: {
  payPeriodId: string;
  spareAmount: number;
  embedded?: boolean;
  onSpentLoaded?: (spent: number) => void;
}) {
  const [transactions, setTransactions] = useState<SpareTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getSpareTransactions(payPeriodId);
        if (!cancelled) {
          setTransactions(data);
          const spent = data.reduce((sum, t) => sum + t.amount, 0);
          onSpentLoaded?.(spent);
        }
      } catch {
        // Silently handle -- the section is supplementary
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payPeriodId]);

  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
  const remaining = spareAmount - totalSpent;

  function fmtDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
    });
  }

  if (isLoading) {
    return (
      <div className={cn('space-y-2', !embedded && 'mt-4')}>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-full rounded-lg" />
        <Skeleton className="h-8 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className={cn(!embedded && 'mt-4')}>
      {!embedded && <Separator className="mb-4" />}
      <div className="flex items-center gap-2 mb-3">
        <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Spare Transactions
        </p>
      </div>

      {transactions.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-2">
          No spare transactions recorded
        </p>
      ) : (
        <>
          {/* Transaction list (scrollable) */}
          <div className="max-h-48 overflow-y-auto space-y-1 mb-3 scrollbar-thin">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between py-1.5 rounded-md px-2 hover:bg-muted/40 transition-colors duration-100"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] tabular-nums text-muted-foreground shrink-0">
                    {fmtDate(t.transaction_date)}
                  </span>
                  <span className="text-xs truncate">{t.description}</span>
                </div>
                <span className="text-xs tabular-nums font-medium text-rose-500 shrink-0 ml-3">
                  -P {formatPHP(t.amount)}
                </span>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="rounded-lg bg-muted/50 p-3 space-y-1">
            <DetailRow
              label="Original Spare"
              value={`P ${formatPHP(spareAmount)}`}
            />
            <DetailRow
              label="Total Spent"
              value={`-P ${formatPHP(totalSpent)}`}
            />
            <Separator className="my-1" />
            <div className="flex items-center justify-between py-1">
              <span className="text-xs font-semibold">Remaining</span>
              <span
                className={cn(
                  'text-xs tabular-nums font-semibold',
                  remaining >= 0 ? 'text-emerald-500' : 'text-rose-500'
                )}
              >
                P {formatPHP(remaining)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trend Chart
// ---------------------------------------------------------------------------
function SpareChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string; color: string }[];
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
  const value = payload[0].value ?? 0;

  return (
    <div ref={ref}>
      <Card className="shadow-xl border-border/50 bg-card/95 backdrop-blur-sm">
        <CardContent className="px-3.5 py-3">
          <p className="text-sm font-semibold text-foreground mb-2">{label}</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-6 text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span
                  className="inline-block h-2 w-2 rounded-full bg-emerald-400"
                />
                Spare
              </span>
              <span className="font-semibold tabular-nums text-foreground">
                PHP {formatPHP(value)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SpareAmountChart({ periods, isMobile }: { periods: PayPeriod[]; isMobile: boolean }) {
  const chartData = [...periods]
    .reverse()
    .map((p) => ({
      period: p.period_label.length > 14
        ? p.period_label.slice(0, 14) + '...'
        : p.period_label,
      spare: p.spare_amount ?? 0,
    }));

  if (chartData.length < 2) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle>Spare Amount Trend</CardTitle>
          <CardDescription>
            Track how your spare amount changes across pay periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 4, right: 20, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="spareGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  width={45}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={<SpareChartTooltip />}
                  allowEscapeViewBox={{ x: true, y: true }}
                  offset={15}
                  isAnimationActive={false}
                  cursor={isMobile ? false : { stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                  wrapperStyle={{ outline: 'none', zIndex: 50 }}
                />
                <Area
                  type="monotone"
                  dataKey="spare"
                  stroke="#34d399"
                  strokeWidth={2}
                  fill="url(#spareGradient)"
                  dot={{ r: 3, fill: '#34d399', stroke: '#1e293b', strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: '#34d399', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Period Bill Payment Status
// ---------------------------------------------------------------------------
function PeriodBillStatus({ period }: { period: PayPeriod }) {
  const [billPayments, setBillPayments] = useState<BillPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [spareSpent, setSpareSpent] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (period.created_at) {
          const month = period.created_at.slice(0, 7);
          const data = await getBillPayments(month);
          if (!cancelled) setBillPayments(data);
        }
      } catch {
        // Silently handle
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [period.created_at]);

  if (!period.allocation_amounts || period.allocation_amounts.length === 0) return null;

  const allocations = period.allocation_amounts as { category: string; actual: number; allocation_type?: string; is_fixed?: boolean; allocation_id?: string }[];
  const expenses = allocations.filter((a) => a.allocation_type !== 'asset' && a.actual > 0);
  const assets = allocations.filter((a) => a.allocation_type === 'asset' && a.actual > 0);

  const totalExpenseAmount = expenses.reduce((sum, a) => sum + a.actual, 0);
  const totalAssetAmount = assets.reduce((sum, a) => sum + a.actual, 0);
  const totalSpare = period.spare_amount ?? 0;
  const totalIncome = (period.total_income ?? 0) - (period.total_tax ?? 0) - (period.total_deductions ?? 0);

  function isPaid(allocationId?: string) {
    if (!allocationId || isLoading) return null;
    const bill = billPayments.find((b) => b.allocation_id === allocationId);
    return bill?.is_paid ?? false;
  }

  return (
    <div className="space-y-4">
      {/* Financial Flow Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-400">
          <DollarSign className="h-3 w-3" />
          Income: P {formatPHP(totalIncome)}
        </span>
        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0 hidden sm:block" />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 font-medium text-rose-400">
          <Receipt className="h-3 w-3" />
          Expenses: P {formatPHP(totalExpenseAmount)}
        </span>
        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0 hidden sm:block" />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-2.5 py-1 font-medium text-violet-400">
          <PiggyBank className="h-3 w-3" />
          Savings: P {formatPHP(totalAssetAmount)}
        </span>
        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0 hidden sm:block" />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 font-medium text-sky-400">
          <Wallet className="h-3 w-3" />
          Spare: P {formatPHP(totalSpare)}
        </span>
        {spareSpent > 0 && (
          <>
            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0 hidden sm:block" />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-2.5 py-1 font-medium text-orange-400">
              <ShoppingBag className="h-3 w-3" />
              Spent: P {formatPHP(spareSpent)}
            </span>
          </>
        )}
      </div>

      {(() => {
        const hasExpenses = expenses.length > 0;
        const hasAssets = assets.length > 0;
        const colCount = (hasExpenses ? 1 : 0) + (hasAssets ? 1 : 0) + 1; // +1 for spare
        const gridClass = colCount === 3
          ? 'grid grid-cols-1 sm:grid-cols-3 gap-4'
          : colCount === 2
            ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
            : 'grid grid-cols-1 gap-4';
        return (
          <div className={gridClass}>
            {/* Budget Expenses Column */}
            {hasExpenses && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Receipt className="h-3 w-3" />
                  Budget Expenses
                </p>
                {expenses.slice(0, 5).map((a, idx) => {
                  const paid = isPaid(a.allocation_id);
                  return (
                    <div key={idx} className="flex items-center justify-between py-1.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        {a.category}
                        {a.is_fixed && <Lock className="h-2.5 w-2.5 text-muted-foreground/60 shrink-0" />}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-xs tabular-nums font-medium">P {formatPHP(a.actual)}</span>
                        {paid !== null && (
                          paid ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Clock className="h-3.5 w-3.5 text-amber-400" />
                          )
                        )}
                      </span>
                    </div>
                  );
                })}
                {expenses.length > 5 && (
                  <p className="text-[10px] text-muted-foreground/60 pt-1">+{expenses.length - 5} more</p>
                )}
                <Separator className="my-2" />
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-semibold text-muted-foreground">Total</span>
                  <span className="text-xs font-bold tabular-nums">P {formatPHP(totalExpenseAmount)}</span>
                </div>
              </div>
            )}

            {/* Savings & Assets Column */}
            {hasAssets && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <PiggyBank className="h-3 w-3" />
                  Savings & Assets
                </p>
                {assets.slice(0, 5).map((a, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      {a.category}
                      {a.is_fixed && <Lock className="h-2.5 w-2.5 text-muted-foreground/60 shrink-0" />}
                    </span>
                    <span className="text-xs tabular-nums font-medium">P {formatPHP(a.actual)}</span>
                  </div>
                ))}
                {assets.length > 5 && (
                  <p className="text-[10px] text-muted-foreground/60 pt-1">+{assets.length - 5} more</p>
                )}
                <Separator className="my-2" />
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-semibold text-muted-foreground">Total</span>
                  <span className="text-xs font-bold tabular-nums">P {formatPHP(totalAssetAmount)}</span>
                </div>
              </div>
            )}

            {/* Spare Spending Column */}
            <SpareTransactionsSection
              payPeriodId={period.id}
              spareAmount={period.spare_amount ?? 0}
              embedded
              onSpentLoaded={setSpareSpent}
            />
          </div>
        );
      })()}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Income vs Expenses Chart
// ---------------------------------------------------------------------------
function IncomeExpensesChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string; color: string; name: string }[];
  label?: string;
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

  return (
    <div ref={ref}>
      <Card className="shadow-xl border-border/50 bg-card/95 backdrop-blur-sm">
        <CardContent className="px-3.5 py-3">
          <p className="text-sm font-semibold text-foreground mb-2">{label}</p>
          <div className="space-y-1.5">
            {payload.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between gap-6 text-xs">
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
        </CardContent>
      </Card>
    </div>
  );
}

function IncomeExpensesChart({ periods, isMobile }: { periods: PayPeriod[]; isMobile: boolean }) {
  const chartData = [...periods]
    .reverse()
    .map((p) => ({
      period: p.period_label.length > 14
        ? p.period_label.slice(0, 14) + '...'
        : p.period_label,
      income: (p.total_income ?? 0) - (p.total_tax ?? 0) - (p.total_deductions ?? 0),
      expenses: p.total_expenses ?? 0,
    }));

  if (chartData.length < 2) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle>Income vs Expenses</CardTitle>
          <CardDescription>
            Compare your income and expenses across pay periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  width={45}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={<IncomeExpensesChartTooltip />}
                  allowEscapeViewBox={{ x: true, y: true }}
                  offset={15}
                  isAnimationActive={false}
                  cursor={isMobile ? false : { fill: '#94a3b8', fillOpacity: 0.1 }}
                  wrapperStyle={{ outline: 'none', zIndex: 50 }}
                />
                <Bar dataKey="income" name="Income" fill="#34d399" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="expenses" name="Expenses" fill="#f87171" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-400" />
              Income
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-rose-400" />
              Expenses
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main History Page
// ---------------------------------------------------------------------------
export default function HistoryPage() {
  const [periods, setPeriods] = useState<PayPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [dateFilter, setDateFilter] = useState<'all-time' | 'this-month' | 'last-month' | 'this-year' | 'custom'>('this-month');
  const [customMonth, setCustomMonth] = useState<MonthYearSelection | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile/touch devices to disable chart tooltips
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Fetch periods on mount
  const fetchPeriods = useCallback(async () => {
    try {
      const data = await getPayPeriods(200);
      setPeriods(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load pay periods.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  // ------ New tab state ------
  const [activeTab, setActiveTab] = useState<'overall' | 'payroll' | 'consumable' | 'borrowing'>('overall');
  const [consumableRecords, setConsumableRecords] = useState<ConsumableMonthlyRecord[]>([]);
  const [borrowingHistory, setBorrowingHistory] = useState<BorrowingWithExpenses[]>([]);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [monthExpenses, setMonthExpenses] = useState<Record<string, ConsumableExpense[]>>({});
  const [isLoadingTab, setIsLoadingTab] = useState(false);
  const [borrowingFilter, setBorrowingFilter] = useState<'all' | 'active' | 'settled'>('all');

  // Compute dateRange from existing dateFilter + customMonth for consumable/borrowing queries
  const dateRange = useMemo<{ from: string; to: string } | null>(() => {
    if (dateFilter === 'all-time') return null;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // Timezone-safe helpers to avoid UTC offset issues
    function localDate(y: number, m: number, d: number): string {
      return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    function localDateEnd(y: number, m: number, d: number): string {
      return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}T23:59:59`;
    }
    function lastDay(y: number, m: number): number {
      return new Date(y, m + 1, 0).getDate();
    }

    switch (dateFilter) {
      case 'this-month':
        return { from: localDate(year, month, 1), to: localDateEnd(year, month, lastDay(year, month)) };
      case 'last-month': {
        const lm = new Date(year, month - 1, 1);
        const lmY = lm.getFullYear();
        const lmM = lm.getMonth();
        return { from: localDate(lmY, lmM, 1), to: localDateEnd(lmY, lmM, lastDay(lmY, lmM)) };
      }
      case 'this-year':
        return { from: localDate(year, 0, 1), to: localDateEnd(year, 11, 31) };
      case 'custom':
        if (customMonth) {
          const cY = customMonth.year;
          const cM = customMonth.month;
          return { from: localDate(cY, cM, 1), to: localDateEnd(cY, cM, lastDay(cY, cM)) };
        }
        return null;
      default:
        return null;
    }
  }, [dateFilter, customMonth]);

  const [startingBalance, setStartingBalance] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadStartingBalance() {
      if (!dateRange || !dateRange.from) {
        setStartingBalance(0);
        return;
      }
      try {
        const dFrom = new Date(dateRange.from);
        dFrom.setDate(dFrom.getDate() - 1);
        const { getFinancialSummary } = await import('@/features/salary/services/salary.service');
        const summary = await getFinancialSummary({ dateTo: dFrom.toISOString() });
        if (!cancelled && summary) {
          const startingSpareAmount = (summary.totalSpare ?? 0) + (summary.giftedIncome ?? 0);
          const bal = startingSpareAmount 
            - (summary.totalSpareSpent ?? 0) 
            - (summary.totalConsumableSpent ?? 0) 
            - (summary.totalBorrowingExpensesSpent ?? 0);
          setStartingBalance(bal);
        }
      } catch {
        // Silently handle
      }
    }
    loadStartingBalance();
    return () => { cancelled = true; };
  }, [dateRange]);



  const loadConsumableHistory = useCallback(async () => {
    setIsLoadingTab(true);
    try {
      const user = await getCurrentUser();
      const config = await getSalaryConfig();
      if (user && config) {
        await autoSnapshotPreviousMonth(user.id, config.consumable_allowance ?? 4500);
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        await snapshotConsumableMonth(user.id, currentMonth, config.consumable_allowance ?? 4500);
      }
      const records = await getConsumableMonthlyRecords(
        dateRange ? { dateFrom: dateRange.from, dateTo: dateRange.to } : undefined
      );
      setConsumableRecords(records);
    } catch {
      toast.error('Failed to load consumable history');
    } finally {
      setIsLoadingTab(false);
    }
  }, [dateRange]);

  const loadBorrowingHistory = useCallback(async () => {
    setIsLoadingTab(true);
    try {
      const settled = borrowingFilter === 'all' ? undefined : borrowingFilter === 'settled';
      const data = await getBorrowingsWithExpenses({ settled });
      // Apply client-side date filtering if dateRange is set
      const filtered = dateRange
        ? data.filter((b) => {
            const d = b.transaction_date;
            return d >= dateRange.from && d <= dateRange.to;
          })
        : data;
      setBorrowingHistory(filtered);
    } catch {
      toast.error('Failed to load borrowing history');
    } finally {
      setIsLoadingTab(false);
    }
  }, [dateRange, borrowingFilter]);

  const loadMonthExpenses = useCallback(async (month: string) => {
    if (monthExpenses[month]) return;
    try {
      const expenses = await getConsumableExpenses(month);
      setMonthExpenses(prev => ({ ...prev, [month]: expenses }));
    } catch {
      toast.error('Failed to load expenses');
    }
  }, [monthExpenses]);

  useEffect(() => {
    if (activeTab === 'overall') {
      loadConsumableHistory();
      loadBorrowingHistory();
    } else if (activeTab === 'consumable') {
      loadConsumableHistory();
    } else if (activeTab === 'borrowing') {
      loadBorrowingHistory();
    }
  }, [activeTab, loadConsumableHistory, loadBorrowingHistory]);

  // Delete handler
  async function handleDelete(id: string, label: string) {
    setDeletingId(id);
    try {
      // Find the period to get its month for bill cleanup
      const period = periods.find((p) => p.id === id);
      await deletePayPeriod(id);
      setPeriods((prev) => prev.filter((p) => p.id !== id));

      // Clear bill payments for that month if no other periods remain for the same month
      if (period?.created_at) {
        const month = period.created_at.slice(0, 7); // "YYYY-MM"
        const remainingInMonth = periods.filter(
          (p) => p.id !== id && p.created_at?.slice(0, 7) === month
        );
        if (remainingInMonth.length === 0) {
          // No other periods for this month -- reset bill payments
          const { deleteBillPaymentsByMonth } = await import(
            '@/features/salary/services/salary.service'
          );
          await deleteBillPaymentsByMonth(month);
        }
      }

      toast.success(`"${label}" deleted.`, {
        description: 'The pay period has been removed.',
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete pay period.';
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  // Date filter
  const dateFilteredPeriods = useMemo(() => {
    if (dateFilter === 'all-time') return periods;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    function localDate(y: number, m: number, d: number): string {
      return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    function localDateEnd(y: number, m: number, d: number): string {
      return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}T23:59:59`;
    }
    function lastDay(y: number, m: number): number {
      return new Date(y, m + 1, 0).getDate();
    }

    let dateFrom: string;
    let dateTo: string;
    switch (dateFilter) {
      case 'this-month':
        dateFrom = localDate(year, month, 1);
        dateTo = localDateEnd(year, month, lastDay(year, month));
        break;
      case 'last-month': {
        const lm = new Date(year, month - 1, 1);
        const lmY = lm.getFullYear();
        const lmM = lm.getMonth();
        dateFrom = localDate(lmY, lmM, 1);
        dateTo = localDateEnd(lmY, lmM, lastDay(lmY, lmM));
        break;
      }
      case 'this-year':
        dateFrom = localDate(year, 0, 1);
        dateTo = localDateEnd(year, 11, 31);
        break;
      case 'custom':
        if (customMonth) {
          const cY = customMonth.year;
          const cM = customMonth.month;
          dateFrom = localDate(cY, cM, 1);
          dateTo = localDateEnd(cY, cM, lastDay(cY, cM));
        } else {
          return periods;
        }
        break;
      default:
        return periods;
    }
    return periods.filter((p) => {
      const created = p.created_at;
      if (!created) return false;
      return created >= dateFrom && created <= dateTo;
    });
  }, [periods, dateFilter, customMonth]);


  // Search filter (applied on top of date filter)
  const filteredPeriods = useMemo(() => {
    return searchQuery.trim()
      ? dateFilteredPeriods.filter((p) => {
          const query = searchQuery.toLowerCase().trim();
          const terms = query.split(/\s+/).filter(Boolean);
          if (terms.length === 0) return true;

          // Gather all searchable strings for this period
          const searchableStrings: string[] = [
            p.period_label.toLowerCase()
          ];

          if (p.created_at) {
            const dateObj = new Date(p.created_at);
            if (!isNaN(dateObj.getTime())) {
              // Formatted date as displayed in the UI, e.g. "Jun 18, 2026"
              const formattedPH = formatDate(p.created_at).toLowerCase();
              const fullMonth = dateObj.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
              const shortMonth = dateObj.toLocaleDateString('en-US', { month: 'short' }).toLowerCase();
              const year = dateObj.getFullYear().toString();
              const day = dateObj.getDate().toString();
              const numericMonth = (dateObj.getMonth() + 1).toString();
              const numericMonthPad = (dateObj.getMonth() + 1).toString().padStart(2, '0');
              const numericDayPad = dateObj.getDate().toString().padStart(2, '0');
              
              searchableStrings.push(
                formattedPH,
                fullMonth,
                shortMonth,
                year,
                day,
                numericMonth,
                `${year}-${numericMonthPad}-${numericDayPad}`,
                `${numericMonthPad}/${numericDayPad}/${year}`
              );
            }
          }

          // For a period to match, EVERY term in the search query must match AT LEAST ONE searchable string
          return terms.every((term) =>
            searchableStrings.some((str) => str.includes(term))
          );
        })
      : dateFilteredPeriods;
  }, [dateFilteredPeriods, searchQuery]);

  const [spareTransactions, setSpareTransactions] = useState<SpareTransaction[]>([]);

  const totalSpareSpent = useMemo(() => {
    return spareTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [spareTransactions]);

  useEffect(() => {
    let cancelled = false;
    async function loadSpareTransactions() {
      try {
        const opts = dateRange ? { dateFrom: dateRange.from, dateTo: dateRange.to } : undefined;
        const results = await getSpareTransactionsInRange(opts);
        if (!cancelled) {
          setSpareTransactions(results);
        }
      } catch {
        // Silently handle
      }
    }
    loadSpareTransactions();
    return () => { cancelled = true; };
  }, [dateRange]);

  // Compute overall aggregates
  const overallStats = useMemo(() => {
    const totalGrossIncome = filteredPeriods.reduce((sum, p) => sum + (p.total_income ?? 0), 0);
    const totalNetPay = filteredPeriods.reduce((sum, p) => {
      const netPay = (p.total_income ?? 0) - (p.total_tax ?? 0) - (p.total_deductions ?? 0);
      return sum + netPay;
    }, 0);
    const totalAllocated = filteredPeriods.reduce((sum, p) => {
      const pAllocated = (p.allocation_amounts || []).reduce((acc, item) => acc + Number(item.actual || 0), 0);
      return sum + pAllocated;
    }, 0);
    const totalSpareBudget = filteredPeriods.reduce((sum, p) => sum + Number(p.spare_amount || 0), 0);
    
    const consumableBudget = consumableRecords.reduce((sum, r) => sum + Number(r.allowance), 0);
    const consumableSpent = consumableRecords.reduce((sum, r) => sum + Number(r.total_spent), 0);
    
    const activeBorrowed = borrowingHistory
      .filter((b) => b.type === 'borrowed' && !b.is_settled)
      .reduce((sum, b) => sum + Number(b.amount), 0);
    const activeLent = borrowingHistory
      .filter((b) => b.type === 'lent' && !b.is_settled)
      .reduce((sum, b) => sum + Number(b.amount), 0);
      
    // Sum of spent from active or historical borrowed accounts
    const totalBorrowingSpent = borrowingHistory
      .filter((b) => b.type === 'borrowed')
      .reduce((sum, b) => sum + Number(b.totalSpent || 0), 0);
      
    // Sum of lent records that were forgiven/gifted by the user (counts as expense/outflow)
    const totalLentForgiven = borrowingHistory
      .filter((b) => b.type === 'lent' && b.is_gifted)
      .reduce((sum, b) => sum + Number(b.amount), 0);
      
    // Sum of borrowed records that were gifted to the user (adds to spare)
    const giftedIncome = borrowingHistory
      .filter((b) => b.type === 'borrowed' && b.is_gifted)
      .reduce((sum, b) => sum + Number(b.amount), 0);
      
    const totalOutflow = totalAllocated + totalSpareSpent + consumableSpent + totalBorrowingSpent + totalLentForgiven;
    const remainingSpare = startingBalance + (totalSpareBudget + giftedIncome) - totalSpareSpent - consumableSpent - totalBorrowingSpent;
    const remainingConsumable = consumableBudget - consumableSpent;
    const netBorrowing = activeLent - activeBorrowed;

    return {
      totalNetPay,
      totalAllocated,
      totalSpareBudget,
      totalSpareSpent,
      consumableBudget,
      consumableSpent,
      activeBorrowed,
      activeLent,
      totalOutflow,
      remainingSpare,
      remainingConsumable,
      netBorrowing,
      totalBorrowingSpent,
      totalLentForgiven,
      totalGrossIncome,
      giftedIncome,
      startingBalance,
    };
  }, [filteredPeriods, totalSpareSpent, consumableRecords, borrowingHistory, startingBalance]);

  // Combined chart data aggregator
  const overallChartData = useMemo(() => {
    const dataMap = new Map<string, { monthLabel: string; income: number; spent: number }>();

    // 1. Process periods (Payroll income and spare_spent)
    for (const p of filteredPeriods) {
      const dateStr = p.created_at || new Date().toISOString();
      const monthKey = dateStr.substring(0, 7); // "YYYY-MM"
      const entry = dataMap.get(monthKey) ?? {
        monthLabel: new Date(monthKey + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        income: 0,
        spent: 0,
      };
      const netPay = (p.total_income ?? 0) - (p.total_tax ?? 0) - (p.total_deductions ?? 0);
      entry.income += netPay;
      
      const pAllocated = (p.allocation_amounts || []).reduce((acc, item) => acc + Number(item.actual || 0), 0);
      const pSpareSpent = spareTransactions
        .filter((t) => t.pay_period_id === p.id)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      entry.spent += pAllocated + pSpareSpent;
      dataMap.set(monthKey, entry);
    }

    // 2. Process consumable records (Consumable spent)
    for (const r of consumableRecords) {
      const monthKey = r.month; // "YYYY-MM"
      const entry = dataMap.get(monthKey) ?? {
        monthLabel: new Date(monthKey + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        income: 0,
        spent: 0,
      };
      entry.spent += Number(r.total_spent);
      dataMap.set(monthKey, entry);
    }

    // 3. Process borrowing expenses (spent from borrowed money) and forgiven lent entries
    for (const b of borrowingHistory) {
      if (b.type === 'borrowed') {
        for (const exp of b.expenses || []) {
          const dateStr = exp.expense_date || new Date().toISOString();
          const monthKey = dateStr.substring(0, 7); // "YYYY-MM"
          const entry = dataMap.get(monthKey) ?? {
            monthLabel: new Date(monthKey + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            income: 0,
            spent: 0,
          };
          entry.spent += Number(exp.amount || 0);
          dataMap.set(monthKey, entry);
        }
      } else if (b.type === 'lent' && b.is_gifted) {
        // Forgiven lent amount becomes an outflow in the month settled
        const dateStr = b.settled_at || b.transaction_date || new Date().toISOString();
        const monthKey = dateStr.substring(0, 7); // "YYYY-MM"
        const entry = dataMap.get(monthKey) ?? {
          monthLabel: new Date(monthKey + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          income: 0,
          spent: 0,
        };
        entry.spent += Number(b.amount);
        dataMap.set(monthKey, entry);
      }
    }

    // Convert to sorted array
    return Array.from(dataMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([_, val]) => val);
  }, [filteredPeriods, spareTransactions, consumableRecords, borrowingHistory]);

  // Layout helper percentages for data visualization
  const payrollProgress = useMemo(() => {
    const netPay = overallStats.totalNetPay || 1;
    const fixedPct = Math.min((overallStats.totalAllocated / netPay) * 100, 100);
    const sparePct = Math.min((overallStats.totalSpareBudget / netPay) * 100, 100 - fixedPct);
    const remainingPct = Math.max(0, 100 - fixedPct - sparePct);
    return { fixedPct, sparePct, remainingPct };
  }, [overallStats]);

  const consumableProgress = useMemo(() => {
    const budget = overallStats.consumableBudget || 1;
    const spentPct = Math.min((overallStats.consumableSpent / budget) * 100, 100);
    const isOver = overallStats.consumableSpent > overallStats.consumableBudget;
    return { spentPct, isOver };
  }, [overallStats]);

  const debtProgress = useMemo(() => {
    const borrowed = overallStats.activeBorrowed;
    const lent = overallStats.activeLent;
    const total = borrowed + lent || 1;
    const borrowedPct = Math.min((borrowed / total) * 100, 100);
    const lentPct = Math.min((lent / total) * 100, 100);
    return { borrowedPct, lentPct, hasDebts: borrowed > 0 || lent > 0 };
  }, [overallStats]);

  const aggregates = useMemo(() => {
    let totalIncome = 0;
    let totalSavings = 0;
    let totalExpenses = 0;
    let totalSpareAllocated = 0;
    
    filteredPeriods.forEach((p) => {
      totalIncome += Number(p.total_income ?? 0);
      totalSpareAllocated += Number(p.spare_amount ?? 0);
      
      let periodAssets = 0;
      let periodExpenses = 0;
      let hasTypeData = false;
      const allocAmounts = (p.allocation_amounts ?? []) as { actual?: number; allocation_type?: string }[];
      for (const a of allocAmounts) {
        const actual = Number(a.actual ?? 0);
        if (a.allocation_type === 'asset') {
          periodAssets += actual;
          hasTypeData = true;
        } else if (a.allocation_type === 'expense') {
          periodExpenses += actual;
          hasTypeData = true;
        }
      }
      
      if (hasTypeData) {
        totalSavings += periodAssets;
        totalExpenses += periodExpenses;
      } else {
        totalSavings += Number(p.total_savings ?? 0);
        totalExpenses += Number(p.total_expenses ?? 0);
      }
    });

    // We no longer add spare spent to total expenses here
    // totalExpenses += totalSpareSpent;
    
    const totalSpending = totalExpenses + totalSavings;
    const remainingSpare = totalSpareAllocated - totalSpareSpent;
    
    return { totalIncome, totalSpending, totalExpenses, totalSavings, remainingSpare, totalSpareAllocated };
  }, [filteredPeriods, totalSpareSpent]);

  const totalPages = Math.max(1, Math.ceil(filteredPeriods.length / perPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedPeriods = filteredPeriods.slice(
    (safeCurrentPage - 1) * perPage,
    safeCurrentPage * perPage
  );

  // Reset to page 1 when search changes
  function handleSearchChange(value: string) {
    setSearchQuery(value);
    setCurrentPage(1);
  }

  function handlePerPageChange(value: number) {
    setPerPage(value);
    setCurrentPage(1);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div>
      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Combined Sticky Toolbar: Date Filter + Search */}
        <div className="sticky top-14 z-20 -mx-4 bg-background/80 px-4 py-3 backdrop-blur-md border-b border-border/20 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 space-y-3">
          {/* Date Filter Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <CalendarRange className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-center gap-1.5">
              {[
                { value: 'all-time' as const, label: 'All Time' },
                { value: 'this-month' as const, label: 'This Month' },
                { value: 'last-month' as const, label: 'Last Month' },
                { value: 'this-year' as const, label: 'This Year' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setDateFilter(opt.value); setCustomMonth(null); setCurrentPage(1); }}
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
                    setDateFilter('all-time');
                  }
                  setCurrentPage(1);
                }}
                placeholder="Custom"
              />
            </div>
          </div>

          {/* Search + Pagination Row (only when data exists) */}
          {!isLoading && periods.length > 0 && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by period label..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {filteredPeriods.length} {filteredPeriods.length === 1 ? 'record' : 'records'}
                </span>
                <div className="flex items-center gap-1">
                  {[10, 25, 50].map((n) => (
                    <button
                      key={n}
                      onClick={() => handlePerPageChange(n)}
                      className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200 cursor-pointer',
                        perPage === n
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {n}
                    </button>
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">per page</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* History Type Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'payroll' | 'consumable' | 'borrowing')} className="space-y-6">
          <TabsList className="flex w-full items-center justify-start overflow-x-auto flex-nowrap p-1 gap-1 h-11 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:inline-flex sm:w-fit">
            <TabsTrigger value="overall" className="flex-1 sm:flex-initial h-9 gap-1 sm:gap-2 px-2.5 sm:px-5 text-xs sm:text-sm shrink-0 whitespace-nowrap">
              <TrendingUp className="h-4 w-4" />
              <span className="tab-label-reveal">Overall</span>
            </TabsTrigger>
            <TabsTrigger value="payroll" className="flex-1 sm:flex-initial h-9 gap-1 sm:gap-2 px-2.5 sm:px-5 text-xs sm:text-sm shrink-0 whitespace-nowrap">
              <Receipt className="h-4 w-4" />
              <span className="tab-label-reveal">Payroll</span>
            </TabsTrigger>
            <TabsTrigger value="consumable" className="flex-1 sm:flex-initial h-9 gap-1 sm:gap-2 px-2.5 sm:px-5 text-xs sm:text-sm shrink-0 whitespace-nowrap">
              <ShoppingCart className="h-4 w-4" />
              <span className="tab-label-reveal">Consumable</span>
            </TabsTrigger>
            <TabsTrigger value="borrowing" className="flex-1 sm:flex-initial h-9 gap-1 sm:gap-2 px-2.5 sm:px-5 text-xs sm:text-sm shrink-0 whitespace-nowrap">
              <HandCoins className="h-4 w-4" />
              <span className="tab-label-reveal">Borrowing</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overall" className="space-y-8">
            {/* Summary Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              <HistoryStatCard
                label="Total Gross Income"
                value={overallStats.totalGrossIncome}
                icon={TrendingUp}
                colorTheme="teal"
                tooltip="Total income before taxes and deductions across all periods"
              />

              <HistoryStatCard
                label="Total Income (Net Pay)"
                value={overallStats.totalNetPay}
                icon={TrendingUp}
                colorTheme="emerald"
                tooltip={
                  <div className="space-y-1">
                    <p className="font-semibold mb-1">Calculation Breakdown:</p>
                    <div className="grid grid-cols-[1fr_auto] gap-x-4">
                      <span className="text-muted-foreground">Gross Income:</span>
                      <span className="font-medium">PHP {formatPHP(overallStats.totalNetPay + filteredPeriods.reduce((sum, p) => sum + (p.total_tax ?? 0) + (p.total_deductions ?? 0), 0))}</span>
                      <span className="text-muted-foreground">Total Taxes:</span>
                      <span className="text-rose-500 font-medium">- PHP {formatPHP(filteredPeriods.reduce((sum, p) => sum + (p.total_tax ?? 0), 0))}</span>
                      <span className="text-muted-foreground">Total Deductions:</span>
                      <span className="text-rose-500 font-medium">- PHP {formatPHP(filteredPeriods.reduce((sum, p) => sum + (p.total_deductions ?? 0), 0))}</span>
                    </div>
                  </div>
                }
              />

              <HistoryStatCard
                label="Total Expenditures"
                value={overallStats.totalOutflow}
                icon={ShoppingCart}
                colorTheme="rose"
                tooltip={
                  <div className="space-y-1">
                    <p className="font-semibold mb-1">Calculation Breakdown:</p>
                    <div className="grid grid-cols-[1fr_auto] gap-x-4">
                      <span className="text-muted-foreground">Fixed Allocations:</span>
                      <span className="font-medium">PHP {formatPHP(overallStats.totalAllocated)}</span>
                      <span className="text-muted-foreground">Spare Spent:</span>
                      <span className="font-medium">+ PHP {formatPHP(overallStats.totalSpareSpent)}</span>
                      <span className="text-muted-foreground">Consumables:</span>
                      <span className="font-medium">+ PHP {formatPHP(overallStats.consumableSpent)}</span>
                      <span className="text-muted-foreground">Borrowing Spent:</span>
                      <span className="font-medium">+ PHP {formatPHP(overallStats.totalBorrowingSpent)}</span>
                      {overallStats.totalLentForgiven > 0 && (
                        <>
                          <span className="text-rose-500/80">Forgiven Lent:</span>
                          <span className="text-rose-500 font-medium">+ PHP {formatPHP(overallStats.totalLentForgiven)}</span>
                        </>
                      )}
                    </div>
                  </div>
                }
              />

              <HistoryStatCard
                label="Available Spare"
                value={overallStats.remainingSpare}
                icon={Sparkles}
                colorTheme="violet"
                tooltip={
                  <div className="space-y-1">
                    <p className="font-semibold mb-1">Calculation Breakdown:</p>
                    <div className="grid grid-cols-[1fr_auto] gap-x-4">
                      <span className="text-muted-foreground">Starting Balance:</span>
                      <span className="font-medium">PHP {formatPHP(overallStats.startingBalance)}</span>

                      <span className="text-muted-foreground">Total Spare Budget:</span>
                      <span className="font-medium">+ PHP {formatPHP(overallStats.totalSpareBudget)}</span>
                      
                      {overallStats.giftedIncome > 0 && (
                        <>
                          <span className="text-emerald-500/80">Gifted/Forgiven Borrowings:</span>
                          <span className="text-emerald-500 font-medium">+ PHP {formatPHP(overallStats.giftedIncome)}</span>
                        </>
                      )}
                      
                      <span className="text-muted-foreground">Spare Spent:</span>
                      <span className="text-rose-500 font-medium">- PHP {formatPHP(overallStats.totalSpareSpent)}</span>
                      
                      <span className="text-muted-foreground">Consumable Spent:</span>
                      <span className="text-rose-500 font-medium">- PHP {formatPHP(overallStats.consumableSpent)}</span>
                      
                      <span className="text-muted-foreground">Borrowing Expenses:</span>
                      <span className="text-rose-500 font-medium">- PHP {formatPHP(overallStats.totalBorrowingSpent)}</span>
                    </div>

                    {(overallStats.activeBorrowed > 0 || overallStats.activeLent > 0) && (
                      <div className="mt-2 pt-2 border-t border-border/20 space-y-1">
                        <p className="font-semibold text-foreground/90">True Cash Position:</p>
                        <div className="grid grid-cols-[1fr_auto] gap-x-4">
                          <span className="text-muted-foreground">Available Spare:</span>
                          <span className="font-medium">PHP {formatPHP(overallStats.remainingSpare)}</span>
                          <span className="text-muted-foreground">Owed to Me (Active):</span>
                          <span className="text-emerald-500 font-medium">+ PHP {formatPHP(overallStats.activeLent)}</span>
                          <span className="text-muted-foreground">I Owe (Active):</span>
                          <span className="text-rose-500 font-medium">- PHP {formatPHP(overallStats.activeBorrowed)}</span>
                          <span className="text-foreground font-bold mt-0.5 border-t border-border/20 pt-0.5">True Balance:</span>
                          <span className="text-foreground font-bold mt-0.5 border-t border-border/20 pt-0.5">PHP {formatPHP(overallStats.remainingSpare + overallStats.activeLent - overallStats.activeBorrowed)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                }
              />

              <div className="col-span-2 md:col-span-1 lg:col-span-1">
                <HistoryStatCard
                  label="Net Outstanding Debts"
                  value={Math.abs(overallStats.netBorrowing)}
                  icon={Scale}
                  colorTheme={overallStats.netBorrowing >= 0 ? "emerald" : "rose"}
                  subtitle={overallStats.netBorrowing > 0 ? 'Others owe you more' : overallStats.netBorrowing < 0 ? 'You owe others more' : 'All settled'}
                  tooltip={
                    <div className="space-y-1">
                      <p className="font-semibold mb-1">Calculation Breakdown:</p>
                      <div className="grid grid-cols-[1fr_auto] gap-x-4">
                        <span className="text-muted-foreground">Total Active Lent:</span>
                        <span className="text-emerald-500 font-medium">PHP {formatPHP(overallStats.activeLent)}</span>
                        <span className="text-muted-foreground">Total Active Borrowed:</span>
                        <span className="text-rose-500 font-medium">- PHP {formatPHP(overallStats.activeBorrowed)}</span>
                      </div>
                    </div>
                  }
                />
              </div>
            </div>

            {/* Combined Trend Chart Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Combined Cashflow Trends</CardTitle>
                <CardDescription>Monthly comparison of Total Net Pay and Total Spending</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72 min-w-0">
                  {overallChartData.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <TrendingUp className="h-8 w-8 text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">No historical data available</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={overallChartData} margin={{ top: 8, right: 10, left: 15, bottom: 0 }}>
                        <defs>
                          <linearGradient id="overallIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="overallSpent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                        <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis 
                          width={65} 
                          tick={{ fontSize: 11, fill: '#94a3b8' }} 
                          axisLine={false} 
                          tickLine={false} 
                          tickFormatter={(v) => v === 0 ? '₱0' : v >= 1000 ? `₱${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : `₱${v}`} 
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const income = payload[0]?.value as number ?? 0;
                            const spent = payload[1]?.value as number ?? 0;
                            return (
                              <div className="rounded-lg border border-border/50 bg-card/95 backdrop-blur-md shadow-xl p-3 space-y-1.5">
                                <p className="text-xs font-semibold text-foreground">{payload[0]?.payload?.monthLabel}</p>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between gap-6 text-xs">
                                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Net Pay</span>
                                    <span className="tabular-nums font-semibold text-emerald-500">PHP {formatPHP(income)}</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-6 text-xs">
                                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" /> Spent</span>
                                    <span className="tabular-nums font-semibold text-rose-500">PHP {formatPHP(spent)}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} formatter={(value) => <span className="text-xs text-muted-foreground capitalize">{value === 'income' ? 'Net Pay' : 'Total Spent'}</span>} />
                        <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#overallIncome)" name="income" />
                        <Area type="monotone" dataKey="spent" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#overallSpent)" name="spent" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Financial Breakdown Card */}
            <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-lg overflow-hidden">
              <CardHeader className="border-b border-border/40 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Overall Financial Breakdown</CardTitle>
                    <CardDescription className="text-xs">Consolidated statistics for all categories</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider bg-muted/30">
                    Portfolio Mix
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                {/* 1. PAYROLL & ALLOCATIONS */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      Payroll & Allocations
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      Total Net Income: <span className="font-semibold text-foreground">PHP {formatPHP(overallStats.totalNetPay)}</span>
                    </span>
                  </div>
                  
                  {/* Stacked Percentage Progress Bar */}
                  <div className="space-y-2">
                    <div className="h-3 w-full flex overflow-hidden rounded-full bg-muted/60 border border-border/10 shadow-inner">
                      <div 
                        className="h-full bg-blue-500/90 transition-all duration-500 hover:brightness-110" 
                        style={{ width: `${payrollProgress.fixedPct}%` }} 
                        title={`Fixed Bills: ${payrollProgress.fixedPct.toFixed(1)}%`}
                      />
                      <div 
                        className="h-full bg-amber-500/90 transition-all duration-500 hover:brightness-110" 
                        style={{ width: `${payrollProgress.sparePct}%` }} 
                        title={`Spare Budget: ${payrollProgress.sparePct.toFixed(1)}%`}
                      />
                      <div 
                        className="h-full bg-emerald-500/90 transition-all duration-500 hover:brightness-110" 
                        style={{ width: `${payrollProgress.remainingPct}%` }} 
                        title={`Buffer/Savings: ${payrollProgress.remainingPct.toFixed(1)}%`}
                      />
                    </div>
                    
                    {/* Legend Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className="flex flex-col gap-0.5 rounded-lg bg-muted/20 p-2.5 border border-border/20">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          Fixed Allocated Bills
                        </span>
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-bold tabular-nums text-foreground">PHP {formatPHP(overallStats.totalAllocated)}</span>
                          <span className="text-[10px] text-muted-foreground font-medium">{payrollProgress.fixedPct.toFixed(1)}%</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-0.5 rounded-lg bg-muted/20 p-2.5 border border-border/20">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          Spare Budget Generated
                        </span>
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-bold tabular-nums text-foreground">PHP {formatPHP(overallStats.totalSpareBudget)}</span>
                          <span className="text-[10px] text-muted-foreground font-medium">{payrollProgress.sparePct.toFixed(1)}%</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-0.5 rounded-lg bg-muted/20 p-2.5 border border-border/20">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Remaining Unspent Spare
                        </span>
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-bold tabular-nums text-emerald-500">PHP {formatPHP(overallStats.remainingSpare)}</span>
                          <span className="text-[10px] text-emerald-500/80 font-medium">{payrollProgress.remainingPct.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="bg-border/40" />

                {/* 2. CONSUMABLE DAILY SPENDING */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                      Consumable Daily Spending
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      Usage Rate: <span className="font-semibold text-foreground">{consumableProgress.spentPct.toFixed(1)}%</span>
                    </span>
                  </div>

                  {/* Consumable Utilization Progress Bar */}
                  <div className="space-y-2">
                    <div className="h-3 w-full overflow-hidden rounded-full bg-muted/60 border border-border/10 shadow-inner">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500 hover:brightness-110',
                          consumableProgress.isOver ? 'bg-rose-500/90' : 
                            consumableProgress.spentPct >= 80 ? 'bg-amber-500/90' : 'bg-emerald-500/90'
                        )}
                        style={{ width: `${consumableProgress.spentPct}%` }}
                      />
                    </div>

                    {/* Consumable Legend Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className="flex flex-col gap-0.5 rounded-lg bg-muted/20 p-2.5 border border-border/20">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                          Consumable Allowance
                        </span>
                        <span className="text-sm font-bold tabular-nums text-foreground">PHP {formatPHP(overallStats.consumableBudget)}</span>
                      </div>

                      <div className="flex flex-col gap-0.5 rounded-lg bg-muted/20 p-2.5 border border-border/20">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                          <span className={cn("h-1.5 w-1.5 rounded-full", consumableProgress.isOver ? 'bg-rose-500' : consumableProgress.spentPct >= 80 ? 'bg-amber-500' : 'bg-emerald-500')} />
                          Total Consumable Spent
                        </span>
                        <span className={cn("text-sm font-bold tabular-nums", consumableProgress.isOver ? 'text-rose-500' : consumableProgress.spentPct >= 80 ? 'text-amber-500' : 'text-emerald-500')}>
                          PHP {formatPHP(overallStats.consumableSpent)}
                        </span>
                      </div>

                      <div className="flex flex-col gap-0.5 rounded-lg bg-muted/20 p-2.5 border border-border/20">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                          <span className={cn("h-1.5 w-1.5 rounded-full", overallStats.remainingConsumable >= 0 ? 'bg-emerald-500' : 'bg-rose-500')} />
                          Remaining Budget
                        </span>
                        <span className={cn("text-sm font-bold tabular-nums", overallStats.remainingConsumable >= 0 ? "text-emerald-500" : "text-rose-500")}>
                          PHP {formatPHP(overallStats.remainingConsumable)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="bg-border/40" />

                {/* 3. BORROWINGS & LENDINGS */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      Borrowings & Lendings
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      Net Balance: <span className={cn("font-semibold", overallStats.netBorrowing >= 0 ? "text-emerald-500" : "text-rose-500")}>
                        PHP {formatPHP(overallStats.netBorrowing)}
                      </span>
                    </span>
                  </div>

                  {/* Debt Ratio Progress Bar */}
                  <div className="space-y-2">
                    {debtProgress.hasDebts ? (
                      <div className="h-3 w-full flex overflow-hidden rounded-full bg-muted/60 border border-border/10 shadow-inner">
                        <div 
                          className="h-full bg-rose-500/90 transition-all duration-500 hover:brightness-110" 
                          style={{ width: `${debtProgress.borrowedPct}%` }}
                          title={`Borrowed: ${debtProgress.borrowedPct.toFixed(1)}%`}
                        />
                        <div 
                          className="h-full bg-emerald-500/90 transition-all duration-500 hover:brightness-110" 
                          style={{ width: `${debtProgress.lentPct}%` }}
                          title={`Lent: ${debtProgress.lentPct.toFixed(1)}%`}
                        />
                      </div>
                    ) : (
                      <div className="h-3 w-full flex items-center justify-center rounded-full bg-muted/60 border border-border/10 text-[9px] text-muted-foreground font-medium uppercase tracking-wide">
                        No outstanding debt or lending records found
                      </div>
                    )}

                    {/* Borrowing Legend Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      <div className="flex flex-col gap-0.5 rounded-lg bg-muted/20 p-2.5 border border-border/20">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          Active Borrowed (I Owe)
                        </span>
                        <span className="text-sm font-bold tabular-nums text-rose-500">PHP {formatPHP(overallStats.activeBorrowed)}</span>
                      </div>

                      <div className="flex flex-col gap-0.5 rounded-lg bg-muted/20 p-2.5 border border-border/20">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          Spent from Borrowed
                        </span>
                        <span className="text-sm font-bold tabular-nums text-amber-500">PHP {formatPHP(overallStats.totalBorrowingSpent)}</span>
                      </div>

                      <div className="flex flex-col gap-0.5 rounded-lg bg-muted/20 p-2.5 border border-border/20">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Active Lent (Owed to Me)
                        </span>
                        <span className="text-sm font-bold tabular-nums text-emerald-500">PHP {formatPHP(overallStats.activeLent)}</span>
                      </div>

                      <div className="flex flex-col gap-0.5 rounded-lg bg-muted/20 p-2.5 border border-border/20">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                          <span className={cn("h-1.5 w-1.5 rounded-full", overallStats.netBorrowing >= 0 ? 'bg-emerald-500' : 'bg-rose-500')} />
                          Net Position
                        </span>
                        <span className={cn("text-sm font-bold tabular-nums", overallStats.netBorrowing >= 0 ? "text-emerald-500" : "text-rose-500")}>
                          PHP {formatPHP(overallStats.netBorrowing)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payroll" className="space-y-8">
        {isLoading ? (
          <HistorySkeleton />
        ) : periods.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Aggregate Summary Cards */}
            {filteredPeriods.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <HistoryStatCard
                  label="Total Income"
                  value={aggregates.totalIncome}
                  icon={DollarSign}
                  colorTheme="emerald"
                  tooltip="Total gross income before any deductions for the filtered periods."
                />

                <HistoryStatCard
                  label="Total Spending"
                  value={aggregates.totalSpending}
                  icon={ShoppingBag}
                  colorTheme="orange"
                  tooltip="Total Expenses + Total Savings + Spare Spent for the filtered periods."
                />

                <HistoryStatCard
                  label="Total Expenses"
                  value={aggregates.totalExpenses}
                  icon={Receipt}
                  colorTheme="rose"
                  tooltip="Budget Expenses + Spare Spent for the filtered periods. Matches Dashboard logic."
                />

                <HistoryStatCard
                  label="Total Savings"
                  value={aggregates.totalSavings}
                  icon={PiggyBank}
                  colorTheme="violet"
                  tooltip="Sum of all asset allocations (Savings, Emergency) for the filtered periods."
                />

                <div className="col-span-2 md:col-span-1 lg:col-span-1">
                  <HistoryStatCard
                    label="Remaining Spare"
                    value={aggregates.remainingSpare}
                    icon={Wallet}
                    colorTheme={aggregates.remainingSpare >= 0 ? "sky" : "rose"}
                    tooltip={`Total Allocated Spare (${formatPHP(aggregates.totalSpareAllocated)}) minus Total Spare Spent (${formatPHP(totalSpareSpent)}).`}
                  />
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* Desktop Table                                                 */}
            {/* ============================================================ */}
            <Card className="hidden lg:block overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead colSpan={9} className="p-0">
                        <div className="flex items-center">
                          <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex-1 min-w-0">
                            Period
                          </div>
                          <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right w-28">
                            Income
                          </div>
                          <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right w-28">
                            Tax
                          </div>
                          <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right w-28">
                            Deductions
                          </div>
                          <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right w-28">
                            Expenses
                          </div>
                          <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right w-28">
                            Savings
                          </div>
                          <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right w-28">
                            Spare
                          </div>
                          <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right w-28">
                            Date
                          </div>
                          <div className="px-4 py-3 w-20" />
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {paginatedPeriods.map((period) => {
                        const isExpanded = expandedId === period.id;
                        const spare = period.spare_amount ?? 0;
                        const isPositive = spare >= 0;

                        return (
                          <motion.tr
                            key={period.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, height: 0 }}
                            layout
                            className="group border-b transition-colors hover:bg-muted/50"
                          >
                            <td colSpan={9} className="p-0">
                              {/* Main Row */}
                              <div
                                className="flex items-center cursor-pointer hover:bg-muted/30 transition-colors duration-150"
                                onClick={() => toggleExpand(period.id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    toggleExpand(period.id);
                                  }
                                }}
                              >
                                <div className="px-4 py-3 text-sm font-medium flex-1 min-w-0 truncate">
                                  <div className="flex items-center gap-2">
                                    {isExpanded ? (
                                      <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    ) : (
                                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    )}
                                    {period.period_label}
                                  </div>
                                </div>
                                <div className="px-4 py-3 text-sm tabular-nums text-right w-28">
                                  P {formatPHP(period.total_income ?? 0)}
                                </div>
                                <div className="px-4 py-3 text-sm tabular-nums text-right w-28">
                                  P {formatPHP(period.total_tax ?? 0)}
                                </div>
                                <div className="px-4 py-3 text-sm tabular-nums text-right w-28">
                                  P {formatPHP(period.total_deductions ?? 0)}
                                </div>
                                <div className="px-4 py-3 text-sm tabular-nums text-right w-28">
                                  P {formatPHP(period.total_expenses ?? 0)}
                                </div>
                                <div className="px-4 py-3 text-sm tabular-nums text-right w-28">
                                  P {formatPHP(period.total_savings ?? 0)}
                                </div>
                                <div className="px-4 py-3 text-right w-28">
                                  <Badge
                                    variant={isPositive ? 'default' : 'destructive'}
                                    className="tabular-nums font-semibold"
                                  >
                                    P {formatPHP(spare)}
                                  </Badge>
                                </div>
                                <div className="px-4 py-3 text-sm text-muted-foreground text-right w-28">
                                  {formatDate(period.created_at)}
                                </div>
                                <div className="px-4 py-3 w-20 flex justify-end">
                                  <ConfirmDialog
                                    trigger={
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                        disabled={deletingId === period.id}
                                      >
                                        {deletingId === period.id ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-4 w-4" />
                                        )}
                                      </Button>
                                    }
                                    title="Delete Pay Period"
                                    description={`Are you sure you want to delete "${period.period_label}"? This action cannot be undone and will also remove associated bill payments for that month.`}
                                    confirmLabel="Delete Period"
                                    onConfirm={() => handleDelete(period.id, period.period_label)}
                                    disabled={deletingId === period.id}
                                  />
                                </div>
                              </div>

                              {/* Expanded Detail */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <Separator />
                                    <div className="px-6 pb-4 pt-4 bg-muted/20 space-y-4">
                                      {/* Income Breakdown */}
                                      <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Income Breakdown</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6">
                                          {period.first_wage > 0 && (
                                            <DetailRow label="First Wage" value={`P ${formatPHP(period.first_wage)}`} />
                                          )}
                                          {period.second_wage > 0 && (
                                            <DetailRow label="Second Wage" value={`P ${formatPHP(period.second_wage)}`} />
                                          )}
                                          {period.part_time > 0 && (
                                            <DetailRow label="Part-Time" value={`P ${formatPHP(period.part_time)}`} />
                                          )}
                                          {(period.additional_income as { label: string; amount: number }[] | null)?.filter((inc) => inc.amount > 0).map((inc, idx) => (
                                            <DetailRow key={`inc-${idx}`} label={inc.label} value={`P ${formatPHP(inc.amount)}`} />
                                          ))}
                                          {Number(period.total_deductions ?? 0) > 0 && (
                                            <DetailRow label="Deductions" value={`- P ${formatPHP(Number(period.total_deductions))}`} />
                                          )}
                                          {Number(period.total_tax ?? 0) > 0 ? (
                                            <DetailRow label="Tax" value={`- P ${formatPHP(Number(period.total_tax))}`} />
                                          ) : (
                                            <DetailRow label="Tax Rate" value={`${(period.tax_rate * 100).toFixed(0)}%`} />
                                          )}
                                        </div>
                                      </div>
                                      <Separator />
                                      {/* Financial Breakdown (new or legacy) */}
                                      {period.allocation_amounts && period.allocation_amounts.length > 0 ? (
                                        <PeriodBillStatus period={period} />
                                      ) : (
                                        /* Legacy fields for old periods */
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                          <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Expenses</p>
                                            <DetailRow label="Daily Rate" value={`P ${formatPHP(period.daily_consumable_rate)} x ${period.daily_consumable_days}d`} />
                                            <DetailRow label="Rent" value={`P ${formatPHP(period.rent)}`} />
                                            <DetailRow label="Electricity" value={`P ${formatPHP(period.electricity)}`} />
                                            {period.monthly_utils_items.map((item, idx) => (
                                              <DetailRow key={idx} label={item.label} value={`P ${formatPHP(item.amount)}`} />
                                            ))}
                                          </div>
                                          <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Savings</p>
                                            <DetailRow label="Emergency Fund" value={`P ${formatPHP(period.emergency_fund)}`} />
                                            <DetailRow label="General Savings" value={`P ${formatPHP(period.general_savings)}`} />
                                          </div>
                                          <SpareTransactionsSection payPeriodId={period.id} spareAmount={period.spare_amount ?? 0} />
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* ============================================================ */}
            {/* Mobile Cards                                                  */}
            {/* ============================================================ */}
            <div className="lg:hidden space-y-3">
              <AnimatePresence>
                {paginatedPeriods.map((period) => {
                  const isExpanded = expandedId === period.id;
                  const spare = period.spare_amount ?? 0;
                  const isPositive = spare >= 0;

                  return (
                    <motion.div
                      key={period.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      layout
                    >
                      <Card className="overflow-hidden">
                        <div
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors duration-150"
                          onClick={() => toggleExpand(period.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              toggleExpand(period.id);
                            }
                          }}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              {period.period_label}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <CalendarDays className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {formatDate(period.created_at)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <div className="flex items-center gap-1.5 justify-end">
                                {isPositive ? (
                                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                  <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                                )}
                                <Badge
                                  variant={isPositive ? 'default' : 'destructive'}
                                  className="tabular-nums font-semibold"
                                >
                                  P {formatPHP(spare)}
                                </Badge>
                              </div>
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                Spare
                              </span>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <Separator />
                              <div className="px-4 pb-4 pt-3 space-y-3">
                                {/* Summary Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="rounded-lg bg-muted/50 p-3">
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Income</p>
                                    <p className="text-sm font-semibold tabular-nums">P {formatPHP(period.total_income ?? 0)}</p>
                                  </div>
                                  <div className="rounded-lg bg-muted/50 p-3">
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Tax</p>
                                    <p className="text-sm font-semibold tabular-nums">P {formatPHP(period.total_tax ?? 0)}</p>
                                  </div>
                                  <div className="rounded-lg bg-muted/50 p-3">
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Expenses</p>
                                    <p className="text-sm font-semibold tabular-nums">P {formatPHP(period.total_expenses ?? 0)}</p>
                                  </div>
                                  <div className="rounded-lg bg-muted/50 p-3">
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Savings</p>
                                    <p className="text-sm font-semibold tabular-nums">P {formatPHP(period.total_savings ?? 0)}</p>
                                  </div>
                                </div>

                                {/* Detail Items */}
                                <div className="space-y-1">
                                  {period.first_wage > 0 && (
                                    <DetailRow label="First Wage" value={`P ${formatPHP(period.first_wage)}`} />
                                  )}
                                  {period.second_wage > 0 && (
                                    <DetailRow label="Second Wage" value={`P ${formatPHP(period.second_wage)}`} />
                                  )}
                                  {period.part_time > 0 && (
                                    <DetailRow label="Part-Time" value={`P ${formatPHP(period.part_time)}`} />
                                  )}
                                  {(period.additional_income as { label: string; amount: number }[] | null)?.filter((inc) => inc.amount > 0).map((inc, idx) => (
                                    <DetailRow key={`inc-${idx}`} label={inc.label} value={`P ${formatPHP(inc.amount)}`} />
                                  ))}
                                </div>

                                {/* Financial Breakdown */}
                                {period.allocation_amounts && period.allocation_amounts.length > 0 ? (
                                  <PeriodBillStatus period={period} />
                                ) : (
                                  <div className="space-y-1">
                                    <DetailRow label="Daily Consumables" value={`P ${formatPHP(period.daily_consumable_rate * period.daily_consumable_days)}`} />
                                    <DetailRow label="Rent" value={`P ${formatPHP(period.rent)}`} />
                                    <DetailRow label="Electricity" value={`P ${formatPHP(period.electricity)}`} />
                                    {period.monthly_utils_items.map((item, idx) => (
                                      <DetailRow key={idx} label={item.label} value={`P ${formatPHP(item.amount)}`} />
                                    ))}
                                    <SpareTransactionsSection payPeriodId={period.id} spareAmount={period.spare_amount ?? 0} />
                                  </div>
                                )}

                                {/* Delete button */}
                                <ConfirmDialog
                                  trigger={
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="w-full gap-1.5"
                                      disabled={deletingId === period.id}
                                    >
                                      {deletingId === period.id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-3.5 w-3.5" />
                                      )}
                                      Delete Period
                                    </Button>
                                  }
                                  title="Delete Pay Period"
                                  description={`Are you sure you want to delete "${period.period_label}"? This action cannot be undone.`}
                                  confirmLabel="Delete Period"
                                  onConfirm={() => handleDelete(period.id, period.period_label)}
                                  disabled={deletingId === period.id}
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* ============================================================ */}
            {/* Trend Chart                                                   */}
            {/* ============================================================ */}
            {/* Bottom Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-4 py-3">
                <span className="text-xs text-muted-foreground">
                  Page {safeCurrentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={safeCurrentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Trend Chart */}
            <SpareAmountChart periods={periods} isMobile={isMobile} />
            <IncomeExpensesChart periods={periods} isMobile={isMobile} />
          </>
        )}
          </TabsContent>

          <TabsContent value="consumable" className="space-y-6">
            {isLoadingTab ? <HistorySkeleton /> : consumableRecords.length === 0 ? (
              <Card>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-5">
                      <ShoppingCart className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No consumable records yet</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                      Start tracking your daily consumable expenses in the Payroll Calculator to see monthly summaries here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Consumable Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <HistoryStatCard
                    label="Months Tracked"
                    value={consumableRecords.length}
                    icon={CalendarDays}
                    colorTheme="indigo"
                    isCurrency={false}
                  />

                  <HistoryStatCard
                    label="Avg Monthly Spend"
                    value={consumableRecords.length > 0 ? consumableRecords.reduce((s, r) => s + Number(r.total_spent), 0) / consumableRecords.length : 0}
                    icon={Calculator}
                    colorTheme="amber"
                  />

                  <HistoryStatCard
                    label="Under Budget"
                    value={consumableRecords.filter(r => !r.is_over_budget).length}
                    icon={CheckCircle2}
                    colorTheme="emerald"
                    isCurrency={false}
                  />

                  <HistoryStatCard
                    label="Over Budget"
                    value={consumableRecords.filter(r => r.is_over_budget).length}
                    icon={AlertTriangle}
                    colorTheme="rose"
                    isCurrency={false}
                  />
                </div>

                {/* Monthly Records Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Monthly Consumable Records</CardTitle>
                    <CardDescription>Budget vs actual spending per month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full overflow-x-auto scrollbar-none">
                      <Table>
                        <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead className="text-right">Allowance</TableHead>
                          <TableHead className="text-right">Spent</TableHead>
                          <TableHead className="text-right">Remaining</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-center">Expenses</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {consumableRecords.map((record) => (
                          <React.Fragment key={record.id}>
                            <TableRow
                              className="cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => {
                                const next = expandedMonth === record.month ? null : record.month;
                                setExpandedMonth(next);
                                if (next) loadMonthExpenses(next);
                              }}
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {expandedMonth === record.month ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  {new Date(record.month + '-01').toLocaleDateString('en-PH', { year: 'numeric', month: 'long' })}
                                </div>
                              </TableCell>
                              <TableCell className="text-right tabular-nums">PHP {formatPHP(Number(record.allowance))}</TableCell>
                              <TableCell className="text-right tabular-nums text-amber-500">PHP {formatPHP(Number(record.total_spent))}</TableCell>
                              <TableCell className={cn('text-right tabular-nums font-medium', Number(record.remaining) >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                                PHP {formatPHP(Number(record.remaining))}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant={record.is_over_budget ? 'destructive' : 'secondary'} className={cn('text-[10px]', !record.is_over_budget && 'bg-emerald-500/10 text-emerald-500')}>
                                  {record.is_over_budget ? 'Over' : 'Under'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center tabular-nums text-muted-foreground">{record.expense_count}</TableCell>
                            </TableRow>
                            {expandedMonth === record.month && (
                              <TableRow>
                                <TableCell colSpan={6} className="bg-muted/30 p-4">
                                  {monthExpenses[record.month] ? (
                                    monthExpenses[record.month].length > 0 ? (
                                      <div className="space-y-1">
                                        {monthExpenses[record.month].map((exp) => (
                                          <div key={exp.id} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                                            <div className="flex items-center gap-3">
                                              <span className="text-muted-foreground w-16">
                                                {new Date(exp.expense_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                                              </span>
                                              <span>{exp.description}</span>
                                            </div>
                                            <span className="font-medium tabular-nums text-amber-500">-PHP {formatPHP(Number(exp.amount))}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-muted-foreground text-center py-2">No expenses recorded</p>
                                    )
                                  ) : (
                                    <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
                                  )}
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Consumable Trend Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="overflow-visible">
                    <CardHeader>
                      <CardTitle className="text-base">Consumable Budget Trend</CardTitle>
                      <CardDescription>Monthly allowance vs actual spending</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-72 min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[...consumableRecords].reverse().map(r => ({
                              month: new Date(r.month + '-01').toLocaleDateString('en-PH', { month: 'short', year: '2-digit' }),
                              allowance: Number(r.allowance),
                              spent: Number(r.total_spent),
                            }))}
                            margin={{ top: 8, right: 20, left: 10, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="allowanceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#34d399" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#34d399" stopOpacity={0.6} />
                              </linearGradient>
                              <linearGradient id="spentGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.6} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                            <XAxis
                              dataKey="month"
                              tick={{ fontSize: 11, fill: '#94a3b8' }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              width={45}
                              tick={{ fontSize: 11, fill: '#94a3b8' }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const allowance = payload[0]?.value as number;
                                const spent = payload[1]?.value as number;
                                const remaining = allowance - spent;
                                return (
                                  <div className="rounded-lg border border-border/50 bg-card/95 backdrop-blur-md shadow-xl p-3 space-y-1.5">
                                    <p className="text-xs font-semibold text-foreground">{payload[0]?.payload?.month}</p>
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between gap-6 text-xs">
                                        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Allowance</span>
                                        <span className="tabular-nums font-medium">PHP {formatPHP(allowance)}</span>
                                      </div>
                                      <div className="flex items-center justify-between gap-6 text-xs">
                                        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" /> Spent</span>
                                        <span className="tabular-nums font-medium">PHP {formatPHP(spent)}</span>
                                      </div>
                                      <Separator className="my-1" />
                                      <div className="flex items-center justify-between gap-6 text-xs">
                                        <span className="text-muted-foreground">Remaining</span>
                                        <span className={cn('tabular-nums font-semibold', remaining >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                                          PHP {formatPHP(remaining)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }}
                              allowEscapeViewBox={{ x: true, y: true }}
                              offset={15}
                              cursor={{ fill: '#94a3b8', opacity: 0.05 }}
                              wrapperStyle={{ outline: 'none', zIndex: 50 }}
                            />
                            <Bar dataKey="allowance" fill="url(#allowanceGradient)" radius={[6, 6, 0, 0]} barSize={28} name="Allowance" />
                            <Bar dataKey="spent" fill="url(#spentGradient)" radius={[6, 6, 0, 0]} barSize={28} name="Spent" />
                            <Legend
                              iconType="circle"
                              iconSize={8}
                              wrapperStyle={{ fontSize: '11px', color: '#94a3b8', paddingTop: '12px' }}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </>
            )}
          </TabsContent>

          <TabsContent value="borrowing" className="space-y-6">
            {/* Borrowing Filter Pills */}
            <div className="flex items-center gap-1.5">
              {(['all', 'active', 'settled'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setBorrowingFilter(f)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer capitalize',
                    borrowingFilter === f
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>

            {isLoadingTab ? <HistorySkeleton /> : borrowingHistory.length === 0 ? (
              <Card>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-5">
                      <HandCoins className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No borrowing records</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                      Track your borrowings and lending on the Borrowing page to see history here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Borrowing Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <HistoryStatCard
                    label="Total Borrowed"
                    value={borrowingHistory.filter(b => b.type === 'borrowed').reduce((s, b) => s + Number(b.amount), 0)}
                    icon={TrendingDown}
                    colorTheme="rose"
                  />

                  <HistoryStatCard
                    label="Total Lent"
                    value={borrowingHistory.filter(b => b.type === 'lent').reduce((s, b) => s + Number(b.amount), 0)}
                    icon={TrendingUp}
                    colorTheme="emerald"
                  />

                  <HistoryStatCard
                    label="Settled"
                    value={borrowingHistory.filter(b => b.is_settled).length}
                    icon={CheckCircle2}
                    colorTheme="teal"
                    isCurrency={false}
                  />

                  <HistoryStatCard
                    label="Active"
                    value={borrowingHistory.filter(b => !b.is_settled).length}
                    icon={Clock}
                    colorTheme="amber"
                    isCurrency={false}
                  />
                </div>

                {/* Borrowing Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Borrowing Transactions</CardTitle>
                    <CardDescription>All borrowing and lending records</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full overflow-x-auto scrollbar-none">
                      <Table>
                        <TableHeader>
                          <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Person</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {borrowingHistory.map((b) => (
                          <TableRow key={b.id}>
                            <TableCell className="text-xs tabular-nums text-muted-foreground">
                              {new Date(b.transaction_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </TableCell>
                            <TableCell className="font-medium">{b.person_name}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={cn('text-[10px]', b.type === 'borrowed' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500')}>
                                {b.type === 'borrowed' ? 'Borrowed' : 'Lent'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-medium">
                              <div>PHP {formatPHP(Number(b.amount))}</div>
                              {b.type === 'borrowed' && (
                                <div className="text-[10px] text-muted-foreground font-normal mt-0.5">
                                  Spent: PHP {formatPHP(b.totalSpent)}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge 
                                variant={b.is_settled ? 'secondary' : 'outline'} 
                                className={cn(
                                  'text-[10px]', 
                                  b.is_settled 
                                    ? b.is_gifted 
                                      ? 'bg-amber-500/10 text-amber-500 border-none' 
                                      : 'bg-emerald-500/10 text-emerald-500'
                                    : ''
                                )}
                              >
                                {b.is_settled 
                                  ? b.is_gifted 
                                    ? b.type === 'borrowed' ? 'Gift / Free' : 'Forgiven' 
                                    : 'Settled' 
                                  : 'Active'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{b.description ?? '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Borrowing Trend Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="overflow-visible">
                    <CardHeader>
                      <CardTitle className="text-base">Borrowing Activity</CardTitle>
                      <CardDescription>Borrowed vs lent amounts over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-72 min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={(() => {
                              const monthMap = new Map<string, { borrowed: number; lent: number; spent: number }>();
                              for (const b of borrowingHistory) {
                                const m = b.transaction_date.substring(0, 7);
                                const entry = monthMap.get(m) ?? { borrowed: 0, lent: 0, spent: 0 };
                                if (b.type === 'borrowed') {
                                  entry.borrowed += Number(b.amount);
                                  entry.spent += b.totalSpent || 0;
                                } else {
                                  entry.lent += Number(b.amount);
                                }
                                monthMap.set(m, entry);
                              }
                              return Array.from(monthMap.entries())
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([m, v]) => ({
                                  month: new Date(m + '-01').toLocaleDateString('en-PH', { month: 'short', year: '2-digit' }),
                                  ...v,
                                }));
                            })()}
                            margin={{ top: 8, right: 20, left: 10, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="borrowedGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.6} />
                              </linearGradient>
                              <linearGradient id="borrowingSpentGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.6} />
                              </linearGradient>
                              <linearGradient id="lentGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#34d399" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#34d399" stopOpacity={0.6} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                            <XAxis
                              dataKey="month"
                              tick={{ fontSize: 11, fill: '#94a3b8' }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              width={45}
                              tick={{ fontSize: 11, fill: '#94a3b8' }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const data = payload[0]?.payload;
                                const borrowed = data?.borrowed ?? 0;
                                const spent = data?.spent ?? 0;
                                const lent = data?.lent ?? 0;
                                const net = lent - borrowed;
                                return (
                                  <div className="rounded-lg border border-border/50 bg-card/95 backdrop-blur-md shadow-xl p-3 space-y-1.5">
                                    <p className="text-xs font-semibold text-foreground">{data?.month}</p>
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between gap-6 text-xs">
                                        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-400" /> Borrowed</span>
                                        <span className="tabular-nums font-medium">PHP {formatPHP(borrowed)}</span>
                                      </div>
                                      {borrowed > 0 && (
                                        <div className="flex items-center justify-between gap-6 text-xs pl-3.5">
                                          <span className="text-muted-foreground flex items-center gap-1">↳ Spent</span>
                                          <span className="tabular-nums font-medium text-amber-500">PHP {formatPHP(spent)}</span>
                                        </div>
                                      )}
                                      <div className="flex items-center justify-between gap-6 text-xs">
                                        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Lent</span>
                                        <span className="tabular-nums font-medium">PHP {formatPHP(lent)}</span>
                                      </div>
                                      <Separator className="my-1" />
                                      <div className="flex items-center justify-between gap-6 text-xs">
                                        <span className="text-muted-foreground">Net Position</span>
                                        <span className={cn('tabular-nums font-semibold', net >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                                          PHP {formatPHP(Math.abs(net))} {net >= 0 ? 'owed to you' : 'you owe'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }}
                              allowEscapeViewBox={{ x: true, y: true }}
                              offset={15}
                              cursor={{ fill: '#94a3b8', opacity: 0.05 }}
                              wrapperStyle={{ outline: 'none', zIndex: 50 }}
                            />
                            <Bar dataKey="borrowed" fill="url(#borrowedGradient)" radius={[6, 6, 0, 0]} barSize={18} name="Borrowed" />
                            <Bar dataKey="spent" fill="url(#borrowingSpentGradient)" radius={[6, 6, 0, 0]} barSize={18} name="Spent" />
                            <Bar dataKey="lent" fill="url(#lentGradient)" radius={[6, 6, 0, 0]} barSize={18} name="Lent" />
                            <Legend
                              iconType="circle"
                              iconSize={8}
                              wrapperStyle={{ fontSize: '11px', color: '#94a3b8', paddingTop: '12px' }}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
