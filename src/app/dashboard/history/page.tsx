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
  Clock,
  ArrowRight,
  DollarSign,
  PiggyBank,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  HandCoins,
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { PayPeriod, SpareTransaction, BillPayment, ConsumableMonthlyRecord, Borrowing, ConsumableExpense } from '@/features/salary/types/salary.types';
import {
  getPayPeriods,
  deletePayPeriod,
  getSpareTransactions,
  getBillPayments,
  getConsumableMonthlyRecords,
  getConsumableExpenses,
  getBorrowings,
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
                margin={{ top: 4, right: 20, left: 0, bottom: 0 }}
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
                margin={{ top: 4, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
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
  const [dateFilter, setDateFilter] = useState<'all-time' | 'this-month' | 'last-month' | 'this-year' | 'custom'>('all-time');
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
  const [activeTab, setActiveTab] = useState<'payroll' | 'consumable' | 'borrowing'>('payroll');
  const [consumableRecords, setConsumableRecords] = useState<ConsumableMonthlyRecord[]>([]);
  const [borrowingHistory, setBorrowingHistory] = useState<Borrowing[]>([]);
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
    switch (dateFilter) {
      case 'this-month':
        return { from: new Date(year, month, 1).toISOString(), to: new Date(year, month + 1, 0, 23, 59, 59).toISOString() };
      case 'last-month':
        return { from: new Date(year, month - 1, 1).toISOString(), to: new Date(year, month, 0, 23, 59, 59).toISOString() };
      case 'this-year':
        return { from: new Date(year, 0, 1).toISOString(), to: new Date(year, 11, 31, 23, 59, 59).toISOString() };
      case 'custom':
        if (customMonth) {
          const range = monthYearToDateRange(customMonth);
          return { from: range.dateFrom, to: range.dateTo };
        }
        return null;
      default:
        return null;
    }
  }, [dateFilter, customMonth]);

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
      const data = await getBorrowings({ settled });
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
    if (activeTab === 'consumable') loadConsumableHistory();
    else if (activeTab === 'borrowing') loadBorrowingHistory();
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
  const dateFilteredPeriods = (() => {
    if (dateFilter === 'all-time') return periods;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    let dateFrom: string;
    let dateTo: string;
    switch (dateFilter) {
      case 'this-month':
        dateFrom = new Date(year, month, 1).toISOString();
        dateTo = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
        break;
      case 'last-month':
        dateFrom = new Date(year, month - 1, 1).toISOString();
        dateTo = new Date(year, month, 0, 23, 59, 59).toISOString();
        break;
      case 'this-year':
        dateFrom = new Date(year, 0, 1).toISOString();
        dateTo = new Date(year, 11, 31, 23, 59, 59).toISOString();
        break;
      case 'custom':
        if (customMonth) {
          const range = monthYearToDateRange(customMonth);
          dateFrom = range.dateFrom;
          dateTo = range.dateTo;
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
  })();


  // Search filter (applied on top of date filter)
  const filteredPeriods = searchQuery.trim()
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

  const [totalSpareSpent, setTotalSpareSpent] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadSpareSpent() {
      try {
        const results = await Promise.all(
          filteredPeriods.map((p) => getSpareTransactions(p.id))
        );
        if (!cancelled) {
          const total = results.flat().reduce((sum, t) => sum + t.amount, 0);
          setTotalSpareSpent(total);
        }
      } catch {
        // Silently handle
      }
    }
    if (filteredPeriods.length > 0) {
      loadSpareSpent();
    } else {
      setTotalSpareSpent(0);
    }
    return () => { cancelled = true; };
  }, [filteredPeriods]);

  const aggregates = useMemo(() => {
    const totalIncome = filteredPeriods.reduce((sum, p) => sum + (p.total_income ?? 0), 0);
    const totalExpenses = filteredPeriods.reduce((sum, p) => sum + (p.total_expenses ?? 0), 0);
    const totalSavings = filteredPeriods.reduce((sum, p) => sum + (p.total_savings ?? 0), 0);
    const totalSpending = totalExpenses + totalSavings + totalSpareSpent;
    const totalSpareAllocated = filteredPeriods.reduce((sum, p) => sum + (p.spare_amount ?? 0), 0);
    const remainingSpare = totalSpareAllocated - totalSpareSpent;
    return { totalIncome, totalSpending, totalExpenses, totalSavings, remainingSpare };
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="payroll" className="gap-1.5">
              <Receipt className="h-4 w-4" />
              Payroll
            </TabsTrigger>
            <TabsTrigger value="consumable" className="gap-1.5">
              <ShoppingCart className="h-4 w-4" />
              Consumable
            </TabsTrigger>
            <TabsTrigger value="borrowing" className="gap-1.5">
              <HandCoins className="h-4 w-4" />
              Borrowing
            </TabsTrigger>
          </TabsList>

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
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                      </div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Income</p>
                    </div>
                    <p className="text-lg font-bold tabular-nums">PHP {formatPHP(aggregates.totalIncome)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10">
                        <ShoppingBag className="h-3.5 w-3.5 text-orange-400" />
                      </div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Spending</p>
                    </div>
                    <p className="text-lg font-bold tabular-nums">PHP {formatPHP(aggregates.totalSpending)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10">
                        <Receipt className="h-3.5 w-3.5 text-rose-400" />
                      </div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Expenses</p>
                    </div>
                    <p className="text-lg font-bold tabular-nums">PHP {formatPHP(aggregates.totalExpenses)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10">
                        <PiggyBank className="h-3.5 w-3.5 text-violet-400" />
                      </div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Savings</p>
                    </div>
                    <p className="text-lg font-bold tabular-nums">PHP {formatPHP(aggregates.totalSavings)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10">
                        <Wallet className="h-3.5 w-3.5 text-sky-400" />
                      </div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Remaining Spare</p>
                    </div>
                    <p className={cn("text-lg font-bold tabular-nums", aggregates.remainingSpare >= 0 ? '' : 'text-rose-500')}>PHP {formatPHP(aggregates.remainingSpare)}</p>
                  </CardContent>
                </Card>
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
                  <Card>
                    <CardContent className="pt-5">
                      <p className="text-xs text-muted-foreground mb-1">Months Tracked</p>
                      <p className="text-xl font-bold tabular-nums">{consumableRecords.length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-5">
                      <p className="text-xs text-muted-foreground mb-1">Avg Monthly Spend</p>
                      <p className="text-xl font-bold tabular-nums text-amber-500">
                        PHP {formatPHP(consumableRecords.length > 0 ? consumableRecords.reduce((s, r) => s + Number(r.total_spent), 0) / consumableRecords.length : 0)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-5">
                      <p className="text-xs text-muted-foreground mb-1">Under Budget</p>
                      <p className="text-xl font-bold tabular-nums text-emerald-500">
                        {consumableRecords.filter(r => !r.is_over_budget).length}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-5">
                      <p className="text-xs text-muted-foreground mb-1">Over Budget</p>
                      <p className="text-xl font-bold tabular-nums text-rose-500">
                        {consumableRecords.filter(r => r.is_over_budget).length}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Monthly Records Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Monthly Consumable Records</CardTitle>
                    <CardDescription>Budget vs actual spending per month</CardDescription>
                  </CardHeader>
                  <CardContent>
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
                            margin={{ top: 8, right: 20, left: 0, bottom: 0 }}
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
                  <Card>
                    <CardContent className="pt-5">
                      <p className="text-xs text-muted-foreground mb-1">Total Borrowed</p>
                      <p className="text-xl font-bold tabular-nums text-rose-500">
                        PHP {formatPHP(borrowingHistory.filter(b => b.type === 'borrowed').reduce((s, b) => s + Number(b.amount), 0))}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-5">
                      <p className="text-xs text-muted-foreground mb-1">Total Lent</p>
                      <p className="text-xl font-bold tabular-nums text-emerald-500">
                        PHP {formatPHP(borrowingHistory.filter(b => b.type === 'lent').reduce((s, b) => s + Number(b.amount), 0))}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-5">
                      <p className="text-xs text-muted-foreground mb-1">Settled</p>
                      <p className="text-xl font-bold tabular-nums">
                        {borrowingHistory.filter(b => b.is_settled).length}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-5">
                      <p className="text-xs text-muted-foreground mb-1">Active</p>
                      <p className="text-xl font-bold tabular-nums text-amber-500">
                        {borrowingHistory.filter(b => !b.is_settled).length}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Borrowing Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Borrowing Transactions</CardTitle>
                    <CardDescription>All borrowing and lending records</CardDescription>
                  </CardHeader>
                  <CardContent>
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
                              PHP {formatPHP(Number(b.amount))}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={b.is_settled ? 'secondary' : 'outline'} className={cn('text-[10px]', b.is_settled && 'bg-emerald-500/10 text-emerald-500')}>
                                {b.is_settled ? 'Settled' : 'Active'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{b.description ?? '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
                              const monthMap = new Map<string, { borrowed: number; lent: number }>();
                              for (const b of borrowingHistory) {
                                const m = b.transaction_date.substring(0, 7);
                                const entry = monthMap.get(m) ?? { borrowed: 0, lent: 0 };
                                if (b.type === 'borrowed') entry.borrowed += Number(b.amount);
                                else entry.lent += Number(b.amount);
                                monthMap.set(m, entry);
                              }
                              return Array.from(monthMap.entries())
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([m, v]) => ({
                                  month: new Date(m + '-01').toLocaleDateString('en-PH', { month: 'short', year: '2-digit' }),
                                  ...v,
                                }));
                            })()}
                            margin={{ top: 8, right: 20, left: 0, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="borrowedGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.6} />
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
                              tick={{ fontSize: 11, fill: '#94a3b8' }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const borrowed = payload[0]?.value as number ?? 0;
                                const lent = payload[1]?.value as number ?? 0;
                                const net = lent - borrowed;
                                return (
                                  <div className="rounded-lg border border-border/50 bg-card/95 backdrop-blur-md shadow-xl p-3 space-y-1.5">
                                    <p className="text-xs font-semibold text-foreground">{payload[0]?.payload?.month}</p>
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between gap-6 text-xs">
                                        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-400" /> Borrowed</span>
                                        <span className="tabular-nums font-medium">PHP {formatPHP(borrowed)}</span>
                                      </div>
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
                            <Bar dataKey="borrowed" fill="url(#borrowedGradient)" radius={[6, 6, 0, 0]} barSize={28} name="Borrowed" />
                            <Bar dataKey="lent" fill="url(#lentGradient)" radius={[6, 6, 0, 0]} barSize={28} name="Lent" />
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
