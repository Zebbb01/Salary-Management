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
} from 'lucide-react';
import { toast } from 'sonner';
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
  colorClass: string;
  subtitle?: string;
}

function SummaryCard({ label, value, icon: Icon, colorClass, subtitle }: SummaryCardProps) {
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
                colorClass
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
          </div>
          {subtitle && (
            <div className="mt-1.5 min-h-[18px]">
              <p className="text-[11px] text-muted-foreground">{subtitle}</p>
            </div>
          )}
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
type PendingAction = { type: 'settle' | 'delete'; borrowing: Borrowing } | null;

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

      const [active, settled, sum] = await Promise.all([
        getBorrowingsWithExpenses({ settled: false }),
        getBorrowings({ settled: true }),
        getBorrowingSummary(),
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
  }, []);

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

  async function handleSettle(borrowing: Borrowing) {
    try {
      const updated = await settleBorrowing(borrowing.id);
      setActiveBorrowings((prev) => prev.filter((b) => b.id !== borrowing.id));
      setSettledBorrowings((prev) => [updated, ...prev]);
      const newSummary = await getBorrowingSummary();
      setSummary(newSummary);
      toast.success(`Settled with ${borrowing.person_name}`);
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
      await handleSettle(pendingAction.borrowing);
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

      {/* Summary Cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <SummaryCard
          label="I Owe"
          value={summary.totalBorrowed}
          icon={ArrowDownLeft}
          colorClass="bg-rose-500/10 text-rose-500"
          subtitle="Total borrowed from others"
        />
        <SummaryCard
          label="Owed To Me"
          value={summary.totalLent}
          icon={ArrowUpRight}
          colorClass="bg-emerald-500/10 text-emerald-500"
          subtitle="Total lent to others"
        />
        <SummaryCard
          label="Net Position"
          value={Math.abs(summary.netPosition)}
          icon={Scale}
          colorClass={cn(
            summary.netPosition >= 0
              ? 'bg-emerald-500/10 text-emerald-500'
              : 'bg-rose-500/10 text-rose-500'
          )}
          subtitle={
            summary.netPosition > 0
              ? 'Others owe you more'
              : summary.netPosition < 0
                ? 'You owe others more'
                : 'All balanced'
          }
        />
      </motion.div>

      {/* Add New Borrowing Form */}
      <motion.div variants={staggerItem}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-muted-foreground" />
              <CardTitle>Add New Entry</CardTitle>
            </div>
            <CardDescription>Record money borrowed or lent</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
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

      {/* Active Borrowings */}
      <motion.div variants={staggerItem}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Handshake className="h-4 w-4 text-muted-foreground" />
                <CardTitle>Active Borrowings</CardTitle>
              </div>
              {summary.activeCount > 0 && (
                <Badge variant="secondary" className="tabular-nums">
                  {summary.activeCount} active
                </Badge>
              )}
            </div>
            <CardDescription>Unsettled borrowings and lendings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                          <Button
                            variant="ghost"
                            size="xs"
                            className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400 dark:hover:text-emerald-300"
                            onClick={() => setPendingAction({ type: 'settle', borrowing })}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Settle
                          </Button>
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
                  <CardTitle>Settled History</CardTitle>
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
              {pendingAction?.type === 'settle' ? 'Settle this entry?' : 'Delete this entry?'}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed max-w-[260px]">
              {pendingAction?.type === 'settle'
                ? `This will mark the ${
                    pendingAction.borrowing.type === 'borrowed' ? 'borrowing from' : 'lending to'
                  } "${pendingAction.borrowing.person_name}" (PHP ${formatPHP(
                    pendingAction.borrowing.amount
                  )}) as settled.`
                : pendingAction
                  ? `This will permanently delete the entry for "${pendingAction.borrowing.person_name}" (PHP ${formatPHP(
                      pendingAction.borrowing.amount
                    )}). This action cannot be undone.`
                  : ''}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={cn(
                pendingAction?.type === 'delete'
                  ? 'bg-rose-600 text-white shadow-sm hover:bg-rose-500'
                  : 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-500'
              )}
            >
              {pendingAction?.type === 'settle' ? 'Settle' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
