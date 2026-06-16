// Salary calculation types

export interface SalaryConfig {
  id: string;
  user_id: string;
  name: string;
  full_time_salary: number;
  part_time_salary: number;
  created_at: string;
  updated_at: string;
}

// Classification for allocation types: expense = bills/costs, asset = savings/investments
export type AllocationClassification = 'expense' | 'asset';

export interface AllocationType {
  id: string;
  user_id: string;
  name: string;
  classification: AllocationClassification;
  color: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetAllocation {
  id: string;
  salary_config_id: string;
  category: string;
  percentage: number;
  description: string | null;
  icon_name: string | null;
  color: string | null;
  display_order: number;
  allocation_type_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MonthlyUtilItem {
  label: string;
  amount: number;
}

// Additional income source (extra on top of wages)
export interface AdditionalIncome {
  label: string;
  amount: number;
}

// Dynamic allocation amount per pay period
export interface AllocationAmount {
  allocation_id: string;
  category: string;
  budgeted: number;
  actual: number;
  allocation_type?: string; // classification: 'expense' | 'asset'
}

export interface PayPeriod {
  id: string;
  user_id: string;
  period_label: string;
  // Income
  first_wage: number;
  second_wage: number;
  part_time: number;
  tax_rate: number;
  // Expenses (legacy columns, kept for backward compat)
  daily_consumable_rate: number;
  daily_consumable_days: number;
  monthly_utils_items: MonthlyUtilItem[];
  rent: number;
  electricity: number;
  // Bank Savings (legacy)
  emergency_fund: number;
  general_savings: number;
  // Dynamic allocation amounts (new)
  allocation_amounts: AllocationAmount[];
  // Additional income sources
  additional_income: AdditionalIncome[];
  // Computed
  total_income: number | null;
  total_tax: number | null;
  total_deductions: number | null;
  total_expenses: number | null;
  total_savings: number | null;
  spare_amount: number | null;
  // Meta
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Form input types (before saving)
export interface PayPeriodInput {
  period_label: string;
  first_wage: number;
  second_wage: number;
  part_time: number;
  tax_rate: number;
  // Separate tax amounts computed by the caller
  wage_tax_amount?: number;
  pt_tax_amount?: number;
  // Total deductions (computed by caller from individual deductions)
  total_deductions?: number;
  // Legacy fields (default 0 for new periods)
  daily_consumable_rate: number;
  daily_consumable_days: number;
  monthly_utils_items: MonthlyUtilItem[];
  rent: number;
  electricity: number;
  emergency_fund: number;
  general_savings: number;
  // Dynamic allocation amounts
  allocation_amounts: AllocationAmount[];
  // Additional income sources
  additional_income?: AdditionalIncome[];
}

// Computed calculation result
export interface CalculationResult {
  totalIncome: number;
  totalDeductions: number;
  netIncome: number;
  totalTax: number;
  wageTax: number;
  ptTax: number;
  totalAllocated: number;
  // Legacy fields for backward compat
  consumablesTotal: number;
  monthlyUtilsTotal: number;
  totalExpenses: number;
  totalSavings: number;
  spareAmount: number;
}

// Budget allocation with computed amount
export interface BudgetAllocationWithAmount extends BudgetAllocation {
  amount: number;
}

// Spare transaction (spending from spare amount)
export interface SpareTransaction {
  id: string;
  user_id: string;
  pay_period_id: string | null;
  description: string;
  amount: number;
  transaction_date: string;
  created_at: string;
  updated_at: string;
}

// Dashboard summary stats
export interface DashboardStats {
  fullTimeSalary: number;
  totalTax: number;
  totalExpenses: number;
  spareAmount: number;
}

// Bill payment tracking
export interface BillPayment {
  id: string;
  user_id: string;
  allocation_id: string;
  month: string;
  amount: number;
  is_paid: boolean;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Bill payment with allocation details (for display)
export interface BillPaymentWithAllocation extends BillPayment {
  allocation: BudgetAllocation;
}

// Aggregated financial summary from all pay periods
export interface FinancialSummary {
  grossIncome: number;
  netIncome: number;
  totalAssets: number;
  monthlyExpenses: number;
  periodCount: number;
}
