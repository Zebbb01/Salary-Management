'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { formatPHP } from '@/features/salary/utils/calculations';
import { MobileChartDetails } from '../ui/mobile-chart-details';
import type { PayPeriod } from '@/features/salary/types/salary.types';

interface IncomeExpensesChartProps {
  periods: PayPeriod[];
  isMobile: boolean;
}

interface ChartDataPoint {
  period: string;
  fullLabel: string;
  income: number;
  expenses: number;
}

export function IncomeExpensesChart({ periods, isMobile }: IncomeExpensesChartProps) {
  const [selectedPoint, setSelectedPoint] = useState<ChartDataPoint | null>(null);

  const [prevPeriods, setPrevPeriods] = useState(periods);
  if (periods !== prevPeriods) {
    setPrevPeriods(periods);
    setSelectedPoint(null);
  }

  const chartData = [...periods]
    .reverse()
    .map((p) => {
      const parts = p.period_label.split(' - ') ?? [];
      const monthYear = parts[0] ?? '';
      const wageType = parts[1] ?? '';

      let cleanLabel = monthYear;
      if (wageType) {
        const shortWage = wageType
          .replace('First Wage', 'W1')
          .replace('Second Wage', 'W2')
          .replace('Untracked Balance', 'Untracked');
        
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthAbbrs = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        let shortenedMonthYear = monthYear;
        for (let i = 0; i < monthNames.length; i++) {
          if (shortenedMonthYear.startsWith(monthNames[i])) {
            shortenedMonthYear = shortenedMonthYear.replace(monthNames[i], monthAbbrs[i]);
            break;
          }
        }
        shortenedMonthYear = shortenedMonthYear.replace(/ 20(\d{2})/, " '$1");
        cleanLabel = `${shortenedMonthYear} (${shortWage})`;
      }

      return {
        period: cleanLabel,
        fullLabel: p.period_label,
        income: (p.total_income ?? 0) - (p.total_tax ?? 0) - (p.total_deductions ?? 0),
        expenses: p.total_expenses ?? 0,
      };
    });

  if (chartData.length < 2) return null;

  const detailFields = selectedPoint
    ? [
        { label: 'Pay Period', value: selectedPoint.fullLabel },
        { label: 'Net Income', value: `PHP ${formatPHP(selectedPoint.income)}`, color: '#34d399' },
        { label: 'Expenses', value: `PHP ${formatPHP(selectedPoint.expenses)}`, color: '#f87171' },
      ]
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="overflow-visible border-border bg-card/40 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Income vs Expenses</CardTitle>
          <CardDescription className="text-xs">
            Compare your income and expenses across pay periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col">
            <div className="h-64 min-w-0">
              <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 100, height: 256 }}>
                <BarChart
                  data={chartData}
                  margin={{ top: 4, right: 20, left: 10, bottom: 0 }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onClick={(state: any) => {
                    if (isMobile && state && state.activePayload && state.activePayload.length > 0) {
                      setSelectedPoint(state.activePayload[0].payload);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    width={40}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                  />
                  <Tooltip
                    allowEscapeViewBox={{ x: false, y: false }}
                    offset={15}
                    isAnimationActive={false}
                    cursor={isMobile ? false : { fill: 'hsl(var(--muted))', fillOpacity: 0.1 }}
                    wrapperStyle={{ outline: 'none', zIndex: 50 }}
                    active={isMobile ? false : undefined}
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-border bg-card/90 p-3 shadow-lg backdrop-blur-md min-w-[170px]">
                          <p className="text-xs font-semibold text-foreground mb-1.5">{data.fullLabel}</p>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Net Income:</span>
                              <span className="font-semibold text-emerald-400">PHP {formatPHP(data.income)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Expenses:</span>
                              <span className="font-semibold text-rose-400">PHP {formatPHP(data.expenses)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="income" name="Income" fill="#34d399" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar dataKey="expenses" name="Expenses" fill="#f87171" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-3">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-400" />
                Income
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-rose-400" />
                Expenses
              </span>
            </div>

            {/* Mobile Touch details */}
            <MobileChartDetails
              title={selectedPoint ? `Selected Period Cashflow` : ''}
              fields={detailFields}
              visible={isMobile && selectedPoint !== null}
              onClose={() => setSelectedPoint(null)}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
