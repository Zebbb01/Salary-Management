'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatPHP } from '@/features/salary/utils/calculations';

import { MobileChartDetails } from '../ui/mobile-chart-details';

interface ConsumableRecord {
  month: string;
  allowance: number;
  total_spent: number;
}

interface ConsumableBudgetTrendProps {
  consumableRecords: ConsumableRecord[];
  isMobile: boolean;
}

interface ChartDataPoint {
  month: string;
  allowance: number;
  spent: number;
}

export function ConsumableBudgetTrend({ consumableRecords, isMobile }: ConsumableBudgetTrendProps) {
  const [selectedPoint, setSelectedPoint] = useState<ChartDataPoint | null>(null);

  const [prevRecords, setPrevRecords] = useState(consumableRecords);
  if (consumableRecords !== prevRecords) {
    setPrevRecords(consumableRecords);
    setSelectedPoint(null);
  }

  const chartData = [...consumableRecords].reverse().map(r => ({
    month: new Date(r.month + '-01').toLocaleDateString('en-PH', { month: 'short', year: '2-digit' }),
    allowance: Number(r.allowance),
    spent: Number(r.total_spent),
  }));

  const remaining = selectedPoint ? selectedPoint.allowance - selectedPoint.spent : 0;

  const detailFields = selectedPoint
    ? [
        { label: 'Month', value: selectedPoint.month },
        { label: 'Allowance', value: `PHP ${formatPHP(selectedPoint.allowance)}`, color: '#34d399' },
        { label: 'Total Spent', value: `PHP ${formatPHP(selectedPoint.spent)}`, color: '#f59e0b' },
        { label: 'Remaining', value: `PHP ${formatPHP(remaining)}`, color: remaining >= 0 ? '#34d399' : '#f87171' },
      ]
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="overflow-visible border-border bg-card/40 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Consumable Budget Trend</CardTitle>
          <CardDescription className="text-xs">Monthly allowance vs actual spending</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col">
            <div className="h-72 min-w-0">
              <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 100, height: 288 }}>
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 20, left: 10, bottom: 0 }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onClick={(state: any) => {
                    if (isMobile && state && state.activePayload && state.activePayload.length > 0) {
                      setSelectedPoint(state.activePayload[0].payload);
                    }
                  }}
                >
                  <defs>
                    <linearGradient id="allowanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.6} />
                    </linearGradient>
                    <linearGradient id="spentGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                  <XAxis
                    dataKey="month"
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
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                    wrapperStyle={{ outline: 'none', zIndex: 50 }}
                    active={isMobile ? false : undefined}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const allowance = payload[0]?.value as number;
                      const spent = payload[1]?.value as number;
                      const rem = allowance - spent;
                      return (
                        <div className="rounded-xl border border-border bg-card/90 p-3 shadow-lg backdrop-blur-md min-w-[170px] space-y-1.5">
                          <p className="text-xs font-semibold text-foreground">{payload[0]?.payload?.month}</p>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between gap-6">
                              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Allowance</span>
                              <span className="tabular-nums font-medium text-foreground">PHP {formatPHP(allowance)}</span>
                            </div>
                            <div className="flex justify-between gap-6">
                              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" /> Spent</span>
                              <span className="tabular-nums font-medium text-foreground">PHP {formatPHP(spent)}</span>
                            </div>
                            <Separator className="my-1 border-border/60" />
                            <div className="flex justify-between gap-6 font-semibold">
                              <span className="text-muted-foreground">Remaining</span>
                              <span style={{ color: rem >= 0 ? '#34d399' : '#f87171' }}>
                                PHP {formatPHP(rem)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="allowance" fill="url(#allowanceGradient)" radius={[6, 6, 0, 0]} barSize={24} name="Allowance" />
                  <Bar dataKey="spent" fill="url(#spentGradient)" radius={[6, 6, 0, 0]} barSize={24} name="Spent" />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', paddingTop: '12px' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Mobile details */}
            <MobileChartDetails
              title={selectedPoint ? `Budget Detail: ${selectedPoint.month}` : ''}
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
