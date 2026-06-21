-- ============================================
-- Monthly consumable budget snapshots
-- ============================================

CREATE TABLE IF NOT EXISTS public.consumable_monthly_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  allowance NUMERIC NOT NULL,
  total_spent NUMERIC NOT NULL,
  remaining NUMERIC NOT NULL,
  is_over_budget BOOLEAN NOT NULL DEFAULT false,
  expense_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, month)
);

ALTER TABLE consumable_monthly_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consumable_monthly_records"
  ON consumable_monthly_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own consumable_monthly_records"
  ON consumable_monthly_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own consumable_monthly_records"
  ON consumable_monthly_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own consumable_monthly_records"
  ON consumable_monthly_records FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_consumable_monthly_records_user ON consumable_monthly_records(user_id);
CREATE INDEX idx_consumable_monthly_records_month ON consumable_monthly_records(month DESC);
