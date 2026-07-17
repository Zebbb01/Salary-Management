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
  Borrowing,
  BorrowingType,
  BorrowingSummary,
  ConsumableExpense,
  ConsumableBudgetSummary,
  ConsumableMonthlyRecord,
  BorrowingExpense,
  AllocationExpense,
  HeldFund,
  AllocationFundSummary,
  AllocationExpenseWithCategory,
} from '../types/salary.types';
import { calculatePayPeriod } from '../utils/calculations';

const supabase = createClient();

function formatToISODate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  const trimmed = dateStr.trim();
  
  // If it's already YYYY-MM-DD, return it
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  
  // If it is MM/DD/YYYY
  const mdPart = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdPart) {
    const [, m, d, y] = mdPart;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  
  // If it is DD-MM-YYYY
  const dmPart = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmPart) {
    const [, d, m, y] = dmPart;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Fallback to JS Date parsing
  try {
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  } catch {
    // Ignore
  }

  return trimmed;
}

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
  updates: Partial<Pick<SalaryConfig, 'name' | 'full_time_salary' | 'part_time_salary' | 'pay_frequency' | 'consumable_allowance'>>
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

async function adjustSavingsForPeriods<
  T extends {
    id: string;
    created_at?: string;
    total_savings?: number | null;
    allocation_amounts?: any;
  }
>(periods: T[]): Promise<T[]> {
  if (periods.length === 0) return [];
  const supabase = createClient();

  // 1. Fetch allocations and types to map classification
  const [allocationsRes, typesRes] = await Promise.all([
    supabase.from('budget_allocations').select('id, allocation_type_id'),
    supabase.from('allocation_types').select('id, classification')
  ]);

  const allocationClassificationMap = new Map<string, string>();
  if (allocationsRes.data && typesRes.data) {
    const typeMap = new Map(typesRes.data.map((t) => [t.id, t.classification]));
    for (const alloc of allocationsRes.data) {
      if (alloc.allocation_type_id) {
        const classification = typeMap.get(alloc.allocation_type_id);
        if (classification) {
          allocationClassificationMap.set(alloc.id, classification);
        }
      }
    }
  }

  // 2. Fetch all allocation expenses
  const { data: aeData } = await supabase
    .from('allocation_expenses')
    .select('amount, allocation_id, held_fund_id, borrowing_id, expense_date');

  // Sort periods chronologically to determine boundaries
  const sortedPeriods = [...periods].sort((a, b) => 
    new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
  );

  const spentAssetsByPeriod = new Map<string, number>();
  const spentAssetsByAllocAndPeriod = new Map<string, Map<string, number>>();

  if (aeData && aeData.length > 0 && sortedPeriods.length > 0) {
    for (const exp of aeData) {
      const expTime = new Date(exp.expense_date).getTime();
      
      let matchedPeriodId: string | null = null;
      for (let i = 0; i < sortedPeriods.length; i++) {
        const pStart = new Date(sortedPeriods[i].created_at!).getTime();
        const pEnd = i + 1 < sortedPeriods.length ? new Date(sortedPeriods[i + 1].created_at!).getTime() : Infinity;
        
        if (expTime >= pStart && expTime < pEnd) {
          matchedPeriodId = sortedPeriods[i].id;
          break;
        }
      }
      
      if (!matchedPeriodId && sortedPeriods.length > 0) {
        matchedPeriodId = sortedPeriods[0].id;
      }
      
      if (matchedPeriodId) {
        const isAsset = allocationClassificationMap.get(exp.allocation_id) === 'asset';
        if (isAsset) {
          if (exp.held_fund_id && !exp.borrowing_id) {
            continue; // Skip paid by held fund
          }
          const amt = Number(exp.amount ?? 0);
          
          spentAssetsByPeriod.set(
            matchedPeriodId,
            (spentAssetsByPeriod.get(matchedPeriodId) ?? 0) + amt
          );
          
          const allocMap = spentAssetsByAllocAndPeriod.get(matchedPeriodId) ?? new Map<string, number>();
          allocMap.set(
            exp.allocation_id,
            (allocMap.get(exp.allocation_id) ?? 0) + amt
          );
          spentAssetsByAllocAndPeriod.set(matchedPeriodId, allocMap);
        }
      }
    }
  }

  return periods.map((p) => {
    const spentSavings = spentAssetsByPeriod.get(p.id) ?? 0;
    const newTotalSavings = Math.max(0, Number(p.total_savings ?? 0) - spentSavings);
    
    const allocAmounts = (p.allocation_amounts ?? []) as any[];
    const updatedAllocAmounts = allocAmounts.map((item) => {
      const allocId = item.allocation_id;
      if (allocId && item.allocation_type === 'asset') {
        const allocSpent = spentAssetsByAllocAndPeriod.get(p.id)?.get(allocId) ?? 0;
        return {
          ...item,
          actual: Math.max(0, Number(item.actual ?? 0) - allocSpent)
        };
      }
      return item;
    });
    
    return {
      ...p,
      total_savings: newTotalSavings,
      allocation_amounts: updatedAllocAmounts
    };
  });
}

