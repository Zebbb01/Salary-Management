-- Salary Management Dashboard - Database Schema
-- Run this in the Supabase SQL Editor

-- ============================================
-- 1. TABLES
-- ============================================

-- Salary configuration (one per user)
CREATE TABLE IF NOT EXISTS salary_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Salary',
  full_time_salary NUMERIC NOT NULL DEFAULT 20000,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Budget allocation percentages
CREATE TABLE IF NOT EXISTS budget_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salary_config_id UUID NOT NULL REFERENCES salary_configs(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  percentage NUMERIC NOT NULL,
  description TEXT,
  icon_name TEXT,
  color TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pay period records
CREATE TABLE IF NOT EXISTS pay_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_label TEXT NOT NULL,
  -- Income
  first_wage NUMERIC NOT NULL DEFAULT 10000,
  second_wage NUMERIC NOT NULL DEFAULT 10000,
  part_time NUMERIC NOT NULL DEFAULT 2800,
  tax_rate NUMERIC NOT NULL DEFAULT 0.10,
  -- Expenses
  daily_consumable_rate NUMERIC NOT NULL DEFAULT 150,
  daily_consumable_days INT NOT NULL DEFAULT 14,
  monthly_utils_items JSONB DEFAULT '[{"label": "Internet/Phone", "amount": 369.76}, {"label": "Subscriptions", "amount": 843.33}]',
  rent NUMERIC NOT NULL DEFAULT 4000,
  electricity NUMERIC NOT NULL DEFAULT 250,
  -- Bank Savings
  emergency_fund NUMERIC NOT NULL DEFAULT 1500,
  general_savings NUMERIC NOT NULL DEFAULT 1500,
  -- Computed (stored for historical queries)
  total_income NUMERIC,
  total_tax NUMERIC,
  total_expenses NUMERIC,
  total_savings NUMERIC,
  spare_amount NUMERIC,
  -- Meta
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_salary_configs_user_id ON salary_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_allocations_config_id ON budget_allocations(salary_config_id);
CREATE INDEX IF NOT EXISTS idx_pay_periods_user_id ON pay_periods(user_id);
CREATE INDEX IF NOT EXISTS idx_pay_periods_created_at ON pay_periods(created_at DESC);

-- ============================================
-- 3. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE salary_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_periods ENABLE ROW LEVEL SECURITY;

-- salary_configs policies
CREATE POLICY "Users can view own salary config"
  ON salary_configs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own salary config"
  ON salary_configs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own salary config"
  ON salary_configs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own salary config"
  ON salary_configs FOR DELETE
  USING (auth.uid() = user_id);

-- budget_allocations policies
CREATE POLICY "Users can view own allocations"
  ON budget_allocations FOR SELECT
  USING (salary_config_id IN (SELECT id FROM salary_configs WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own allocations"
  ON budget_allocations FOR INSERT
  WITH CHECK (salary_config_id IN (SELECT id FROM salary_configs WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own allocations"
  ON budget_allocations FOR UPDATE
  USING (salary_config_id IN (SELECT id FROM salary_configs WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own allocations"
  ON budget_allocations FOR DELETE
  USING (salary_config_id IN (SELECT id FROM salary_configs WHERE user_id = auth.uid()));

-- pay_periods policies
CREATE POLICY "Users can view own pay periods"
  ON pay_periods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pay periods"
  ON pay_periods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pay periods"
  ON pay_periods FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pay periods"
  ON pay_periods FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. FUNCTIONS
-- ============================================

-- Function to auto-seed salary config and default allocations for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_config_id UUID;
BEGIN
  -- Create default salary config
  INSERT INTO public.salary_configs (user_id, name, full_time_salary)
  VALUES (NEW.id, 'My Salary', 20000)
  RETURNING id INTO new_config_id;

  -- Seed default budget allocations
  INSERT INTO public.budget_allocations (salary_config_id, category, percentage, description, icon_name, color, display_order)
  VALUES
    (new_config_id, 'Investment', 0.50, 'Business, tools, resources', 'TrendingUp', 'hsl(160, 84%, 39%)', 1),
    (new_config_id, 'Utilities', 0.20, 'Electricity, water, transportation', 'Zap', 'hsl(217, 91%, 60%)', 2),
    (new_config_id, 'Consumable', 0.20, 'Food, drinking water, daily necessities', 'ShoppingCart', 'hsl(38, 92%, 50%)', 3),
    (new_config_id, 'Emergency', 0.05, 'Health insurance, emergency funds', 'ShieldAlert', 'hsl(346, 77%, 50%)', 4),
    (new_config_id, 'Spare', 0.05, 'Personal discretionary spending', 'Sparkles', 'hsl(270, 76%, 55%)', 5);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-seed on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER set_salary_configs_updated_at
  BEFORE UPDATE ON salary_configs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_budget_allocations_updated_at
  BEFORE UPDATE ON budget_allocations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_pay_periods_updated_at
  BEFORE UPDATE ON pay_periods
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
