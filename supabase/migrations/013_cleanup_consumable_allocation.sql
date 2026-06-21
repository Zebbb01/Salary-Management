-- ============================================
-- Cleanup: Remove old "Consumable" allocation + migrate spare transactions
-- ============================================

-- Step 1: Delete any bill_payments referencing the Consumable allocation
DELETE FROM bill_payments
WHERE allocation_id = '0e00e682-d17f-47c2-90d8-ac0838250d65';

-- Step 2: Remove "Consumable" entries from allocation_amounts JSONB in all pay_periods
UPDATE pay_periods
SET allocation_amounts = (
  SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
  FROM jsonb_array_elements(allocation_amounts) AS elem
  WHERE lower(elem->>'category') != 'consumable'
)
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(allocation_amounts) AS elem
  WHERE lower(elem->>'category') = 'consumable'
);

-- Step 3: Zero out legacy consumable columns
UPDATE pay_periods
SET daily_consumable_rate = 0,
    daily_consumable_days = 0
WHERE daily_consumable_rate > 0 OR daily_consumable_days > 0;

-- Step 4: Recalculate total_expenses (only expense-type allocations + legacy fields)
UPDATE pay_periods
SET total_expenses = (
  COALESCE((
    SELECT SUM((elem->>'actual')::numeric)
    FROM jsonb_array_elements(allocation_amounts) AS elem
    WHERE elem->>'allocation_type' = 'expense'
  ), 0)
  + COALESCE(rent, 0)
  + COALESCE(electricity, 0)
  + COALESCE((
    SELECT SUM((item->>'amount')::numeric)
    FROM jsonb_array_elements(monthly_utils_items) AS item
  ), 0)
);

-- Step 5: Recalculate spare_amount (income - tax - deductions - all allocations)
UPDATE pay_periods
SET spare_amount = (
  COALESCE(total_income, 0)
  - COALESCE(total_tax, 0)
  - COALESCE(total_deductions, 0)
  - COALESCE((
    SELECT SUM((elem->>'actual')::numeric)
    FROM jsonb_array_elements(allocation_amounts) AS elem
  ), 0)
);

-- Step 6: Delete orphaned budget_allocations
DELETE FROM budget_allocations
WHERE id = '0e00e682-d17f-47c2-90d8-ac0838250d65'
   OR lower(category) = 'consumable';

-- ============================================
-- Step 7: Migrate spare transactions to consumable_expenses
-- ============================================
INSERT INTO consumable_expenses (id, user_id, description, amount, expense_date, month, created_at, updated_at)
VALUES
  (gen_random_uuid(), '6eb6b781-36aa-4e9f-8c2e-a7970b50e1f9', 'water 10L',                  15, '2026-06-18', '2026-06', '2026-06-18 12:57:31.271125+00', now()),
  (gen_random_uuid(), '6eb6b781-36aa-4e9f-8c2e-a7970b50e1f9', 'Mayo',                        23, '2026-06-16', '2026-06', '2026-06-16 06:00:34.714359+00', now()),
  (gen_random_uuid(), '6eb6b781-36aa-4e9f-8c2e-a7970b50e1f9', 'CalChess (2)',                 34, '2026-06-19', '2026-06', '2026-06-19 06:02:06.784457+00', now()),
  (gen_random_uuid(), '6eb6b781-36aa-4e9f-8c2e-a7970b50e1f9', 'police clearance',           180, '2026-06-16', '2026-06', '2026-06-16 07:07:57.693561+00', now()),
  (gen_random_uuid(), '6eb6b781-36aa-4e9f-8c2e-a7970b50e1f9', 'lunch ( 3 lumpya /w 1 rice )', 30, '2026-06-19', '2026-06', '2026-06-19 06:03:24.718961+00', now()),
  (gen_random_uuid(), '6eb6b781-36aa-4e9f-8c2e-a7970b50e1f9', 'ice 2x',                       6, '2026-06-18', '2026-06', '2026-06-18 12:57:17.855783+00', now()),
  (gen_random_uuid(), '6eb6b781-36aa-4e9f-8c2e-a7970b50e1f9', 'bfast ( chicken )',            35, '2026-06-19', '2026-06', '2026-06-19 06:02:43.50023+00', now()),
  (gen_random_uuid(), '6eb6b781-36aa-4e9f-8c2e-a7970b50e1f9', 'lunch',                        45, '2026-06-20', '2026-06', '2026-06-20 04:48:10.797055+00', now()),
  (gen_random_uuid(), '6eb6b781-36aa-4e9f-8c2e-a7970b50e1f9', 'snacks',                       96, '2026-06-20', '2026-06', '2026-06-20 04:48:19.865475+00', now());

-- Step 8: Delete the migrated spare transactions
DELETE FROM spare_transactions
WHERE id IN (
  '14221fd3-7dbd-4327-a31a-128ffa25605e',
  '16cc9e85-58fc-4c42-907c-e0df8c347e90',
  '194de7db-2276-44c1-9217-2d36309b4984',
  '2b9c66b2-7117-413e-9147-92bc928d998b',
  '54a06072-3a87-4186-a91e-0175c2b3f233',
  '7aeb2e15-fe24-46c6-9222-97d18bcde66b',
  '929d7b39-19fe-4194-a059-7fd18e0b6f6a',
  '9db62501-452b-4cd0-9072-49d64467846e',
  'a0fe9613-e481-472b-8923-cb3cc62a6a8b'
);

-- Verify: pay periods
SELECT id, period_label, total_expenses, spare_amount, total_income,
       jsonb_array_length(allocation_amounts) as alloc_count
FROM pay_periods ORDER BY created_at DESC LIMIT 5;

-- Verify: consumable expenses
SELECT description, amount, expense_date FROM consumable_expenses ORDER BY expense_date;
