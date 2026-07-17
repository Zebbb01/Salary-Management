'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatPHP, formatPercentage } from '@/features/salary/utils/calculations';
import { MobileChartDetails } from '../ui/mobile-chart-details';

interface BudgetAllocationPoint {
  name: string;
  category: string;
  value: number; // percentage (integer)
  amount: number;
  percentage: number; // decimal (0-1)
  fill: string;
}

interface BudgetPieChartProps {
  chartData: BudgetAllocationPoint[];
  totalSalary: number;
  isMobile: boolean;
  hasPartTime: boolean;
}

function CenterLabel({ salary }: { salary: number }) {
  return (
    <text
      x="50%"
      y="50%"
      textAnchor="middle"
      dominantBaseline="middle"
      className="fill-foreground"
    >
      <tspan x="50%" dy="-6" className="text-[10px] uppercase tracking-wider fill-muted-foreground">
        Total Salary
      </tspan>
      <tspan x="50%" dy="18" className="text-sm font-semibold fill-foreground">
        PHP {formatPHP(salary)}
      </tspan>
    </text>
  );
}

export function BudgetPieChart({
  chartData,
  totalSalary,
  isMobile,
  hasPartTime,
}: BudgetPieChartProps) {
  const [selectedSlice, setSelectedSlice] = useState<BudgetAllocationPoint | null>(null);

  const [prevChartData, setPrevChartData] = useState(chartData);
  if (chartData !== prevChartData) {
    setPrevChartData(chartData);
    setSelectedSlice(null);
  }

  const detailFields = selectedSlice
    ? [
        { label: 'Category', value: selectedSlice.category, color: selectedSlice.fill },
        { label: 'Percentage', value: formatPercentage(selectedSlice.percentage), color: '#a78bfa' },
        { label: 'Amount Allocated', value: `PHP ${formatPHP(selectedSlice.amount)}`, color: '#38bdf8' },
      ]
    : [];

  return (
    <Card className="h-full border-border bg-card/40 backdrop-blur-md overflow-visible">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          Budget Allocation
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger className="flex cursor-pointer">
                <Info className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground shrink-0" />
              </TooltipTrigger>
              <TooltipContent side="top">
                Detailed breakdown of allocation categories
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription className="text-xs">
          Percentage breakdown of your {hasPartTime ? 'combined ' : ''}salary
        </CardDescription>
      </CardHeader>

      <CardContent>
        {chartData.length > 0 ? (
          <div className="flex flex-col">
            <div className="h-96 flex items-center justify-center w-full relative">
              <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 100, height: 384 }}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={110}
                    outerRadius={160}
                    paddingAngle={3}
                    dataKey="amount"
                    strokeWidth={0}
                    animationBegin={200}
                    animationDuration={800}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onClick={(state: any) => {
                      if (isMobile && state && state.payload) {
                        setSelectedSlice(state.payload);
                      }
                    }}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.fill}
                        style={{ outline: 'none', cursor: 'pointer' }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    allowEscapeViewBox={{ x: false, y: false }}
                    offset={15}
                    isAnimationActive={false}
                    active={isMobile ? false : undefined}
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-border bg-card/90 p-3 shadow-lg backdrop-blur-md min-w-[150px]">
                          <p className="text-xs font-semibold capitalize text-foreground mb-1">
                            {data.category}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatPercentage(data.percentage)} &bull; PHP {formatPHP(data.amount)}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <CenterLabel salary={totalSalary} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Mobile Touch Details Panel */}
            <MobileChartDetails
              title={selectedSlice ? `Allocation Detail: ${selectedSlice.category}` : ''}
              fields={detailFields}
              visible={isMobile && selectedSlice !== null}
              onClose={() => setSelectedSlice(null)}
            />
          </div>
        ) : (
          <div className="flex h-96 items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No allocations configured
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
