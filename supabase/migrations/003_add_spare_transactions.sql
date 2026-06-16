-- Create spare_transactions table
CREATE TABLE public.spare_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pay_period_id uuid NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT spare_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT spare_transactions_pay_period_id_fkey
    FOREIGN KEY (pay_period_id) REFERENCES pay_periods(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE spare_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own spare_transactions"
  ON spare_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spare_transactions"
  ON spare_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own spare_transactions"
  ON spare_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_spare_transactions_pay_period ON spare_transactions(pay_period_id);
CREATE INDEX idx_spare_transactions_user_id ON spare_transactions(user_id);

-- Updated_at trigger
CREATE TRIGGER set_spare_transactions_updated_at
  BEFORE UPDATE ON spare_transactions
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
