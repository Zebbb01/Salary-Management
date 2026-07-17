'use client';

import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { formatPHP } from '@/features/salary/utils/calculations';
import { MobileChartDetails } from '../ui/mobile-chart-details';

interface CombinedCashflowTrendsProps {
  overallChartData: {
    monthLabel: string;
    income: number;
    spent: number;
  }[];
  isMobile: boolean;
}

interface ChartDataPoint {
  monthLabel: string;
  income: number;
  spent: number;
}

export function CombinedCashflowTrends({ overallChartData, isMobile }: CombinedCashflowTrendsProps) {
  const [selectedPoint, setSelectedPoint] = useState<ChartDataPoint | null>(null);

  const [prevData, setPrevData] = useState(overallChartData);
  if (overallChartData !== prevData) {
    setPrevData(overallChartData);
    setSelectedPoint(null);
  }

  const detailFields = selectedPoint
    ? [
        { label: 'Month', value: selectedPoint.monthLabel },
        { label: 'Net Pay', value: `PHP ${formatPHP(selectedPoint.income)}`, color: '#10b981' },
        { label: 'Total Spent', value: `PHP ${formatPHP(selectedPoint.spent)}`, color: '#f43f5e' },
      ]
    : [];

  return (
    <Card className="border-border bg-card/40 backdrop-blur-md overflow-visible">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Combined Cashflow Trends</CardTitle>
        <CardDescription className="text-xs">Monthly comparison of Total Net Pay and Total Spending</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          <div className="h-72 min-w-0">
            {overallChartData.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <TrendingUp className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No historical data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 100, height: 288 }}>
                <AreaChart
                  data={overallChartData}
                  margin={{ top: 8, right: 10, left: 15, bottom: 0 }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onClick={(state: any) => {
                    if (isMobile && state && state.activePayload && state.activePayload.length > 0) {
                      setSelectedPoint(state.activePayload[0].payload);
                    }
                  }}
                >
                  <defs>
                    <linearGradient id="overallIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="overallSpent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis 
                    width={55} 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(v) => v === 0 ? '₱0' : v >= 1000 ? `₱${(v / 1000).toFixed(0)}k` : `₱${v}`} 
                  />
                  <Tooltip
                    allowEscapeViewBox={{ x: false, y: false }}
                    isAnimationActive={false}
                    active={isMobile ? false : undefined}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const income = payload[0]?.value as number ?? 0;
                      const spent = payload[1]?.value as number ?? 0;
                      return (
                        <div className="rounded-xl border border-border bg-card/90 p-3 shadow-lg backdrop-blur-md min-w-[170px] space-y-1.5">
                          <p className="text-xs font-semibold text-foreground">{payload[0]?.payload?.monthLabel}</p>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-6 text-xs">
                              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Net Pay</span>
                              <span className="tabular-nums font-semibold text-emerald-500">PHP {formatPHP(income)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-6 text-xs">
                              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" /> Spent</span>
                              <span className="tabular-nums font-semibold text-rose-500">PHP {formatPHP(spent)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} formatter={(value) => <span className="text-xs text-muted-foreground capitalize">{value === 'income' ? 'Net Pay' : 'Total Spent'}</span>} />
                  <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#overallIncome)" name="income" />
                  <Area type="monotone" dataKey="spent" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#overallSpent)" name="spent" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Mobile details */}
          <MobileChartDetails
            title={selectedPoint ? `Details for ${selectedPoint.monthLabel}` : ''}
            fields={detailFields}
            visible={isMobile && selectedPoint !== null}
            onClose={() => setSelectedPoint(null)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