export async function getPayPeriods(limit = 20): Promise<PayPeriod[]> {
  const { data, error } = await supabase
    .from('pay_periods')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  const periods = data ?? [];
  return adjustSavingsForPeriods(periods);
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
  const { wage_tax_amount, pt_tax_amount, created_at, ...dbFields } = input;

  const insertData: any = {
    user_id: userId,
    ...dbFields,
    total_income: calc.totalIncome,
    total_tax: calc.totalTax,
    total_deductions: calc.totalDeductions,
    total_expenses: calc.totalExpenses,
    total_savings: calc.totalSavings,
    spare_amount: calc.spareAmount,
  };

  if (created_at) {
    insertData.created_at = created_at;
  }

  const { data, error } = await supabase
    .from('pay_periods')
    .insert(insertData)
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
    transfer_link_id?: string;
  }
): Promise<SpareTransaction> {
  const { data, error } = await supabase
    .from('spare_transactions')
    .insert({
      user_id: userId,
      pay_period_id: payPeriodId,
      description: transaction.description,
      amount: transaction.amount,
      transaction_date: formatToISODate(transaction.transaction_date ?? new Date().toISOString().split('T')[0]),
      transfer_link_id: transaction.transfer_link_id ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSpareTransaction(id: string): Promise<void> {
  const supabase = createClient();

  // Fetch first to check for transfer link
  const { data: txn, error: fetchError } = await supabase
    .from('spare_transactions')
    .select('*')
    .eq('id', id)
    .single();

  if (!fetchError && txn && txn.transfer_link_id) {
    // Delete both sides of the transfer
    await supabase
      .from('allocation_expenses')
      .delete()
      .eq('transfer_link_id', txn.transfer_link_id);
    await supabase
      .from('spare_transactions')
      .delete()
      .eq('transfer_link_id', txn.transfer_link_id);
  } else {
    // Normal delete
    const { error } = await supabase
      .from('spare_transactions')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}

export async function getSpareTotal(payPeriodId: string): Promise<number> {
  const { data, error } = await supabase
    .from('spare_transactions')
    .select('amount')
    .eq('pay_period_id', payPeriodId);

  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
}

export async function getSpareTransactionsInRange(
  opts?: { dateFrom?: string; dateTo?: string }
): Promise<SpareTransaction[]> {
  let query = supabase
    .from('spare_transactions')
    .select('*')
    .order('transaction_date', { ascending: false });

  if (opts?.dateFrom) query = query.gte('transaction_date', opts.dateFrom.substring(0, 10));
  if (opts?.dateTo) query = query.lte('transaction_date', opts.dateTo.substring(0, 10));

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
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

/** Recalculate monthly bill payment totals by summing up all actual pay period allocations */
export async function recalculateBillPaymentsForMonth(
  userId: string,
  month: string
): Promise<void> {
  const supabase = createClient();

  // 1. Get salary config to get the budget allocations
  const { data: config } = await supabase
    .from('salary_configs')
    .select('id, full_time_salary, part_time_salary')
    .eq('user_id', userId)
    .single();

  if (!config) return;

  const combinedSalary = (config.full_time_salary || 0) + (config.part_time_salary || 0);

  // Get budget allocations
  const { data: allocs } = await supabase
    .from('budget_allocations')
    .select('*')
    .eq('salary_config_id', config.id);

  if (!allocs) return;

  // Fetch allocation types to map classifications
  const { data: dbTypes } = await supabase
    .from('allocation_types')
    .select('*');

  const typeMap = new Map((dbTypes || []).map((t) => [t.id, t.classification]));

  // Compute budgeted amounts
  const computedAllocs = allocs.map((a: any) => {
    const pct = Number(a.percentage ?? 0);
    const amount = combinedSalary * pct;
    
    let classification: string | undefined;
    if (a.allocation_type_id) {
      classification = typeMap.get(a.allocation_type_id);
    }
    
    return {
      id: a.id,
      category: a.category,
      budgeted: amount,
      classification: classification || 'expense'
    };
  });

  // 2. Fetch all pay periods for the month
  const { data: periods } = await supabase
    .from('pay_periods')
    .select('*')
    .eq('user_id', userId);

  const thisMonthPeriods = (periods ?? []).filter(
    (p) => p.created_at && p.created_at.slice(0, 7) === month
  );

  // 3. Sum up actual amounts
  const allocationTotals = new Map<string, number>();
  for (const p of thisMonthPeriods) {
    const allocAmounts = (p.allocation_amounts || []) as any[];
    for (const alloc of allocAmounts) {
      const currentTotal = allocationTotals.get(alloc.allocation_id) ?? 0;
      allocationTotals.set(alloc.allocation_id, currentTotal + Number(alloc.actual ?? 0));
    }
  }

  // 4. Update bill payments for each computed allocation
  for (const alloc of computedAllocs) {
    if (alloc.category.toLowerCase() === 'spare') continue;

    const totalPaid = allocationTotals.get(alloc.id) ?? 0;
    const isFullyPaid = totalPaid >= alloc.budgeted;

    await supabase.from('bill_payments').upsert(
      {
        user_id: userId,
        allocation_id: alloc.id,
        month,
        amount: totalPaid,
        is_paid: isFullyPaid,
        paid_at: isFullyPaid ? new Date().toISOString() : null,
      },
      { onConflict: 'user_id,allocation_id,month' }
    );
  }
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
  const supabase = createClient();

  // 1. Build pay_periods query
  let periodsQuery = supabase
    .from('pay_periods')
    .select('id, total_income, total_tax, total_deductions, total_expenses, total_savings, allocation_amounts, first_wage, second_wage, part_time, additional_income, spare_amount')
    .order('created_at', { ascending: false });

  if (opts?.dateFrom) periodsQuery = periodsQuery.gte('created_at', opts.dateFrom);
  if (opts?.dateTo) periodsQuery = periodsQuery.lte('created_at', opts.dateTo);

  // 2. Build spare_transactions query
  let spareQuery = supabase
    .from('spare_transactions')
    .select('amount, pay_period_id, transaction_date');

  if (opts?.dateFrom) spareQuery = spareQuery.gte('transaction_date', opts.dateFrom.substring(0, 10));
  if (opts?.dateTo) spareQuery = spareQuery.lte('transaction_date', opts.dateTo.substring(0, 10));

  // 3. Build borrowings (active) query
  const activeBorrowingQuery = supabase
    .from('borrowings')
    .select('id, type, amount')
    .eq('is_settled', false);

  // 4. Build borrowing_expenses query
  let beQuery = supabase
    .from('borrowing_expenses')
    .select('amount, expense_date');

  if (opts?.dateFrom) {
    beQuery = beQuery.gte('expense_date', opts.dateFrom.substring(0, 10));
  }
  if (opts?.dateTo) {
    beQuery = beQuery.lte('expense_date', opts.dateTo.substring(0, 10));
  }

  // 5. Build borrowings (gifted) query
  let gQuery = supabase
    .from('borrowings')
    .select('type, amount')
    .eq('is_gifted', true);

  if (opts?.dateFrom) gQuery = gQuery.gte('settled_at', opts.dateFrom);
  if (opts?.dateTo) gQuery = gQuery.lte('settled_at', opts.dateTo);

  // 6. Build consumable_expenses query
  let cQuery = supabase
    .from('consumable_expenses')
    .select('amount');

  if (opts?.dateFrom) {
    cQuery = cQuery.gte('expense_date', opts.dateFrom);
  }
  if (opts?.dateTo) {
    cQuery = cQuery.lte('expense_date', opts.dateTo);
  }

  // 7 & 8. budget_allocations and allocation_types
  const allocationsQuery = supabase
    .from('budget_allocations')
    .select('id, allocation_type_id');

  const typesQuery = supabase
    .from('allocation_types')
    .select('id, classification');

  // 9. Build allocation_expenses query
  let aeQuery = supabase
    .from('allocation_expenses')
    .select('amount, allocation_id, held_fund_id, borrowing_id, expense_date');

  if (opts?.dateFrom) {
    aeQuery = aeQuery.gte('expense_date', opts.dateFrom.substring(0, 10));
  }
  if (opts?.dateTo) {
    aeQuery = aeQuery.lte('expense_date', opts.dateTo.substring(0, 10));
  }

  // Run all 9 queries concurrently
  const [
    allocationsRes,
    typesRes,
    periodsRes,
    spareRes,
    activeBorrowingRes,
    beRes,
    giftedRes,
    cRes,
    aeRes
  ] = await Promise.all([
    allocationsQuery,
    typesQuery,
    periodsQuery,
    spareQuery,
    activeBorrowingQuery,
    beQuery,
    gQuery,
    cQuery,
    aeQuery
  ]);

  if (periodsRes.error) throw periodsRes.error;

  const dbAllocations = allocationsRes.data;
  const dbTypes = typesRes.data;
  const periods = periodsRes.data ?? [];
  const spareData = spareRes.data ?? [];
  const activeBorrowingData = activeBorrowingRes.data ?? [];
  const expData = beRes.data ?? [];
  const giftedData = giftedRes.data ?? [];
  const cData = cRes.data ?? [];
  const aeData = aeRes.data ?? [];

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
  
  const totalSpare = periods.reduce((s, p) => s + Number(p.spare_amount ?? 0), 0);

  // Fetch spare transactions for the date range to compute total spent
  let totalSpareSpent = 0;
  const spareSpentByPeriod = new Map<string, number>();

  for (const row of spareData) {
    const amt = Number(row.amount ?? 0);
    totalSpareSpent += amt;
    if (row.pay_period_id) {
      spareSpentByPeriod.set(
        row.pay_period_id,
        (spareSpentByPeriod.get(row.pay_period_id) ?? 0) + amt
      );
    }
  }

  const allocationClassificationMap = new Map<string, string>();
  if (dbAllocations && dbTypes) {
    const typeMap = new Map(dbTypes.map((t) => [t.id, t.classification]));
    for (const alloc of dbAllocations) {
      if (alloc.allocation_type_id) {
        const classification = typeMap.get(alloc.allocation_type_id);
        if (classification) {
          allocationClassificationMap.set(alloc.id, classification);
        }
      }
    }
  }

  // Compute totalAssets and monthlyExpenses from allocation_amounts with type info
  let totalAssets = 0;
  let monthlyExpenses = 0;

  for (const period of periods) {
    const allocAmounts = (period.allocation_amounts ?? []) as { actual?: number; allocation_type?: string; allocation_id?: string }[];
    let periodAssets = 0;
    let periodExpenses = 0;
    let hasTypeData = false;

    for (const a of allocAmounts) {
      const actual = Number(a.actual ?? 0);
      const liveType = a.allocation_id ? allocationClassificationMap.get(a.allocation_id) : null;
      const type = liveType || a.allocation_type;

      if (type === 'asset') {
        periodAssets += actual;
        hasTypeData = true;
      } else if (type === 'expense') {
        periodExpenses += actual;
        hasTypeData = true;
      }
    }

    if (hasTypeData) {
      totalAssets += periodAssets;
      monthlyExpenses += periodExpenses;
    } else {
      // Fallback: use legacy columns
      totalAssets += Number(period.total_savings ?? 0);
      monthlyExpenses += Number(period.total_expenses ?? 0);
    }
  }

  // Fetch asset expenses from aeData to deduct from totalAssets
  let totalAssetExpensesSpent = 0;
  for (const ae of aeData) {
    const type = allocationClassificationMap.get(ae.allocation_id);
    if (type === 'asset') {
      if (ae.held_fund_id && !ae.borrowing_id) {
        continue;
      }
      totalAssetExpensesSpent += Number(ae.amount ?? 0);
    }
  }

  // Store the original allocated savings total (total assets before deduction of expenses)
  const totalSavings = totalAssets;

  // Adjust totalAssets to be remaining balance
  totalAssets = Math.max(0, totalAssets - totalAssetExpensesSpent);

  // Fetch active (unsettled) borrowing totals for outstanding debt display
  let totalBorrowed = 0;
  let totalLent = 0;
  let totalBorrowingExpensesSpent = 0;

  for (const b of activeBorrowingData) {
    if (b.type === 'borrowed') totalBorrowed += Number(b.amount ?? 0);
    else if (b.type === 'lent') totalLent += Number(b.amount ?? 0);
  }

  for (const e of expData) {
    totalBorrowingExpensesSpent += Number(e.amount ?? 0);
  }

  // Fetch gifted (forgiven) borrowings
  let giftedIncome = 0;
  let forgivenLent = 0;

  for (const b of giftedData) {
    if (b.type === 'borrowed') giftedIncome += Number(b.amount ?? 0);
    else if (b.type === 'lent') forgivenLent += Number(b.amount ?? 0);
  }

  // Fetch consumable expenses total for the date range
  let totalConsumableSpent = 0;
  for (const row of cData) {
    totalConsumableSpent += Number(row.amount ?? 0);
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
    totalExpensesSum: monthlyExpenses,
    totalSpare,
    totalSpareSpent,
    totalBorrowed,
    totalLent,
    totalBorrowingExpensesSpent,
    totalConsumableSpent,
    giftedIncome,
    forgivenLent,
    totalSavings,
    totalDeductions,
  };
}

export async function getPayPeriodTrend(limit = 6, opts?: { dateFrom?: string; dateTo?: string }): Promise<{
  label: string;
  fullLabel: string;
  income: number;
  netPay: number;
  expenses: number;
  spare: number;
  tax: number;
  savings: number;
}[]> {
  // Build query with date filters applied BEFORE limit to ensure we get
  // the most recent N periods within the date range, not the oldest N globally.
  let query = supabase
    .from('pay_periods')
    .select('id, period_label, total_income, total_expenses, total_savings, total_tax, total_deductions, spare_amount, allocation_amounts, created_at');

  // Apply date filters first so the limit applies to the filtered set
  if (opts?.dateFrom) query = query.gte('created_at', opts.dateFrom);
  if (opts?.dateTo) query = query.lte('created_at', opts.dateTo);

  // Order descending and limit to get the N most recent in range
  query = query.order('created_at', { ascending: false }).limit(limit);

  const { data, error } = await query;

  if (error) throw error;

  const periods = data ?? [];
  const adjustedPeriods = await adjustSavingsForPeriods(periods);

  // Fetch spare transactions for these periods so we can include them in expenses
  const spareSpentByPeriod = new Map<string, number>();
  const pIds = adjustedPeriods.map((p) => p.id).filter(Boolean);
  if (pIds.length > 0) {
    const { data: spareData, error: spareError } = await supabase
      .from('spare_transactions')
      .select('amount, pay_period_id')
      .in('pay_period_id', pIds);

    if (!spareError && spareData) {
      for (const row of spareData) {
        const amt = Number(row.amount ?? 0);
        if (row.pay_period_id) {
          spareSpentByPeriod.set(
            row.pay_period_id,
            (spareSpentByPeriod.get(row.pay_period_id) ?? 0) + amt
          );
        }
      }
    }
  }

  // Reverse to chronological order (ascending) for chart display
  return adjustedPeriods.reverse().map((p) => {
    const income = Number(p.total_income ?? 0);
    const tax = Number(p.total_tax ?? 0);
    const deductions = Number(p.total_deductions ?? 0);

    const parts = p.period_label?.split(' - ') ?? [];
    const monthYear = parts[0] ?? '';
    const wageType = parts[1] ?? '';

    let cleanLabel = monthYear;
    if (wageType) {
      const shortWage = wageType
        .replace('First Wage', 'W1')
        .replace('Second Wage', 'W2')
        .replace('Untracked Balance', 'Untracked');
      
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const monthAbbrs = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      let shortenedMonthYear = monthYear;
      for (let i = 0; i < monthNames.length; i++) {
        if (shortenedMonthYear.startsWith(monthNames[i])) {
          shortenedMonthYear = shortenedMonthYear.replace(monthNames[i], monthAbbrs[i]);
          break;
        }
      }
      shortenedMonthYear = shortenedMonthYear.replace(/ 20(\d{2})/, " '$1");
      cleanLabel = `${shortenedMonthYear} (${shortWage})`;
    }

    return {
      label: cleanLabel,
      fullLabel: p.period_label ?? '',
      income,
      netPay: income - tax - deductions,
      expenses: Number(p.total_expenses ?? 0) + (spareSpentByPeriod.get(p.id) ?? 0),
      spare: Number(p.spare_amount ?? 0),
      tax,
      savings: Number(p.total_savings ?? 0),
    };
  });
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

// ============================================
// BORROWINGS
// ============================================

export async function getBorrowings(opts?: {
  settled?: boolean;
  dateFrom?: string;
  dateTo?: string;
}): Promise<Borrowing[]> {
  let query = supabase
    .from('borrowings')
    .select('*')
    .order('transaction_date', { ascending: false });

  if (opts?.settled !== undefined) {
    query = query.eq('is_settled', opts.settled);
  }
  if (opts?.dateFrom) {
    query = query.gte('transaction_date', opts.dateFrom);
  }
  if (opts?.dateTo) {
    query = query.lte('transaction_date', opts.dateTo);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createBorrowing(
  userId: string,
  borrowing: {
    person_name: string;
    type: BorrowingType;
    amount: number;
    description?: string | null;
    transaction_date?: string;
    pay_period_id?: string | null;
  }
): Promise<Borrowing> {
  const { data, error } = await supabase
    .from('borrowings')
    .insert({
      user_id: userId,
      person_name: borrowing.person_name,
      type: borrowing.type,
      amount: borrowing.amount,
      description: borrowing.description ?? null,
      transaction_date:
        formatToISODate(borrowing.transaction_date ?? new Date().toISOString().split('T')[0]),
      pay_period_id: borrowing.pay_period_id ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function settleBorrowing(id: string, isGifted = false): Promise<Borrowing> {
  const { data, error } = await supabase
    .from('borrowings')
    .update({ is_settled: true, is_gifted: isGifted, settled_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function unsettleBorrowing(id: string): Promise<Borrowing> {
  const { data, error } = await supabase
    .from('borrowings')
    .update({ is_settled: false, is_gifted: false, settled_at: null })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBorrowing(id: string): Promise<void> {
  const { error } = await supabase.from('borrowings').delete().eq('id', id);
  if (error) throw error;
}

export async function getBorrowingSummary(opts?: {
  dateFrom?: string;
  dateTo?: string;
}): Promise<BorrowingSummary> {
  let query = supabase
    .from('borrowings')
    .select('type, amount')
    .eq('is_settled', false);

  if (opts?.dateFrom) {
    // Active debts shouldn't be filtered by date. They are active regardless of when created.
  }

  const { data, error } = await query;

  if (error) throw error;

  let totalBorrowed = 0;
  let totalLent = 0;

  for (const row of data ?? []) {
    if (row.type === 'borrowed') totalBorrowed += Number(row.amount ?? 0);
    else if (row.type === 'lent') totalLent += Number(row.amount ?? 0);
  }

  return {
    totalBorrowed,
    totalLent,
    netPosition: totalLent - totalBorrowed,
    activeCount: (data ?? []).length,
  };
}

// ============================================
// CONSUMABLE EXPENSES
// ============================================

export async function getConsumableExpenses(
  month: string
): Promise<ConsumableExpense[]> {
  const { data, error } = await supabase
    .from('consumable_expenses')
    .select('*')
    .eq('month', month)
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createConsumableExpense(
  userId: string,
  expense: {
    description: string;
    amount: number;
    expense_date?: string;
  }
): Promise<ConsumableExpense> {
  const date = expense.expense_date ?? new Date().toISOString().split('T')[0];
  const month = date.substring(0, 7); // '2026-06'

  const { data, error } = await supabase
    .from('consumable_expenses')
    .insert({
      user_id: userId,
      description: expense.description,
      amount: expense.amount,
      expense_date: date,
      month,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteConsumableExpense(id: string): Promise<void> {
  const { error } = await supabase
    .from('consumable_expenses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getConsumableBudgetSummary(
  month: string,
  allowance: number
): Promise<ConsumableBudgetSummary> {
  const expenses = await getConsumableExpenses(month);
  const totalSpent = expenses.reduce(
    (sum, e) => sum + Number(e.amount ?? 0),
    0
  );

  return {
    allowance,
    totalSpent,
    remaining: allowance - totalSpent,
    isOverBudget: totalSpent > allowance,
    expenses,
  };
}

// ============================================
// Consumable Monthly Records
// ============================================

/** Snapshot (upsert) a month's consumable data into the archive */
export async function snapshotConsumableMonth(
  userId: string,
  month: string,
  allowance: number
): Promise<ConsumableMonthlyRecord | null> {
  const supabase = createClient();

  // Get actual expenses for that month
  const { data: expenses } = await supabase
    .from('consumable_expenses')
    .select('amount')
    .eq('month', month);

  const totalSpent = (expenses ?? []).reduce(
    (sum, e) => sum + Number(e.amount ?? 0),
    0
  );
  const expenseCount = (expenses ?? []).length;

  const record = {
    user_id: userId,
    month,
    allowance,
    total_spent: totalSpent,
    remaining: allowance - totalSpent,
    is_over_budget: totalSpent > allowance,
    expense_count: expenseCount,
  };

  const { data, error } = await supabase
    .from('consumable_monthly_records')
    .upsert(record, { onConflict: 'user_id,month' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Auto-snapshot previous month if not already recorded */
export async function autoSnapshotPreviousMonth(
  userId: string,
  allowance: number
): Promise<void> {
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

  const supabase = createClient();

  // Check if already exists
  const { data: existing } = await supabase
    .from('consumable_monthly_records')
    .select('id')
    .eq('month', monthStr)
    .maybeSingle();

  if (!existing) {
    // Check if there were any expenses that month
    const { data: expenses } = await supabase
      .from('consumable_expenses')
      .select('id')
      .eq('month', monthStr)
      .limit(1);

    if (expenses && expenses.length > 0) {
      await snapshotConsumableMonth(userId, monthStr, allowance);
    }
  }
}

/** Get all monthly records for history */
export async function getConsumableMonthlyRecords(
  opts?: { dateFrom?: string; dateTo?: string }
): Promise<ConsumableMonthlyRecord[]> {
  const supabase = createClient();

  let query = supabase
    .from('consumable_monthly_records')
    .select('*')
    .order('month', { ascending: false });

  if (opts?.dateFrom) {
    // dateFrom is a date like '2026-01-01', extract month
    const fromMonth = opts.dateFrom.substring(0, 7);
    query = query.gte('month', fromMonth);
  }
  if (opts?.dateTo) {
    const toMonth = opts.dateTo.substring(0, 7);
    query = query.lte('month', toMonth);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// ============================================
// Borrowing Expenses
// ============================================

/** Get expenses for a specific borrowing */
export async function getBorrowingExpenses(
  borrowingId: string
): Promise<BorrowingExpense[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('borrowing_expenses')
    .select('*')
    .eq('borrowing_id', borrowingId)
    .order('expense_date', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** Create a borrowing expense */
export async function createBorrowingExpense(
  userId: string,
  input: {
    borrowing_id: string;
    description: string;
    amount: number;
    expense_date?: string;
  }
): Promise<BorrowingExpense> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('borrowing_expenses')
    .insert({
      user_id: userId,
      borrowing_id: input.borrowing_id,
      description: input.description,
      amount: input.amount,
      expense_date: formatToISODate(input.expense_date ?? new Date().toISOString().split('T')[0]),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Delete a borrowing expense */
export async function deleteBorrowingExpense(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('borrowing_expenses')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/** Get all borrowings with their expenses */
export async function getBorrowingsWithExpenses(
  opts?: { settled?: boolean; dateFrom?: string; dateTo?: string; }
): Promise<Array<Borrowing & { expenses: BorrowingExpense[]; totalSpent: number; remainingBalance: number }>> {
  const supabase = createClient();

  let query = supabase
    .from('borrowings')
    .select('*')
    .order('transaction_date', { ascending: false });

  if (opts?.settled !== undefined) {
    query = query.eq('is_settled', opts.settled);
  }
  if (opts?.dateFrom) {
    if (opts.settled) {
      query = query.gte('settled_at', opts.dateFrom);
    }
  }
  if (opts?.dateTo) {
    if (opts.settled) {
      query = query.lte('settled_at', opts.dateTo);
    }
  }

  const { data: borrowings, error } = await query;
  if (error) throw error;
  if (!borrowings || borrowings.length === 0) return [];

  // Fetch all expenses for these borrowings in one query
  const ids = borrowings.map((b) => b.id);
  const { data: allExpenses } = await supabase
    .from('borrowing_expenses')
    .select('*')
    .in('borrowing_id', ids)
    .order('expense_date', { ascending: false });

  const expenseMap = new Map<string, BorrowingExpense[]>();
  for (const exp of allExpenses ?? []) {
    const list = expenseMap.get(exp.borrowing_id) ?? [];
    list.push(exp);
    expenseMap.set(exp.borrowing_id, list);
  }

  return borrowings.map((b) => {
    const expenses = expenseMap.get(b.id) ?? [];
    const totalSpent = expenses.reduce((s, e) => s + Number(e.amount ?? 0), 0);
    return {
      ...b,
      expenses,
      totalSpent,
      remainingBalance: Number(b.amount) - totalSpent,
    };
  });
}

/** Get all borrowings for history (with date filter) */
export async function getBorrowingsHistory(
  opts?: { dateFrom?: string; dateTo?: string; settled?: boolean }
): Promise<Borrowing[]> {
  const supabase = createClient();

  let query = supabase
    .from('borrowings')
    .select('*')
    .order('transaction_date', { ascending: false });

  if (opts?.dateFrom) {
    if (opts.settled) {
      query = query.gte('settled_at', opts.dateFrom);
    } else {
      query = query.gte('transaction_date', opts.dateFrom);
    }
  }
  if (opts?.dateTo) {
    if (opts.settled) {
      query = query.lte('settled_at', opts.dateTo);
    } else {
      query = query.lte('transaction_date', opts.dateTo);
    }
  }
  if (opts?.settled !== undefined) {
    query = query.eq('is_settled', opts.settled);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/** Get recent consumable expenses for a user across all months */
export async function getConsumableExpensesByUser(
  limit = 100
): Promise<ConsumableExpense[]> {
  const { data, error } = await supabase
    .from('consumable_expenses')
    .select('*')
    .order('expense_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

/** Get consumable expenses for a user in a specific date range */
export async function getConsumableExpensesInRange(
  userId: string,
  opts?: { dateFrom?: string; dateTo?: string }
): Promise<ConsumableExpense[]> {
  const supabase = createClient();
  let query = supabase
    .from('consumable_expenses')
    .select('*')
    .eq('user_id', userId)
    .order('expense_date', { ascending: false });

  if (opts?.dateFrom) {
    query = query.gte('expense_date', opts.dateFrom.substring(0, 10));
  }
  if (opts?.dateTo) {
    query = query.lte('expense_date', opts.dateTo.substring(0, 10));
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/** Get all allocation expenses for a user, optionally filtered by date range, with category information */
export async function getAllAllocationExpenses(
  userId: string,
  opts?: { dateFrom?: string; dateTo?: string }
): Promise<AllocationExpenseWithCategory[]> {
  const supabase = createClient();
  let query = supabase
    .from('allocation_expenses')
    .select('*, budget_allocations(category)')
    .eq('user_id', userId)
    .order('expense_date', { ascending: false });

  if (opts?.dateFrom) {
    query = query.gte('expense_date', opts.dateFrom.substring(0, 10));
  }
  if (opts?.dateTo) {
    query = query.lte('expense_date', opts.dateTo.substring(0, 10));
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as any) ?? [];
}

// ============================================
// ALLOCATION EXPENSES (Fund Tracker)
// ============================================

/** Get all expenses for a specific allocation */
export async function getAllocationExpenses(
  allocationId: string
): Promise<AllocationExpense[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('allocation_expenses')
    .select('*')
    .eq('allocation_id', allocationId)
    .order('expense_date', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** Get fund summaries for multiple allocations */
export async function getAllocationFundSummaries(
  userId: string,
  allocations: { id: string; category: string; amount: number }[],
  opts?: { dateFrom?: string; dateTo?: string }
): Promise<AllocationFundSummary[]> {
  const supabase = createClient();
  const allocationIds = allocations.map((a) => a.id);
  if (allocationIds.length === 0) return [];

  // 1. Fetch allocation expenses within the date range
  let expenseQuery = supabase
    .from('allocation_expenses')
    .select('*')
    .in('allocation_id', allocationIds)
    .order('expense_date', { ascending: false });

  if (opts?.dateFrom) {
    expenseQuery = expenseQuery.gte('expense_date', opts.dateFrom.substring(0, 10));
  }
  if (opts?.dateTo) {
    expenseQuery = expenseQuery.lte('expense_date', opts.dateTo.substring(0, 10));
  }

  // 2. Query pay periods in range to sum actual allocated amounts
  let periodQuery = supabase
    .from('pay_periods')
    .select('allocation_amounts')
    .eq('user_id', userId);

  if (opts?.dateFrom) periodQuery = periodQuery.gte('created_at', opts.dateFrom);
  if (opts?.dateTo) periodQuery = periodQuery.lte('created_at', opts.dateTo);

  // Fetch allocation expenses and periods in parallel
  const [expensesRes, periodsRes] = await Promise.all([
    expenseQuery,
    periodQuery,
  ]);

  const { data: expenses, error: eError } = expensesRes;
  if (eError) throw eError;

  const { data: periods, error: pError } = periodsRes;

  // 1b. Fetch borrowings to check settlement status for unpaid shared expenses
  const borrowingIds = (expenses ?? [])
    .map((e) => e.borrowing_id)
    .filter((id): id is string => !!id);

  const borrowingSettledMap = new Map<string, boolean>();
  if (borrowingIds.length > 0) {
    const { data: borrowings, error: bError } = await supabase
      .from('borrowings')
      .select('id, is_settled')
      .in('id', borrowingIds);
    
    if (!bError && borrowings) {
      for (const b of borrowings) {
        borrowingSettledMap.set(b.id, b.is_settled);
      }
    }
  }

  // Group expenses by allocation_id and map settlement status
  const expenseMap = new Map<string, AllocationExpense[]>();
  for (const exp of expenses ?? []) {
    const isSettled = exp.borrowing_id ? (borrowingSettledMap.get(exp.borrowing_id) ?? false) : true;
    const list = expenseMap.get(exp.allocation_id) ?? [];
    list.push({
      ...exp,
      is_borrowing_settled: isSettled,
    });
    expenseMap.set(exp.allocation_id, list);
  }
  
  const allocatedMap = new Map<string, number>();
  const hasPeriodData = !pError && periods && periods.length > 0;

  if (hasPeriodData) {
    for (const p of periods) {
      const allocAmounts = (p.allocation_amounts ?? []) as any[];
      for (const item of allocAmounts) {
        const allocId = item.allocation_id;
        if (allocId) {
          const currentSum = allocatedMap.get(allocId) ?? 0;
          allocatedMap.set(allocId, currentSum + Number(item.actual ?? 0));
        }
      }
    }
  }

  // Build summaries
  return allocations.map((alloc) => {
    const allocExpenses = expenseMap.get(alloc.id) ?? [];
    
    // Only count expenses that have actually been spent from the user's cash/bank.
    // That means:
    // 1. If it was paid from a held fund and no borrowing is linked, it was spent for the other person (using their own money), so the user spent 0.
    // 2. Either no borrowing is linked, or the linked borrowing is already marked as settled.
    const totalSpent = allocExpenses.reduce((sum, e) => {
      if (e.held_fund_id && !e.borrowing_id) {
        return sum;
      }
      return sum + Number(e.amount ?? 0);
    }, 0);

    const budgeted = hasPeriodData ? (allocatedMap.get(alloc.id) ?? 0) : alloc.amount;

    return {
      allocation_id: alloc.id,
      category: alloc.category,
      budgeted,
      totalSpent,
      remaining: budgeted - totalSpent,
      expenses: allocExpenses,
    };
  });
}

/**
 * Create an allocation expense.
 * If is_shared && paid_by is set (someone else paid), auto-creates a borrowing record.
 * If held_fund_id is set, auto-deducts from the held fund.
 */
export async function createAllocationExpense(
  userId: string,
  input: {
    allocation_id: string;
    description: string;
    amount: number;
    expense_date?: string;
    is_shared?: boolean;
    paid_by?: string;
    shared_total?: number;
    shared_parties?: number;
    held_fund_id?: string;
    held_fund_deduction?: number;
    notes?: string;
    transfer_link_id?: string;
  }
): Promise<AllocationExpense> {
  const supabase = createClient();

  let borrowingId: string | null = null;

  // If someone else paid for you, create a borrowing record
  if (input.is_shared && input.paid_by && input.paid_by.trim()) {
    const { data: borrowing, error: bError } = await supabase
      .from('borrowings')
      .insert({
        user_id: userId,
        person_name: input.paid_by.trim(),
        type: 'borrowed',
        amount: input.amount,
        description: `Shared expense: ${input.description}`,
        transaction_date: formatToISODate(input.expense_date ?? new Date().toISOString().split('T')[0]),
      })
      .select()
      .single();

    if (bError) throw bError;
    borrowingId = borrowing.id;
  }

  // If deducting from a held fund, reduce the current_amount
  const heldFundId: string | null = input.held_fund_id ?? null;
  if (heldFundId && input.held_fund_deduction && input.held_fund_deduction > 0) {
    // Fetch current held fund
    const { data: fund, error: fError } = await supabase
      .from('held_funds')
      .select('current_amount')
      .eq('id', heldFundId)
      .single();

    if (fError) throw fError;

    const newAmount = Math.max(0, Number(fund.current_amount) - input.held_fund_deduction);
    const { error: uError } = await supabase
      .from('held_funds')
      .update({ current_amount: newAmount })
      .eq('id', heldFundId);

    if (uError) throw uError;
  }

  // Create the allocation expense
  const { data, error: insertError } = await supabase
    .from('allocation_expenses')
    .insert({
      user_id: userId,
      allocation_id: input.allocation_id,
      description: input.description,
      amount: input.amount,
      expense_date: formatToISODate(input.expense_date ?? new Date().toISOString().split('T')[0]),
      is_shared: input.is_shared ?? false,
      paid_by: input.paid_by ?? null,
      shared_total: input.shared_total ?? null,
      shared_parties: input.shared_parties ?? null,
      borrowing_id: borrowingId,
      held_fund_id: heldFundId,
      notes: input.notes ?? null,
      transfer_link_id: input.transfer_link_id ?? null,
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return data;
}

/** Delete an allocation expense and reverse held fund deduction if applicable */
export async function deleteAllocationExpense(id: string): Promise<void> {
  const supabase = createClient();

  // Fetch the expense first to check for held fund link and transfer link
  const { data: expense, error: fetchError } = await supabase
    .from('allocation_expenses')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  // If linked to a held fund, reverse the deduction
  if (expense.held_fund_id) {
    const { data: fund, error: fError } = await supabase
      .from('held_funds')
      .select('current_amount, original_amount')
      .eq('id', expense.held_fund_id)
      .single();

    if (!fError && fund) {
      const restored = Math.min(
        Number(fund.original_amount),
        Number(fund.current_amount) + Number(expense.amount)
      );
      await supabase
        .from('held_funds')
        .update({ current_amount: restored })
        .eq('id', expense.held_fund_id);
    }
  }

  // If linked to a borrowing, delete the borrowing too
  if (expense.borrowing_id) {
    await supabase
      .from('borrowings')
      .delete()
      .eq('id', expense.borrowing_id);
  }

  // If linked to a transfer, delete the matching spare_transactions and other allocation_expenses
  if (expense.transfer_link_id) {
    await supabase
      .from('spare_transactions')
      .delete()
      .eq('transfer_link_id', expense.transfer_link_id);
    await supabase
      .from('allocation_expenses')
      .delete()
      .eq('transfer_link_id', expense.transfer_link_id);
  } else {
    // Delete the single expense
    const { error } = await supabase
      .from('allocation_expenses')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}

// ============================================
// HELD FUNDS
// ============================================

/** Get all held funds for the current user */
export async function getHeldFunds(
  opts?: { activeOnly?: boolean }
): Promise<HeldFund[]> {
  const supabase = createClient();
  let query = supabase
    .from('held_funds')
    .select('*')
    .order('created_at', { ascending: false });

  if (opts?.activeOnly) {
    query = query.eq('is_returned', false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/** Create a new held fund */
export async function createHeldFund(
  userId: string,
  input: {
    person_name: string;
    original_amount: number;
    description?: string;
  }
): Promise<HeldFund> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('held_funds')
    .insert({
      user_id: userId,
      person_name: input.person_name,
      original_amount: input.original_amount,
      current_amount: input.original_amount,
      description: input.description ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Mark a held fund as returned */
export async function returnHeldFund(id: string): Promise<HeldFund> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('held_funds')
    .update({
      is_returned: true,
      returned_at: new Date().toISOString(),
      current_amount: 0,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Delete a held fund */
export async function deleteHeldFund(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('held_funds')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/** Export all user data as a single JSON structure for backup */
export async function exportAllDataAsJson(userId: string): Promise<any> {
  const supabase = createClient();
  const tables = [
    'salary_configs',
    'allocation_types',
    'budget_allocations',
    'allocation_expenses',
    'pay_periods',
    'spare_transactions',
    'bill_payments',
    'borrowings',
    'borrowing_expenses',
    'consumable_expenses',
    'consumable_monthly_records',
    'held_funds',
  ];

  const backupData: Record<string, any[]> = {};

  await Promise.all(
    tables.map(async (table) => {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        backupData[table] = [];
      } else {
        backupData[table] = data ?? [];
      }
    })
  );

  return {
    version: '1.0.0',
    exported_at: new Date().toISOString(),
    user_id: userId,
    data: backupData,
  };
}

/** Restore all user data from a JSON backup, clearing existing records first */
export async function restoreAllDataFromJson(userId: string, backup: any): Promise<void> {
  const supabase = createClient();
  if (!backup || !backup.data) {
    throw new Error('Invalid backup file format');
  }

  const backupData = backup.data;

  // Safe delete order to respect foreign key constraints (child first)
  const deleteOrder = [
    'borrowing_expenses',
    'allocation_expenses',
    'bill_payments',
    'spare_transactions',
    'borrowings',
    'budget_allocations',
    'pay_periods',
    'held_funds',
    'consumable_expenses',
    'consumable_monthly_records',
    'allocation_types',
    'salary_configs',
  ];

  for (const table of deleteOrder) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('user_id', userId);
    if (error) {
      console.error(`Error deleting from ${table}:`, error);
      throw error;
    }
  }

  // Safe insert order to respect foreign key constraints (parent first)
  const insertOrder = [
    'salary_configs',
    'allocation_types',
    'consumable_monthly_records',
    'consumable_expenses',
    'held_funds',
    'pay_periods',
    'budget_allocations',
    'borrowings',
    'spare_transactions',
    'bill_payments',
    'allocation_expenses',
    'borrowing_expenses',
  ];

  for (const table of insertOrder) {
    const rows = backupData[table] ?? [];
    if (rows.length === 0) continue;

    const sanitizedRows = rows.map((row: any) => ({
      ...row,
      user_id: userId,
    }));

    const { error } = await supabase
      .from(table)
      .insert(sanitizedRows);
    
    if (error) {
      console.error(`Error inserting into ${table}:`, error);
      throw error;
    }
  }
}

/** Import spare transactions from parsed CSV records */
export async function importSpareTransactions(
  userId: string,
  txns: { transaction_date: string; description: string; amount: number }[]
): Promise<void> {
  const supabase = createClient();

  // Fetch pay periods to align transaction dates
  const { data: periods, error: periodsError } = await supabase
    .from('pay_periods')
    .select('id, period_label, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (periodsError) throw periodsError;

  const payPeriods = periods ?? [];

  const findPeriodId = (dateStr: string): string | null => {
    if (payPeriods.length === 0) return null;
    let bestPeriod = payPeriods[0];
    for (const p of payPeriods) {
      const pDate = p.created_at.split('T')[0];
      if (pDate <= dateStr) {
        bestPeriod = p;
      }
    }
    return bestPeriod.id;
  };

  const rowsToInsert = txns.map((t) => {
    const matchedPeriodId = findPeriodId(t.transaction_date);
    return {
      user_id: userId,
      pay_period_id: matchedPeriodId,
      description: t.description,
      amount: t.amount,
      transaction_date: t.transaction_date,
    };
  });

  if (rowsToInsert.length === 0) return;

  const { error } = await supabase
    .from('spare_transactions')
    .insert(rowsToInsert);

  if (error) throw error;
}

/** Import consumable expenses from parsed CSV records */
export async function importConsumableExpenses(
  userId: string,
  txns: { expense_date: string; description: string; amount: number }[]
): Promise<void> {
  const supabase = createClient();

  const rowsToInsert = txns.map((t) => {
    const month = t.expense_date.substring(0, 7);
    return {
      user_id: userId,
      description: t.description,
      amount: t.amount,
      expense_date: t.expense_date,
      month,
    };
  });

  if (rowsToInsert.length === 0) return;

  const { error } = await supabase
    .from('consumable_expenses')
    .insert(rowsToInsert);

  if (error) throw error;
}

/** Get all pay periods for a user (no limit, chronological order) */
export async function getAllPayPeriods(userId: string): Promise<PayPeriod[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('pay_periods')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Get all spare transactions for a user */
export async function getAllSpareTransactions(userId: string): Promise<SpareTransaction[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('spare_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Get all consumable expenses for a user */
export async function getAllConsumableExpenses(userId: string): Promise<ConsumableExpense[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('consumable_expenses')
    .select('*')
    .eq('user_id', userId)
    .order('expense_date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}


