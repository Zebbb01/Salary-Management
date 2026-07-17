'use client';

import { useState, useCallback } from 'react';
import { BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatPHP } from '@/features/salary/utils/calculations';
import { MobileChartDetails } from '../ui/mobile-chart-details';

interface TrendDataPoint {
  label: string;
  fullLabel?: string;
  income: number;
  netPay: number;
  expenses: number;
  spare: number;
  tax: number;
  savings: number;
}

interface TrendChartProps {
  trendData: TrendDataPoint[];
  trendLimit: number;
  onTrendLimitChange: (limit: number) => void;
  isMobile: boolean;
}

export function TrendChart({
  trendData,
  trendLimit,
  onTrendLimitChange,
  isMobile,
}: TrendChartProps) {
  const [selectedPoint, setSelectedPoint] = useState<TrendDataPoint | null>(null);
  const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>({
    income: true,
    netPay: true,
    expenses: true,
    spare: false,
    tax: false,
    savings: false,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLegendClick = useCallback((e: any) => {
    const dataKey = e.dataKey;
    if (!dataKey) return;
    setVisibleSeries((prev) => ({
      ...prev,
      [dataKey]: !prev[dataKey],
    }));
  }, []);

  const [prevTrendData, setPrevTrendData] = useState(trendData);
  if (trendData !== prevTrendData) {
    setPrevTrendData(trendData);
    setSelectedPoint(null);
  }

  // Format fields for mobile view
  const detailFields = selectedPoint
    ? [
        { label: 'Gross Income', value: `PHP ${formatPHP(selectedPoint.income)}`, color: '#34d399' },
        { label: 'Net Pay', value: `PHP ${formatPHP(selectedPoint.netPay)}`, color: '#38bdf8' },
        { label: 'Expenses', value: `PHP ${formatPHP(selectedPoint.expenses)}`, color: '#f472b6' },
        { label: 'Spare Remaining', value: `PHP ${formatPHP(selectedPoint.spare)}`, color: '#a78bfa' },
        { label: 'Tax', value: `PHP ${formatPHP(selectedPoint.tax)}`, color: '#fbbf24' },
        { label: 'Savings', value: `PHP ${formatPHP(selectedPoint.savings)}`, color: '#2dd4bf' },
      ]
    : [];

  return (
    <Card className="border-border bg-card/40 backdrop-blur-md overflow-visible">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Financial Trend</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {[
              { label: '3', value: 3 },
              { label: '6', value: 6 },
              { label: '12', value: 12 },
              { label: 'All', value: 100 },
            ].map((filter) => (
              <Button
                key={filter.value}
                variant={trendLimit === filter.value ? 'secondary' : 'ghost'}
                size="sm"
                className={cn(
                  'h-7 px-2.5 text-xs font-medium cursor-pointer',
                  trendLimit === filter.value && 'bg-primary/10 text-primary'
                )}
                onClick={() => onTrendLimitChange(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
        <CardDescription className="text-xs">
          {trendLimit >= 100
            ? `All ${trendData.length} pay periods`
            : `Last ${trendData.length} pay period${trendData.length !== 1 ? 's' : ''}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {trendData.length > 0 ? (
          <div className="flex flex-col">
            <div className="h-80 min-w-0 overflow-visible">
              <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 100, height: 320 }}>
                <AreaChart
                  data={trendData}
                  margin={{ top: 8, right: 45, left: 0, bottom: 8 }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onClick={(state: any) => {
                    if (isMobile && state && state.activePayload && state.activePayload.length > 0) {
                      setSelectedPoint(state.activePayload[0].payload);
                    }
                  }}
                >
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="netPayGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f472b6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#f472b6" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="spareGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="taxGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                    strokeOpacity={0.4}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    dy={8}
                    interval="preserveStartEnd"
                    tickFormatter={(v: string) => v.length > 22 ? v.slice(0, 20) + '...' : v}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
                    width={55}
                  />
                  <Tooltip
                    allowEscapeViewBox={{ x: false, y: false }}
                    offset={15}
                    isAnimationActive={false}
                    cursor={isMobile ? false : { stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                    wrapperStyle={{ outline: 'none', zIndex: 50 }}
                    active={isMobile ? false : undefined}
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      return (
                        <div className="rounded-xl border border-border bg-card/90 p-3 shadow-lg backdrop-blur-md min-w-[200px]">
                          <p className="text-xs font-semibold mb-2 text-foreground">
                            {payload[0].payload.fullLabel || payload[0].payload.label}
                          </p>
                          <div className="space-y-1.5">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {payload.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between gap-4 text-xs">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <span
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                  />
                                  <span>{item.name}</span>
                                </div>
                                <span className="font-semibold text-foreground tabular-nums">
                                  PHP {formatPHP(item.value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    onClick={handleLegendClick}
                    wrapperStyle={{ fontSize: 12, paddingTop: 16, cursor: 'pointer' }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: string, entry: any) => {
                      const dataKey = entry.dataKey;
                      const isVisible = visibleSeries[dataKey];
                      return (
                        <span
                          style={{
                            color: isVisible ? 'hsl(var(--muted-foreground))' : 'hsl(var(--muted-foreground)/0.4)',
                            fontSize: 12,
                            textDecoration: isVisible ? 'none' : 'line-through',
                          }}
                        >
                          {value}
                        </span>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Gross Income"
                    stroke="#34d399"
                    strokeWidth={2.5}
                    fill="url(#incomeGradient)"
                    hide={!visibleSeries.income}
                    dot={{ r: 3, fill: '#34d399', stroke: 'hsl(var(--background))', strokeWidth: 1.5 }}
                    activeDot={{ r: 5, fill: '#34d399', stroke: '#fff', strokeWidth: 1.5 }}
                    animationDuration={800}
                  />
                  <Area
                    type="monotone"
                    dataKey="netPay"
                    name="Net Pay"
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    fill="url(#netPayGradient)"
                    hide={!visibleSeries.netPay}
                    dot={{ r: 3, fill: '#38bdf8', stroke: 'hsl(var(--background))', strokeWidth: 1.5 }}
                    activeDot={{ r: 5, fill: '#38bdf8', stroke: '#fff', strokeWidth: 1.5 }}
                    animationDuration={800}
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    name="Expenses"
                    stroke="#f472b6"
                    strokeWidth={2.5}
                    fill="url(#expensesGradient)"
                    hide={!visibleSeries.expenses}
                    dot={{ r: 3, fill: '#f472b6', stroke: 'hsl(var(--background))', strokeWidth: 1.5 }}
                    activeDot={{ r: 5, fill: '#f472b6', stroke: '#fff', strokeWidth: 1.5 }}
                    animationDuration={800}
                  />
                  <Area
                    type="monotone"
                    dataKey="spare"
                    name="Spare"
                    stroke="#a78bfa"
                    strokeWidth={2.5}
                    fill="url(#spareGradient)"
                    hide={!visibleSeries.spare}
                    dot={{ r: 3, fill: '#a78bfa', stroke: 'hsl(var(--background))', strokeWidth: 1.5 }}
                    activeDot={{ r: 5, fill: '#a78bfa', stroke: '#fff', strokeWidth: 1.5 }}
                    animationDuration={800}
                  />
                  <Area
                    type="monotone"
                    dataKey="tax"
                    name="Tax"
                    stroke="#fbbf24"
                    strokeWidth={2.5}
                    fill="url(#taxGradient)"
                    hide={!visibleSeries.tax}
                    dot={{ r: 3, fill: '#fbbf24', stroke: 'hsl(var(--background))', strokeWidth: 1.5 }}
                    activeDot={{ r: 5, fill: '#fbbf24', stroke: '#fff', strokeWidth: 1.5 }}
                    animationDuration={800}
                  />
                  <Area
                    type="monotone"
                    dataKey="savings"
                    name="Savings"
                    stroke="#2dd4bf"
                    strokeWidth={2.5}
                    fill="url(#savingsGradient)"
                    hide={!visibleSeries.savings}
                    dot={{ r: 3, fill: '#2dd4bf', stroke: 'hsl(var(--background))', strokeWidth: 1.5 }}
                    activeDot={{ r: 5, fill: '#2dd4bf', stroke: '#fff', strokeWidth: 1.5 }}
                    animationDuration={800}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Mobile Touch Details Panel */}
            <MobileChartDetails
              title={selectedPoint ? `Details: ${selectedPoint.fullLabel || selectedPoint.label}` : ''}
              fields={detailFields}
              visible={isMobile && selectedPoint !== null}
              onClose={() => setSelectedPoint(null)}
            />
          </div>
        ) : (
          <div className="flex h-80 items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
                <BarChart3 className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">No trend data yet</p>
                <p className="text-xs text-muted-foreground/60">
                  Save your first pay period to see the trend
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
