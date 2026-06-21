-- ============================================
-- Borrowing / Lending tracker
-- ============================================

CREATE TABLE IF NOT EXISTS public.borrowings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('borrowed', 'lent')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_settled BOOLEAN NOT NULL DEFAULT false,
  settled_at TIMESTAMPTZ,
  pay_period_id UUID REFERENCES pay_periods(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE borrowings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own borrowings"
  ON borrowings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own borrowings"
  ON borrowings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own borrowings"
  ON borrowings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own borrowings"
  ON borrowings FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_borrowings_user_id ON borrowings(user_id);
CREATE INDEX idx_borrowings_is_settled ON borrowings(is_settled);
CREATE INDEX idx_borrowings_transaction_date ON borrowings(transaction_date DESC);

-- Updated_at trigger
CREATE TRIGGER set_borrowings_updated_at
  BEFORE UPDATE ON borrowings
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
