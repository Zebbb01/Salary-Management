// Salary calculation types

export type PayFrequency = 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly';

export interface SalaryConfig {
  id: string;
  user_id: string;
  name: string;
  full_time_salary: number;
  part_time_salary: number;
  pay_frequency: PayFrequency;
  consumable_allowance: number;
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
  is_fixed: boolean;
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
  is_fixed?: boolean;
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
  // Optional date override for delayed entries
  created_at?: string;
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
  // Wage breakdowns for dashboard cards
  fullTimeSalary: number;
  partTimeSalary: number;
  additionalIncomeTotal: number;
  totalTax: number;
  totalExpensesSum: number;
  totalSpare: number;
  totalSpareSpent: number;
  // Borrowing totals
  totalBorrowed: number;
  totalLent: number;
  totalBorrowingExpensesSpent: number;
  // Consumable totals
  totalConsumableSpent: number;
  giftedIncome: number;
  forgivenLent: number;
  totalSavings: number;
  totalDeductions: number;
}

// Borrowing / Lending record
export type BorrowingType = 'borrowed' | 'lent';

export interface Borrowing {
  id: string;
  user_id: string;
  person_name: string;
  type: BorrowingType;
  amount: number;
  description: string | null;
  transaction_date: string;
  is_settled: boolean;
  is_gifted: boolean;
  settled_at: string | null;
  pay_period_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BorrowingSummary {
  totalBorrowed: number;   // Total I owe others (unsettled)
  totalLent: number;       // Total others owe me (unsettled)
  netPosition: number;     // totalLent - totalBorrowed (positive = net positive)
  activeCount: number;
}

// Consumable expense entry
export interface ConsumableExpense {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  expense_date: string;
  month: string;
  created_at: string;
  updated_at: string;
}

// Consumable budget summary for a given month
export interface ConsumableBudgetSummary {
  allowance: number;
  totalSpent: number;
  remaining: number;
  isOverBudget: boolean;
  expenses: ConsumableExpense[];
}

// Monthly consumable archive record
export interface ConsumableMonthlyRecord {
  id: string;
  user_id: string;
  month: string;
  allowance: number;
  total_spent: number;
  remaining: number;
  is_over_budget: boolean;
  expense_count: number;
  created_at: string;
}

// Borrowing expense (spending from borrowed money)
export interface BorrowingExpense {
  id: string;
  borrowing_id: string;
  user_id: string;
  description: string;
  amount: number;
  expense_date: string;
  created_at: string;
  updated_at: string;
}

// Borrowing with its expenses
export interface BorrowingWithExpenses extends Borrowing {
  expenses: BorrowingExpense[];
  totalSpent: number;
  remainingBalance: number;
}

// Allocation expense (spending from a specific allocation fund)
export interface AllocationExpense {
  id: string;
  user_id: string;
  allocation_id: string;
  description: string;
  amount: number;
  expense_date: string;
  is_shared: boolean;
  paid_by: string | null;
  shared_total: number | null;
  shared_parties: number | null;
  borrowing_id: string | null;
  held_fund_id: string | null;
  is_borrowing_settled?: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Held fund (money you're holding for someone else)
export interface HeldFund {
  id: string;
  user_id: string;
  person_name: string;
  original_amount: number;
  current_amount: number;
  description: string | null;
  is_returned: boolean;
  returned_at: string | null;
  created_at: string;
  updated_at: string;
}

// Allocation with fund tracking data
export interface AllocationFundSummary {
  allocation_id: string;
  category: string;
  budgeted: number;
  totalSpent: number;
  remaining: number;
  expenses: AllocationExpense[];
}

// Allocation expense (spending from a specific allocation fund)
export interface AllocationExpense {
  id: string;
  user_id: string;
  allocation_id: string;
  description: string;
  amount: number;
  expense_date: string;
  is_shared: boolean;
  paid_by: string | null;
  shared_total: number | null;
  shared_parties: number | null;
  borrowing_id: string | null;
  held_fund_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Held fund (money you're holding for someone else)
export interface HeldFund {
  id: string;
  user_id: string;
  person_name: string;
  original_amount: number;
  current_amount: number;
  description: string | null;
  is_returned: boolean;
  returned_at: string | null;
  created_at: string;
  updated_at: string;
}

// Allocation with fund tracking data
export interface AllocationFundSummary {
  allocation_id: string;
  category: string;
  budgeted: number;
  totalSpent: number;
  remaining: number;
  expenses: AllocationExpense[];
}
