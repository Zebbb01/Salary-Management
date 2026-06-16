import { z } from 'zod';

// Salary config validation
export const salaryConfigSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  full_time_salary: z
    .number()
    .min(0, 'Salary must be positive')
    .max(10000000, 'Salary seems too high'),
  part_time_salary: z
    .number()
    .min(0, 'Salary must be positive')
    .max(10000000, 'Salary seems too high')
    .default(0),
});

// Budget allocation validation
export const budgetAllocationSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  percentage: z
    .number()
    .min(0, 'Percentage must be positive')
    .max(100, 'Percentage cannot exceed 100%'),
  description: z.string().nullable().optional(),
});

// Monthly utility item validation
export const monthlyUtilItemSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  amount: z.number().min(0, 'Amount must be positive'),
});

// Additional income item validation
export const additionalIncomeSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  amount: z.number().min(0, 'Amount must be positive'),
});

// Allocation amount per pay period
export const allocationAmountSchema = z.object({
  allocation_id: z.string(),
  category: z.string(),
  budgeted: z.number().min(0),
  actual: z.number().min(0, 'Amount must be positive'),
  allocation_type: z.string().optional(),
});

// Pay period form validation
export const payPeriodSchema = z.object({
  period_label: z.string().min(1, 'Period label is required'),
  first_wage: z.number().min(0, 'First wage must be positive'),
  second_wage: z.number().min(0, 'Second wage must be positive').default(0),
  part_time: z.number().min(0, 'Part-time must be positive').default(0),
  first_wage_deduction: z.number().min(0).default(0),
  second_wage_deduction: z.number().min(0).default(0),
  part_time_deduction: z.number().min(0).default(0),
  include_first_wage: z.boolean().default(false),
  include_second_wage: z.boolean().default(false),
  include_part_time: z.boolean().default(false),
  // Wage tax (applies to first + second wage)
  include_wage_tax: z.boolean().default(false),
  wage_tax_rate: z
    .number()
    .min(0, 'Tax rate must be positive')
    .max(100, 'Tax rate cannot exceed 100%'),
  // Part-time tax (applies to part-time income)
  include_pt_tax: z.boolean().default(false),
  pt_tax_rate: z
    .number()
    .min(0, 'Tax rate must be positive')
    .max(100, 'Tax rate cannot exceed 100%')
    .default(0),
  // Legacy fields (kept for backward compat, default 0 for new periods)
  daily_consumable_rate: z.number().min(0).default(0),
  daily_consumable_days: z.number().int().min(0).max(31).default(0),
  monthly_utils_items: z.array(monthlyUtilItemSchema).default([]),
  rent: z.number().min(0).default(0),
  electricity: z.number().min(0).default(0),
  emergency_fund: z.number().min(0).default(0),
  general_savings: z.number().min(0).default(0),
  // Dynamic allocation amounts (primary)
  allocation_amounts: z.array(allocationAmountSchema).default([]),
  // Additional income sources
  additional_income: z.array(additionalIncomeSchema).default([]),
});

// Auth validation
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type SalaryConfigFormData = z.infer<typeof salaryConfigSchema>;
export type BudgetAllocationFormData = z.infer<typeof budgetAllocationSchema>;
export type PayPeriodFormData = z.infer<typeof payPeriodSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
