ALTER TABLE pay_periods
ADD COLUMN IF NOT EXISTS additional_income jsonb null default '[]'::jsonb;
