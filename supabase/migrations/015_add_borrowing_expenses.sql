-- ============================================
-- Borrowing expenses (track spending per borrowing)
-- ============================================

CREATE TABLE IF NOT EXISTS public.borrowing_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  borrowing_id UUID NOT NULL REFERENCES borrowings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE borrowing_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own borrowing_expenses"
  ON borrowing_expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own borrowing_expenses"
  ON borrowing_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own borrowing_expenses"
  ON borrowing_expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own borrowing_expenses"
  ON borrowing_expenses FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_borrowing_expenses_borrowing ON borrowing_expenses(borrowing_id);
CREATE INDEX idx_borrowing_expenses_user ON borrowing_expenses(user_id);

CREATE TRIGGER set_borrowing_expenses_updated_at
  BEFORE UPDATE ON borrowing_expenses
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
