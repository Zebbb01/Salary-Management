-- ============================================
-- Consumable budget tracker
-- ============================================

-- Add monthly consumable allowance to salary_configs
ALTER TABLE salary_configs
  ADD COLUMN IF NOT EXISTS consumable_allowance NUMERIC NOT NULL DEFAULT 4500;

-- Daily consumable expense entries
CREATE TABLE IF NOT EXISTS public.consumable_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  month TEXT NOT NULL, -- e.g. '2026-06'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE consumable_expenses ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own consumable_expenses"
  ON consumable_expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consumable_expenses"
  ON consumable_expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own consumable_expenses"
  ON consumable_expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own consumable_expenses"
  ON consumable_expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_consumable_expenses_user_id ON consumable_expenses(user_id);
CREATE INDEX idx_consumable_expenses_month ON consumable_expenses(month);
CREATE INDEX idx_consumable_expenses_date ON consumable_expenses(expense_date DESC);

-- Updated_at trigger
CREATE TRIGGER set_consumable_expenses_updated_at
  BEFORE UPDATE ON consumable_expenses
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
