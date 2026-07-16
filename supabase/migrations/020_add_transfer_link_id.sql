-- Migration: Add transfer_link_id to link transfer transactions
-- Tables: allocation_expenses, spare_transactions

ALTER TABLE allocation_expenses ADD COLUMN IF NOT EXISTS transfer_link_id UUID;
ALTER TABLE spare_transactions ADD COLUMN IF NOT EXISTS transfer_link_id UUID;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_allocation_expenses_transfer_link ON allocation_expenses(transfer_link_id);
CREATE INDEX IF NOT EXISTS idx_spare_transactions_transfer_link ON spare_transactions(transfer_link_id);
