-- Performance optimization indexes for dashboard queries and range filters

CREATE INDEX IF NOT EXISTS idx_spare_transactions_date ON spare_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_borrowing_expenses_date ON borrowing_expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_borrowings_settled_at ON borrowings(settled_at DESC);
CREATE INDEX IF NOT EXISTS idx_allocation_expenses_alloc_date ON allocation_expenses(allocation_id, expense_date DESC);
