'use client';

import { useState } from 'react';
import { Scale, Users, Handshake } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { formatPHP } from '@/features/salary/utils/calculations';
import { MobileChartDetails } from '../ui/mobile-chart-details';
import type { Borrowing, BorrowingSummary } from '@/features/salary/types/salary.types';

interface BorrowingChartsProps {
  borrowings: Borrowing[];
  summary: BorrowingSummary;
  isMobile: boolean;
}

interface DistPoint {
  name: string;
  value: number;
  type: string;
  fill: string;
}

const COLORS = [
  '#f472b6', // pink
  '#38bdf8', // sky
  '#a78bfa', // violet
  '#fbbf24', // amber
  '#2dd4bf', // teal
  '#34d399', // emerald
  '#f87171', // red
];

interface BarDataPoint {
  name: string;
  amount: number;
  fill: string;
}

export function BorrowingCharts({ borrowings, summary, isMobile }: BorrowingChartsProps) {
  const [selectedPoint, setSelectedPoint] = useState<DistPoint | null>(null);
  const [selectedBar, setSelectedBar] = useState<BarDataPoint | null>(null);

  // Clear selections when borrowings list changes
  const [prevBorrowings, setPrevBorrowings] = useState(borrowings);
  if (borrowings !== prevBorrowings) {
    setPrevBorrowings(borrowings);
    setSelectedPoint(null);
    setSelectedBar(null);
  }

  // Filter out settled borrowings
  const activeEntries = borrowings.filter((b) => !b.is_settled && !b.is_gifted);

  // Generate distribution by person
  const personMap = new Map<string, { total: number; type: string }>();
  activeEntries.forEach((b) => {
    const key = `${b.person_name} (${b.type})`;
    const current = personMap.get(key) || { total: 0, type: b.type };
    personMap.set(key, { total: current.total + Number(b.amount), type: b.type });
  });

  const distributionData: DistPoint[] = Array.from(personMap.entries()).map(
    ([name, info], index) => ({
      name,
      value: info.total,
      type: info.type,
      fill: COLORS[index % COLORS.length],
    })
  );

  // Summary bar data
  const barData = [
    {
      name: 'Borrowed (You Owe)',
      amount: summary.totalBorrowed,
      fill: '#f472b6',
    },
    {
      name: 'Lent (Owed to You)',
      amount: summary.totalLent,
      fill: '#34d399',
    },
  ];

  const pieFields = selectedPoint
    ? [
        { label: 'Name', value: selectedPoint.name },
        { label: 'Type', value: selectedPoint.type.toUpperCase(), color: selectedPoint.type === 'borrowed' ? '#f472b6' : '#34d399' },
        { label: 'Amount', value: `PHP ${formatPHP(selectedPoint.value)}`, color: selectedPoint.fill },
      ]
    : [];

  const barFields = selectedBar
    ? [
        { label: 'Category', value: selectedBar.name },
        { label: 'Total Outstanding', value: `PHP ${formatPHP(selectedBar.amount)}`, color: selectedBar.fill },
      ]
    : [];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Outstanding Summary Comparison Bar Chart */}
      <Card className="border-border bg-card/40 backdrop-blur-md overflow-visible">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Debt vs Lending Balances</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Comparison of active outstanding debts and lendings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary.totalBorrowed > 0 || summary.totalLent > 0 ? (
            <div className="flex flex-col">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 100, height: 288 }}>
                  <BarChart
                    data={barData}
                    margin={{ top: 15, right: 15, left: 0, bottom: 5 }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onClick={(state: any) => {
                      if (isMobile && state && state.activePayload && state.activePayload.length > 0) {
                        setSelectedBar(state.activePayload[0].payload);
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
                      dataKey="name"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
                      width={50}
                    />
                    <Tooltip
                      allowEscapeViewBox={{ x: false, y: false }}
                      isAnimationActive={false}
                      active={isMobile ? false : undefined}
                      cursor={isMobile ? false : { fill: 'hsl(var(--muted))', fillOpacity: 0.2 }}
                      content={({ active, payload }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-border bg-card/90 p-3 shadow-lg backdrop-blur-md min-w-[150px]">
                            <p className="text-xs font-semibold text-foreground mb-1">{data.name}</p>
                            <p className="text-xs font-bold text-foreground">
                              PHP {formatPHP(data.amount)}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey="amount"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={45}
                      animationDuration={800}
                    >
                      {barData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} style={{ outline: 'none', cursor: 'pointer' }} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Mobile Bar details */}
              <MobileChartDetails
                title={selectedBar ? `Balance: ${selectedBar.name}` : ''}
                fields={barFields}
                visible={isMobile && selectedBar !== null}
                onClose={() => setSelectedBar(null)}
              />
            </div>
          ) : (
            <div className="flex h-72 items-center justify-center border border-dashed border-border/60 rounded-xl">
              <div className="flex flex-col items-center gap-2 text-center py-8">
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-muted/40 text-muted-foreground/50">
                  <Handshake className="h-5 w-5" />
                </div>
                <p className="text-xs text-muted-foreground">No active balance to compare</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distribution by Person */}
      <Card className="border-border bg-card/40 backdrop-blur-md overflow-visible">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Active Debt Distribution</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Visual breakdown of outstanding balances grouped by person
          </CardDescription>
        </CardHeader>
        <CardContent>
          {distributionData.length > 0 ? (
            <div className="flex flex-col">
              <div className="h-72 w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 100, height: 288 }}>
                  <PieChart>
                    <Pie
                      data={distributionData}
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
                          setSelectedPoint(state.payload);
                        }
                      }}
                    >
                      {distributionData.map((entry, index) => (
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
                            <p className="text-xs text-muted-foreground">
                              {data.type.toUpperCase()} &bull; PHP {formatPHP(data.value)}
                            </p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Mobile Pie details */}
              <MobileChartDetails
                title={selectedPoint ? `Distribution Detail` : ''}
                fields={pieFields}
                visible={isMobile && selectedPoint !== null}
                onClose={() => setSelectedPoint(null)}
              />
            </div>
          ) : (
            <div className="flex h-72 items-center justify-center border border-dashed border-border/60 rounded-xl">
              <div className="flex flex-col items-center gap-2 text-center py-8">
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-muted/40 text-muted-foreground/50">
                  <Users className="h-5 w-5" />
                </div>
                <p className="text-xs text-muted-foreground">No active debts to distribute</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
