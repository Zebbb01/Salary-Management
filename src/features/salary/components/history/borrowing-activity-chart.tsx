'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatPHP } from '@/features/salary/utils/calculations';

import { MobileChartDetails } from '../ui/mobile-chart-details';

interface BorrowingRecord {
  amount: number;
  transaction_date: string;
  type: 'borrowed' | 'lent';
  totalSpent?: number;
}

interface BorrowingActivityChartProps {
  borrowingHistory: BorrowingRecord[];
  isMobile: boolean;
}

interface ChartDataPoint {
  month: string;
  borrowed: number;
  lent: number;
  spent: number;
}

export function BorrowingActivityChart({ borrowingHistory, isMobile }: BorrowingActivityChartProps) {
  const [selectedPoint, setSelectedPoint] = useState<ChartDataPoint | null>(null);

  const [prevHistory, setPrevHistory] = useState(borrowingHistory);
  if (borrowingHistory !== prevHistory) {
    setPrevHistory(borrowingHistory);
    setSelectedPoint(null);
  }

  const chartData = (() => {
    const monthMap = new Map<string, { borrowed: number; lent: number; spent: number }>();
    for (const b of borrowingHistory) {
      const m = b.transaction_date.substring(0, 7);
      const entry = monthMap.get(m) ?? { borrowed: 0, lent: 0, spent: 0 };
      if (b.type === 'borrowed') {
        entry.borrowed += Number(b.amount);
        entry.spent += b.totalSpent || 0;
      } else {
        entry.lent += Number(b.amount);
      }
      monthMap.set(m, entry);
    }
    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([m, v]) => ({
        month: new Date(m + '-01').toLocaleDateString('en-PH', { month: 'short', year: '2-digit' }),
        ...v,
      }));
  })();

  const net = selectedPoint ? selectedPoint.lent - selectedPoint.borrowed : 0;

  const detailFields = selectedPoint
    ? [
        { label: 'Month', value: selectedPoint.month },
        { label: 'Borrowed', value: `PHP ${formatPHP(selectedPoint.borrowed)}`, color: '#f43f5e' },
        { label: 'Lent', value: `PHP ${formatPHP(selectedPoint.lent)}`, color: '#34d399' },
        { label: 'Net Position', value: `PHP ${formatPHP(Math.abs(net))} ${net >= 0 ? 'owed to you' : 'you owe'}`, color: net >= 0 ? '#34d399' : '#f43f5e' },
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
          <CardTitle className="text-base font-semibold">Borrowing Activity</CardTitle>
          <CardDescription className="text-xs">Borrowed vs lent amounts over time</CardDescription>
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
                    <linearGradient id="borrowedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.6} />
                    </linearGradient>
                    <linearGradient id="lentGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.6} />
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
                      const data = payload[0]?.payload;
                      const borrowed = data?.borrowed ?? 0;
                      const spent = data?.spent ?? 0;
                      const lent = data?.lent ?? 0;
                      const netPos = lent - borrowed;
                      return (
                        <div className="rounded-xl border border-border bg-card/90 p-3 shadow-lg backdrop-blur-md min-w-[180px] space-y-1.5">
                          <p className="text-xs font-semibold text-foreground">{data?.month}</p>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between gap-6">
                              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-400" /> Borrowed</span>
                              <span className="tabular-nums font-medium text-foreground">PHP {formatPHP(borrowed)}</span>
                            </div>
                            {borrowed > 0 && (
                              <div className="flex justify-between gap-6 pl-3 text-[10px] text-muted-foreground">
                                <span>↳ Spent</span>
                                <span>PHP {formatPHP(spent)}</span>
                              </div>
                            )}
                            <div className="flex justify-between gap-6">
                              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Lent</span>
                              <span className="tabular-nums font-medium text-foreground">PHP {formatPHP(lent)}</span>
                            </div>
                            <Separator className="my-1 border-border/60" />
                            <div className="flex justify-between gap-6 font-semibold">
                              <span className="text-muted-foreground">Net Position</span>
                              <span style={{ color: netPos >= 0 ? '#34d399' : '#f43f5e' }}>
                                PHP {formatPHP(Math.abs(netPos))} {netPos >= 0 ? 'owed' : 'owe'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="borrowed" fill="url(#borrowedGradient)" radius={[6, 6, 0, 0]} barSize={24} name="Borrowed" />
                  <Bar dataKey="lent" fill="url(#lentGradient)" radius={[6, 6, 0, 0]} barSize={24} name="Lent" />
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
              title={selectedPoint ? `Borrowing Activity: ${selectedPoint.month}` : ''}
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
