'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
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
  getCurrentUser,
  initMonthlyBills,
  upsertBillPayment,
  getFinancialSummary,
  getPayPeriodTrend,
  getLatestPeriodInRange,
  getAllocationTypes,
  getPayPeriods,
} from '@/features/salary/services/salary.service';
import type {
  SalaryConfig,
  BudgetAllocationWithAmount,
  PayPeriod,
  BillPayment,
  FinancialSummary,
  AllocationType,
} from '@/features/salary/types/salary.types';
import {
  computeAllocations,
  formatPHP,
  formatPercentage,
} from '@/features/salary/utils/calculations';
import { cn } from '@/lib/utils';
import { CategoryIcon } from '@/components/ui/category-icon';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
  colorClass: string;
  index: number;
  editable?: boolean;
  onSave?: (value: number) => void;
  subtitle?: string;
}

function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
  index,
  editable,
  onSave,
  subtitle,
}: StatCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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
          'overflow-hidden transition-shadow duration-200 hover:shadow-md h-full',
          editable && 'cursor-pointer'
        )}
        onClick={handleStartEdit}
      >
        <CardContent className="pt-5 pb-5 h-full flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-xs text-muted-foreground">{label}</span>
              {isEditing ? (
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <span className="text-sm text-muted-foreground">PHP</span>
                  <Input
                    ref={inputRef}
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className="w-28 text-lg font-semibold tabular-nums font-display"
                    min={0}
                    step={100}
                  />
                </div>
              ) : (
                <span className="text-lg font-semibold text-foreground whitespace-nowrap">
                  <AnimatedNumber value={value} prefix="PHP " />
                </span>
              )}
            </div>
            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                colorClass
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-1.5 min-h-[18px]">
            {editable && !isEditing && (
              <p className="text-[11px] text-muted-foreground">Click to edit</p>
            )}
            {subtitle && !isEditing && (
              <p className="text-[11px] text-muted-foreground">{subtitle}</p>
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
  gradientClass: string;
}

function OverviewCard({ label, value, icon: Icon, gradientClass }: OverviewCardProps) {
  return (
    <motion.div variants={staggerItem} className="h-full">
      <Card className="overflow-hidden transition-shadow duration-200 hover:shadow-md h-full">
        <CardContent className="pt-5 pb-5 h-full flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-lg font-semibold text-foreground whitespace-nowrap">
                <AnimatedNumber value={value} prefix="PHP " />
              </span>
            </div>
            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                gradientClass
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
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
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;

  return (
    <Card className="shadow-lg">
      <CardContent className="px-3 py-2.5">
        <p className="text-sm font-medium capitalize text-foreground">
          {data.category}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatPercentage(data.percentage)} - PHP {formatPHP(data.amount)}
        </p>
      </CardContent>
    </Card>
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
  if (!active || !payload?.length) return null;

  const income = payload.find((p) => p.dataKey === 'income')?.value ?? 0;
  const expenses = payload.find((p) => p.dataKey === 'expenses')?.value ?? 0;
  const net = income - expenses;

  return (
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
        <Separator className="my-2" />
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Net</span>
          <span className={cn(
            'font-bold tabular-nums',
            net >= 0 ? 'text-emerald-500' : 'text-rose-500'
          )}>
            {net >= 0 ? '+' : ''}PHP {formatPHP(net)}
          </span>
        </div>
      </CardContent>
    </Card>
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
          <Button size="lg" render={<Link href="/dashboard/settings" />}>
            <Settings className="h-4 w-4" />
            Go to Settings
          </Button>
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

type DateFilterPreset = 'this-month' | 'last-month' | 'last-3-months' | 'this-year' | 'all-time';

function getDateRange(preset: DateFilterPreset): { dateFrom?: string; dateTo?: string; billMonth: string } {
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

  // New state
  const [billPayments, setBillPayments] = useState<BillPayment[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [trendData, setTrendData] = useState<{ label: string; income: number; expenses: number; savings: number }[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [trendLimit, setTrendLimit] = useState(6);
  const [allocationTypes, setAllocationTypes] = useState<AllocationType[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'expense' | 'asset'>('all');
  const [billFilter, setBillFilter] = useState<'all' | 'expense' | 'asset'>('all');

  // Handle trend filter change
  const handleTrendFilter = useCallback(async (limit: number) => {
    setTrendLimit(limit);
    try {
      const { dateFrom, dateTo } = getDateRange(dateFilter);
      const trend = await getPayPeriodTrend(limit, { dateFrom, dateTo });
      setTrendData(trend);
    } catch {
      // Silently fail
    }
  }, [dateFilter]);

  const fetchData = useCallback(async (filter: DateFilterPreset = 'this-month') => {
    try {
      const supabase = createClient();
      const { dateFrom, dateTo, billMonth } = getDateRange(filter);
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
    fetchData(dateFilter);
  }, [fetchData, dateFilter]);



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

  // Use latest pay period data for cards, fallback to config if no periods saved
  const fullTimeSalary = latestPeriod
    ? (latestPeriod.first_wage ?? 0) + (latestPeriod.second_wage ?? 0)
    : 0;
  const partTimeSalary = latestPeriod
    ? (latestPeriod.part_time ?? 0)
    : 0;
  // Show part-time cards if config has part-time salary (even if no period saved yet)
  const hasPartTime = (salaryConfig.part_time_salary ?? 0) > 0;
  const totalSalary = fullTimeSalary + partTimeSalary;
  const taxAmount = latestPeriod?.total_tax ?? 0;
  const totalExpenses = latestPeriod?.total_expenses ?? 0;
  const spareAmount = latestPeriod?.spare_amount ?? 0;
  const remainingSpare = spareAmount - spareSpent;

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
                onClick={() => setDateFilter(opt.value)}
                className={cn(
                  'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer',
                  dateFilter === opt.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {opt.label}
              </button>
            ))}
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
                    <div className="mt-2 flex flex-wrap gap-2">
                      {unpaidBills.map((bill) => {
                        const alloc = allocationMap.get(bill.allocation_id);
                        return (
                          <div
                            key={bill.id}
                            className="flex items-center gap-2 rounded-lg bg-white/60 px-2.5 py-1.5 text-xs dark:bg-white/10"
                          >
                            <span className="font-medium text-foreground capitalize">
                              {alloc?.category ?? 'Bill'}
                            </span>
                            <span className="text-muted-foreground tabular-nums">
                              PHP {formatPHP(alloc?.amount ?? bill.amount)}
                            </span>
                            <Button
                              size="xs"
                              variant="secondary"
                              className="ml-0.5 h-5 px-1.5 text-[10px]"
                              onClick={() => handleMarkBillPaid(bill)}
                            >
                              Mark Paid
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Stats Row */}
      <div
        className={cn(
          'grid grid-cols-1 gap-4 sm:grid-cols-2',
          hasPartTime ? 'lg:grid-cols-5' : 'lg:grid-cols-4'
        )}
      >
        <StatCard
          label="Full-time Salary"
          value={fullTimeSalary}
          icon={DollarSign}
          colorClass="bg-emerald-500/10 text-emerald-500"
          index={0}
        />
        {hasPartTime && (
          <StatCard
            label="Part-time Salary"
            value={partTimeSalary}
            icon={Briefcase}
            colorClass="bg-sky-500/10 text-sky-500"
            index={1}
          />
        )}
        {hasPartTime && (
          <StatCard
            label="Total Salary"
            value={totalSalary}
            icon={Wallet}
            colorClass="bg-teal-500/10 text-teal-500"
            index={2}
            subtitle="Full-time + Part-time"
          />
        )}
        <StatCard
          label="Tax Amount"
          value={taxAmount}
          icon={Receipt}
          colorClass="bg-rose-500/10 text-rose-500"
          index={hasPartTime ? 3 : 1}
        />
        <StatCard
          label="Total Expenses"
          value={totalExpenses}
          icon={ArrowDownRight}
          colorClass="bg-amber-500/10 text-amber-500"
          index={hasPartTime ? 4 : 2}
        />
        {!hasPartTime && (
          <StatCard
            label="Spare Amount"
            value={remainingSpare}
            icon={Sparkles}
            colorClass="bg-purple-500/10 text-purple-500"
            index={3}
            subtitle={spareSpent > 0 ? `PHP ${formatPHP(spareSpent)} spent from spare` : undefined}
          />
        )}
      </div>

      {/* Spare Amount Hero Card */}
      <motion.div
        variants={staggerItem}
        className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 p-6 shadow-lg dark:from-emerald-700 dark:to-emerald-600"
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-white/80">
              Available Spare
            </span>
            <span className="text-3xl font-semibold tabular-nums font-display text-white sm:text-4xl">
              PHP {formatPHP(remainingSpare)}
            </span>
            {spareSpent > 0 && (
              <span className="text-xs text-white/60">
                PHP {formatPHP(spareSpent)} spent from spare
              </span>
            )}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
        </div>
      </motion.div>

      {/* Financial Overview Cards */}
      {financialSummary && (
        <motion.div variants={staggerItem}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <OverviewCard
              label="Gross Income"
              value={financialSummary.grossIncome}
              icon={TrendingUp}
              gradientClass="bg-teal-500/10 text-teal-500"
            />
            <OverviewCard
              label="Net Income"
              value={financialSummary.netIncome}
              icon={DollarSign}
              gradientClass="bg-emerald-500/10 text-emerald-500"
            />
            <OverviewCard
              label="Total Assets"
              value={financialSummary.totalAssets}
              icon={Landmark}
              gradientClass="bg-violet-500/10 text-violet-500"
            />
            <OverviewCard
              label="Monthly Expenses"
              value={financialSummary.monthlyExpenses}
              icon={ArrowDownRight}
              gradientClass="bg-rose-500/10 text-rose-500"
            />
          </div>
        </motion.div>
      )}

      {/* Income vs Expenses Trend Chart */}
      <motion.div variants={staggerItem}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <CardTitle>Income vs Expenses Trend</CardTitle>
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
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#34d399" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f472b6" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#f472b6" stopOpacity={0.02} />
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
                      cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                      wrapperStyle={{ outline: 'none' }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
                      formatter={(value: string) => (
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>
                      )}
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      name="Income"
                      stroke="#34d399"
                      strokeWidth={2.5}
                      fill="url(#incomeGradient)"
                      dot={{ r: 4, fill: '#34d399', stroke: '#1e293b', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#34d399', stroke: '#fff', strokeWidth: 2 }}
                      animationDuration={800}
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      name="Expenses"
                      stroke="#f472b6"
                      strokeWidth={2.5}
                      fill="url(#expensesGradient)"
                      dot={{ r: 4, fill: '#f472b6', stroke: '#1e293b', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#f472b6', stroke: '#fff', strokeWidth: 2 }}
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
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Budget Allocation</CardTitle>
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
                          <span className="text-sm font-medium capitalize text-foreground">
                            {allocation.category}
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

      {/* Monthly Bills Checklist */}
      <motion.div variants={staggerItem} data-onboarding="monthly-bills">
        {billPayments.length > 0 ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <CardTitle>Monthly Bills</CardTitle>
                  </div>
                  <CardDescription>
                    Track your bill payments for {activeBillMonth}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  {(['all', 'expense', 'asset'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setBillFilter(filter)}
                      className={cn(
                        'whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200 cursor-pointer capitalize',
                        billFilter === filter
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
              <div className="flex flex-col gap-1 max-h-96 overflow-y-auto pr-1 scrollbar-thin">
                {filteredBillPayments.map((bill, index) => {
                  const alloc = allocationMap.get(bill.allocation_id);
                  return (
                    <motion.div
                      key={bill.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.1 + index * 0.04,
                        duration: 0.3,
                        ease: 'easeOut',
                      }}
                      className={cn(
                        'flex items-center justify-between rounded-lg p-3 transition-colors duration-150',
                        bill.is_paid
                          ? 'bg-emerald-500/5 hover:bg-emerald-500/10'
                          : 'hover:bg-muted/50'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0">
                          {bill.is_paid ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : Number(bill.amount) > 0 ? (
                            <Circle className="h-5 w-5 text-amber-400" strokeWidth={2.5} />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground/40" />
                          )}
                        </div>
                        <div className="flex min-w-0 flex-col">
                          <span
                            className={cn(
                              'text-sm font-medium capitalize',
                              bill.is_paid
                                ? 'text-muted-foreground line-through'
                                : 'text-foreground'
                            )}
                          >
                            {alloc?.category ?? 'Bill'}
                          </span>
                          {bill.is_paid && bill.paid_at ? (
                            <span className="text-[11px] text-muted-foreground">
                              Paid {new Date(bill.paid_at).toLocaleDateString('en-PH', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          ) : Number(bill.amount) > 0 && !bill.is_paid ? (
                            <span className="text-[11px] text-amber-500">
                              Paid {formatPHP(Number(bill.amount))} of {formatPHP(alloc?.amount ?? 0)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <span
                          className={cn(
                            'text-sm font-semibold tabular-nums',
                            bill.is_paid ? 'text-muted-foreground' : 'text-foreground'
                          )}
                        >
                          PHP {formatPHP(alloc?.amount ?? bill.amount)}
                        </span>
                        {/* Progress bar for partial payments */}
                        {!bill.is_paid && Number(bill.amount) > 0 && alloc && (
                          <div className="w-20 h-1 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-amber-500 transition-all duration-300"
                              style={{ width: `${Math.min(100, (Number(bill.amount) / alloc.amount) * 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between px-3">
                <span className="text-xs text-muted-foreground">
                  {filteredPaidCount} of {filteredBillPayments.length} paid{filteredPartialCount > 0 ? ` · ${filteredPartialCount} partial` : ''}
                </span>
                <Badge
                  variant={filteredPaidCount === filteredBillPayments.length ? 'default' : 'secondary'}
                  className={cn(
                    filteredPaidCount === filteredBillPayments.length &&
                      'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  )}
                >
                  {filteredPaidCount === filteredBillPayments.length ? 'All Paid' : `${filteredBillPayments.length - filteredPaidCount} remaining`}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center text-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Receipt className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">No bills set up yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add budget allocations in Settings to start tracking your monthly bills.
                  </p>
                </div>
                <Link href="/dashboard/settings">
                  <Button variant="outline" size="sm" className="mt-2">
                    <Settings className="h-3.5 w-3.5 mr-1.5" />
                    Go to Settings
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </motion.div>
  );
}
