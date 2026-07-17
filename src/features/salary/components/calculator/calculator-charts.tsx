'use client';

import { useState } from 'react';
import { CreditCard, LineChart as LucideLineChart, Landmark } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { formatPHP } from '@/features/salary/utils/calculations';
import { MobileChartDetails } from '../ui/mobile-chart-details';
import type { CalculationResult, ConsumableBudgetSummary } from '@/features/salary/types/salary.types';

interface CalculatorChartsProps {
  calculationResult: CalculationResult | null;
  consumableSummary: ConsumableBudgetSummary | null;
  isMobile: boolean;
}

interface BreakdownSlice {
  name: string;
  value: number;
  fill: string;
}

interface BurnRatePoint {
  day: number;
  label: string;
  targetLimit: number;
  actualSpent: number | null;
}

export function CalculatorCharts({
  calculationResult,
  consumableSummary,
  isMobile,
}: CalculatorChartsProps) {
  const [selectedSlice, setSelectedSlice] = useState<BreakdownSlice | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<BurnRatePoint | null>(null);

  // Reset selections on data changes
  const [prevResult, setPrevResult] = useState(calculationResult);
  const [prevSummary, setPrevSummary] = useState(consumableSummary);
  if (calculationResult !== prevResult || consumableSummary !== prevSummary) {
    setPrevResult(calculationResult);
    setPrevSummary(consumableSummary);
    setSelectedSlice(null);
    setSelectedPoint(null);
  }

  // 1. Wage Breakdown Donut Chart
  let breakdownData: BreakdownSlice[] = [];
  if (calculationResult && calculationResult.totalIncome > 0) {
    const tax = calculationResult.totalTax;
    const allocated = calculationResult.totalAllocated;
    const spare = calculationResult.spareAmount;

    breakdownData = [
      { name: 'Income Tax', value: tax, fill: '#fbbf24' }, // amber
      { name: 'Allocated Budget', value: allocated, fill: '#38bdf8' }, // sky
      { name: 'Spare Cash', value: spare, fill: '#34d399' }, // emerald
    ].filter((item) => item.value > 0);
  }

  // 2. Daily Consumable Burn Rate Line Chart
  const burnRateData: BurnRatePoint[] = [];
  if (consumableSummary) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Sort expenses chronologically
    const sortedExpenses = [...(consumableSummary.expenses || [])].sort(
      (a, b) => new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime()
    );

    // Group expenses by day of month
    const dailySpendMap = new Map<number, number>();
    sortedExpenses.forEach((exp) => {
      const expDate = new Date(exp.expense_date);
      if (expDate.getMonth() === month && expDate.getFullYear() === year) {
        const day = expDate.getDate();
        dailySpendMap.set(day, (dailySpendMap.get(day) || 0) + Number(exp.amount));
      }
    });

    const dailyAllowance = consumableSummary.allowance / daysInMonth;
    let cumulativeActual = 0;
    
    // Build burn-rate data points for days elapsed up to today, plus rest of month target
    const currentDay = now.getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const targetLimit = Math.round(dailyAllowance * day);
      
      const daySpend = dailySpendMap.get(day) || 0;
      
      // Only plot actual cumulative spent up to the current day
      if (day <= currentDay) {
        cumulativeActual += daySpend;
      }

      burnRateData.push({
        day,
        label: `Day ${day}`,
        targetLimit,
        actualSpent: day <= currentDay ? Math.round(cumulativeActual) : null,
      });
    }
  }

  const sliceFields = selectedSlice
    ? [
        { label: 'Category', value: selectedSlice.name },
        { label: 'Amount', value: `PHP ${formatPHP(selectedSlice.value)}`, color: selectedSlice.fill },
      ]
    : [];

  const pointFields = selectedPoint
    ? [
        { label: 'Timeline', value: selectedPoint.label },
        { label: 'Budget Target', value: `PHP ${formatPHP(selectedPoint.targetLimit)}`, color: '#a78bfa' },
        { label: 'Actual Spent', value: selectedPoint.actualSpent !== null ? `PHP ${formatPHP(selectedPoint.actualSpent)}` : 'N/A', color: '#f472b6' },
      ]
    : [];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Donut Wage Breakdown */}
      <Card className="border-border bg-card/40 backdrop-blur-md overflow-visible">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Wage Allocation Breakdown</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Where your calculated wages are distributed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {breakdownData.length > 0 ? (
            <div className="flex flex-col">
              <div className="h-72 w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 100, height: 288 }}>
                  <PieChart>
                    <Pie
                      data={breakdownData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                      animationDuration={800}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      onClick={(state: any) => {
                        if (isMobile && state && state.payload) {
                          setSelectedSlice(state.payload);
                        }
                      }}
                    >
                      {breakdownData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} style={{ outline: 'none', cursor: 'pointer' }} />
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
                            <p className="text-xs font-semibold text-foreground mb-1">{data.name}</p>
                            <p className="text-xs font-bold text-foreground">
                              PHP {formatPHP(data.value)}
                            </p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Mobile details for Donut breakdown */}
              <MobileChartDetails
                title={selectedSlice ? `Breakdown: ${selectedSlice.name}` : ''}
                fields={sliceFields}
                visible={isMobile && selectedSlice !== null}
                onClose={() => setSelectedSlice(null)}
              />
            </div>
          ) : (
            <div className="flex h-72 items-center justify-center border border-dashed border-border/60 rounded-xl">
              <div className="flex flex-col items-center gap-2 text-center py-8">
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-muted/40 text-muted-foreground/50">
                  <Landmark className="h-5 w-5" />
                </div>
                <p className="text-xs text-muted-foreground">Calculate salary to see breakdown</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Burn Rate line graph */}
      <Card className="border-border bg-card/40 backdrop-blur-md overflow-visible">
        <CardHeader>
          <div className="flex items-center gap-2">
            <LucideLineChart className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Spending Velocity (Burn-Rate)</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Cumulative daily spending vs target monthly budget line
          </CardDescription>
        </CardHeader>
        <CardContent>
          {burnRateData.length > 0 ? (
            <div className="flex flex-col">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 100, height: 288 }}>
                  <LineChart
                    data={burnRateData}
                    margin={{ top: 15, right: 15, left: 0, bottom: 5 }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onClick={(state: any) => {
                      if (isMobile && state && state.activePayload && state.activePayload.length > 0) {
                        setSelectedPoint(state.activePayload[0].payload);
                      }
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                      strokeOpacity={0.4}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
                      width={50}
                    />
                    <Tooltip
                      allowEscapeViewBox={{ x: false, y: false }}
                      isAnimationActive={false}
                      active={isMobile ? false : undefined}
                      cursor={isMobile ? false : { stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                      content={({ active, payload }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-border bg-card/90 p-3 shadow-lg backdrop-blur-md min-w-[170px]">
                            <p className="text-xs font-semibold text-foreground mb-1.5">{data.label}</p>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between gap-3">
                                <span className="text-muted-foreground">Target limit:</span>
                                <span className="font-semibold text-foreground">PHP {formatPHP(data.targetLimit)}</span>
                              </div>
                              {data.actualSpent !== null && (
                                <div className="flex justify-between gap-3">
                                  <span className="text-muted-foreground">Actual spent:</span>
                                  <span className="font-semibold text-foreground text-pink-400">PHP {formatPHP(data.actualSpent)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="targetLimit"
                      name="Budget Target"
                      stroke="#a78bfa"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="actualSpent"
                      name="Actual Spent"
                      stroke="#f472b6"
                      strokeWidth={2.5}
                      connectNulls
                      dot={false}
                      activeDot={isMobile ? false : { r: 5, strokeWidth: 1 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Mobile burn rate point details */}
              <MobileChartDetails
                title={selectedPoint ? `Day ${selectedPoint.day} Analysis` : ''}
                fields={pointFields}
                visible={isMobile && selectedPoint !== null}
                onClose={() => setSelectedPoint(null)}
              />
            </div>
          ) : (
            <div className="flex h-72 items-center justify-center border border-dashed border-border/60 rounded-xl">
              <div className="flex flex-col items-center gap-2 text-center py-8">
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-muted/40 text-muted-foreground/50">
                  <CreditCard className="h-5 w-5" />
                </div>
                <p className="text-xs text-muted-foreground">Log expenses to see burn velocity</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
