-- Migration: Add part_time_salary to salary_configs
-- Supports multiple income sources (full-time + part-time)

ALTER TABLE salary_configs
ADD COLUMN IF NOT EXISTS part_time_salary numeric DEFAULT 0 NOT NULL;
