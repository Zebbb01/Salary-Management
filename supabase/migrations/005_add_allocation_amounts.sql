-- Add allocation_amounts JSONB column to pay_periods
-- This stores dynamic budget allocation amounts per pay period,
-- replacing the hardcoded rent/electricity/savings columns for new periods.
-- Old columns are kept for backward compatibility.

ALTER TABLE public.pay_periods
  ADD COLUMN IF NOT EXISTS allocation_amounts JSONB DEFAULT '[]'::jsonb;

-- Add a comment for documentation
COMMENT ON COLUMN public.pay_periods.allocation_amounts IS
  'Array of {allocation_id, category, budgeted, actual} objects linking pay periods to budget allocations';
