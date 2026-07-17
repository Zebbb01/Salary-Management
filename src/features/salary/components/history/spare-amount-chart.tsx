'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { formatPHP } from '@/features/salary/utils/calculations';
import { MobileChartDetails } from '../ui/mobile-chart-details';
import type { PayPeriod } from '@/features/salary/types/salary.types';

interface SpareAmountChartProps {
  periods: PayPeriod[];
  isMobile: boolean;
}

interface ChartDataPoint {
  period: string;
  fullLabel: string;
  spare: number;
}

export function SpareAmountChart({ periods, isMobile }: SpareAmountChartProps) {
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
        spare: p.spare_amount ?? 0,
      };
    });

  if (chartData.length < 2) return null;

  const detailFields = selectedPoint
    ? [
        { label: 'Pay Period', value: selectedPoint.fullLabel },
        { label: 'Spare Amount', value: `PHP ${formatPHP(selectedPoint.spare)}`, color: '#34d399' },
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
          <CardTitle className="text-base font-semibold">Spare Amount Trend</CardTitle>
          <CardDescription className="text-xs">
            Track how your spare amount changes across pay periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col">
            <div className="h-64 min-w-0">
              <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 100, height: 256 }}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 4, right: 20, left: 10, bottom: 0 }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onClick={(state: any) => {
                    if (isMobile && state && state.activePayload && state.activePayload.length > 0) {
                      setSelectedPoint(state.activePayload[0].payload);
                    }
                  }}
                >
                  <defs>
                    <linearGradient id="spareTrendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
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
                    tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
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
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-border bg-card/90 p-3 shadow-lg backdrop-blur-md min-w-[150px]">
                          <p className="text-xs font-semibold text-foreground mb-1">{data.fullLabel}</p>
                          <p className="text-xs font-bold text-emerald-400">
                            PHP {formatPHP(data.spare)}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="spare"
                    stroke="#34d399"
                    strokeWidth={2}
                    fill="url(#spareTrendGradient)"
                    dot={{ r: 3, fill: '#34d399', stroke: 'hsl(var(--background))', strokeWidth: 1.5 }}
                    activeDot={{ r: 5, fill: '#34d399', stroke: '#fff', strokeWidth: 1.5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Mobile Touch details */}
            <MobileChartDetails
              title={selectedPoint ? `Selected Period Spare` : ''}
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
