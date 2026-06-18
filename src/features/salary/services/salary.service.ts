import { createClient } from '@/lib/supabase/client';
import type {
  SalaryConfig,
  BudgetAllocation,
  AllocationType,
  AllocationClassification,
  PayPeriod,
  PayPeriodInput,
  CalculationResult,
  SpareTransaction,
  BillPayment,
  FinancialSummary,
} from '../types/salary.types';
import { calculatePayPeriod } from '../utils/calculations';

const supabase = createClient();

// ============================================
// SALARY CONFIG
// ============================================

export async function getSalaryConfig(): Promise<SalaryConfig | null> {
  const { data, error } = await supabase
    .from('salary_configs')
    .select('*')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows found
    throw error;
  }
  return data;
}

export async function updateSalaryConfig(
  id: string,
  updates: Partial<Pick<SalaryConfig, 'name' | 'full_time_salary' | 'part_time_salary' | 'pay_frequency'>>
): Promise<SalaryConfig> {
  const { data, error } = await supabase
    .from('salary_configs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// BUDGET ALLOCATIONS
// ============================================

export async function getBudgetAllocations(
  salaryConfigId: string
): Promise<BudgetAllocation[]> {
  const { data, error } = await supabase
    .from('budget_allocations')
    .select('*')
    .eq('salary_config_id', salaryConfigId)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createBudgetAllocation(
  salaryConfigId: string,
  allocation: {
    category: string;
    percentage: number;
    description?: string | null;
    icon_name?: string | null;
    color?: string | null;
    display_order?: number;
    allocation_type_id?: string | null;
    is_fixed?: boolean;
  }
): Promise<BudgetAllocation> {
  const { data, error } = await supabase
    .from('budget_allocations')
    .insert({
      salary_config_id: salaryConfigId,
      category: allocation.category,
      percentage: allocation.percentage,
      description: allocation.description ?? null,
      icon_name: allocation.icon_name ?? null,
      color: allocation.color ?? null,
      display_order: allocation.display_order ?? 99,
      allocation_type_id: allocation.allocation_type_id ?? null,
      is_fixed: allocation.is_fixed ?? false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBudgetAllocation(id: string): Promise<void> {
  const { error } = await supabase
    .from('budget_allocations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function updateBudgetAllocation(
  id: string,
  updates: Partial<Pick<BudgetAllocation, 'percentage' | 'description' | 'category' | 'icon_name' | 'color' | 'is_fixed'>>
): Promise<BudgetAllocation> {
  const { data, error } = await supabase
    .from('budget_allocations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMultipleAllocations(
  allocations: {
    id: string;
    percentage: number;
    category?: string;
    description?: string | null;
    icon_name?: string | null;
    color?: string | null;
    allocation_type_id?: string | null;
    is_fixed?: boolean;
  }[]
): Promise<void> {
  const promises = allocations.map(({ id, percentage, category, description, icon_name, color, allocation_type_id, is_fixed }) => {
    const updates: Record<string, unknown> = { percentage };
    if (category !== undefined) updates.category = category;
    if (description !== undefined) updates.description = description;
    if (icon_name !== undefined) updates.icon_name = icon_name;
    if (color !== undefined) updates.color = color;
    if (allocation_type_id !== undefined) updates.allocation_type_id = allocation_type_id;
    if (is_fixed !== undefined) updates.is_fixed = is_fixed;

    return supabase
      .from('budget_allocations')
      .update(updates)
      .eq('id', id);
  });

  const results = await Promise.all(promises);
  const errors = results.filter((r) => r.error);
  if (errors.length > 0) {
    throw errors[0].error;
  }
}

// ============================================
// ALLOCATION TYPES
// ============================================

export async function getAllocationTypes(): Promise<AllocationType[]> {
  const { data, error } = await supabase
    .from('allocation_types')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createAllocationType(
  userId: string,
  type: {
    name: string;
    classification: AllocationClassification;
    color?: string | null;
    display_order?: number;
  }
): Promise<AllocationType> {
  const { data, error } = await supabase
    .from('allocation_types')
    .insert({
      user_id: userId,
      name: type.name,
      classification: type.classification,
      color: type.color ?? null,
      display_order: type.display_order ?? 99,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAllocationType(
  id: string,
  updates: Partial<Pick<AllocationType, 'name' | 'classification' | 'color' | 'display_order'>>
): Promise<AllocationType> {
  const { data, error } = await supabase
    .from('allocation_types')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAllocationType(id: string): Promise<void> {
  const { error } = await supabase
    .from('allocation_types')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Seed default allocation types if user has none
export async function seedDefaultAllocationTypes(userId: string): Promise<AllocationType[]> {
  const existing = await getAllocationTypes();
  if (existing.length > 0) return existing;

  const defaults: { name: string; classification: AllocationClassification; color: string; display_order: number }[] = [
    { name: 'Expense', classification: 'expense', color: 'hsl(346, 77%, 50%)', display_order: 0 },
    { name: 'Utility', classification: 'expense', color: 'hsl(38, 92%, 50%)', display_order: 1 },
    { name: 'Savings', classification: 'asset', color: 'hsl(160, 84%, 39%)', display_order: 2 },
    { name: 'Emergency', classification: 'asset', color: 'hsl(270, 76%, 55%)', display_order: 3 },
  ];

  const results: AllocationType[] = [];
  for (const d of defaults) {
    const created = await createAllocationType(userId, d);
    results.push(created);
  }
  return results;
}

// ============================================
// PAY PERIODS
// ============================================

export async function getPayPeriods(limit = 20): Promise<PayPeriod[]> {
  const { data, error } = await supabase
    .from('pay_periods')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getPayPeriod(id: string): Promise<PayPeriod | null> {
  const { data, error } = await supabase
    .from('pay_periods')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function createPayPeriod(
  userId: string,
  input: PayPeriodInput
): Promise<PayPeriod> {
  const calc: CalculationResult = calculatePayPeriod(input);

  // Strip calculation-only fields that don't exist as DB columns
  const { wage_tax_amount, pt_tax_amount, ...dbFields } = input;

  const { data, error } = await supabase
    .from('pay_periods')
    .insert({
      user_id: userId,
      ...dbFields,
      total_income: calc.totalIncome,
      total_tax: calc.totalTax,
      total_deductions: calc.totalDeductions,
      total_expenses: calc.totalExpenses,
      total_savings: calc.totalSavings,
      spare_amount: calc.spareAmount,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePayPeriod(
  id: string,
  input: PayPeriodInput
): Promise<PayPeriod> {
  const calc: CalculationResult = calculatePayPeriod(input);

  // Strip calculation-only fields that don't exist as DB columns
  const { wage_tax_amount, pt_tax_amount, ...dbFields } = input;

  const { data, error } = await supabase
    .from('pay_periods')
    .update({
      ...dbFields,
      total_income: calc.totalIncome,
      total_tax: calc.totalTax,
      total_deductions: calc.totalDeductions,
      total_expenses: calc.totalExpenses,
      total_savings: calc.totalSavings,
      spare_amount: calc.spareAmount,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePayPeriod(id: string): Promise<void> {
  const { error } = await supabase
    .from('pay_periods')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================
// SPARE TRANSACTIONS
// ============================================

export async function getSpareTransactions(
  payPeriodId: string
): Promise<SpareTransaction[]> {
  const { data, error } = await supabase
    .from('spare_transactions')
    .select('*')
    .eq('pay_period_id', payPeriodId)
    .order('transaction_date', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getSpareTransactionsByUser(
  limit = 50
): Promise<SpareTransaction[]> {
  const { data, error } = await supabase
    .from('spare_transactions')
    .select('*')
    .order('transaction_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function createSpareTransaction(
  userId: string,
  payPeriodId: string,
  transaction: {
    description: string;
    amount: number;
    transaction_date?: string;
  }
): Promise<SpareTransaction> {
  const { data, error } = await supabase
    .from('spare_transactions')
    .insert({
      user_id: userId,
      pay_period_id: payPeriodId,
      description: transaction.description,
      amount: transaction.amount,
      transaction_date: transaction.transaction_date ?? new Date().toISOString().split('T')[0],
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSpareTransaction(id: string): Promise<void> {
  const { error } = await supabase
    .from('spare_transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getSpareTotal(payPeriodId: string): Promise<number> {
  const { data, error } = await supabase
    .from('spare_transactions')
    .select('amount')
    .eq('pay_period_id', payPeriodId);

  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
}

// ============================================
// BILL PAYMENTS
// ============================================

export async function getBillPayments(month: string): Promise<BillPayment[]> {
  const { data, error } = await supabase
    .from('bill_payments')
    .select('*')
    .eq('month', month)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getUnpaidBills(month: string): Promise<BillPayment[]> {
  const { data, error } = await supabase
    .from('bill_payments')
    .select('*')
    .eq('month', month)
    .eq('is_paid', false)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function upsertBillPayment(
  userId: string,
  allocationId: string,
  month: string,
  data: { amount: number; is_paid: boolean; paid_at?: string | null; notes?: string | null }
): Promise<BillPayment> {
  const { data: result, error } = await supabase
    .from('bill_payments')
    .upsert(
      {
        user_id: userId,
        allocation_id: allocationId,
        month,
        amount: data.amount,
        is_paid: data.is_paid,
        paid_at: data.is_paid ? (data.paid_at ?? new Date().toISOString()) : null,
        notes: data.notes ?? null,
      },
      { onConflict: 'user_id,allocation_id,month' }
    )
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function deleteBillPaymentsByMonth(month: string): Promise<void> {
  const { error } = await supabase
    .from('bill_payments')
    .delete()
    .eq('month', month);

  if (error) throw error;
}

export async function initMonthlyBills(
  userId: string,
  month: string,
  allocations: { id: string; amount: number }[]
): Promise<BillPayment[]> {
  // Check existing bills for this month
  const existing = await getBillPayments(month);
  const existingIds = new Set(existing.map((b) => b.allocation_id));

  // Only create entries for allocations that don't already have a bill this month
  const newBills = allocations
    .filter((a) => !existingIds.has(a.id))
    .map((a) => ({
      user_id: userId,
      allocation_id: a.id,
      month,
      amount: 0, // amount = cumulative paid, starts at 0
      is_paid: false,
    }));

  if (newBills.length === 0) return existing;

  const { data, error } = await supabase
    .from('bill_payments')
    .insert(newBills)
    .select();

  if (error) throw error;
  return [...existing, ...(data ?? [])];
}

// ============================================
// FINANCIAL SUMMARY
// ============================================

export async function getFinancialSummary(opts?: { dateFrom?: string; dateTo?: string }): Promise<FinancialSummary> {
  let query = supabase
    .from('pay_periods')
    .select('id, total_income, total_tax, total_deductions, total_expenses, total_savings, allocation_amounts, first_wage, second_wage, part_time, additional_income, spare_amount')
    .order('created_at', { ascending: false });

  if (opts?.dateFrom) query = query.gte('created_at', opts.dateFrom);
  if (opts?.dateTo) query = query.lte('created_at', opts.dateTo);

  const { data, error } = await query;

  if (error) throw error;

  const periods = data ?? [];
  const grossIncome = periods.reduce((s, p) => s + Number(p.total_income ?? 0), 0);
  const totalTax = periods.reduce((s, p) => s + Number(p.total_tax ?? 0), 0);
  const totalDeductions = periods.reduce((s, p) => s + Number(p.total_deductions ?? 0), 0);
  const netIncome = grossIncome - totalTax - totalDeductions;

  // Wage breakdowns for dashboard cards
  const fullTimeSalary = periods.reduce((s, p) => s + Number(p.first_wage ?? 0) + Number(p.second_wage ?? 0), 0);
  const partTimeSalary = periods.reduce((s, p) => s + Number(p.part_time ?? 0), 0);
  const additionalIncomeTotal = periods.reduce((s, p) => {
    const items = (p.additional_income ?? []) as { amount: number }[];
    return s + items.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
  }, 0);
  const totalExpensesSum = periods.reduce((s, p) => s + Number(p.total_expenses ?? 0), 0);
  const totalSpare = periods.reduce((s, p) => s + Number(p.spare_amount ?? 0), 0);

  // Fetch spare transactions for ALL periods in range to compute total spent
  let totalSpareSpent = 0;
  const periodIds = periods.map((p) => p.id).filter(Boolean);
  if (periodIds.length > 0) {
    const { data: spareData, error: spareError } = await supabase
      .from('spare_transactions')
      .select('amount')
      .in('pay_period_id', periodIds);

    if (!spareError && spareData) {
      totalSpareSpent = spareData.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
    }
  }

  // Compute totalAssets and monthlyExpenses from allocation_amounts with type info
  let totalAssets = 0;
  let monthlyExpenses = 0;

  for (const period of periods) {
    const allocAmounts = (period.allocation_amounts ?? []) as { actual?: number; allocation_type?: string }[];
    let periodAssets = 0;
    let periodExpenses = 0;
    let hasTypeData = false;

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
      totalAssets += periodAssets;
      // Monthly expenses = only the latest period's expenses
      if (period === periods[0]) {
        monthlyExpenses = periodExpenses;
      }
    } else {
      // Fallback: use legacy columns
      totalAssets += Number(period.total_savings ?? 0);
      if (period === periods[0]) {
        monthlyExpenses = Number(period.total_expenses ?? 0);
      }
    }
  }

  return {
    grossIncome,
    netIncome,
    totalAssets,
    monthlyExpenses,
    periodCount: periods.length,
    fullTimeSalary,
    partTimeSalary,
    additionalIncomeTotal,
    totalTax,
    totalExpensesSum,
    totalSpare,
    totalSpareSpent,
  };
}

export async function getPayPeriodTrend(limit = 6, opts?: { dateFrom?: string; dateTo?: string }): Promise<{
  label: string;
  income: number;
  expenses: number;
  savings: number;
}[]> {
  // Build query with date filters applied BEFORE limit to ensure we get
  // the most recent N periods within the date range, not the oldest N globally.
  let query = supabase
    .from('pay_periods')
    .select('period_label, total_income, total_expenses, total_savings');

  // Apply date filters first so the limit applies to the filtered set
  if (opts?.dateFrom) query = query.gte('created_at', opts.dateFrom);
  if (opts?.dateTo) query = query.lte('created_at', opts.dateTo);

  // Order descending and limit to get the N most recent in range
  query = query.order('created_at', { ascending: false }).limit(limit);

  const { data, error } = await query;

  if (error) throw error;

  // Reverse to chronological order (ascending) for chart display
  return (data ?? []).reverse().map((p) => ({
    label: p.period_label?.split(' - ')[0] ?? '',
    income: Number(p.total_income ?? 0),
    expenses: Number(p.total_expenses ?? 0),
    savings: Number(p.total_savings ?? 0),
  }));
}

export async function getLatestPeriodInRange(opts?: { dateFrom?: string; dateTo?: string }): Promise<PayPeriod | null> {
  let query = supabase
    .from('pay_periods')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (opts?.dateFrom) query = query.gte('created_at', opts.dateFrom);
  if (opts?.dateTo) query = query.lte('created_at', opts.dateTo);

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

// ============================================
// AUTH HELPERS
// ============================================

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
