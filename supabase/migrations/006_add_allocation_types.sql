-- Add allocation_types table for user-defined budget categories
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. ALLOCATION TYPES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS allocation_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  classification TEXT NOT NULL DEFAULT 'expense' CHECK (classification IN ('expense', 'asset')),
  color TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. ADD allocation_type_id TO budget_allocations
-- ============================================

ALTER TABLE budget_allocations
ADD COLUMN IF NOT EXISTS allocation_type_id UUID REFERENCES allocation_types(id) ON DELETE SET NULL;

-- ============================================
-- 3. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE allocation_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own allocation types"
  ON allocation_types FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own allocation types"
  ON allocation_types FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own allocation types"
  ON allocation_types FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own allocation types"
  ON allocation_types FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE TRIGGER set_updated_at_allocation_types
  BEFORE UPDATE ON allocation_types
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
