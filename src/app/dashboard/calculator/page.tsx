'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  Receipt,
  Plus,
  Trash2,
  Loader2,
  Calculator,
  TrendingUp,
  TrendingDown,
  Wallet,
  CalendarDays,
  Info,
  Search,
  ChevronsUpDown,
  Check,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { payPeriodSchema, type PayPeriodFormData } from '@/features/salary/validations/schemas';
import {
  calculatePayPeriod,
  computeAllocations,
  generatePeriodLabel,
  formatPHP,
} from '@/features/salary/utils/calculations';
import {
  createPayPeriod,
  getCurrentUser,
  getPayPeriods,
  getSpareTransactions,
  createSpareTransaction,
  deleteSpareTransaction,
  getSpareTotal,
  getBudgetAllocations,
  getSalaryConfig,
  upsertBillPayment,
  getBillPayments,
  getAllocationTypes,
} from '@/features/salary/services/salary.service';
import type { PayPeriodInput, PayPeriod, SpareTransaction, AllocationAmount, BudgetAllocationWithAmount, SalaryConfig, AllocationType } from '@/features/salary/types/salary.types';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------
const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: 'easeOut' },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
};

// ---------------------------------------------------------------------------
// Section Card wrapper (uses shadcn Card)
// ---------------------------------------------------------------------------
function SectionCard({
  title,
  icon: Icon,
  children,
  summary,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  summary?: string;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <motion.div variants={fadeIn}>
      <Card>
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => setIsOpen((o) => !o)}
        >
          <CardTitle className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <span className="flex-1">{title}</span>
            {!isOpen && summary && (
              <span className="text-xs font-normal text-muted-foreground truncate max-w-[50%] hidden sm:inline">
                {summary}
              </span>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsOpen((o) => !o); }}
              className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors shrink-0"
              aria-label={isOpen ? 'Collapse' : 'Expand'}
            >
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </CardTitle>
        </CardHeader>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <CardContent>{children}</CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Field wrapper for form fields
// ---------------------------------------------------------------------------
function FormField({
  id,
  label,
  error,
  children,
  className,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={id} className="mb-1.5 text-muted-foreground">
        {label}
      </Label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Calculator Page
// ---------------------------------------------------------------------------
export default function CalculatorPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingLastPeriod, setIsLoadingLastPeriod] = useState(true);

  // Spare tracker state
  const [savedPeriods, setSavedPeriods] = useState<PayPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
  const [periodSearch, setPeriodSearch] = useState('');
  const [spareTransactions, setSpareTransactions] = useState<SpareTransaction[]>([]);
  const [spareTotal, setSpareTotal] = useState(0);
  const [isLoadingSpare, setIsLoadingSpare] = useState(false);
  const [isAddingSpare, setIsAddingSpare] = useState(false);
  const [spareRows, setSpareRows] = useState<{ description: string; amount: string; date: string }[]>([
    { description: '', amount: '', date: new Date().toISOString().split('T')[0] },
  ]);
  const [budgetAllocations, setBudgetAllocations] = useState<BudgetAllocationWithAmount[]>([]);
  const [salaryConfig, setSalaryConfig] = useState<SalaryConfig | null>(null);
  // Track which allocations are truly paid (remaining balance = 0 from bill payments)
  const [paidAllocationIds, setPaidAllocationIds] = useState<Set<string>>(new Set());
  // Additional income rows
  const [additionalIncomeRows, setAdditionalIncomeRows] = useState<{ label: string; amount: string }[]>([]);

  const defaultValues: PayPeriodFormData = {
    period_label: generatePeriodLabel(),
    first_wage: 0,
    second_wage: 0,
    part_time: 0,
    first_wage_deduction: 0,
    second_wage_deduction: 0,
    part_time_deduction: 0,
    include_first_wage: false,
    include_second_wage: false,
    include_part_time: false,
    include_wage_tax: false,
    wage_tax_rate: 0,
    include_pt_tax: false,
    pt_tax_rate: 0,
    // Legacy fields (default 0)
    daily_consumable_rate: 0,
    daily_consumable_days: 0,
    monthly_utils_items: [],
    rent: 0,
    electricity: 0,
    emergency_fund: 0,
    general_savings: 0,
    // Dynamic allocation amounts
    allocation_amounts: [],
    // Additional income sources
    additional_income: [],
  };

  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PayPeriodFormData>({
    resolver: zodResolver(payPeriodSchema) as Resolver<PayPeriodFormData>,
    defaultValues,
    mode: 'onChange',
  });

  // ---------------------------------------------------------------------------
  // Load last saved pay period on mount to pre-fill the form
  // ---------------------------------------------------------------------------
  const loadLastPeriod = useCallback(async () => {
    try {
      // Fetch salary config and budget allocations
      const config = await getSalaryConfig();
      let computed: BudgetAllocationWithAmount[] = [];
      if (config) {
        setSalaryConfig(config);
        const allocs = await getBudgetAllocations(config.id);
        const combinedSalary = config.full_time_salary + config.part_time_salary;
        computed = computeAllocations(allocs, combinedSalary);
        setBudgetAllocations(computed);

        // Pre-fill allocation_amounts from budget allocations (excluding 'Spare')
        // Fetch allocation types to include classification
        const types = await getAllocationTypes();
        const typeMap = new Map(types.map((t) => [t.id, t]));

        const allocAmounts: AllocationAmount[] = computed
          .filter((a) => a.category.toLowerCase() !== 'spare')
          .map((a) => {
            // Resolve allocation type: prefer direct ID lookup, fallback to type name search
            let classification: string | undefined;
            if (a.allocation_type_id) {
              const allocType = typeMap.get(a.allocation_type_id);
              classification = allocType?.classification;
            }
            if (!classification && typeMap.size > 0) {
              for (const [, t] of typeMap) {
                if (t.name.toLowerCase() === a.category.toLowerCase()) {
                  classification = t.classification;
                  break;
                }
              }
            }
            return {
              allocation_id: a.id,
              category: a.category,
              budgeted: a.amount,
              actual: a.amount,
              allocation_type: classification,
            };
          });
        // Set allocation_amounts as default
        setValue('allocation_amounts', allocAmounts);
      }

      const periods = await getPayPeriods(20);
      setSavedPeriods(periods);

      // Fetch current month's bill payments to calculate remaining balances
      const currentMonth = new Date().toISOString().slice(0, 7);
      const existingBills = await getBillPayments(currentMonth);
      const billMap = new Map(existingBills.map((b) => [b.allocation_id, b]));

      // Always derive budgeted amounts from CURRENT config (not stale saved period values)
      // This ensures Settings changes are immediately reflected in the Calculator
      // Re-use typeMap from above if available, otherwise fetch
      let typeMap: Map<string, AllocationType>;
      try {
        const types = await getAllocationTypes();
        typeMap = new Map(types.map((t) => [t.id, t]));
      } catch {
        typeMap = new Map();
      }

      const currentAllocAmounts: AllocationAmount[] = computed
        .filter((a) => a.category.toLowerCase() !== 'spare')
        .map((a) => {
          const bill = billMap.get(a.id);
          const isPaid = bill ? bill.is_paid : false;
          const paidSoFar = bill ? Number(bill.amount ?? 0) : 0;
          const remaining = Math.max(0, a.amount - paidSoFar);

          // Resolve allocation type: prefer direct ID lookup, fallback to type name search
          let classification: string | undefined;
          if (a.allocation_type_id) {
            const allocType = typeMap.get(a.allocation_type_id);
            classification = allocType?.classification;
          }
          // Fallback: check all types for a name-based match if no direct ID link
          if (!classification && typeMap.size > 0) {
            for (const [, t] of typeMap) {
              if (t.name.toLowerCase() === a.category.toLowerCase()) {
                classification = t.classification;
                break;
              }
            }
          }

          return {
            allocation_id: a.id,
            category: a.category,
            budgeted: a.amount,
            actual: isPaid ? 0 : remaining,
            allocation_type: classification,
          };
        });

      // Track which allocations are fully paid from bill payment data
      const paidIds = new Set<string>();
      existingBills.forEach((bill) => {
        if (bill.is_paid) {
          paidIds.add(bill.allocation_id);
        }
      });
      setPaidAllocationIds(paidIds);

      if (periods.length > 0) {
        const last = periods[0];
        setSelectedPeriodId(last.id);

        reset({
          period_label: generatePeriodLabel(),
          first_wage: last.first_wage,
          second_wage: last.second_wage,
          part_time: last.part_time,
          first_wage_deduction: 0,
          second_wage_deduction: 0,
          part_time_deduction: 0,
          include_first_wage: last.first_wage > 0,
          include_second_wage: last.second_wage > 0,
          include_part_time: last.part_time > 0,
          include_wage_tax: last.tax_rate > 0,
          wage_tax_rate: last.tax_rate,
          include_pt_tax: false,
          pt_tax_rate: 0,
          // Legacy fields (zeroed for new flow)
          daily_consumable_rate: 0,
          daily_consumable_days: 0,
          monthly_utils_items: [],
          rent: 0,
          electricity: 0,
          emergency_fund: 0,
          general_savings: 0,
          allocation_amounts: currentAllocAmounts,
        });
      }
    } catch {
      // Silently fall back to defaults
    } finally {
      setIsLoadingLastPeriod(false);
    }
  }, [reset, setValue]);

  useEffect(() => {
    loadLastPeriod();
  }, [loadLastPeriod]);

  // ---------------------------------------------------------------------------
  // Load spare transactions when selected period changes
  // ---------------------------------------------------------------------------
  const loadSpareData = useCallback(async (periodId: string) => {
    setIsLoadingSpare(true);
    try {
      const [txns, total] = await Promise.all([
        getSpareTransactions(periodId),
        getSpareTotal(periodId),
      ]);
      setSpareTransactions(txns);
      setSpareTotal(total);
    } catch {
      toast.error('Failed to load spare transactions.');
    } finally {
      setIsLoadingSpare(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPeriodId) {
      loadSpareData(selectedPeriodId);
    }
  }, [selectedPeriodId, loadSpareData]);

  // Add multiple spare transactions at once
  async function handleAddRows() {
    // Filter out empty rows
    const validRows = spareRows.filter(
      (r) => r.description.trim() && !isNaN(parseFloat(r.amount)) && parseFloat(r.amount) > 0
    );
    if (validRows.length === 0) {
      toast.error('Please fill in at least one expense row.');
      return;
    }
    if (!selectedPeriodId) {
      toast.error('Please select a pay period.');
      return;
    }
    setIsAddingSpare(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        toast.error('You must be signed in.');
        return;
      }
      await Promise.all(
        validRows.map((row) =>
          createSpareTransaction(user.id, selectedPeriodId, {
            description: row.description.trim(),
            amount: parseFloat(row.amount),
            transaction_date: row.date,
          })
        )
      );
      toast.success(`${validRows.length} expense${validRows.length > 1 ? 's' : ''} added.`);
      setSpareRows([{ description: '', amount: '', date: new Date().toISOString().split('T')[0] }]);
      await loadSpareData(selectedPeriodId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add expenses.';
      toast.error(message);
    } finally {
      setIsAddingSpare(false);
    }
  }

  // Spare row helpers
  function addSpareRow() {
    setSpareRows((prev) => [
      ...prev,
      { description: '', amount: '', date: new Date().toISOString().split('T')[0] },
    ]);
  }

  function removeSpareRow(index: number) {
    setSpareRows((prev) => prev.length <= 1 ? prev : prev.filter((_, i) => i !== index));
  }

  function updateSpareRow(index: number, field: 'description' | 'amount' | 'date', value: string) {
    setSpareRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  // Delete spare transaction
  async function handleDeleteSpare(id: string) {
    try {
      await deleteSpareTransaction(id);
      toast.success('Transaction deleted.');
      if (selectedPeriodId) {
        await loadSpareData(selectedPeriodId);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete transaction.';
      toast.error(message);
    }
  }



  // Watch all fields for live calculation
  const watchedValues = watch();

  // Derive toggle states
  const includeFirstWage = watchedValues.include_first_wage ?? true;
  const includeSecondWage = watchedValues.include_second_wage ?? true;
  const includePartTime = watchedValues.include_part_time ?? true;
  const includeWageTax = watchedValues.include_wage_tax ?? true;
  const includePtTax = watchedValues.include_pt_tax ?? false;

  // Compute live calculation summary
  const calculation = useMemo(() => {
    const firstWage = includeFirstWage ? (Number(watchedValues.first_wage) || 0) : 0;
    const secondWage = includeSecondWage ? (Number(watchedValues.second_wage) || 0) : 0;
    const partTime = includePartTime ? (Number(watchedValues.part_time) || 0) : 0;

    // Compute deductions
    const fwDeduction = includeFirstWage ? (Number(watchedValues.first_wage_deduction) || 0) : 0;
    const swDeduction = includeSecondWage ? (Number(watchedValues.second_wage_deduction) || 0) : 0;
    const ptDeduction = includePartTime ? (Number(watchedValues.part_time_deduction) || 0) : 0;
    const totalDeductions = fwDeduction + swDeduction + ptDeduction;

    // Compute separate tax amounts (on gross, before deductions)
    const wageBase = firstWage + secondWage;
    const wageTaxRate = includeWageTax ? (Number(watchedValues.wage_tax_rate) || 0) : 0;
    const wageTaxAmount = wageBase * (wageTaxRate / 100);

    const ptTaxRate = includePtTax ? (Number(watchedValues.pt_tax_rate) || 0) : 0;
    const ptTaxAmount = partTime * (ptTaxRate / 100);

    const calcInput: PayPeriodInput = {
      period_label: watchedValues.period_label || '',
      first_wage: firstWage,
      second_wage: secondWage,
      part_time: partTime,
      tax_rate: 0,
      wage_tax_amount: wageTaxAmount,
      pt_tax_amount: ptTaxAmount,
      total_deductions: totalDeductions,
      // Legacy
      daily_consumable_rate: 0,
      daily_consumable_days: 0,
      monthly_utils_items: [],
      rent: 0,
      electricity: 0,
      emergency_fund: 0,
      general_savings: 0,
      // Dynamic
      allocation_amounts: (watchedValues.allocation_amounts || []).map((item) => ({
        allocation_id: item?.allocation_id || '',
        category: item?.category || '',
        budgeted: Number(item?.budgeted) || 0,
        actual: Number(item?.actual) || 0,
      })),
      // Additional income
      additional_income: additionalIncomeRows
        .filter((r) => r.label.trim() && !isNaN(parseFloat(r.amount)) && parseFloat(r.amount) > 0)
        .map((r) => ({ label: r.label.trim(), amount: parseFloat(r.amount) })),
    };
    return calculatePayPeriod(calcInput);
  }, [watchedValues, includeFirstWage, includeSecondWage, includePartTime, includeWageTax, includePtTax, additionalIncomeRows]);

  // Derived display values
  const wageTaxRate = Number(watchedValues.wage_tax_rate) || 0;
  const ptTaxRate = Number(watchedValues.pt_tax_rate) || 0;

  // ---------------------------------------------------------------------------
  // Form submission
  // ---------------------------------------------------------------------------
  async function onSubmit(data: PayPeriodFormData) {
    setIsSaving(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        toast.error('You must be signed in to save.');
        return;
      }

      // Strip form-only fields and apply toggle logic before saving
      const firstWage = data.include_first_wage ? data.first_wage : 0;
      const secondWage = data.include_second_wage ? data.second_wage : 0;
      const partTime = data.include_part_time ? data.part_time : 0;

      // Compute deductions
      const fwDed = data.include_first_wage ? (data.first_wage_deduction || 0) : 0;
      const swDed = data.include_second_wage ? (data.second_wage_deduction || 0) : 0;
      const ptDed = data.include_part_time ? (data.part_time_deduction || 0) : 0;
      const totalDeductions = fwDed + swDed + ptDed;

      // Compute separate tax amounts
      const wageBase = firstWage + secondWage;
      const wTaxRate = data.include_wage_tax ? data.wage_tax_rate : 0;
      const wageTaxAmount = wageBase * (wTaxRate / 100);
      const pTaxRate = data.include_pt_tax ? data.pt_tax_rate : 0;
      const ptTaxAmount = partTime * (pTaxRate / 100);

      const saveInput: PayPeriodInput = {
        period_label: data.period_label,
        first_wage: firstWage,
        second_wage: secondWage,
        part_time: partTime,
        tax_rate: 0,
        wage_tax_amount: wageTaxAmount,
        pt_tax_amount: ptTaxAmount,
        total_deductions: totalDeductions,
        daily_consumable_rate: 0,
        daily_consumable_days: 0,
        monthly_utils_items: [],
        rent: 0,
        electricity: 0,
        emergency_fund: 0,
        general_savings: 0,
        allocation_amounts: data.allocation_amounts || [],
        additional_income: additionalIncomeRows
          .filter((r) => r.label.trim() && !isNaN(parseFloat(r.amount)) && parseFloat(r.amount) > 0)
          .map((r) => ({ label: r.label.trim(), amount: parseFloat(r.amount) || 0 })),
      };

      await createPayPeriod(user.id, saveInput);
      toast.success('Pay period saved successfully.');

      // Sync bill payments: only mark as fully paid when actual >= budgeted
      const currentMonth = new Date().toISOString().slice(0, 7);
      const existingBills = await getBillPayments(currentMonth);
      const existingBillMap = new Map(existingBills.map((b) => [b.allocation_id, b]));

      for (const alloc of (data.allocation_amounts || [])) {
        if (alloc.actual > 0) {
          try {
            const existing = existingBillMap.get(alloc.allocation_id);
            const previousAmount = existing ? existing.amount : 0;
            const totalPaid = previousAmount + alloc.actual;
            const isFullyPaid = totalPaid >= alloc.budgeted;

            await upsertBillPayment(user.id, alloc.allocation_id, currentMonth, {
              amount: totalPaid,
              is_paid: isFullyPaid,
              paid_at: isFullyPaid ? new Date().toISOString() : null,
            });
          } catch {
            // Silently ignore bill sync errors
          }
        }
      }

      // Reset allocation_amounts for the next pay period:
      // - Fully paid categories (total paid >= budgeted): set actual to 0 (disabled)
      // - Partially paid categories: pre-fill actual with remaining balance
      // - Unpaid categories: keep actual = budgeted
      const updatedBills = await getBillPayments(currentMonth);
      const updatedBillMap = new Map(updatedBills.map((b) => [b.allocation_id, b]));

      const nextAllocAmounts: AllocationAmount[] = (data.allocation_amounts || []).map((alloc) => {
        const bill = updatedBillMap.get(alloc.allocation_id);
        const totalPaid = bill ? bill.amount : 0;
        const remaining = Math.max(0, alloc.budgeted - totalPaid);

        return {
          allocation_id: alloc.allocation_id,
          category: alloc.category,
          budgeted: alloc.budgeted,
          actual: remaining,
          allocation_type: alloc.allocation_type,
        };
      });

      // Update form for next period
      setValue('period_label', generatePeriodLabel());
      setValue('allocation_amounts', nextAllocAmounts);

      // Refresh saved periods list for spare tracker
      const updatedPeriods = await getPayPeriods(20);
      setSavedPeriods(updatedPeriods);
      if (updatedPeriods.length > 0) {
        setSelectedPeriodId(updatedPeriods[0].id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save pay period.';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  // Selected period for spare tracker
  const selectedPeriod = savedPeriods.find((p) => p.id === selectedPeriodId);
  const originalSpare = selectedPeriod?.spare_amount ?? 0;
  const remainingSpare = originalSpare - spareTotal;

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs defaultValue="calculator">
          <div className="sticky top-14 z-20 -mx-4 bg-background/80 px-4 py-3 backdrop-blur-md border-b border-border/20 mb-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="calculator">
                <Calculator className="h-4 w-4" />
                Payroll
              </TabsTrigger>
              <TabsTrigger value="spare-tracker">
                <Wallet className="h-4 w-4" />
                Spare Tracker
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ============== CALCULATOR TAB ============== */}
          <TabsContent value="calculator" className="overflow-visible">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            {/* ============================================================ */}
            {/* LEFT PANEL - Input Form                                       */}
            {/* ============================================================ */}
            <motion.div
              className="flex-1 space-y-6 lg:w-2/5"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {/* ----- Income Section ----- */}
              <SectionCard title="Income" icon={DollarSign} summary={`P ${formatPHP(calculation.totalIncome)}`}>
                <div className="space-y-4">
                  {/* First Wage - with toggle */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="include_first_wage"
                        className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary"
                        {...register('include_first_wage')}
                      />
                      <Label
                        htmlFor="include_first_wage"
                        className={cn(
                          'text-sm cursor-pointer select-none',
                          !includeFirstWage ? 'text-muted-foreground/60' : 'text-muted-foreground'
                        )}
                      >
                        First Wage
                      </Label>
                      {!includeFirstWage && (
                        <Badge variant="outline" className="ml-auto text-xs">
                          Excluded
                        </Badge>
                      )}
                    </div>
                    <Input
                      id="first_wage"
                      type="number"
                      step="0.01"
                      disabled={!includeFirstWage}
                      className={cn(
                        'h-10 tabular-nums transition-opacity duration-150',
                        !includeFirstWage && 'opacity-40 cursor-not-allowed'
                      )}
                      aria-invalid={!!errors.first_wage}
                      {...register('first_wage', { valueAsNumber: true })}
                    />
                    {includeFirstWage && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">Deduction</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0"
                          className="h-8 tabular-nums text-xs"
                          {...register('first_wage_deduction', { valueAsNumber: true })}
                        />
                      </div>
                    )}
                    {errors.first_wage?.message && (
                      <p className="text-xs text-destructive">{errors.first_wage.message}</p>
                    )}
                  </div>

                  {/* Second Wage - with toggle */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="include_second_wage"
                        className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary"
                        {...register('include_second_wage')}
                      />
                      <Label
                        htmlFor="include_second_wage"
                        className={cn(
                          'text-sm cursor-pointer select-none',
                          !includeSecondWage ? 'text-muted-foreground/60' : 'text-muted-foreground'
                        )}
                      >
                        Second Wage
                      </Label>
                      {!includeSecondWage && (
                        <Badge variant="outline" className="ml-auto text-xs">
                          Excluded
                        </Badge>
                      )}
                    </div>
                    <Input
                      id="second_wage"
                      type="number"
                      step="0.01"
                      disabled={!includeSecondWage}
                      className={cn(
                        'h-10 tabular-nums transition-opacity duration-150',
                        !includeSecondWage && 'opacity-40 cursor-not-allowed'
                      )}
                      aria-invalid={!!errors.second_wage}
                      {...register('second_wage', { valueAsNumber: true })}
                    />
                    {includeSecondWage && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">Deduction</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0"
                          className="h-8 tabular-nums text-xs"
                          {...register('second_wage_deduction', { valueAsNumber: true })}
                        />
                      </div>
                    )}
                    {errors.second_wage?.message && (
                      <p className="text-xs text-destructive">{errors.second_wage.message}</p>
                    )}
                  </div>

                  {/* Part-Time - with toggle */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="include_part_time"
                        className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary"
                        {...register('include_part_time')}
                      />
                      <Label
                        htmlFor="include_part_time"
                        className={cn(
                          'text-sm cursor-pointer select-none',
                          !includePartTime ? 'text-muted-foreground/60' : 'text-muted-foreground'
                        )}
                      >
                        Part-Time
                      </Label>
                      {!includePartTime && (
                        <Badge variant="outline" className="ml-auto text-xs">
                          Excluded
                        </Badge>
                      )}
                    </div>
                    <Input
                      id="part_time"
                      type="number"
                      step="0.01"
                      disabled={!includePartTime}
                      className={cn(
                        'h-10 tabular-nums transition-opacity duration-150',
                        !includePartTime && 'opacity-40 cursor-not-allowed'
                      )}
                      aria-invalid={!!errors.part_time}
                      {...register('part_time', { valueAsNumber: true })}
                    />
                    {includePartTime && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">Deduction</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0"
                          className="h-8 tabular-nums text-xs"
                          {...register('part_time_deduction', { valueAsNumber: true })}
                        />
                      </div>
                    )}
                    {errors.part_time?.message && (
                      <p className="text-xs text-destructive">{errors.part_time.message}</p>
                    )}
                  </div>
                </div>
              </SectionCard>

              {/* ----- Additional Income Section ----- */}
              <SectionCard
                title="Additional Income"
                icon={Plus}
                defaultOpen={additionalIncomeRows.length > 0}
                summary={additionalIncomeRows.length > 0 ? `${additionalIncomeRows.length} source${additionalIncomeRows.length !== 1 ? 's' : ''}` : undefined}
              >
                <div className="space-y-3">
                  {additionalIncomeRows.length === 0 ? (
                    <p className="text-sm text-muted-foreground/60 py-2">
                      No additional income added.
                    </p>
                  ) : (
                    additionalIncomeRows.map((row, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          type="text"
                          placeholder="Label (e.g. Freelance)"
                          value={row.label}
                          onChange={(e) =>
                            setAdditionalIncomeRows((prev) =>
                              prev.map((r, i) =>
                                i === index ? { ...r, label: e.target.value } : r
                              )
                            )
                          }
                          className="h-9 flex-1 text-sm"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={row.amount}
                          onChange={(e) =>
                            setAdditionalIncomeRows((prev) =>
                              prev.map((r, i) =>
                                i === index ? { ...r, amount: e.target.value } : r
                              )
                            )
                          }
                          className="h-9 w-28 tabular-nums text-sm"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() =>
                            setAdditionalIncomeRows((prev) =>
                              prev.filter((_, i) => i !== index)
                            )
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      setAdditionalIncomeRows((prev) => [...prev, { label: '', amount: '' }])
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Income
                  </Button>
                </div>
              </SectionCard>

              {/* ----- Tax Section ----- */}
              <SectionCard title="Tax" icon={Receipt} summary={`P ${formatPHP(calculation.totalTax)}`}>
                <div className="space-y-5">
                  {/* Wage Tax */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="include_wage_tax"
                        className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary"
                        {...register('include_wage_tax')}
                      />
                      <Label
                        htmlFor="include_wage_tax"
                        className={cn(
                          'text-sm cursor-pointer select-none font-medium',
                          !includeWageTax ? 'text-muted-foreground/60' : 'text-foreground'
                        )}
                      >
                        Wage Tax
                      </Label>
                      <span className="text-xs text-muted-foreground">(1st + 2nd Wage)</span>
                      {!includeWageTax && (
                        <Badge variant="outline" className="ml-auto text-xs">Off</Badge>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="wage_tax_rate"
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        disabled={!includeWageTax}
                        className={cn(
                          'h-9 pr-10 tabular-nums text-sm',
                          !includeWageTax && 'opacity-40 cursor-not-allowed'
                        )}
                        {...register('wage_tax_rate', { valueAsNumber: true })}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                        %
                      </span>
                    </div>
                    <p className="text-sm tabular-nums text-muted-foreground">
                      Wage Tax:{' '}
                      <span className="font-medium text-foreground">
                        P {formatPHP(calculation.wageTax)}
                      </span>
                    </p>
                  </div>

                  <Separator />

                  {/* Part-Time Tax */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="include_pt_tax"
                        className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary"
                        {...register('include_pt_tax')}
                      />
                      <Label
                        htmlFor="include_pt_tax"
                        className={cn(
                          'text-sm cursor-pointer select-none font-medium',
                          !includePtTax ? 'text-muted-foreground/60' : 'text-foreground'
                        )}
                      >
                        Part-Time Tax
                      </Label>
                      {!includePtTax && (
                        <Badge variant="outline" className="ml-auto text-xs">Off</Badge>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="pt_tax_rate"
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        disabled={!includePtTax}
                        className={cn(
                          'h-9 pr-10 tabular-nums text-sm',
                          !includePtTax && 'opacity-40 cursor-not-allowed'
                        )}
                        {...register('pt_tax_rate', { valueAsNumber: true })}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                        %
                      </span>
                    </div>
                    <p className="text-sm tabular-nums text-muted-foreground">
                      PT Tax:{' '}
                      <span className="font-medium text-foreground">
                        P {formatPHP(calculation.ptTax)}
                      </span>
                    </p>
                  </div>

                  <Separator />

                  {/* Total Tax */}
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span className="text-foreground">Total Tax</span>
                    <span className="tabular-nums text-foreground">P {formatPHP(calculation.totalTax)}</span>
                  </div>
                </div>
              </SectionCard>

              {/* ----- Budget Allocations Section ----- */}
              <SectionCard title="Budget Allocations" icon={CalendarDays} summary={`P ${formatPHP(calculation.totalAllocated)}`}>
                <div className="space-y-3">
                  {(watchedValues.allocation_amounts || []).length === 0 ? (
                    <div className="py-6 text-center">
                      <Info className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">No budget allocations found.</p>
                      <p className="text-xs text-muted-foreground">Set up allocations in Settings first.</p>
                    </div>
                  ) : (
                    <>
                      {/* Header row */}
                      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                        <span className="flex-1">Category</span>
                        <span className="w-28 text-right">Budgeted</span>
                        <span className="w-28">Actual</span>
                        <span className="w-20" />
                      </div>
                      {/* Allocation rows */}
                      {(watchedValues.allocation_amounts || []).map((item, index) => {
                        const actual = Number(item?.actual) || 0;
                        const budgeted = Number(item?.budgeted) || 0;
                        const diff = actual - budgeted;
                        const isFullyPaid = paidAllocationIds.has(item?.allocation_id || '');
                        return (
                          <div key={item?.allocation_id || index} className={cn(
                            'space-y-1.5',
                            isFullyPaid && 'opacity-50'
                          )}>
                            <div className="flex items-center gap-3">
                              <span className={cn(
                                'flex-1 text-sm font-medium capitalize truncate',
                                isFullyPaid ? 'text-muted-foreground line-through' : 'text-foreground'
                              )}>
                                {item?.category || 'Unknown'}
                              </span>
                              <span className="w-28 text-right text-sm tabular-nums text-muted-foreground">
                                P {formatPHP(budgeted)}
                              </span>
                              <div className="w-28">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  disabled={isFullyPaid}
                                  className={cn(
                                    'h-8 tabular-nums text-sm',
                                    isFullyPaid && 'opacity-40 cursor-not-allowed'
                                  )}
                                  {...register(`allocation_amounts.${index}.actual`, { valueAsNumber: true })}
                                />
                              </div>
                              {isFullyPaid ? (
                                <Badge variant="outline" className="w-20 justify-center text-xs text-emerald-500 border-emerald-500/30">
                                  Paid
                                </Badge>
                              ) : diff !== 0 ? (
                                <span className={cn(
                                  'text-xs tabular-nums font-medium w-20 text-right',
                                  diff < 0 ? 'text-emerald-500' : 'text-amber-500'
                                )}>
                                  {diff > 0 ? '+' : ''}{formatPHP(diff)}
                                </span>
                              ) : (
                                <span className="w-20" />
                              )}
                            </div>
                            {/* Quick-fill buttons */}
                            {!isFullyPaid && budgeted > 0 && (
                              <div className="flex items-center gap-1.5 pl-[calc(100%-12rem-5rem-1.5rem)]">
                                <button
                                  type="button"
                                  onClick={() => setValue(`allocation_amounts.${index}.actual`, Math.round(budgeted / 2 * 100) / 100, { shouldValidate: true })}
                                  className={cn(
                                    'px-2 py-0.5 text-[10px] font-medium rounded-full border transition-colors',
                                    actual === Math.round(budgeted / 2 * 100) / 100
                                      ? 'bg-primary/15 text-primary border-primary/30'
                                      : 'text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                                  )}
                                >
                                  Half
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setValue(`allocation_amounts.${index}.actual`, budgeted, { shouldValidate: true })}
                                  className={cn(
                                    'px-2 py-0.5 text-[10px] font-medium rounded-full border transition-colors',
                                    actual === budgeted
                                      ? 'bg-primary/15 text-primary border-primary/30'
                                      : 'text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                                  )}
                                >
                                  Full
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setValue(`allocation_amounts.${index}.actual`, 0, { shouldValidate: true })}
                                  className="px-2 py-0.5 text-[10px] font-medium rounded-full border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                >
                                  Clear
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {/* Total row */}
                      <Separator className="my-2" />
                      <div className="flex items-center gap-3 px-1">
                        <span className="flex-1 text-sm font-semibold text-foreground">Total Allocated</span>
                        <span className="text-sm font-bold tabular-nums text-foreground">
                          P {formatPHP(calculation.totalAllocated)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </SectionCard>

              {/* ----- Period Label ----- */}
              <motion.div variants={fadeIn}>
                <Card>
                  <CardContent className="pt-1">
                    <FormField
                      id="period_label"
                      label="Period Label"
                      error={errors.period_label?.message}
                    >
                      <div className="flex gap-2">
                        <select
                          className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
                          value={
                            (() => {
                              const val = watch('period_label') || '';
                              const types = ['First Wage', 'Second Wage', 'Part-Time Pay', 'Bonus'];
                              const matched = types.find((t) => val.includes(t));
                              return matched ?? 'custom';
                            })()
                          }
                          onChange={(e) => {
                            const type = e.target.value;
                            if (type === 'custom') {
                              setValue('period_label', '');
                            } else {
                              const now = new Date();
                              const month = now.toLocaleString('en-US', { month: 'long' });
                              const year = now.getFullYear();
                              const formattedDate = now.toLocaleString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                              });
                              setValue('period_label', `${month} ${year} - ${type} (${formattedDate})`);
                            }
                          }}
                        >
                          <option value="First Wage">First Wage</option>
                          <option value="Second Wage">Second Wage</option>
                          <option value="Part-Time Pay">Part-Time Pay</option>
                          <option value="Bonus">Bonus</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                      {/* Show text input only when Custom is selected */}
                      {(() => {
                        const val = watch('period_label') || '';
                        const types = ['First Wage', 'Second Wage', 'Part-Time Pay', 'Bonus'];
                        const isCustom = !types.some((t) => val.includes(t));
                        if (!isCustom) return null;
                        return (
                          <Input
                            id="period_label"
                            type="text"
                            className="h-10 mt-2"
                            placeholder="Enter custom period label"
                            aria-invalid={!!errors.period_label}
                            {...register('period_label')}
                          />
                        );
                      })()}
                      {/* Preview */}
                      <p className="text-xs text-muted-foreground mt-1.5 truncate">
                        {watch('period_label') || 'No label set'}
                      </p>
                    </FormField>
                  </CardContent>
                </Card>
              </motion.div>

              {/* ----- Save Button ----- */}
              <motion.div variants={fadeIn}>
                <Button
                  type="submit"
                  variant="default"
                  size="lg"
                  disabled={isSaving}
                  className="w-full h-12 text-sm font-medium"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Pay Period'
                  )}
                </Button>
              </motion.div>
            </motion.div>

            {/* ============================================================ */}
            {/* RIGHT PANEL - Live Calculation Summary                        */}
            {/* ============================================================ */}
            <div className="lg:sticky lg:top-32 lg:w-3/5 self-start">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle>Calculation Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {/* Column 1: Income + Tax */}
                        <div className="space-y-3">
                          {/* Income */}
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Income
                            </p>
                            <div className="space-y-1.5">
                              <SummaryRow
                                label="First Wage"
                                value={includeFirstWage ? (Number(watchedValues.first_wage) || 0) : 0}
                                muted={!includeFirstWage}
                              />
                              {includeFirstWage && (Number(watchedValues.first_wage_deduction) || 0) > 0 && (
                                <div className="flex items-center justify-between text-xs pl-3">
                                  <span className="text-muted-foreground/70">Deduction</span>
                                  <span className="tabular-nums text-rose-400">-P {formatPHP(Number(watchedValues.first_wage_deduction) || 0)}</span>
                                </div>
                              )}
                              <SummaryRow
                                label="Second Wage"
                                value={includeSecondWage ? (Number(watchedValues.second_wage) || 0) : 0}
                                muted={!includeSecondWage}
                              />
                              {includeSecondWage && (Number(watchedValues.second_wage_deduction) || 0) > 0 && (
                                <div className="flex items-center justify-between text-xs pl-3">
                                  <span className="text-muted-foreground/70">Deduction</span>
                                  <span className="tabular-nums text-rose-400">-P {formatPHP(Number(watchedValues.second_wage_deduction) || 0)}</span>
                                </div>
                              )}
                              <SummaryRow
                                label="Part-Time"
                                value={includePartTime ? (Number(watchedValues.part_time) || 0) : 0}
                                muted={!includePartTime}
                              />
                              {includePartTime && (Number(watchedValues.part_time_deduction) || 0) > 0 && (
                                <div className="flex items-center justify-between text-xs pl-3">
                                  <span className="text-muted-foreground/70">Deduction</span>
                                  <span className="tabular-nums text-rose-400">-P {formatPHP(Number(watchedValues.part_time_deduction) || 0)}</span>
                                </div>
                              )}
                              {additionalIncomeRows
                                .filter((r) => r.label.trim() && parseFloat(r.amount) > 0)
                                .map((r, idx) => (
                                  <SummaryRow key={`addl-${idx}`} label={r.label} value={parseFloat(r.amount) || 0} />
                                ))}
                              {calculation.totalDeductions > 0 && (
                                <>
                                  <Separator className="my-1" />
                                  <SummaryRow label="Total Deductions" value={calculation.totalDeductions} />
                                </>
                              )}
                              <Separator className="my-1" />
                              <SummaryRow
                                label={calculation.totalDeductions > 0 ? 'Net Income' : 'Total Income'}
                                value={calculation.netIncome}
                                bold
                              />
                            </div>
                          </div>

                          {/* Tax */}
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Tax
                            </p>
                            <div className="space-y-1.5">
                              {includeWageTax && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground flex items-center gap-1.5">
                                    Wage Tax
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{wageTaxRate}%</Badge>
                                  </span>
                                  <span className="tabular-nums text-foreground">P {formatPHP(calculation.wageTax)}</span>
                                </div>
                              )}
                              {includePtTax && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground flex items-center gap-1.5">
                                    PT Tax
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{ptTaxRate}%</Badge>
                                  </span>
                                  <span className="tabular-nums text-foreground">P {formatPHP(calculation.ptTax)}</span>
                                </div>
                              )}
                              {!includeWageTax && !includePtTax && (
                                <p className="text-sm text-muted-foreground/60 italic">No tax applied</p>
                              )}
                              <Separator className="my-1" />
                              <SummaryRow label="Total Tax" value={calculation.totalTax} bold />
                            </div>
                          </div>
                        </div>

                        {/* Column 2: Allocations */}
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Allocations
                          </p>
                          <div className="space-y-1.5">
                            {(watchedValues.allocation_amounts || []).map((item) => (
                              <SummaryRow
                                key={item?.allocation_id}
                                label={item?.category || 'Unknown'}
                                value={Number(item?.actual) || 0}
                              />
                            ))}
                            <Separator className="my-1" />
                            <SummaryRow label="Total Allocated" value={calculation.totalAllocated} bold />
                          </div>
                        </div>
                      </div>

                      {/* Spare Amount - full width below the grid */}
                      <div className="border-t-2 border-border pt-4 mt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {calculation.spareAmount >= 0 ? (
                              <TrendingUp className="h-5 w-5 text-emerald-500" />
                            ) : (
                              <TrendingDown className="h-5 w-5 text-rose-500" />
                            )}
                            <span className="text-sm font-semibold">Spare Amount</span>
                          </div>
                          <span
                            className={cn(
                              'text-lg font-bold tabular-nums font-display',
                              calculation.spareAmount >= 0 ? 'text-emerald-500' : 'text-rose-500'
                            )}
                          >
                            P {formatPHP(calculation.spareAmount)}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Use the Spare Tracker tab to log expenses from this amount
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
            </div>
          </div>
        </form>
          </TabsContent>

          {/* ============== SPARE TRACKER TAB ============== */}
          <TabsContent value="spare-tracker" className="overflow-visible">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col gap-6 lg:flex-row lg:items-start"
            >
              {/* Left: Add transaction + List */}
              <div className="flex-1 space-y-6 lg:w-3/5">
                {/* Period selector */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Wallet className="h-4 w-4 text-primary" />
                      </div>
                      <span>Track Spare Spending</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <Label htmlFor="spare-period" className="mb-1.5 text-muted-foreground">
                        Pay Period
                      </Label>
                      {/* Custom searchable dropdown */}
                      <button
                        type="button"
                        id="spare-period"
                        onClick={() => setPeriodDropdownOpen((o) => !o)}
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
                      >
                        <span className="truncate text-left">
                          {savedPeriods.length === 0
                            ? 'No saved periods'
                            : savedPeriods.find((p) => p.id === selectedPeriodId)?.period_label ?? 'Select period'}
                        </span>
                        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </button>
                      {periodDropdownOpen && (
                        <>
                          {/* Backdrop */}
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => { setPeriodDropdownOpen(false); setPeriodSearch(''); }}
                          />
                          {/* Dropdown panel */}
                          <div className="absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-hidden rounded-md border border-input bg-background shadow-lg">
                            {/* Search input */}
                            <div className="flex items-center gap-2 border-b border-input px-3 py-2">
                              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                              <input
                                type="text"
                                placeholder="Search periods..."
                                value={periodSearch}
                                onChange={(e) => setPeriodSearch(e.target.value)}
                                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                                autoFocus
                              />
                            </div>
                            {/* Options */}
                            <div className="max-h-48 overflow-y-auto p-1">
                              {savedPeriods
                                .filter((p) => p.period_label.toLowerCase().includes(periodSearch.toLowerCase()))
                                .map((p) => {
                                  const isSelected = p.id === selectedPeriodId;
                                  const date = p.created_at
                                    ? new Date(p.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                                    : '';
                                  return (
                                    <button
                                      key={p.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedPeriodId(p.id);
                                        setPeriodDropdownOpen(false);
                                        setPeriodSearch('');
                                      }}
                                      className={cn(
                                        'flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm transition-colors cursor-pointer',
                                        isSelected
                                          ? 'bg-primary/10 text-primary'
                                          : 'hover:bg-muted/60'
                                      )}
                                    >
                                      <Check className={cn('h-3.5 w-3.5 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')} />
                                      <div className="flex flex-col items-start min-w-0">
                                        <span className="truncate w-full text-left">{p.period_label}</span>
                                        <span className="text-[11px] text-muted-foreground">
                                          {date}{p.spare_amount != null ? ` · Spare: P ${formatPHP(p.spare_amount)}` : ''}
                                        </span>
                                      </div>
                                    </button>
                                  );
                                })}
                              {savedPeriods.filter((p) => p.period_label.toLowerCase().includes(periodSearch.toLowerCase())).length === 0 && (
                                <p className="px-3 py-4 text-center text-sm text-muted-foreground">No periods found</p>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <Separator />

                    {/* Add expense form - multi-row */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-foreground">Add Expenses</p>
                      <div className="space-y-2">
                        {spareRows.map((row, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-end gap-2"
                          >
                            <div className="flex-1">
                              {index === 0 && (
                                <Label className="mb-1.5 text-muted-foreground">Description</Label>
                              )}
                              <Input
                                type="text"
                                placeholder="Lunch, grab, shopping..."
                                value={row.description}
                                onChange={(e) => updateSpareRow(index, 'description', e.target.value)}
                                className="h-9"
                              />
                            </div>
                            <div className="w-24">
                              {index === 0 && (
                                <Label className="mb-1.5 text-muted-foreground">Amount</Label>
                              )}
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={row.amount}
                                onChange={(e) => updateSpareRow(index, 'amount', e.target.value)}
                                className="h-9 tabular-nums"
                              />
                            </div>
                            <div className="w-36">
                              {index === 0 && (
                                <Label className="mb-1.5 text-muted-foreground">Date</Label>
                              )}
                              <Input
                                type="date"
                                value={row.date}
                                onChange={(e) => updateSpareRow(index, 'date', e.target.value)}
                                className="h-9"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                              onClick={() => removeSpareRow(index)}
                              disabled={spareRows.length <= 1}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addSpareRow}
                        >
                          <Plus className="h-4 w-4" />
                          Add Row
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddRows}
                          disabled={isAddingSpare || !selectedPeriodId}
                        >
                          {isAddingSpare ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            `Save ${spareRows.filter((r) => r.description.trim() && r.amount).length || ''} Expense${spareRows.filter((r) => r.description.trim() && r.amount).length !== 1 ? 's' : ''}`
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Transaction list */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                        <CalendarDays className="h-4 w-4 text-amber-500" />
                      </div>
                      <span>Transactions</span>
                      {spareTransactions.length > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                          {spareTransactions.length}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingSpare ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
                        ))}
                      </div>
                    ) : spareTransactions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <Wallet className="h-8 w-8 text-muted-foreground/40 mb-3" />
                        <p className="text-sm text-muted-foreground">
                          No spare transactions yet
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          Add an expense above to start tracking
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {spareTransactions.map((txn) => (
                          <motion.div
                            key={txn.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3 transition-colors hover:bg-muted/30"
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-medium">{txn.description}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(txn.transaction_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold tabular-nums font-display text-rose-500">
                                -P {formatPHP(txn.amount)}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteSpare(txn.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right: Summary */}
              <div className="lg:sticky lg:top-32 lg:w-2/5 self-start">
                  <Card>
                    <CardHeader>
                      <CardTitle>Spare Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Pay Period</span>
                          <span className="font-medium text-xs text-right max-w-[200px] truncate">
                            {selectedPeriod?.period_label ?? 'None selected'}
                          </span>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Original Spare</span>
                          <span className="tabular-nums font-display font-medium">
                            P {formatPHP(originalSpare)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Total Spent</span>
                          <span className="tabular-nums font-display font-medium text-rose-500">
                            -P {formatPHP(spareTotal)}
                          </span>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {remainingSpare >= 0 ? (
                              <TrendingUp className="h-5 w-5 text-emerald-500" />
                            ) : (
                              <TrendingDown className="h-5 w-5 text-rose-500" />
                            )}
                            <span className="text-sm font-semibold">Remaining</span>
                          </div>
                          <span
                            className={cn(
                              'text-lg font-bold tabular-nums font-display',
                              remainingSpare >= 0 ? 'text-emerald-500' : 'text-rose-500'
                            )}
                          >
                            P {formatPHP(remainingSpare)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary Row Component
// ---------------------------------------------------------------------------
function SummaryRow({
  label,
  value,
  bold = false,
  muted = false,
}: {
  label: string;
  value: number;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <div className={cn('flex items-center justify-between text-sm', muted && 'opacity-40')}>
      <span
        className={cn(
          bold ? 'font-semibold text-foreground' : 'text-muted-foreground'
        )}
      >
        {label}
        {muted && (
          <span className="ml-1.5 text-xs italic font-normal">(off)</span>
        )}
      </span>
      <span
        className={cn(
          'tabular-nums font-display',
          bold && 'font-semibold'
        )}
      >
        P {formatPHP(value)}
      </span>
    </div>
  );
}
