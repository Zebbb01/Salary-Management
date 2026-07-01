'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  Plus,
  Handshake,
  CheckCircle2,
  Trash2,
  Undo2,
  ChevronDown,
  ChevronUp,
  Users,
  Calendar,
  FileText,
  ChevronRight,
  Receipt,
  Loader2,
  Info,
  Gift,
  CreditCard,
  CalendarRange,
} from 'lucide-react';
import { MonthYearPicker, type MonthYearSelection } from '@/components/ui/month-year-picker';
import { toast } from 'sonner';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  getCurrentUser,
  getBorrowings,
  getBorrowingsWithExpenses,
  createBorrowing,
  createBorrowingExpense,
  deleteBorrowingExpense,
  settleBorrowing,
  unsettleBorrowing,
  deleteBorrowing,
  getBorrowingSummary,
} from '@/features/salary/services/salary.service';
import type { Borrowing, BorrowingWithExpenses, BorrowingSummary, BorrowingType } from '@/features/salary/types/salary.types';
import { formatPHP } from '@/features/salary/utils/calculations';
import { cn } from '@/lib/utils';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ============================================
// CONSTANTS
// ============================================

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
} as const;

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span className="tabular-nums font-display">
      {prefix}{formatPHP(displayed)}
    </span>
  );
}

// ============================================
// SUMMARY CARD
// ============================================

interface SummaryCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  colorTheme: 'rose' | 'emerald' | 'teal' | 'amber' | 'sky';
  subtitle?: string;
  tooltip?: React.ReactNode;
}

