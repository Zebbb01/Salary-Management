-- Add total_deductions column to pay_periods
-- Run this in Supabase SQL Editor

ALTER TABLE pay_periods
ADD COLUMN IF NOT EXISTS total_deductions numeric null default 0;
