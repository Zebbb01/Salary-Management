-- Create bill_payments table for tracking monthly bill payment status
CREATE TABLE public.bill_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  allocation_id uuid NOT NULL,
  month text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  is_paid boolean NOT NULL DEFAULT false,
  paid_at timestamptz NULL,
  notes text NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT bill_payments_pkey PRIMARY KEY (id),
  CONSTRAINT bill_payments_allocation_id_fkey
    FOREIGN KEY (allocation_id) REFERENCES budget_allocations(id) ON DELETE CASCADE,
  CONSTRAINT bill_payments_unique UNIQUE (user_id, allocation_id, month)
);

-- Enable RLS
ALTER TABLE bill_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own bill_payments"
  ON bill_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bill_payments"
  ON bill_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bill_payments"
  ON bill_payments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bill_payments"
  ON bill_payments FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_bill_payments_user_month ON bill_payments(user_id, month);
CREATE INDEX idx_bill_payments_allocation ON bill_payments(allocation_id);

-- Updated_at trigger
CREATE TRIGGER set_bill_payments_updated_at
  BEFORE UPDATE ON bill_payments
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
