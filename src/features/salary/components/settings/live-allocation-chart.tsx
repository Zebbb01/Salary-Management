'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, PieChart as LucidePieChart } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { formatPHP, formatPercentage } from '@/features/salary/utils/calculations';
import { MobileChartDetails } from '../ui/mobile-chart-details';
import type { BudgetAllocation } from '@/features/salary/types/salary.types';

interface LiveAllocationChartProps {
  allocations: BudgetAllocation[];
  allocationAmounts: Record<string, number>;
  totalSalary: number;
  isMobile: boolean;
}

interface AllocationSlice {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  fill: string;
}

const CATEGORY_COLORS = [
  '#38bdf8', // sky
  '#a78bfa', // violet
  '#f472b6', // pink
  '#fbbf24', // amber
  '#2dd4bf', // teal
  '#f87171', // red
  '#fb7185', // rose
];

export function LiveAllocationChart({
  allocations,
  allocationAmounts,
  totalSalary,
  isMobile,
}: LiveAllocationChartProps) {
  const [selectedSlice, setSelectedSlice] = useState<AllocationSlice | null>(null);

  // Reset selected slice on amount change
  const [prevAmounts, setPrevAmounts] = useState(allocationAmounts);
  const [prevTotal, setPrevTotal] = useState(totalSalary);
  if (allocationAmounts !== prevAmounts || totalSalary !== prevTotal) {
    setPrevAmounts(allocationAmounts);
    setPrevTotal(totalSalary);
    setSelectedSlice(null);
  }

  if (totalSalary <= 0) return null;

  // Calculate allocations
  const totalAllocated = allocations.reduce((sum, a) => sum + (allocationAmounts[a.id] ?? 0), 0);
  const slices: AllocationSlice[] = allocations.map((a, index) => {
    const amt = allocationAmounts[a.id] ?? 0;
    return {
      id: a.id,
      name: a.category,
      amount: amt,
      percentage: totalSalary > 0 ? amt / totalSalary : 0,
      fill: a.color || CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    };
  }).filter(s => s.amount > 0);

  const remaining = totalSalary - totalAllocated;
  const isOverAllocated = remaining < 0;

  if (remaining > 0) {
    slices.push({
      id: 'spare-unallocated',
      name: 'Unallocated Spare',
      amount: remaining,
      percentage: remaining / totalSalary,
      fill: '#34d399', // emerald
    });
  }

  const detailFields = selectedSlice
    ? [
        { label: 'Category', value: selectedSlice.name, color: selectedSlice.fill },
        { label: 'Percentage', value: formatPercentage(selectedSlice.percentage), color: '#a78bfa' },
        { label: 'Amount', value: `PHP ${formatPHP(selectedSlice.amount)}`, color: '#38bdf8' },
      ]
    : [];

  return (
    <Card className="border-border bg-card/40 backdrop-blur-md overflow-visible">
      <CardHeader className="pb-1">
        <div className="flex items-center gap-2">
          <LucidePieChart className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base font-semibold">Live Allocation Preview</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Real-time preview of your budget percentage distribution
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <AnimatePresence>
          {isOverAllocated && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-rose-400 flex items-start gap-2 text-xs"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Over-allocated Salary</p>
                <p className="text-rose-400/80">
                  Allocations exceed your total salary by PHP {formatPHP(Math.abs(remaining))}.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col">
          <div className="h-72 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 100, height: 288 }}>
              <PieChart>
                <Pie
                  data={slices}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={2}
                  dataKey="amount"
                  strokeWidth={0}
                  animationDuration={600}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onClick={(state: any) => {
                    if (isMobile && state && state.payload) {
                      setSelectedSlice(state.payload);
                    }
                  }}
                >
                  {slices.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.fill}
                      style={{ outline: 'none', cursor: 'pointer' }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  allowEscapeViewBox={{ x: false, y: false }}
                  isAnimationActive={false}
                  active={isMobile ? false : undefined}
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-border bg-card/90 p-3 shadow-lg backdrop-blur-md min-w-[150px]">
                        <p className="text-xs font-semibold capitalize text-foreground mb-1">
                          {data.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatPercentage(data.percentage)} &bull; PHP {formatPHP(data.amount)}
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Mobile slices details */}
          <MobileChartDetails
            title={selectedSlice ? `Allocation Detail` : ''}
            fields={detailFields}
            visible={isMobile && selectedSlice !== null}
            onClose={() => setSelectedSlice(null)}
          />
        </div>

        {/* Breakdown Summary List */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground border-b border-border/40 pb-1.5 px-1">
            <span>Category</span>
            <span>Allocated</span>
          </div>
          <div className="max-h-[160px] overflow-y-auto pr-1 scrollbar-thin space-y-1.5">
            {slices.map((slice, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 text-xs px-1 hover:bg-muted/30 py-1 rounded transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: slice.fill }} />
                  <span className="text-foreground capitalize font-medium truncate">{slice.name}</span>
                </div>
                <span className="font-semibold text-muted-foreground tabular-nums shrink-0 whitespace-nowrap text-[11px]">
                  PHP {formatPHP(slice.amount)} ({Math.round(slice.percentage * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
