-- Add is_fixed column to budget_allocations
ALTER TABLE budget_allocations
  ADD COLUMN is_fixed BOOLEAN NOT NULL DEFAULT false;