function SummaryCard({ label, value, icon: Icon, colorTheme, subtitle, tooltip }: SummaryCardProps) {
  const themeClasses = {
    rose: {
      accent: 'bg-rose-500',
      glow: 'from-rose-500/10 via-rose-500/5 to-transparent',
      cardBg: 'from-card via-card to-rose-950/15',
      iconColor: 'text-rose-500/5 dark:text-rose-400/5 group-hover:text-rose-500/10 dark:group-hover:text-rose-400/10',
    },
    emerald: {
      accent: 'bg-emerald-500',
      glow: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
      cardBg: 'from-card via-card to-emerald-950/15',
      iconColor: 'text-emerald-500/5 dark:text-emerald-400/5 group-hover:text-emerald-500/10 dark:group-hover:text-emerald-400/10',
    },
    teal: {
      accent: 'bg-teal-500',
      glow: 'from-teal-500/10 via-teal-500/5 to-transparent',
      cardBg: 'from-card via-card to-teal-950/15',
      iconColor: 'text-teal-500/5 dark:text-teal-400/5 group-hover:text-teal-500/10 dark:group-hover:text-teal-400/10',
    },
    amber: {
      accent: 'bg-amber-500',
      glow: 'from-amber-500/10 via-amber-500/5 to-transparent',
      cardBg: 'from-card via-card to-amber-950/15',
      iconColor: 'text-amber-500/5 dark:text-amber-400/5 group-hover:text-amber-500/10 dark:group-hover:text-amber-400/10',
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

        <CardContent className="p-3.5 sm:p-5 h-full flex flex-col justify-between gap-3 relative z-10">
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
                  <TooltipContent side="top" className="max-w-[220px] text-[10px] leading-relaxed">
                    {tooltip}
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            )}
          </div>

          <div>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-foreground font-display tracking-tight flex items-baseline">
              <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground/60 mr-1">PHP</span>
              <AnimatedNumber value={value} />
            </p>
            {subtitle && (
              <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================
// LOADING SKELETON
// ============================================

function BorrowingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
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
      {/* Add form */}
      <Skeleton className="h-48 rounded-xl" />
      {/* List */}
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================

function EmptyBorrowings() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Handshake className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">No active borrowings</p>
        <p className="text-xs text-muted-foreground mt-1">
          Add a new entry above to start tracking money borrowed or lent.
        </p>
      </div>
    </div>
  );
}

// ============================================
// BORROWING PAGE
// ============================================

type TabFilter = 'all' | 'borrowed' | 'lent';
type PendingAction = {
  type: 'settle' | 'unsettle' | 'delete' | 'deleteExpense';
  id?: string;
  borrowing: Borrowing;
  isGifted?: boolean;
} | null;

type DateFilterPreset = 'all-time' | 'this-month' | 'last-month' | 'this-year' | 'custom';

export default function BorrowingPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<BorrowingSummary>({
    totalBorrowed: 0,
    totalLent: 0,
    netPosition: 0,
    activeCount: 0,
  });
  const [activeBorrowings, setActiveBorrowings] = useState<BorrowingWithExpenses[]>([]);
  const [settledBorrowings, setSettledBorrowings] = useState<Borrowing[]>([]);
  const [showSettled, setShowSettled] = useState(false);
  const [tabFilter, setTabFilter] = useState<TabFilter>('all');
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  // Date Filter State
  const [dateFilter, setDateFilter] = useState<DateFilterPreset>('this-month');
  const [customMonth, setCustomMonth] = useState<MonthYearSelection | null>(null);

  // Form state
  const [formType, setFormType] = useState<BorrowingType>('borrowed');
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Expense tracking state
  const [expandedBorrowingId, setExpandedBorrowingId] = useState<string | null>(null);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isAddingExpense, setIsAddingExpense] = useState(false);

  // ----------------------------------------
  // FETCH DATA
  // ----------------------------------------

  const fetchData = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (user) setUserId(user.id);

      // Compute dateRange
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

      let dateFrom: string | undefined;
      let dateTo: string | undefined;
      
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
          }
          break;
      }

      const [active, settled, sum] = await Promise.all([
        getBorrowingsWithExpenses({ settled: false, dateFrom, dateTo }),
        getBorrowings({ settled: true, dateFrom, dateTo }),
        getBorrowingSummary({ dateFrom, dateTo }),
      ]);

      setActiveBorrowings(active);
      setSettledBorrowings(settled);
      setSummary(sum);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load borrowing data';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter, customMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ----------------------------------------
  // ADD BORROWING
  // ----------------------------------------

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();

    if (!userId) {
      toast.error('User not authenticated');
      return;
    }

    const name = formName.trim();
    const amount = parseFloat(formAmount);

    if (!name) {
      toast.error('Person name is required');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createBorrowing(userId, {
        person_name: name,
        type: formType,
        amount,
        description: formDescription.trim() || null,
        transaction_date: formDate,
      });

      // Re-fetch to get data with expense fields
      const refreshed = await getBorrowingsWithExpenses({ settled: false });
      setActiveBorrowings(refreshed);

      // Update summary
      const newSummary = await getBorrowingSummary();
      setSummary(newSummary);

      // Reset form
      setFormName('');
      setFormAmount('');
      setFormDescription('');
      setFormDate(new Date().toISOString().split('T')[0]);

      toast.success(
        formType === 'borrowed'
          ? `Recorded borrowing from ${name}`
          : `Recorded lending to ${name}`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add borrowing';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ----------------------------------------
  // SETTLE / UNSETTLE / DELETE
  // ----------------------------------------

  async function handleSettle(borrowing: Borrowing, isGifted = false) {
    try {
      const updated = await settleBorrowing(borrowing.id, isGifted);
      setActiveBorrowings((prev) => prev.filter((b) => b.id !== borrowing.id));
      setSettledBorrowings((prev) => [updated, ...prev]);
      const newSummary = await getBorrowingSummary();
      setSummary(newSummary);
      toast.success(isGifted 
        ? (borrowing.type === 'borrowed' ? `Marked as Gift/Free` : `Forgave loan to ${borrowing.person_name}`)
        : `Settled with ${borrowing.person_name}`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to settle';
      toast.error(message);
    }
  }

  async function handleUnsettle(borrowing: Borrowing) {
    try {
      await unsettleBorrowing(borrowing.id);
      setSettledBorrowings((prev) => prev.filter((b) => b.id !== borrowing.id));
      const refreshed = await getBorrowingsWithExpenses({ settled: false });
      setActiveBorrowings(refreshed);
      const newSummary = await getBorrowingSummary();
      setSummary(newSummary);
      toast.success(`Unsettled with ${borrowing.person_name}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unsettle';
      toast.error(message);
    }
  }

  async function handleDelete(borrowing: Borrowing) {
    try {
      await deleteBorrowing(borrowing.id);
      setActiveBorrowings((prev) => prev.filter((b) => b.id !== borrowing.id));
      setSettledBorrowings((prev) => prev.filter((b) => b.id !== borrowing.id));
      const newSummary = await getBorrowingSummary();
      setSummary(newSummary);
      toast.success(`Deleted entry for ${borrowing.person_name}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete';
      toast.error(message);
    }
  }

  async function handleConfirmAction() {
    if (!pendingAction) return;
    if (pendingAction.type === 'settle') {
      await handleSettle(pendingAction.borrowing, false);
    } else {
      await handleDelete(pendingAction.borrowing);
    }
    setPendingAction(null);
  }

  // ----------------------------------------
  // EXPENSE HANDLERS
  // ----------------------------------------

  async function handleAddExpense(borrowingId: string, maxAmount: number) {
    if (!userId) {
      toast.error('User not authenticated');
      return;
    }

    const desc = expenseDesc.trim();
    const amt = parseFloat(expenseAmount);

    if (!desc) {
      toast.error('Please describe what you spent on');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (amt > maxAmount) {
      toast.error(`Amount exceeds remaining balance of PHP ${formatPHP(maxAmount)}`);
      return;
    }

    setIsAddingExpense(true);
    try {
      await createBorrowingExpense(userId, {
        borrowing_id: borrowingId,
        description: desc,
        amount: amt,
        expense_date: expenseDate,
      });

      // Refresh active borrowings
      const refreshed = await getBorrowingsWithExpenses({ settled: false });
      setActiveBorrowings(refreshed);

      // Reset form
      setExpenseDesc('');
      setExpenseAmount('');
      setExpenseDate(new Date().toISOString().split('T')[0]);

      toast.success('Expense recorded');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add expense';
      toast.error(message);
    } finally {
      setIsAddingExpense(false);
    }
  }

  async function handleDeleteExpense(expenseId: string) {
    try {
      await deleteBorrowingExpense(expenseId);

      // Refresh active borrowings
      const refreshed = await getBorrowingsWithExpenses({ settled: false });
      setActiveBorrowings(refreshed);

      toast.success('Expense deleted');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete expense';
      toast.error(message);
    }
  }

  // ----------------------------------------
  // FILTERED LIST
  // ----------------------------------------

  const filteredActive = tabFilter === 'all'
    ? activeBorrowings
    : activeBorrowings.filter((b) => b.type === tabFilter);

  // ----------------------------------------
  // RENDER
  // ----------------------------------------

  if (isLoading) {
    return <BorrowingSkeleton />;
  }

  const tabOptions: { value: TabFilter; label: string }[] = [
    { value: 'all', label: `All (${activeBorrowings.length})` },
    { value: 'borrowed', label: `I Borrowed (${activeBorrowings.filter((b) => b.type === 'borrowed').length})` },
    { value: 'lent', label: `I Lent (${activeBorrowings.filter((b) => b.type === 'lent').length})` },
  ];

  const debtTotal = summary.totalBorrowed + summary.totalLent || 1;
  const borrowedPct = Math.min((summary.totalBorrowed / debtTotal) * 100, 100);
  const lentPct = Math.min((summary.totalLent / debtTotal) * 100, 100);
  const hasDebts = summary.totalBorrowed > 0 || summary.totalLent > 0;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-6"
    >
      {/* Page Header */}
      <motion.div variants={staggerItem}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Handshake className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Borrowing & Lending</h1>
            <p className="text-sm text-muted-foreground">Track money borrowed from and lent to others</p>
          </div>
        </div>
      </motion.div>

      {/* Date Filter Toolbar */}
      <motion.div variants={staggerItem} className="sticky top-14 z-20 -mx-4 bg-background/80 px-4 py-3 backdrop-blur-md border-b border-border/20 sm:static sm:mx-0 sm:px-0 sm:py-0 sm:bg-transparent sm:backdrop-blur-none sm:border-none flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
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
                setDateFilter('all-time');
              }
            }}
            placeholder="Custom"
          />
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4"
      >
        <SummaryCard
          label="I Owe"
          value={summary.totalBorrowed}
          icon={ArrowDownLeft}
          colorTheme="rose"
          subtitle="Total borrowed from others"
        />
        <SummaryCard
          label="Owed To Me"
          value={summary.totalLent}
          icon={ArrowUpRight}
          colorTheme="emerald"
          subtitle="Total lent to others"
        />
        <SummaryCard
          label="Net Position"
          value={Math.abs(summary.netPosition)}
          icon={Scale}
          colorTheme={summary.netPosition >= 0 ? 'emerald' : 'rose'}
          subtitle={
            summary.netPosition > 0
              ? 'Others owe you more'
              : summary.netPosition < 0
                ? 'You owe others more'
                : 'All balanced'
          }
        />
        <SummaryCard
          label="Forgiven / Gifted"
          value={settledBorrowings
            .filter((b) => b.is_gifted)
            .reduce((sum, b) => sum + Number(b.amount), 0)}
          icon={Gift}
          colorTheme="amber"
          subtitle="Written off or received as gifts"
        />
      </motion.div>


      {/* Side-by-side form and active list on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Balance Ratio and Form */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
          {/* Debt Balance Ratio Card */}
          <motion.div variants={staggerItem}>
            <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-md overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="flex items-center gap-2">Debt & Lending Balance</CardTitle>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Net Position: <span className={cn("font-semibold", summary.netPosition >= 0 ? "text-emerald-500" : "text-rose-500")}>
                      PHP {formatPHP(Math.abs(summary.netPosition))} {summary.netPosition > 0 ? '(Owed to Me)' : summary.netPosition < 0 ? '(I Owe)' : '(Balanced)'}
                    </span>
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {hasDebts ? (
                    <>
                      <div className="h-3 w-full flex overflow-hidden rounded-full bg-muted/60 border border-border/10 shadow-inner">
                        <div 
                          className="h-full bg-rose-500/95 transition-all duration-500" 
                          style={{ width: `${borrowedPct}%` }}
                          title={`I Owe: ${borrowedPct.toFixed(1)}%`}
                        />
                        <div 
                          className="h-full bg-emerald-500/95 transition-all duration-500" 
                          style={{ width: `${lentPct}%` }}
                          title={`Owed to Me: ${lentPct.toFixed(1)}%`}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium px-0.5">
                        <span className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          I Owe: {borrowedPct.toFixed(1)}% (PHP {formatPHP(summary.totalBorrowed)})
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Owed to Me: {lentPct.toFixed(1)}% (PHP {formatPHP(summary.totalLent)})
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="h-9 w-full flex items-center justify-center rounded-lg bg-muted/30 border border-border/30 border-dashed text-xs text-muted-foreground">
                      No active borrowings or lendings found. Your account is fully balanced!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Add New Borrowing Form */}
          <motion.div variants={staggerItem} className="flex-1 flex flex-col">
            <Card className="flex-1 flex flex-col h-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="flex items-center gap-2">Add New Entry
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger className="flex">
                      <Info className="h-3 w-3 text-muted-foreground/50 cursor-help shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      Log a new borrowing or owed amount
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </CardTitle>
            </div>
            <CardDescription>Record money borrowed or lent</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <form onSubmit={handleAdd} className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Type Selector */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Type</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType('borrowed')}
                    className={cn(
                      'flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer',
                      formType === 'borrowed'
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/30'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <ArrowDownLeft className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
                    I Borrowed
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('lent')}
                    className={cn(
                      'flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer',
                      formType === 'lent'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <ArrowUpRight className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
                    I Lent
                  </button>
                </div>
              </div>

              {/* Input Fields */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="person-name" className="text-xs text-muted-foreground">
                    <Users className="inline h-3 w-3 mr-1 -mt-0.5" />
                    Person Name
                  </Label>
                  <Input
                    id="person-name"
                    placeholder="e.g., Mom, John"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-xs text-muted-foreground">
                    Amount (PHP)
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    min={0}
                    step={0.01}
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-xs text-muted-foreground">
                    <FileText className="inline h-3 w-3 mr-1 -mt-0.5" />
                    Description (optional)
                  </Label>
                  <Input
                    id="description"
                    placeholder="e.g., For groceries"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-xs text-muted-foreground">
                    <Calendar className="inline h-3 w-3 mr-1 -mt-0.5" />
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>
              </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                {isSubmitting ? 'Adding...' : 'Add Entry'}
              </Button>
            </form>
          </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column: Active List */}
        <div className="lg:col-span-7 flex flex-col">
          {/* Active Borrowings */}
          <motion.div variants={staggerItem} className="flex-1 flex flex-col">
            <Card className="flex-1 flex flex-col h-full">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Handshake className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="flex items-center gap-2">Active Borrowings
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger className="flex">
                            <Info className="h-3 w-3 text-muted-foreground/50 cursor-help shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            Current active balances that need to be settled
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </CardTitle>
                  </div>
              {summary.activeCount > 0 && (
                <Badge variant="secondary" className="tabular-nums">
                  {summary.activeCount} active
                </Badge>
              )}
            </div>
            <CardDescription>Unsettled borrowings and lendings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col">
            {/* Tab Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {tabOptions.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setTabFilter(tab.value)}
                  className={cn(
                    'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer',
                    tabFilter === tab.value
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <Separator />

            {/* Borrowing List */}
            {filteredActive.length === 0 ? (
              <EmptyBorrowings />
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="space-y-2"
              >
                <AnimatePresence mode="popLayout">
                  {filteredActive.map((borrowing) => (
                    <motion.div
                      key={borrowing.id}
                      variants={staggerItem}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                      className="group"
                    >
                      <div className="rounded-lg border border-border/60 bg-card p-3 transition-colors duration-150 hover:bg-muted/30">
                      <div className="flex items-center gap-3">
                        {/* Type Icon */}
                        <div
                          className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                            borrowing.type === 'borrowed'
                              ? 'bg-rose-500/10 text-rose-500'
                              : 'bg-emerald-500/10 text-emerald-500'
                          )}
                        >
                          {borrowing.type === 'borrowed' ? (
                            <ArrowDownLeft className="h-4 w-4" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4" />
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-foreground">
                              {borrowing.person_name}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] py-0',
                                borrowing.type === 'borrowed'
                                  ? 'border-rose-500/30 text-rose-600 dark:text-rose-400'
                                  : 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                              )}
                            >
                              {borrowing.type === 'borrowed' ? 'Borrowed' : 'Lent'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {new Date(borrowing.transaction_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                            {borrowing.description && (
                              <>
                                <span className="text-muted-foreground/40">·</span>
                                <span className="text-xs text-muted-foreground truncate">
                                  {borrowing.description}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right shrink-0">
                          <span
                            className={cn(
                              'text-sm font-semibold tabular-nums',
                              borrowing.type === 'borrowed'
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            )}
                          >
                            PHP {formatPHP(borrowing.amount)}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Settle dropdown */}
                          <Popover>
                            <PopoverTrigger
                              className="inline-flex h-7 items-center gap-1 rounded px-2 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-500/10 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:text-emerald-400 dark:hover:text-emerald-300"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Settle
                              <ChevronDown className="h-3 w-3 opacity-60" />
                            </PopoverTrigger>
                            <PopoverContent
                              side="bottom"
                              align="end"
                              sideOffset={6}
                              className="w-64 p-1.5"
                            >
                              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                How was this settled?
                              </p>
                              <button
                                className="flex w-full items-start gap-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-emerald-500/10 focus:outline-none focus-visible:bg-emerald-500/10"
                                onClick={() =>
                                  setPendingAction({ type: 'settle', borrowing, isGifted: false })
                                }
                              >
                                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                  <CreditCard className="h-3.5 w-3.5" />
                                </span>
                                <span>
                                  <span className="block text-xs font-semibold text-foreground">
                                    Settle as Paid
                                  </span>
                                  <span className="block text-[11px] text-muted-foreground mt-0.5">
                                    {borrowing.type === 'borrowed'
                                      ? 'You paid back the money normally'
                                      : 'The person paid you back'}
                                  </span>
                                </span>
                              </button>
                              <button
                                className="flex w-full items-start gap-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-amber-500/10 focus:outline-none focus-visible:bg-amber-500/10"
                                onClick={() =>
                                  setPendingAction({ type: 'settle', borrowing, isGifted: true })
                                }
                              >
                                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                  <Gift className="h-3.5 w-3.5" />
                                </span>
                                <span>
                                  <span className="block text-xs font-semibold text-foreground">
                                    {borrowing.type === 'borrowed' ? 'Mark as Gift / Free' : 'Forgive the Loan'}
                                  </span>
                                  <span className="block text-[11px] text-muted-foreground mt-0.5">
                                    {borrowing.type === 'borrowed'
                                      ? 'Forgiven — no repayment needed'
                                      : 'You are writing off the debt'}
                                  </span>
                                </span>
                              </button>
                            </PopoverContent>
                          </Popover>

                          <Button
                            variant="ghost"
                            size="xs"
                            className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 dark:text-rose-400 dark:hover:text-rose-300"
                            onClick={() => setPendingAction({ type: 'delete', borrowing })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Spending tracker - only for borrowed type */}
                      {borrowing.type === 'borrowed' && (
                        <div className="mt-2.5 space-y-2 border-t border-border/40 pt-2.5">
                          {/* Progress bar summary */}
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span className="tabular-nums">
                              Spent: PHP {formatPHP(borrowing.totalSpent)} / PHP {formatPHP(borrowing.amount)}
                            </span>
                            <span
                              className={cn(
                                'font-medium tabular-nums',
                                borrowing.remainingBalance > 0 ? 'text-emerald-500' : 'text-rose-500'
                              )}
                            >
                              {formatPHP(borrowing.remainingBalance)} left
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <motion.div
                              className={cn(
                                'h-full rounded-full',
                                borrowing.totalSpent >= borrowing.amount ? 'bg-rose-500' : 'bg-amber-500'
                              )}
                              initial={{ width: 0 }}
                              animate={{
                                width: `${Math.min((borrowing.totalSpent / Math.max(Number(borrowing.amount), 1)) * 100, 100)}%`,
                              }}
                              transition={{ duration: 0.5, ease: 'easeOut' }}
                            />
                          </div>

                          {/* Toggle button */}
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedBorrowingId((prev) =>
                                prev === borrowing.id ? null : borrowing.id
                              )
                            }
                            className={cn(
                              'flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-colors duration-150 cursor-pointer',
                              'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                            )}
                          >
                            <Receipt className="h-3 w-3" />
                            {expandedBorrowingId === borrowing.id ? 'Hide' : 'View'} Spending
                            <ChevronRight
                              className={cn(
                                'h-3 w-3 transition-transform duration-200',
                                expandedBorrowingId === borrowing.id && 'rotate-90'
                              )}
                            />
                          </button>

                          {/* Expanded expense section */}
                          <AnimatePresence initial={false}>
                            {expandedBorrowingId === borrowing.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                className="overflow-hidden"
                              >
                                <div className="space-y-2 pt-1">
                                  {/* Expense list */}
                                  {borrowing.expenses.length > 0 ? (
                                    <div className="space-y-1">
                                      {borrowing.expenses.map((exp) => (
                                        <div
                                          key={exp.id}
                                          className="group/exp flex items-center justify-between gap-2 rounded-md bg-muted/30 px-2.5 py-1.5"
                                        >
                                          <div className="flex-1 min-w-0">
                                            <span className="text-xs text-foreground">
                                              {exp.description}
                                            </span>
                                            <span className="ml-2 text-[10px] text-muted-foreground tabular-nums">
                                              {new Date(exp.expense_date).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                              })}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1.5 shrink-0">
                                            <span className="text-xs font-medium text-foreground tabular-nums">
                                              PHP {formatPHP(exp.amount)}
                                            </span>
                                            <Button
                                              variant="ghost"
                                              size="xs"
                                              className="h-6 w-6 p-0 opacity-0 group-hover/exp:opacity-100 transition-opacity text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                                              onClick={() => handleDeleteExpense(exp.id)}
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-[11px] text-muted-foreground/60 py-1">
                                      No spending recorded yet.
                                    </p>
                                  )}

                                  {/* Add expense form */}
                                  {borrowing.remainingBalance > 0 && (
                                    <div className="flex flex-col gap-2 rounded-md border border-dashed border-border/60 p-2.5">
                                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
                                        <Input
                                          placeholder="What did you spend on?"
                                          value={expenseDesc}
                                          onChange={(e) => setExpenseDesc(e.target.value)}
                                          className="h-8 text-xs"
                                        />
                                        <Input
                                          type="number"
                                          placeholder="Amount"
                                          min={0}
                                          step={0.01}
                                          max={borrowing.remainingBalance}
                                          value={expenseAmount}
                                          onChange={(e) => setExpenseAmount(e.target.value)}
                                          className="h-8 w-full sm:w-24 text-xs"
                                        />
                                        <Input
                                          type="date"
                                          value={expenseDate}
                                          onChange={(e) => setExpenseDate(e.target.value)}
                                          className="h-8 w-full sm:w-32 text-xs"
                                        />
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-7 self-end text-xs"
                                        disabled={isAddingExpense}
                                        onClick={() =>
                                          handleAddExpense(borrowing.id, borrowing.remainingBalance)
                                        }
                                      >
                                        {isAddingExpense ? (
                                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                        ) : (
                                          <Plus className="h-3 w-3 mr-1" />
                                        )}
                                        Add Expense
                                      </Button>
                                    </div>
                                  )}
                                  {borrowing.remainingBalance <= 0 && (
                                    <p className="text-[11px] font-medium text-rose-500 py-0.5">
                                      Entire borrowed amount has been spent.
                                    </p>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
        </div>
      </div>

      {/* Settled History */}
      {settledBorrowings.length > 0 && (
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader
              className="cursor-pointer select-none"
              onClick={() => setShowSettled((prev) => !prev)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="flex items-center gap-2">Settled History
                    <TooltipProvider>
                      <UITooltip>
                        <TooltipTrigger className="flex">
                          <Info className="h-3 w-3 text-muted-foreground/50 cursor-help shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          Past settled borrowing records
                        </TooltipContent>
                      </UITooltip>
                    </TooltipProvider>
                  </CardTitle>
                  <Badge variant="secondary" className="tabular-nums text-[10px]">
                    {settledBorrowings.length}
                  </Badge>
                </div>
                <Button variant="ghost" size="xs" className="h-7 w-7 p-0">
                  {showSettled ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <CardDescription>
                Previously settled borrowings and lendings
              </CardDescription>
            </CardHeader>
            <AnimatePresence initial={false}>
              {showSettled && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <CardContent className="pt-0 space-y-2">
                    {settledBorrowings.map((borrowing) => (
                      <div
                        key={borrowing.id}
                        className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/20 p-3"
                      >
                        {/* Type Icon (muted) */}
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/60">
                          {borrowing.type === 'borrowed' ? (
                            <ArrowDownLeft className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground line-through">
                              {borrowing.person_name}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 opacity-50"
                            >
                              {borrowing.type === 'borrowed' ? 'Borrowed' : 'Lent'}
                            </Badge>
                            {borrowing.is_gifted && (
                              <Badge className="text-[10px] py-0 bg-amber-500/15 text-amber-600 dark:text-amber-400 border-none">
                                {borrowing.type === 'borrowed' ? 'Gift / Free' : 'Forgiven'}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-muted-foreground/60 tabular-nums">
                              Settled{' '}
                              {borrowing.settled_at
                                ? new Date(borrowing.settled_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : ''}
                            </span>
                            {borrowing.description && (
                              <>
                                <span className="text-muted-foreground/30">·</span>
                                <span className="text-[11px] text-muted-foreground/50 truncate">
                                  {borrowing.description}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Amount */}
                        <span className="text-sm font-medium text-muted-foreground/60 tabular-nums line-through shrink-0">
                          PHP {formatPHP(borrowing.amount)}
                        </span>

                        {/* Undo */}
                        <Button
                          variant="ghost"
                          size="xs"
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => handleUnsettle(borrowing)}
                        >
                          <Undo2 className="h-3.5 w-3.5 mr-1" />
                          Undo
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      )}

      {/* Confirmation AlertDialog */}
      <AlertDialog
        open={!!pendingAction}
        onOpenChange={(open) => { if (!open) setPendingAction(null); }}
      >
        <AlertDialogContent size="sm">
          <div className="flex flex-col items-center text-center pt-2">
            {/* Lottie animation */}
            <div className="h-16 w-16">
              {pendingAction && (
                <Lottie
                  animationData={
                    pendingAction.type === 'delete'
                      ? warningAnimation
                      : successAnimation
                  }
                  loop={false}
                  autoplay
                  className="h-16 w-16"
                />
              )}
            </div>
            <h2 className="mt-3 text-base font-semibold text-foreground">
              {pendingAction?.type === 'settle'
                ? pendingAction.isGifted
                  ? pendingAction.borrowing.type === 'borrowed'
                    ? 'Mark as Gift / Free?'
                    : 'Forgive this loan?'
                  : 'Confirm Settled as Paid?'
                : 'Delete this entry?'}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed max-w-[260px]">
              {pendingAction?.type === 'settle'
                ? pendingAction.isGifted
                  ? pendingAction.borrowing.type === 'borrowed'
                    ? `"${pendingAction.borrowing.person_name}" gifted you PHP ${formatPHP(pendingAction.borrowing.amount)}. No repayment will be tracked.`
                    : `You are forgiving PHP ${formatPHP(pendingAction.borrowing.amount)} owed by "${pendingAction.borrowing.person_name}". This cannot be undone.`
                  : `Marking PHP ${formatPHP(pendingAction.borrowing.amount)} with "${pendingAction.borrowing.person_name}" as fully paid and settled.`
                : pendingAction
                  ? `This will permanently delete the entry for "${pendingAction.borrowing.person_name}" (PHP ${formatPHP(
                      pendingAction.borrowing.amount
                    )}). This action cannot be undone.`
                  : ''}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {pendingAction?.type === 'settle' ? (
              <AlertDialogAction
                onClick={async () => {
                  await handleSettle(pendingAction.borrowing, pendingAction.isGifted);
                  setPendingAction(null);
                }}
                className={cn(
                  'text-white shadow-sm',
                  pendingAction.isGifted
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                )}
              >
                {pendingAction.isGifted
                  ? pendingAction.borrowing.type === 'borrowed'
                    ? 'Yes, Mark as Gift'
                    : 'Yes, Forgive Loan'
                  : 'Yes, Settle as Paid'}
              </AlertDialogAction>
            ) : (
              <AlertDialogAction
                onClick={handleConfirmAction}
                className="bg-rose-600 hover:bg-rose-500 text-white shadow-sm"
              >
                Delete
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
