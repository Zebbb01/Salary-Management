'use client';

import { useEffect, useState, useCallback } from 'react';
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
  Loader2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Search,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { PayPeriod, SpareTransaction } from '@/features/salary/types/salary.types';
import {
  getPayPeriods,
  deletePayPeriod,
  getSpareTransactions,
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
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
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
}: {
  payPeriodId: string;
  spareAmount: number;
}) {
  const [transactions, setTransactions] = useState<SpareTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getSpareTransactions(payPeriodId);
        if (!cancelled) setTransactions(data);
      } catch {
        // Silently handle – the section is supplementary
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
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
      <div className="space-y-2 mt-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-full rounded-lg" />
        <Skeleton className="h-8 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="mt-4">
      <Separator className="mb-4" />
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
          {/* Transaction list */}
          <div className="space-y-1 mb-3">
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
function SpareAmountChart({ periods }: { periods: PayPeriod[] }) {
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
      <Card>
        <CardHeader>
          <CardTitle>Spare Amount Trend</CardTitle>
          <CardDescription>
            Track how your spare amount changes across pay periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="spareGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'hsl(var(--card-foreground))',
                  }}
                  formatter={(value) => [`P ${formatPHP(Number(value))}`, 'Spare']}
                />
                <Area
                  type="monotone"
                  dataKey="spare"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#spareGradient)"
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

  // Search & Pagination
  const filteredPeriods = searchQuery.trim()
    ? periods.filter((p) =>
        p.period_label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : periods;
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
        {isLoading ? (
          <HistorySkeleton />
        ) : periods.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Search + Pagination Toolbar */}
            <div className="sticky top-14 z-20 -mx-4 bg-background/80 px-4 py-3 backdrop-blur-md border-b border-border/20 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
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
            </div>

            {/* ============================================================ */}
            {/* Desktop Table                                                 */}
            {/* ============================================================ */}
            <Card className="hidden lg:block overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead colSpan={8} className="p-0">
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
                            <td colSpan={8} className="p-0">
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
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(period.id, period.period_label);
                                    }}
                                    disabled={deletingId === period.id}
                                    className="opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all duration-150"
                                    aria-label={`Delete ${period.period_label}`}
                                  >
                                    {deletingId === period.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
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
                                    <div className="px-6 pb-4 pt-4 bg-muted/20">
                                      <div className="grid grid-cols-3 gap-6 max-w-3xl">
                                        <div>
                                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                            Income Breakdown
                                          </p>
                                          <DetailRow
                                            label="First Wage"
                                            value={`P ${formatPHP(period.first_wage)}`}
                                          />
                                          <DetailRow
                                            label="Second Wage"
                                            value={`P ${formatPHP(period.second_wage)}`}
                                          />
                                          <DetailRow
                                            label="Part-Time"
                                            value={`P ${formatPHP(period.part_time)}`}
                                          />
                                          {(period.additional_income as { label: string; amount: number }[] | null)?.map((inc, idx) => (
                                            <DetailRow key={`inc-${idx}`} label={inc.label} value={`P ${formatPHP(inc.amount)}`} />
                                          ))}
                                          {Number(period.total_deductions ?? 0) > 0 && (
                                            <DetailRow
                                              label="Deductions"
                                              value={`- P ${formatPHP(Number(period.total_deductions))}`}
                                            />
                                          )}
                                          {Number(period.total_tax ?? 0) > 0 ? (
                                            <DetailRow
                                              label="Tax"
                                              value={`- P ${formatPHP(Number(period.total_tax))}`}
                                            />
                                          ) : (
                                            <DetailRow
                                              label="Tax Rate"
                                              value={`${(period.tax_rate * 100).toFixed(0)}%`}
                                            />
                                          )}
                                        </div>
                                        {/* Dynamic allocations (new periods) */}
                                        {period.allocation_amounts && period.allocation_amounts.length > 0 ? (
                                          <>
                                            <div>
                                              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                                Expenses
                                              </p>
                                              {(period.allocation_amounts as { category: string; actual: number; allocation_type?: string }[])
                                                .filter((a) => a.allocation_type !== 'asset')
                                                .map((a, idx) => (
                                                  <DetailRow
                                                    key={idx}
                                                    label={a.category}
                                                    value={`P ${formatPHP(a.actual)}`}
                                                  />
                                                ))}
                                            </div>
                                            <div>
                                              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                                Assets
                                              </p>
                                              {(period.allocation_amounts as { category: string; actual: number; allocation_type?: string }[])
                                                .filter((a) => a.allocation_type === 'asset')
                                                .length > 0 ? (
                                                (period.allocation_amounts as { category: string; actual: number; allocation_type?: string }[])
                                                  .filter((a) => a.allocation_type === 'asset')
                                                  .map((a, idx) => (
                                                    <DetailRow
                                                      key={idx}
                                                      label={a.category}
                                                      value={`P ${formatPHP(a.actual)}`}
                                                    />
                                                  ))
                                              ) : (
                                                <p className="text-xs text-muted-foreground/60">No assets</p>
                                              )}
                                            </div>
                                          </>
                                        ) : (
                                          /* Legacy fields for old periods */
                                          <>
                                            <div>
                                              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                                Expenses
                                              </p>
                                              <DetailRow
                                                label="Daily Rate"
                                                value={`P ${formatPHP(period.daily_consumable_rate)} x ${period.daily_consumable_days}d`}
                                              />
                                              <DetailRow
                                                label="Rent"
                                                value={`P ${formatPHP(period.rent)}`}
                                              />
                                              <DetailRow
                                                label="Electricity"
                                                value={`P ${formatPHP(period.electricity)}`}
                                              />
                                              {period.monthly_utils_items.map(
                                                (item, idx) => (
                                                  <DetailRow
                                                    key={idx}
                                                    label={item.label}
                                                    value={`P ${formatPHP(item.amount)}`}
                                                  />
                                                )
                                              )}
                                            </div>
                                            <div>
                                              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                                Savings
                                              </p>
                                              <DetailRow
                                                label="Emergency Fund"
                                                value={`P ${formatPHP(period.emergency_fund)}`}
                                              />
                                              <DetailRow
                                                label="General Savings"
                                                value={`P ${formatPHP(period.general_savings)}`}
                                              />
                                            </div>
                                          </>
                                        )}
                                      </div>

                                      {/* Spare Transactions */}
                                      <SpareTransactionsSection
                                        payPeriodId={period.id}
                                        spareAmount={period.spare_amount ?? 0}
                                      />
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
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                                      Income
                                    </p>
                                    <p className="text-sm font-semibold tabular-nums">
                                      P {formatPHP(period.total_income ?? 0)}
                                    </p>
                                  </div>
                                  <div className="rounded-lg bg-muted/50 p-3">
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                                      Tax
                                    </p>
                                    <p className="text-sm font-semibold tabular-nums">
                                      P {formatPHP(period.total_tax ?? 0)}
                                    </p>
                                  </div>
                                  <div className="rounded-lg bg-muted/50 p-3">
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                                      Expenses
                                    </p>
                                    <p className="text-sm font-semibold tabular-nums">
                                      P {formatPHP(period.total_expenses ?? 0)}
                                    </p>
                                  </div>
                                  <div className="rounded-lg bg-muted/50 p-3">
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                                      Savings
                                    </p>
                                    <p className="text-sm font-semibold tabular-nums">
                                      P {formatPHP(period.total_savings ?? 0)}
                                    </p>
                                  </div>
                                </div>

                                {/* Detail Items */}
                                <div className="space-y-1">
                                  <DetailRow
                                    label="First Wage"
                                    value={`P ${formatPHP(period.first_wage)}`}
                                  />
                                  <DetailRow
                                    label="Part-Time"
                                    value={`P ${formatPHP(period.part_time)}`}
                                  />
                                  {(period.additional_income as { label: string; amount: number }[] | null)?.map((inc, idx) => (
                                    <DetailRow key={`inc-${idx}`} label={inc.label} value={`P ${formatPHP(inc.amount)}`} />
                                  ))}
                                  {period.allocation_amounts && period.allocation_amounts.length > 0 ? (
                                    (period.allocation_amounts as { category: string; actual: number; allocation_type?: string }[])
                                      .map((a, idx) => (
                                        <DetailRow
                                          key={idx}
                                          label={a.category}
                                          value={`P ${formatPHP(a.actual)}`}
                                        />
                                      ))
                                  ) : (
                                    <>
                                      <DetailRow
                                        label="Daily Consumables"
                                        value={`P ${formatPHP(period.daily_consumable_rate * period.daily_consumable_days)}`}
                                      />
                                      <DetailRow
                                        label="Rent"
                                        value={`P ${formatPHP(period.rent)}`}
                                      />
                                      <DetailRow
                                        label="Electricity"
                                        value={`P ${formatPHP(period.electricity)}`}
                                      />
                                      {period.monthly_utils_items.map((item, idx) => (
                                        <DetailRow
                                          key={idx}
                                          label={item.label}
                                          value={`P ${formatPHP(item.amount)}`}
                                        />
                                      ))}
                                    </>
                                  )}
                                </div>

                                {/* Spare Transactions */}
                                <SpareTransactionsSection
                                  payPeriodId={period.id}
                                  spareAmount={period.spare_amount ?? 0}
                                />

                                {/* Delete button */}
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(period.id, period.period_label);
                                  }}
                                  disabled={deletingId === period.id}
                                  className="mt-2"
                                >
                                  {deletingId === period.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                  )}
                                  Delete Period
                                </Button>
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
            <SpareAmountChart periods={periods} />
          </>
        )}
      </div>
    </div>
  );
}
