-- Migration: Add Fund Tracker tables
-- Tables: held_funds, allocation_expenses

-- ============================================
-- HELD FUNDS (must be created first, referenced by allocation_expenses)
-- ============================================

CREATE TABLE held_funds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL,
  original_amount NUMERIC NOT NULL CHECK (original_amount > 0),
  current_amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  is_returned BOOLEAN NOT NULL DEFAULT false,
  returned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE held_funds ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own held funds"
  ON held_funds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own held funds"
  ON held_funds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own held funds"
  ON held_funds FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own held funds"
  ON held_funds FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_held_funds_user_id ON held_funds(user_id);

-- Trigger for updated_at
CREATE TRIGGER set_held_funds_updated_at
  BEFORE UPDATE ON held_funds
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- ALLOCATION EXPENSES
-- ============================================

CREATE TABLE allocation_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  allocation_id UUID NOT NULL REFERENCES budget_allocations(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  paid_by TEXT,
  shared_total NUMERIC,
  shared_parties INTEGER DEFAULT 1,
  borrowing_id UUID REFERENCES borrowings(id) ON DELETE SET NULL,
  held_fund_id UUID REFERENCES held_funds(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE allocation_expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own allocation expenses"
  ON allocation_expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own allocation expenses"
  ON allocation_expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own allocation expenses"
  ON allocation_expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own allocation expenses"
  ON allocation_expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_allocation_expenses_user_id ON allocation_expenses(user_id);
CREATE INDEX idx_allocation_expenses_allocation_id ON allocation_expenses(allocation_id);
CREATE INDEX idx_allocation_expenses_held_fund_id ON allocation_expenses(held_fund_id);

-- Trigger for updated_at
CREATE TRIGGER set_allocation_expenses_updated_at
  BEFORE UPDATE ON allocation_expenses
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
