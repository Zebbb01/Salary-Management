'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export interface MonthYearSelection {
  month: number; // 0-indexed
  year: number;
}

interface MonthYearPickerProps {
  /** Current selection (null = not selected / cleared) */
  value: MonthYearSelection | null;
  /** Called when user picks a month or clears */
  onChange: (value: MonthYearSelection | null) => void;
  /** Placeholder text when nothing selected */
  placeholder?: string;
  /** Optional className for the trigger button */
  className?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Minimum selectable date (defaults to no limit) */
  minDate?: { month: number; year: number };
  /** Maximum selectable date (defaults to current month) */
  maxDate?: { month: number; year: number };
}

export function MonthYearPicker({
  value,
  onChange,
  placeholder = 'Pick a month',
  className,
  disabled = false,
  minDate,
  maxDate,
}: MonthYearPickerProps) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const effectiveMax = maxDate ?? { month: currentMonth, year: currentYear };

  const [viewYear, setViewYear] = React.useState(value?.year ?? currentYear);
  const [open, setOpen] = React.useState(false);

  // Sync view year when value changes
  React.useEffect(() => {
    if (value) setViewYear(value.year);
  }, [value]);

  const canGoNext = viewYear < effectiveMax.year;
  const canGoPrev = minDate ? viewYear > minDate.year : true;

  const isMonthDisabled = (monthIndex: number): boolean => {
    if (viewYear > effectiveMax.year) return true;
    if (viewYear === effectiveMax.year && monthIndex > effectiveMax.month) return true;
    if (minDate) {
      if (viewYear < minDate.year) return true;
      if (viewYear === minDate.year && monthIndex < minDate.month) return true;
    }
    return false;
  };

  const isMonthSelected = (monthIndex: number): boolean => {
    return value !== null && value.month === monthIndex && value.year === viewYear;
  };

  const isCurrentMonth = (monthIndex: number): boolean => {
    return monthIndex === currentMonth && viewYear === currentYear;
  };

  const handleSelect = (monthIndex: number) => {
    if (isMonthDisabled(monthIndex)) return;
    onChange({ month: monthIndex, year: viewYear });
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setOpen(false);
  };

  const displayLabel = value
    ? `${MONTHS_FULL[value.month]} ${value.year}`
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <button
            type="button"
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap',
              value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
              disabled && 'opacity-50 cursor-not-allowed',
              className
            )}
          />
        }
      >
        <CalendarDays className="h-3 w-3" />
        <span>{displayLabel ?? placeholder}</span>
        {value && (
          <span
            role="button"
            tabIndex={-1}
            onClick={handleClear}
            className="ml-0.5 rounded-full p-0.5 hover:bg-primary-foreground/20 transition-colors"
          >
            <X className="h-2.5 w-2.5" />
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-3">
        {/* Year navigation */}
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewYear((y) => y - 1)}
            disabled={!canGoPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold tabular-nums">{viewYear}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewYear((y) => y + 1)}
            disabled={!canGoNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-3 gap-1.5">
          {MONTHS.map((label, index) => {
            const selected = isMonthSelected(index);
            const current = isCurrentMonth(index);
            const disabledMonth = isMonthDisabled(index);

            return (
              <button
                key={label}
                type="button"
                disabled={disabledMonth}
                onClick={() => handleSelect(index)}
                className={cn(
                  'relative rounded-md px-2 py-2 text-xs font-medium transition-all duration-150 cursor-pointer',
                  selected
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : current
                      ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                      : 'text-foreground hover:bg-muted',
                  disabledMonth && 'opacity-30 cursor-not-allowed hover:bg-transparent'
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Quick actions */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
          <button
            type="button"
            onClick={() => {
              setViewYear(currentYear);
              onChange({ month: currentMonth, year: currentYear });
              setOpen(false);
            }}
            className="text-[11px] text-primary hover:underline cursor-pointer"
          >
            This month
          </button>
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Clear filter
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Utility: Convert MonthYearSelection to dateFrom/dateTo timezone-safe strings.
 * Uses YYYY-MM-DD format to avoid UTC offset issues (e.g. midnight in UTC+8
 * becoming the previous day in UTC via .toISOString()).
 */
export function monthYearToDateRange(selection: MonthYearSelection): {
  dateFrom: string;
  dateTo: string;
} {
  const { month, year } = selection;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const dateFrom = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const dateTo = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59`;
  return { dateFrom, dateTo };
}
