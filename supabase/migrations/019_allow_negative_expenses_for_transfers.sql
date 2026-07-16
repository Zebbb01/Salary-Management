-- Migration: Allow negative allocation expenses for refunds and transfers
-- Description: Drops the check constraint requiring amounts to be strictly positive.

ALTER TABLE allocation_expenses DROP CONSTRAINT IF EXISTS allocation_expenses_amount_check;
