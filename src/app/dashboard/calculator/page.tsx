'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
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
  Lock,
  ShoppingCart,
} from 'lucide-react';
import {
  Tooltip as UITooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
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
  getSpareTransactionsInRange,
  getSpareTransactionsByUser,
  createSpareTransaction,
  deleteSpareTransaction,
  getSpareTotal,
  getFinancialSummary,
  getBudgetAllocations,
  getSalaryConfig,
  upsertBillPayment,
  getBillPayments,
  getAllocationTypes,
  getConsumableExpenses,
  getConsumableExpensesByUser,
  createConsumableExpense,
  deleteConsumableExpense,
  recalculateBillPaymentsForMonth,
} from '@/features/salary/services/salary.service';
import type { PayPeriodInput, PayPeriod, SpareTransaction, AllocationAmount, BudgetAllocationWithAmount, SalaryConfig, AllocationType, PayFrequency, ConsumableExpense } from '@/features/salary/types/salary.types';
import { PayslipScanner, type PayslipData } from '@/components/ui/payslip-scanner';
import { MonthYearPicker } from '@/components/ui/month-year-picker';

import { CalculatorCharts } from '@/features/salary/components/calculator/calculator-charts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

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
  tooltip,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  summary?: string;
  defaultOpen?: boolean;
  tooltip?: string;
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
              <span className="flex-1 flex items-center gap-2">
                {title}
                {tooltip && (
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger className="flex">
                        <Info className="h-3 w-3 text-muted-foreground/50 cursor-help shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[220px] text-[10px] leading-relaxed">
                        {tooltip}
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                )}
              </span>
              {!isOpen && summary && (
                <span className="text-xs font-normal text-muted-foreground truncate max-w-[50%] hidden sm:inline">
                  {summary}
                </span>
              )}
            </CardTitle>
          <div className="absolute right-6 top-6">
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
          </div>
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingLastPeriod, setIsLoadingLastPeriod] = useState(true);

  // Spare tracker state
  const [savedPeriods, setSavedPeriods] = useState<PayPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
  const [periodSearch, setPeriodSearch] = useState('');
  const [spareTransactions, setSpareTransactions] = useState<SpareTransaction[]>([]);
  const [spareTotal, setSpareTotal] = useState(0);
  const [startingBalance, setStartingBalance] = useLocalStorage('calculator_input_startingBalance', 0);
  const [monthSpareAdded, setMonthSpareAdded] = useLocalStorage('calculator_input_monthSpareAdded', 0);
  const [isLoadingSpare, setIsLoadingSpare] = useState(false);
  const [isAddingSpare, setIsAddingSpare] = useState(false);
  const [spareRows, setSpareRows] = useLocalStorage<{ description: string; amount: string; date: string }[]>('calculator_input_spareRows', [
    { description: '', amount: '', date: new Date().toISOString().split('T')[0] },
  ]);
  const [budgetAllocations, setBudgetAllocations] = useState<BudgetAllocationWithAmount[]>([]);
  const [salaryConfig, setSalaryConfig] = useState<SalaryConfig | null>(null);
  // Track which allocations are truly paid (remaining balance = 0 from bill payments)
  const [paidAllocationIds, setPaidAllocationIds] = useState<Set<string>>(new Set());
  // Additional income rows
  const [additionalIncomeRows, setAdditionalIncomeRows] = useLocalStorage<{ label: string; amount: string }[]>('calculator_input_additionalIncomeRows', []);
  const [payFrequency, setPayFrequency] = useState<PayFrequency>('semi-monthly');

  // Consumable expenses state
  const [consumableExpenses, setConsumableExpenses] = useState<ConsumableExpense[]>([]);
  const [consumableAllowance, setConsumableAllowance] = useLocalStorage('calculator_input_consumableAllowance', 4500);
  const [isLoadingConsumable, setIsLoadingConsumable] = useState(false);
  const [isAddingConsumable, setIsAddingConsumable] = useState(false);
  const [consumableRows, setConsumableRows] = useLocalStorage<{ description: string; amount: string; date: string }[]>('calculator_input_consumableRows', [
    { description: '', amount: '', date: new Date().toISOString().split('T')[0] },
  ]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Autocomplete suggestions
  const [consumableSuggestions, setConsumableSuggestions] = useState<{ description: string; amount: number }[]>([]);
  const [spareSuggestions, setSpareSuggestions] = useState<{ description: string; amount: number }[]>([]);

  const defaultValues: PayPeriodFormData = {
    period_label: generatePeriodLabel(new Date(), payFrequency),
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
    wage_tax_mode: 'percentage',
    wage_tax_rate: 0,
    wage_tax_amount: 0,
    include_pt_tax: false,
    pt_tax_mode: 'percentage',
    pt_tax_rate: 0,
    pt_tax_amount: 0,
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
    payroll_date: new Date().toISOString().split('T')[0],
  };

  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<PayPeriodFormData>({
    resolver: zodResolver(payPeriodSchema) as Resolver<PayPeriodFormData>,
    defaultValues,
    mode: 'onChange',
  });

  // ---------------------------------------------------------------------------
  // Load autocomplete suggestions for consumable expenses and spare transactions
  // ---------------------------------------------------------------------------
  const loadAutocompleteSuggestions = useCallback(async () => {
    try {
      const [consumableData, spareData] = await Promise.all([
        getConsumableExpensesByUser(100),
        getSpareTransactionsByUser(100),
      ]);

      // Deduplicate consumable suggestions (keep the most recent one's amount)
      const consMap = new Map<string, number>();
      const consSeen = new Set<string>();
      for (const row of consumableData) {
        const desc = row.description.trim();
        const descLower = desc.toLowerCase();
        if (!consSeen.has(descLower)) {
          consSeen.add(descLower);
          consMap.set(desc, Number(row.amount));
        }
      }
      setConsumableSuggestions(
        Array.from(consMap.entries()).map(([description, amount]) => ({ description, amount }))
      );

      // Deduplicate spare suggestions (keep the most recent one's amount)
      const spareMap = new Map<string, number>();
      const spareSeen = new Set<string>();
      for (const row of spareData) {
        const desc = row.description.trim();
        const descLower = desc.toLowerCase();
        if (!spareSeen.has(descLower)) {
          spareSeen.add(descLower);
          spareMap.set(desc, Number(row.amount));
        }
      }
      setSpareSuggestions(
        Array.from(spareMap.entries()).map(([description, amount]) => ({ description, amount }))
      );
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    loadAutocompleteSuggestions();
  }, [loadAutocompleteSuggestions]);

  // ---------------------------------------------------------------------------
  // Sync Payroll Date input when currentMonth changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const pd = getValues('payroll_date');
    if (pd && !pd.startsWith(currentMonth)) {
      // Create a date using the selected month, defaulting to the 1st day to ensure
      // it saves inside the correct month bucket.
      setValue('payroll_date', `${currentMonth}-01`, { shouldValidate: true });
    }
  }, [currentMonth, getValues, setValue]);

  // ---------------------------------------------------------------------------
  // Load last saved pay period on mount to pre-fill the form
  // ---------------------------------------------------------------------------
  const loadLastPeriod = useCallback(async () => {
    try {
      // Stage 1: Fetch independent configuration and lists in parallel
      const [config, expenses, types, periods, existingBills] = await Promise.all([
        getSalaryConfig().catch(() => null),
        getConsumableExpenses(currentMonth).catch(() => []),
        getAllocationTypes().catch(() => []),
        getPayPeriods(20).catch(() => []),
        getBillPayments(currentMonth).catch(() => []),
      ]);

      setSavedPeriods(periods);

      let computed: BudgetAllocationWithAmount[] = [];
      const typeMap = new Map(types.map((t) => [t.id, t]));

      if (config) {
        setSalaryConfig(config);
        setPayFrequency(config.pay_frequency ?? 'semi-monthly');
        setConsumableAllowance(config.consumable_allowance ?? 4500);
        setConsumableExpenses(expenses);

        // Stage 2: Fetch budget allocations using the loaded config ID
        const allocs = await getBudgetAllocations(config.id).catch(() => []);
        const combinedSalary = config.full_time_salary + config.part_time_salary;
        computed = computeAllocations(allocs, combinedSalary);
        setBudgetAllocations(computed);

        // Pre-fill allocation_amounts from budget allocations (excluding 'Spare')
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
              is_fixed: a.is_fixed,
            };
          });
        // Set allocation_amounts as default
        setValue('allocation_amounts', allocAmounts);
      }

      const billMap = new Map(existingBills.map((b) => [b.allocation_id, b]));

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
          period_label: generatePeriodLabel(new Date(), payFrequency),
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
  }, [reset, setValue, currentMonth]);

  useEffect(() => {
    loadLastPeriod();
  }, [loadLastPeriod]);

  // ---------------------------------------------------------------------------
  // AI Scanner Handler
  // ---------------------------------------------------------------------------
  const handlePayslipData = useCallback((data: PayslipData) => {
    if (data.gross_pay && data.gross_pay > 0) {
      setValue('first_wage', data.gross_pay, { shouldValidate: true });
      setValue('include_first_wage', true);
    }
    
    // Convert specific deductions into Budget Allocations
    const currentAllocations = getValues('allocation_amounts') || [];
    let updatedAllocations = [...currentAllocations];
    
    const upsertAllocation = (category: string, amountRaw: number | string) => {
      const amount = parseFloat(String(amountRaw));
      if (isNaN(amount) || amount <= 0) return;
      
      const existingIdx = updatedAllocations.findIndex(a => 
        a.category.toLowerCase() === category.toLowerCase()
      );
      
      if (existingIdx >= 0) {
        // Update existing allocation's 'actual' amount
        updatedAllocations[existingIdx] = {
          ...updatedAllocations[existingIdx],
          actual: amount,
          budgeted: updatedAllocations[existingIdx].budgeted || amount
        };
      } else {
        // Create a new allocation for this deduction
        updatedAllocations.push({
          allocation_id: `temp-${Date.now()}-${Math.random()}`,
          category,
          budgeted: amount,
          actual: amount,
          allocation_type: 'expense',
          is_fixed: true
        });
      }
    };

    upsertAllocation('SSS', data.sss || 0);
    upsertAllocation('Pag-IBIG', data.pag_ibig || 0);
    upsertAllocation('PhilHealth', data.philhealth || 0);
    
    if (data.loans && data.loans > 0) {
      upsertAllocation('Loans', data.loans);
    }
    
    // Set updated allocations back to the form
    setValue('allocation_amounts', updatedAllocations, { shouldValidate: true });
    
    // Leave the generic total deduction as 0, as the user requested
    setValue('first_wage_deduction', 0, { shouldValidate: true });

    // Taxes
    const taxVal = parseFloat(String(data.tax_withheld || 0));
    const grossVal = parseFloat(String(data.gross_pay || 0));
    if (!isNaN(taxVal) && taxVal > 0 && !isNaN(grossVal) && grossVal > 0) {
      const taxRate = (taxVal / grossVal) * 100;
      setValue('include_wage_tax', true);
      setValue('wage_tax_mode', 'fixed');
      setValue('wage_tax_amount', taxVal);
      setValue('wage_tax_rate', parseFloat(taxRate.toFixed(2)), { shouldValidate: true });
    }
  }, [setValue, getValues]);

  // ---------------------------------------------------------------------------
  // Load spare transactions based on the selected month (date-based wallet)
  // ---------------------------------------------------------------------------
  const loadSpareData = useCallback(async (monthStr: string) => {
    setIsLoadingSpare(true);
    try {
      const year = monthStr.split('-')[0];
      const month = monthStr.split('-')[1];
      const dateFrom = `${year}-${month}-01`;
      const lastDay = new Date(Number(year), Number(month), 0).getDate();
      const dateTo = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

      // Get starting balance (up to day before dateFrom)
      const dFrom = new Date(dateFrom);
      dFrom.setDate(dFrom.getDate() - 1);
      const prevDateTo = dFrom.toISOString().split('T')[0];

      const [txns, monthSummary, startingSummary] = await Promise.all([
        getSpareTransactionsInRange({ dateFrom, dateTo }),
        getFinancialSummary({ dateFrom, dateTo }),
        getFinancialSummary({ dateTo: prevDateTo }),
      ]);

      setSpareTransactions(txns);
      
      const startingSpareAmount = (startingSummary?.totalSpare ?? 0) + (startingSummary?.giftedIncome ?? 0);
      const startingBal = startingSpareAmount 
        - (startingSummary?.totalSpareSpent ?? 0) 
        - (startingSummary?.totalConsumableSpent ?? 0) 
        - (startingSummary?.totalBorrowingExpensesSpent ?? 0);
      
      setStartingBalance(startingBal);
      setMonthSpareAdded(monthSummary?.totalSpare ?? 0);
      setSpareTotal(txns.reduce((sum, t) => sum + Number(t.amount || 0), 0));
    } catch {
      toast.error('Failed to load spare transactions.');
    } finally {
      setIsLoadingSpare(false);
    }
  }, []);

  useEffect(() => {
    loadSpareData(currentMonth);
  }, [currentMonth, loadSpareData]);

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
    
    const latestPeriod = savedPeriods[0];
    if (!latestPeriod) {
      toast.error('Please create at least one pay period in Payroll first.');
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
          createSpareTransaction(user.id, latestPeriod.id, {
            description: row.description.trim(),
            amount: parseFloat(row.amount),
            transaction_date: row.date,
          })
        )
      );
      toast.success(`${validRows.length} expense${validRows.length > 1 ? 's' : ''} added.`);
      setSpareRows([{ description: '', amount: '', date: new Date().toISOString().split('T')[0] }]);
      await loadSpareData(currentMonth);
      await loadAutocompleteSuggestions();
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
      prev.map((row, i) => {
        if (i === index) {
          const updatedRow = { ...row, [field]: value };
          if (field === 'description') {
            const match = spareSuggestions.find(
              (s) => s.description.toLowerCase() === value.trim().toLowerCase()
            );
            if (match) {
              updatedRow.amount = String(match.amount);
            }
          }
          return updatedRow;
        }
        return row;
      })
    );
  }

  // Delete spare transaction
  async function handleDeleteSpare(id: string) {
    try {
      await deleteSpareTransaction(id);
      toast.success('Transaction deleted.');
      await loadSpareData(currentMonth);
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
    const wageTaxMode = watchedValues.wage_tax_mode || 'percentage';
    let wageTaxAmount = 0;
    if (includeWageTax) {
      if (wageTaxMode === 'fixed') {
        wageTaxAmount = Number(watchedValues.wage_tax_amount) || 0;
      } else {
        const rate = Number(watchedValues.wage_tax_rate) || 0;
        wageTaxAmount = wageBase * (rate / 100);
      }
    }

    const ptTaxMode = watchedValues.pt_tax_mode || 'percentage';
    let ptTaxAmount = 0;
    if (includePtTax) {
      if (ptTaxMode === 'fixed') {
        ptTaxAmount = Number(watchedValues.pt_tax_amount) || 0;
      } else {
        const rate = Number(watchedValues.pt_tax_rate) || 0;
        ptTaxAmount = partTime * (rate / 100);
      }
    }

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

  const consumableSummaryObject = useMemo(() => {
    const totalSpent = consumableExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    return {
      allowance: consumableAllowance,
      totalSpent,
      remaining: consumableAllowance - totalSpent,
      isOverBudget: totalSpent > consumableAllowance,
      expenses: consumableExpenses,
    };
  }, [consumableAllowance, consumableExpenses]);

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
      let wageTaxAmount = 0;
      if (data.include_wage_tax) {
        if (data.wage_tax_mode === 'fixed') {
          wageTaxAmount = data.wage_tax_amount || 0;
        } else {
          wageTaxAmount = wageBase * ((data.wage_tax_rate || 0) / 100);
        }
      }

      let ptTaxAmount = 0;
      if (data.include_pt_tax) {
        if (data.pt_tax_mode === 'fixed') {
          ptTaxAmount = data.pt_tax_amount || 0;
        } else {
          ptTaxAmount = partTime * ((data.pt_tax_rate || 0) / 100);
        }
      }

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
        created_at: data.payroll_date ? new Date(data.payroll_date).toISOString() : undefined,
      };

      await createPayPeriod(user.id, saveInput);
      toast.success('Pay period saved successfully.');

      // Sync bill payments: recalculate monthly totals based on all pay periods in this month
      try {
        await recalculateBillPaymentsForMonth(user.id, currentMonth);
      } catch {
        // Silently ignore bill sync errors
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
          is_fixed: alloc.is_fixed,
        };
      });

      // Update form for next period
      const nextDate = data.payroll_date ? new Date(data.payroll_date) : new Date();
      setValue('period_label', generatePeriodLabel(nextDate, payFrequency));
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
  // Selected period for spare tracker (Fallback for database saving)
  const selectedPeriod = savedPeriods.find((p) => p.id === selectedPeriodId);
  const remainingSpare = startingBalance + monthSpareAdded - spareTotal;

  // Period label options based on pay frequency
  const periodLabelOptions = (() => {
    switch (payFrequency) {
      case 'monthly':
        return [
          { value: 'Monthly Pay', label: 'Monthly Pay' },
          { value: 'Part-Time Pay', label: 'Part-Time Pay' },
          { value: 'Bonus', label: 'Bonus' },
          { value: 'custom', label: 'Custom' },
        ];
      case 'bi-weekly':
        return [
          { value: 'Pay Period', label: 'Pay Period' },
          { value: 'Part-Time Pay', label: 'Part-Time Pay' },
          { value: 'Bonus', label: 'Bonus' },
          { value: 'custom', label: 'Custom' },
        ];
      case 'weekly':
        return [
          { value: 'Weekly Pay', label: 'Weekly Pay' },
          { value: 'Part-Time Pay', label: 'Part-Time Pay' },
          { value: 'Bonus', label: 'Bonus' },
          { value: 'custom', label: 'Custom' },
        ];
      case 'semi-monthly':
      default:
        return [
          { value: 'First Wage', label: 'First Wage' },
          { value: 'Second Wage', label: 'Second Wage' },
          { value: 'Part-Time Pay', label: 'Part-Time Pay' },
          { value: 'Bonus', label: 'Bonus' },
          { value: 'custom', label: 'Custom' },
        ];
    }
  })();

  const [cYear, cMonthStr] = currentMonth.split('-');
  const pickerValue = { year: Number(cYear), month: Number(cMonthStr) - 1 };

  const handleMonthChange = (val: { month: number; year: number } | null) => {
    if (val) {
      setCurrentMonth(`${val.year}-${String(val.month + 1).padStart(2, '0')}`);
    }
  };

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs defaultValue="calculator">
          <div className="sticky top-14 z-20 -mx-4 bg-background/80 px-4 py-3 backdrop-blur-md border-b border-border/20 mb-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 flex justify-between items-center gap-4">
            <TabsList className="flex items-center justify-start overflow-x-auto flex-nowrap p-1 gap-1 h-11 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:inline-flex sm:w-fit">
              <TabsTrigger value="calculator" className="flex-1 sm:flex-initial h-9 gap-1 sm:gap-2 px-2.5 sm:px-5 text-xs sm:text-sm shrink-0 whitespace-nowrap">
                <Calculator className="h-4 w-4" />
                <span className="tab-label-reveal">Payroll</span>
              </TabsTrigger>
              <TabsTrigger value="spare-tracker" className="flex-1 sm:flex-initial h-9 gap-1 sm:gap-2 px-2.5 sm:px-5 text-xs sm:text-sm shrink-0 whitespace-nowrap">
                <Wallet className="h-4 w-4" />
                <span className="tab-label-reveal">Spare Tracker</span>
              </TabsTrigger>
              <TabsTrigger value="consumable" className="flex-1 sm:flex-initial h-9 gap-1 sm:gap-2 px-2.5 sm:px-5 text-xs sm:text-sm shrink-0 whitespace-nowrap">
                <ShoppingCart className="h-4 w-4" />
                <span className="tab-label-reveal">Consumable</span>
              </TabsTrigger>
            </TabsList>
            
            <div className="shrink-0 hidden sm:flex items-center gap-2">
              <MonthYearPicker value={pickerValue} onChange={handleMonthChange} />
              <PayslipScanner onDataExtracted={handlePayslipData} />
            </div>
          </div>
          
          <div className="mb-4 sm:hidden flex justify-end gap-2">
             <MonthYearPicker value={pickerValue} onChange={handleMonthChange} />
             <PayslipScanner onDataExtracted={handlePayslipData} />
          </div>

          {/* Live Charts Overview */}
          <div className="mb-8">
            <CalculatorCharts
              calculationResult={calculation}
              consumableSummary={consumableSummaryObject}
              isMobile={isMobile}
            />
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
              <SectionCard tooltip="Total income from all sources before deductions" title="Income" icon={DollarSign} summary={`P ${formatPHP(calculation.totalIncome)}`}>
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
                        {payFrequency === 'monthly' ? 'Salary' : payFrequency === 'bi-weekly' ? 'Pay Amount' : payFrequency === 'weekly' ? 'Weekly Pay' : 'First Wage'}
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

                  {/* Second Wage - with toggle (only for semi-monthly) */}
                  {payFrequency === 'semi-monthly' && (
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
                  )}

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
              <SectionCard tooltip="Tax calculation based on current rates" title="Tax" icon={Receipt} summary={`P ${formatPHP(calculation.totalTax)}`}>
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
                      <div className="flex bg-muted/50 rounded-md p-1 ml-auto shrink-0 border border-border/50">
                        <button
                          type="button"
                          onClick={() => setValue('wage_tax_mode', 'percentage', { shouldValidate: true })}
                          disabled={!includeWageTax}
                          className={cn(
                            "px-2.5 py-0.5 rounded text-[10px] font-semibold transition-all",
                            watchedValues.wage_tax_mode !== 'fixed' && includeWageTax
                              ? "bg-background shadow-sm text-foreground"
                              : "text-muted-foreground hover:text-foreground",
                            !includeWageTax && "opacity-40 cursor-not-allowed"
                          )}
                        >
                          %
                        </button>
                        <button
                          type="button"
                          onClick={() => setValue('wage_tax_mode', 'fixed', { shouldValidate: true })}
                          disabled={!includeWageTax}
                          className={cn(
                            "px-2.5 py-0.5 rounded text-[10px] font-semibold transition-all",
                            watchedValues.wage_tax_mode === 'fixed' && includeWageTax
                              ? "bg-background shadow-sm text-foreground"
                              : "text-muted-foreground hover:text-foreground",
                            !includeWageTax && "opacity-40 cursor-not-allowed"
                          )}
                        >
                          ₱
                        </button>
                      </div>
                      {!includeWageTax && (
                        <Badge variant="outline" className="ml-2 text-xs">Off</Badge>
                      )}
                    </div>
                    <div className="relative">
                      {watchedValues.wage_tax_mode === 'fixed' ? (
                        <>
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                            ₱
                          </span>
                          <Input
                            id="wage_tax_amount"
                            type="number"
                            step="0.01"
                            min="0"
                            disabled={!includeWageTax}
                            className={cn(
                              'h-9 pl-8 tabular-nums text-sm',
                              !includeWageTax && 'opacity-40 cursor-not-allowed'
                            )}
                            {...register('wage_tax_amount', { valueAsNumber: true })}
                          />
                        </>
                      ) : (
                        <>
                          <Input
                            id="wage_tax_rate"
                            type="number"
                            step="1"
                            min="0"
                            max="100"
                            disabled={!includeWageTax}
                            className={cn(
                              'h-9 pr-8 tabular-nums text-sm',
                              !includeWageTax && 'opacity-40 cursor-not-allowed'
                            )}
                            {...register('wage_tax_rate', { valueAsNumber: true })}
                          />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                            %
                          </span>
                        </>
                      )}
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
                      <div className="flex bg-muted/50 rounded-md p-1 ml-auto shrink-0 border border-border/50">
                        <button
                          type="button"
                          onClick={() => setValue('pt_tax_mode', 'percentage', { shouldValidate: true })}
                          disabled={!includePtTax}
                          className={cn(
                            "px-2.5 py-0.5 rounded text-[10px] font-semibold transition-all",
                            watchedValues.pt_tax_mode !== 'fixed' && includePtTax
                              ? "bg-background shadow-sm text-foreground"
                              : "text-muted-foreground hover:text-foreground",
                            !includePtTax && "opacity-40 cursor-not-allowed"
                          )}
                        >
                          %
                        </button>
                        <button
                          type="button"
                          onClick={() => setValue('pt_tax_mode', 'fixed', { shouldValidate: true })}
                          disabled={!includePtTax}
                          className={cn(
                            "px-2.5 py-0.5 rounded text-[10px] font-semibold transition-all",
                            watchedValues.pt_tax_mode === 'fixed' && includePtTax
                              ? "bg-background shadow-sm text-foreground"
                              : "text-muted-foreground hover:text-foreground",
                            !includePtTax && "opacity-40 cursor-not-allowed"
                          )}
                        >
                          ₱
                        </button>
                      </div>
                      {!includePtTax && (
                        <Badge variant="outline" className="ml-2 text-xs">Off</Badge>
                      )}
                    </div>
                    <div className="relative">
                      {watchedValues.pt_tax_mode === 'fixed' ? (
                        <>
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                            ₱
                          </span>
                          <Input
                            id="pt_tax_amount"
                            type="number"
                            step="0.01"
                            min="0"
                            disabled={!includePtTax}
                            className={cn(
                              'h-9 pl-8 tabular-nums text-sm',
                              !includePtTax && 'opacity-40 cursor-not-allowed'
                            )}
                            {...register('pt_tax_amount', { valueAsNumber: true })}
                          />
                        </>
                      ) : (
                        <>
                          <Input
                            id="pt_tax_rate"
                            type="number"
                            step="1"
                            min="0"
                            max="100"
                            disabled={!includePtTax}
                            className={cn(
                              'h-9 pr-8 tabular-nums text-sm',
                              !includePtTax && 'opacity-40 cursor-not-allowed'
                            )}
                            {...register('pt_tax_rate', { valueAsNumber: true })}
                          />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                            %
                          </span>
                        </>
                      )}
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
              <SectionCard tooltip="Planned budget distribution for expenses and savings" title="Budget Allocations" icon={CalendarDays} summary={`P ${formatPHP(calculation.totalAllocated)}`}>
                <div className="space-y-3">
                  {(watchedValues.allocation_amounts || []).length === 0 ? (
                    <div className="py-6 text-center">
                      <Info className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">No budget allocations found.</p>
                      <p className="text-xs text-muted-foreground">Set up allocations in Settings first.</p>
                    </div>
                  ) : (
                    <>
                      {/* Header row - hidden on mobile */}
                      <div className="hidden sm:flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
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
                        const isFixed = item?.is_fixed ?? false;
                        return (
                          <div key={item?.allocation_id || index} className={cn(
                            'space-y-1.5',
                            isFullyPaid && 'opacity-50'
                          )}>
                            {/* Desktop layout */}
                            <div className="hidden sm:flex items-center gap-3">
                              <span className={cn(
                                'flex items-center gap-1.5 flex-1 text-sm font-medium capitalize truncate',
                                isFullyPaid ? 'text-muted-foreground line-through' : 'text-foreground'
                              )}>
                                {item?.category || 'Unknown'}
                                {isFixed && (
                                  <Lock className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                                )}
                              </span>
                              <span className="w-28 text-right text-sm tabular-nums text-muted-foreground">
                                P {formatPHP(budgeted)}
                              </span>
                              <div className="w-28">
                                <AllocationInput
                                  disabled={isFullyPaid}
                                  className={cn(
                                    'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm tabular-nums transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30',
                                    isFullyPaid && 'opacity-40 cursor-not-allowed'
                                  )}
                                  value={actual}
                                  onChange={(val) => setValue(`allocation_amounts.${index}.actual`, val, { shouldValidate: true })}
                                />
                              </div>
                              {isFullyPaid ? (
                                <Badge variant="outline" className="w-20 justify-center text-xs text-emerald-500 border-emerald-500/30">
                                  Paid
                                </Badge>
                              ) : isFixed ? (
                                <Badge variant="outline" className="w-20 justify-center text-xs text-muted-foreground border-border/30 bg-muted/10">
                                  Fixed
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
                            {/* Mobile layout */}
                            <div className="sm:hidden space-y-2">
                              <div className="flex items-center justify-between">
                                <span className={cn(
                                  'flex items-center gap-1.5 text-sm font-medium capitalize',
                                  isFullyPaid ? 'text-muted-foreground line-through' : 'text-foreground'
                                )}>
                                  {item?.category || 'Unknown'}
                                  {isFixed && (
                                    <Lock className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                                  )}
                                </span>
                                {isFullyPaid ? (
                                  <Badge variant="outline" className="text-xs text-emerald-500 border-emerald-500/30">
                                    Paid
                                  </Badge>
                                ) : isFixed ? (
                                  <Badge variant="outline" className="text-xs text-muted-foreground border-border/30 bg-muted/10">
                                    Fixed
                                  </Badge>
                                ) : diff !== 0 ? (
                                  <span className={cn(
                                    'text-xs tabular-nums font-medium',
                                    diff < 0 ? 'text-emerald-500' : 'text-amber-500'
                                  )}>
                                    {diff > 0 ? '+' : ''}{formatPHP(diff)}
                                  </span>
                                ) : null}
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-[11px] text-muted-foreground">Budgeted</span>
                                  <p className="text-sm tabular-nums text-muted-foreground">P {formatPHP(budgeted)}</p>
                                </div>
                                <div>
                                  <span className="text-[11px] text-muted-foreground">Actual</span>
                                  <AllocationInput
                                    disabled={isFullyPaid}
                                    className={cn(
                                      'h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm tabular-nums transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30',
                                      isFullyPaid && 'opacity-40 cursor-not-allowed'
                                    )}
                                    value={actual}
                                    onChange={(val) => setValue(`allocation_amounts.${index}.actual`, val, { shouldValidate: true })}
                                  />
                                </div>
                              </div>
                            </div>
                            {/* Quick-fill buttons */}
                            {!isFullyPaid && budgeted > 0 && (
                              <div className="flex items-center gap-1.5 sm:pl-[calc(100%-12rem-5rem-1.5rem)]">
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

              {/* ----- Payroll Date & Period Label ----- */}
              <motion.div variants={fadeIn}>
                <Card>
                  <CardContent className="pt-3 pb-3 space-y-4">
                    <FormField
                      id="payroll_date"
                      label="Payroll Date"
                      error={errors.payroll_date?.message}
                    >
                      <Input
                        id="payroll_date"
                        type="date"
                        className="h-10 text-sm"
                        aria-invalid={!!errors.payroll_date}
                        {...register('payroll_date')}
                      />
                    </FormField>

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
                              const types = periodLabelOptions.filter((o) => o.value !== 'custom').map((o) => o.value);
                              const matched = types.find((t) => val.includes(t));
                              return matched ?? 'custom';
                            })()
                          }
                          onChange={(e) => {
                            const type = e.target.value;
                            if (type === 'custom') {
                              setValue('period_label', '');
                            } else {
                              const pDateStr = watch('payroll_date');
                              const d = pDateStr ? new Date(pDateStr) : new Date();
                              const month = d.toLocaleString('en-US', { month: 'long' });
                              const year = d.getFullYear();
                              const formattedDate = d.toLocaleString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                              });
                              setValue('period_label', `${month} ${year} - ${type} (${formattedDate})`);
                            }
                          }}
                        >
                          {periodLabelOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      {/* Show text input only when Custom is selected */}
                      {(() => {
                        const val = watch('period_label') || '';
                        const types = periodLabelOptions.filter((o) => o.value !== 'custom').map((o) => o.value);
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
              <motion.div variants={fadeIn} data-onboarding="calculator-save">
                <ConfirmDialog
                  trigger={
                    <Button
                      type="button"
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
                  }
                  title="Save Pay Period?"
                  description="This will create a new pay period record with the current values. Make sure all amounts are correct before saving."
                  confirmLabel="Save"
                  destructive={false}
                  onConfirm={() => handleSubmit(onSubmit)()}
                  disabled={isSaving}
                />
              </motion.div>
            </motion.div>

            {/* ============================================================ */}
            {/* RIGHT PANEL - Live Calculation Summary                        */}
            {/* ============================================================ */}
            <div className="w-full lg:sticky lg:top-32 lg:w-3/5 lg:self-start">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2">Calculation Summary <TooltipProvider><UITooltip><TooltipTrigger className="flex"><Info className="h-3 w-3 text-muted-foreground/50 cursor-help shrink-0" /></TooltipTrigger><TooltipContent side="top">A breakdown of income, taxes, deductions, and allocations.</TooltipContent></UITooltip></TooltipProvider></CardTitle>
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
                                label={payFrequency === 'monthly' ? 'Salary' : payFrequency === 'bi-weekly' ? 'Pay Amount' : payFrequency === 'weekly' ? 'Weekly Pay' : 'First Wage'}
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
                                label={payFrequency === 'semi-monthly' ? 'Second Wage' : 'Second Wage'}
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
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Tracking Month:</span>
                      <span className="font-semibold text-foreground">
                        {new Date(currentMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>
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
                          >
                            {/* Desktop: single row | Mobile: stacked grid */}
                            <div className="flex flex-col gap-2 sm:grid sm:grid-cols-[1fr_100px_140px_36px] sm:items-end">
                              <div className="w-full">
                                {index === 0 && (
                                  <Label className="mb-1.5 text-muted-foreground">Description</Label>
                                )}
                                <Input
                                  type="text"
                                  placeholder="Lunch, grab, shopping..."
                                  value={row.description}
                                  onChange={(e) => updateSpareRow(index, 'description', e.target.value)}
                                  className="h-10 sm:h-9 text-base sm:text-sm"
                                  list="spare-suggestions"
                                />
                              </div>
                              <div className="grid grid-cols-[1fr_1.2fr_40px] gap-2 items-end sm:contents">
                                <div>
                                  {index === 0 && (
                                    <Label className="mb-1.5 text-xs text-muted-foreground block">Amount</Label>
                                  )}
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={row.amount}
                                    onChange={(e) => updateSpareRow(index, 'amount', e.target.value)}
                                    className="h-10 tabular-nums sm:h-9 text-base sm:text-sm"
                                  />
                                </div>
                                <div>
                                  {index === 0 && (
                                    <Label className="mb-1.5 text-xs text-muted-foreground block">Date</Label>
                                  )}
                                  <Input
                                    type="date"
                                    value={row.date}
                                    onChange={(e) => updateSpareRow(index, 'date', e.target.value)}
                                    className="h-10 sm:h-9 text-base sm:text-sm"
                                  />
                                </div>
                                <div className="flex items-center justify-center">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive sm:h-9 sm:w-9"
                                    onClick={() => removeSpareRow(index)}
                                    disabled={spareRows.length <= 1}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                            {/* Separator between rows on mobile */}
                            {index < spareRows.length - 1 && (
                              <Separator className="mt-3 sm:hidden" />
                            )}
                          </motion.div>
                        ))}
                        <datalist id="spare-suggestions">
                          {spareSuggestions.map((s) => (
                            <option key={s.description} value={s.description}>
                              P {formatPHP(s.amount)}
                            </option>
                          ))}
                        </datalist>
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
                          disabled={isAddingSpare || savedPeriods.length === 0}
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
                              <span className={cn(
                                "text-sm font-semibold tabular-nums font-display",
                                txn.amount < 0 ? "text-emerald-500" : "text-rose-500"
                              )}>
                                {txn.amount < 0 ? `+P ${formatPHP(Math.abs(txn.amount))}` : `-P ${formatPHP(txn.amount)}`}
                              </span>
                              <ConfirmDialog
                                trigger={
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                }
                                title="Delete Transaction"
                                description={`Are you sure you want to delete "${txn.description}" (P ${formatPHP(Math.abs(txn.amount))})? This action cannot be undone.`}
                                confirmLabel="Delete"
                                onConfirm={() => handleDeleteSpare(txn.id)}
                              />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right: Summary */}
              <div className="w-full lg:sticky lg:top-32 lg:w-2/5 lg:self-start">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        Wallet Summary
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger className="flex">
                              <Info className="h-3 w-3 text-muted-foreground/50 cursor-help shrink-0" />
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              Running wallet balance for the selected month.
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Starting Wallet (Liquid Cash)</span>
                          <span className="tabular-nums font-display font-medium">
                            P {formatPHP(startingBalance)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">New Spare Added</span>
                          <span className="tabular-nums font-display font-medium text-emerald-500">
                            +P {formatPHP(monthSpareAdded)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Spent this Month</span>
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
                            <span className="text-sm font-semibold">Remaining Wallet</span>
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

          {/* ============== CONSUMABLE EXPENSES TAB ============== */}
          <TabsContent value="consumable" className="overflow-visible">
            <motion.div
              className="mx-auto max-w-3xl space-y-6"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Budget Overview Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                      <ShoppingCart className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">Consumable Budget <TooltipProvider><UITooltip><TooltipTrigger className="flex"><Info className="h-3 w-3 text-muted-foreground/50 cursor-help shrink-0" /></TooltipTrigger><TooltipContent side="top">Daily trackable budget based on your set allowance.</TooltipContent></UITooltip></TooltipProvider></CardTitle>
                      <CardDescription>
                        {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })} - Track daily expenses against your monthly allowance
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Budget Progress */}
                  {(() => {
                    const totalSpent = consumableExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
                    const remaining = consumableAllowance - totalSpent;
                    const percentage = consumableAllowance > 0 ? Math.min((totalSpent / consumableAllowance) * 100, 100) : 0;
                    const isOver = totalSpent > consumableAllowance;
                    return (
                      <>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="rounded-lg bg-muted/50 p-3 text-center">
                            <p className="text-[11px] text-muted-foreground">Budget</p>
                            <p className="text-sm font-bold tabular-nums text-foreground">PHP {formatPHP(consumableAllowance)}</p>
                          </div>
                          <div className="rounded-lg bg-amber-500/10 p-3 text-center">
                            <p className="text-[11px] text-muted-foreground">Spent</p>
                            <p className="text-sm font-bold tabular-nums text-amber-500">PHP {formatPHP(totalSpent)}</p>
                          </div>
                          <div className={cn('rounded-lg p-3 text-center', isOver ? 'bg-rose-500/10' : 'bg-emerald-500/10')}>
                            <p className="text-[11px] text-muted-foreground">{isOver ? 'Over Budget' : 'Remaining'}</p>
                            <p className={cn('text-sm font-bold tabular-nums', isOver ? 'text-rose-500' : 'text-emerald-500')}>
                              {isOver ? '-' : ''}PHP {formatPHP(Math.abs(remaining))}
                            </p>
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>{percentage.toFixed(0)}% used</span>
                            <span>{consumableExpenses.length} expense{consumableExpenses.length !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <motion.div
                              className={cn(
                                'h-full rounded-full transition-colors duration-300',
                                percentage >= 100 ? 'bg-rose-500' : percentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                              )}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(percentage, 100)}%` }}
                              transition={{ duration: 0.6, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Add Expense Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Add Daily Expense</CardTitle>
                  <CardDescription>Log your daily consumable spending</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {consumableRows.map((row, idx) => (
                    <div key={idx} className="flex flex-col gap-2 sm:grid sm:grid-cols-[1fr_140px_100px_36px] sm:items-end">
                      {/* Description */}
                      <div className="w-full">
                        {idx === 0 && (
                          <Label htmlFor={`cons-desc-${idx}`} className="mb-1.5 text-xs text-muted-foreground">Description</Label>
                        )}
                        <Input
                          id={`cons-desc-${idx}`}
                          placeholder="e.g. Lunch, Water, Snacks"
                          value={row.description}
                          onChange={(e) => {
                            const value = e.target.value;
                            const updated = [...consumableRows];
                            const match = consumableSuggestions.find(
                              (s) => s.description.toLowerCase() === value.trim().toLowerCase()
                            );
                            updated[idx] = {
                              ...updated[idx],
                              description: value,
                              amount: match ? String(match.amount) : updated[idx].amount
                            };
                            setConsumableRows(updated);
                          }}
                          className="h-9 text-base sm:text-sm"
                          list="consumable-suggestions"
                        />
                      </div>
                      {/* Date, Amount, Trash */}
                      <div className="grid grid-cols-[1.2fr_1fr_40px] gap-2 items-end sm:contents">
                        <div>
                          {idx === 0 && (
                            <Label htmlFor={`cons-date-${idx}`} className="mb-1.5 text-xs text-muted-foreground block">Date</Label>
                          )}
                          <Input
                            id={`cons-date-${idx}`}
                            type="date"
                            value={row.date}
                            onChange={(e) => {
                              const updated = [...consumableRows];
                              updated[idx] = { ...updated[idx], date: e.target.value };
                              setConsumableRows(updated);
                            }}
                            className="h-9 text-base sm:text-sm"
                          />
                        </div>
                        <div>
                          {idx === 0 && (
                            <Label htmlFor={`cons-amt-${idx}`} className="mb-1.5 text-xs text-muted-foreground block">Amount</Label>
                          )}
                          <Input
                            id={`cons-amt-${idx}`}
                            type="number"
                            placeholder="0"
                            step="0.01"
                            min="0"
                            value={row.amount}
                            onChange={(e) => {
                              const updated = [...consumableRows];
                              updated[idx] = { ...updated[idx], amount: e.target.value };
                              setConsumableRows(updated);
                            }}
                            className="h-9 text-base sm:text-sm tabular-nums"
                          />
                        </div>
                        <div className="flex items-center justify-center">
                          {consumableRows.length > 1 ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                              onClick={() => setConsumableRows(consumableRows.filter((_, i) => i !== idx))}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <div className="w-9 h-9" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <datalist id="consumable-suggestions">
                    {consumableSuggestions.map((s) => (
                      <option key={s.description} value={s.description}>
                        P {formatPHP(s.amount)}
                      </option>
                    ))}
                  </datalist>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => setConsumableRows([...consumableRows, { description: '', amount: '', date: new Date().toISOString().split('T')[0] }])}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Row
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="gap-1.5 text-xs ml-auto"
                      disabled={isAddingConsumable || consumableRows.every((r) => !r.description || !r.amount)}
                      onClick={async () => {
                        const validRows = consumableRows.filter((r) => r.description.trim() && Number(r.amount) > 0);
                        if (validRows.length === 0) {
                          toast.error('Add at least one expense with description and amount.');
                          return;
                        }
                        setIsAddingConsumable(true);
                        try {
                          const user = await getCurrentUser();
                          if (!user) throw new Error('Not authenticated');
                          for (const row of validRows) {
                            await createConsumableExpense(user.id, {
                              description: row.description.trim(),
                              amount: Number(row.amount),
                              expense_date: row.date,
                            });
                          }
                          toast.success(`${validRows.length} expense${validRows.length > 1 ? 's' : ''} added.`);
                          // Refresh
                          const expenses = await getConsumableExpenses(currentMonth);
                          setConsumableExpenses(expenses);
                          setConsumableRows([{ description: '', amount: '', date: new Date().toISOString().split('T')[0] }]);
                          await loadAutocompleteSuggestions();
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Failed to add expense.');
                        } finally {
                          setIsAddingConsumable(false);
                        }
                      }}
                    >
                      {isAddingConsumable ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                      Save Expense{consumableRows.filter(r => r.description.trim() && Number(r.amount) > 0).length > 1 ? 's' : ''}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Expense History */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">This Month's Expenses</CardTitle>
                    <Badge variant="secondary" className="text-[10px]">
                      {consumableExpenses.length} entries
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingConsumable ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : consumableExpenses.length > 0 ? (
                    <div className="flex flex-col gap-1 max-h-96 overflow-y-auto pr-1 scrollbar-thin">
                      {consumableExpenses.map((expense) => (
                        <div
                          key={expense.id}
                          className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors duration-150 group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 w-14">
                              {new Date(expense.expense_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                            </span>
                            <span className="text-sm text-foreground truncate">{expense.description}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-semibold tabular-nums text-amber-500">
                              -PHP {formatPHP(Number(expense.amount))}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                              onClick={async () => {
                                try {
                                  await deleteConsumableExpense(expense.id);
                                  setConsumableExpenses((prev) => prev.filter((e) => e.id !== expense.id));
                                  toast.success('Expense deleted.');
                                } catch (err) {
                                  toast.error(err instanceof Error ? err.message : 'Failed to delete.');
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <ShoppingCart className="h-8 w-8 text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">No expenses recorded this month</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Add your first daily expense above</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper for Allocation Input to prevent React Hook Form re-render locking
// ---------------------------------------------------------------------------
function AllocationInput({
  value,
  onChange,
  disabled,
  className
}: {
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [localVal, setLocalVal] = useState<string>(value?.toString() || '0');

  // Sync external changes (e.g. Full/Clear buttons) but don't interrupt typing
  useEffect(() => {
    const parsed = parseFloat(localVal);
    const isLocalEmptyOrNaN = localVal === '' || Number.isNaN(parsed);
    
    // If the external value is 0 and we are typing (empty or invalid), don't overwrite
    if (value === 0 && isLocalEmptyOrNaN) {
      return;
    }
    
    // Otherwise if it genuinely changed externally, sync it
    if (parsed !== value) {
      setLocalVal(value?.toString() || '0');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setLocalVal(newVal);
    
    const parsed = parseFloat(newVal);
    if (!Number.isNaN(parsed)) {
      onChange(parsed);
    } else if (newVal === '') {
      onChange(0);
    }
  };

  return (
    <input
      type="number"
      step="0.01"
      min="0"
      disabled={disabled}
      className={className}
      value={localVal}
      onChange={handleChange}
      onBlur={() => {
        // Clean up dangling dots or empty states on blur
        const parsed = parseFloat(localVal);
        if (Number.isNaN(parsed)) {
          setLocalVal('0');
          onChange(0);
        } else {
          setLocalVal(parsed.toString());
        }
      }}
    />
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
