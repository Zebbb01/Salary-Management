// Pure calculation functions for salary management
// These functions have no side effects and can be tested independently

import type { PayPeriodInput, CalculationResult, BudgetAllocation, BudgetAllocationWithAmount } from '../types/salary.types';

/**
 * Calculate the full pay period breakdown
 *
 * New formula (with allocation_amounts):
 *   totalIncome    = first_wage + second_wage + part_time (gross, before deductions)
 *   totalDeductions = sum of deductions passed via total_deductions
 *   netIncome      = totalIncome - totalDeductions
 *   wageTax        = wage_tax_amount ?? 0
 *   ptTax          = pt_tax_amount ?? 0
 *   totalTax       = wageTax + ptTax (or totalIncome * tax_rate/100 for legacy)
 *   totalAllocated = sum of allocation_amounts[].actual
 *   spareAmount    = netIncome - totalTax - totalAllocated
 *
 * Legacy formula (without allocation_amounts, for backward compat):
 *   totalExpenses = consumables + rent + electricity + monthlyUtils
 *   totalSavings  = emergency_fund + general_savings
 *   spareAmount   = netIncome - totalTax - totalExpenses - totalSavings
 */
export function calculatePayPeriod(input: PayPeriodInput): CalculationResult {
  const additionalIncomeTotal = (input.additional_income ?? []).reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const totalIncome = input.first_wage + input.second_wage + input.part_time + additionalIncomeTotal;
  const totalDeductions = input.total_deductions ?? 0;
  const netIncome = totalIncome - totalDeductions;

  // Compute tax: use separate wage/pt amounts if provided, otherwise fallback to single rate
  const hasSeparateTax = input.wage_tax_amount !== undefined || input.pt_tax_amount !== undefined;
  const wageTax = hasSeparateTax ? (input.wage_tax_amount ?? 0) : 0;
  const ptTax = hasSeparateTax ? (input.pt_tax_amount ?? 0) : 0;
  const totalTax = hasSeparateTax
    ? wageTax + ptTax
    : totalIncome * (input.tax_rate / 100);

  // Check if we have dynamic allocation amounts (new periods)
  const hasAllocations = input.allocation_amounts && input.allocation_amounts.length > 0;

  if (hasAllocations) {
    const totalAllocated = input.allocation_amounts.reduce(
      (sum, item) => sum + item.actual,
      0
    );

    // Split by allocation type: asset-typed go to savings, expense-typed go to expenses
    let totalExpenses = 0;
    let totalSavings = 0;
    for (const item of input.allocation_amounts) {
      if (item.allocation_type === 'asset') {
        totalSavings += item.actual;
      } else {
        // Default to expense if no type or type is 'expense'
        totalExpenses += item.actual;
      }
    }

    const spareAmount = netIncome - totalTax - totalAllocated;

    return {
      totalIncome,
      totalDeductions,
      netIncome,
      totalTax,
      wageTax,
      ptTax,
      totalAllocated,
      consumablesTotal: 0,
      monthlyUtilsTotal: 0,
      totalExpenses,
      totalSavings,
      spareAmount,
    };
  }

  // Legacy fallback for old saved periods
  const consumablesTotal = input.daily_consumable_rate * input.daily_consumable_days;
  const monthlyUtilsTotal = (input.monthly_utils_items ?? []).reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const totalExpenses = consumablesTotal + input.rent + input.electricity + monthlyUtilsTotal;
  const totalSavings = input.emergency_fund + input.general_savings;
  const totalAllocated = totalExpenses + totalSavings;
  const spareAmount = netIncome - totalExpenses - totalTax - totalSavings;

  return {
    totalIncome,
    totalDeductions,
    netIncome,
    totalTax,
    wageTax,
    ptTax,
    totalAllocated,
    consumablesTotal,
    monthlyUtilsTotal,
    totalExpenses,
    totalSavings,
    spareAmount,
  };
}

/**
 * Compute budget allocation amounts from percentages and salary
 * Percentages are stored as decimals (0.5 = 50%)
 */
export function computeAllocations(
  allocations: BudgetAllocation[],
  totalSalary: number
): BudgetAllocationWithAmount[] {
  return allocations
    .sort((a, b) => a.display_order - b.display_order)
    .map((allocation) => ({
      ...allocation,
      amount: totalSalary * allocation.percentage,
    }));
}

/**
 * Validate that budget allocation percentages sum to 1.0 (100%)
 * Percentages are stored as decimals (0.5 = 50%)
 */
export function validateAllocationsSum(allocations: BudgetAllocation[]): {
  valid: boolean;
  total: number;
  difference: number;
} {
  const total = allocations.reduce((sum, a) => sum + a.percentage, 0);
  const roundedTotal = Math.round(total * 100) / 100;
  return {
    valid: roundedTotal === 1,
    total: roundedTotal,
    difference: Math.round((1 - total) * 100) / 100,
  };
}

/**
 * Generate a default period label based on current date
 * Format: "June 2026 - First Wage (June 4, 2026)" or "June 2026 - Second Wage (June 16, 2026)"
 */
export function generatePeriodLabel(date: Date = new Date()): string {
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();
  const day = date.getDate();
  const wage = day <= 15 ? 'First Wage' : 'Second Wage';

  const formattedDate = date.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return `${month} ${year} - ${wage} (${formattedDate})`;
}

/**
 * Format a number as Philippine Peso currency
 */
export function formatPHP(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a decimal percentage for display (0.50 -> "50%")
 */
export function formatPercentage(decimal: number): string {
  return `${(decimal * 100).toFixed(0)}%`;
}

/**
 * Convert a whole-number percentage to decimal (50 -> 0.5)
 */
export function percentToDecimal(wholeNumber: number): number {
  return wholeNumber / 100;
}

/**
 * Convert a decimal percentage to whole number (0.5 -> 50)
 */
export function decimalToPercent(decimal: number): number {
  return Math.round(decimal * 100);
}
