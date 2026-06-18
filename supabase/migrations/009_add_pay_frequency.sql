-- Add pay frequency to salary configs
-- Supports: weekly, bi-weekly, semi-monthly (default), monthly
ALTER TABLE salary_configs 
  ADD COLUMN pay_frequency TEXT NOT NULL DEFAULT 'semi-monthly';

-- Add check constraint
ALTER TABLE salary_configs
  ADD CONSTRAINT salary_configs_pay_frequency_check
  CHECK (pay_frequency IN ('weekly', 'bi-weekly', 'semi-monthly', 'monthly'));
