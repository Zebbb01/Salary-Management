'use client';

import { useEffect, useLayoutEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import { successAnimation, warningAnimation } from '@/components/ui/lottie-animations';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DollarSign,
  Receipt,
  ArrowDownRight,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Settings,
  Briefcase,
  Wallet,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Circle,
  Landmark,
  BarChart3,
  CalendarRange,
  Filter,
  Lock,
  ChevronRight,
  ShoppingCart,
  HandCoins,
  Info,
  Coins,
  PiggyBank,
  Plus,
  Trash2,
  Users,
  Heart,
  ShieldAlert,
  Activity,
  Loader2,
  ArrowRightLeft,
} from 'lucide-react';
import {
  Tooltip as UITooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { toast } from 'sonner';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  getSpareTotal,
  getSpareTransactionsInRange,
  getCurrentUser,
  initMonthlyBills,
  upsertBillPayment,
  getFinancialSummary,
  getPayPeriodTrend,
  getLatestPeriodInRange,
  getAllocationTypes,
  getPayPeriods,
  getConsumableBudgetSummary,
  getBorrowingSummary,
  getSalaryConfig,
  getHeldFunds,
  createHeldFund,
  returnHeldFund,
  deleteHeldFund,
  getAllocationFundSummaries,
  createAllocationExpense,
  deleteAllocationExpense,
  createBorrowing,
  updatePayPeriod,
  createSpareTransaction,
} from '@/features/salary/services/salary.service';
import type {
  SalaryConfig,
  BudgetAllocationWithAmount,
  PayPeriod,
  BillPayment,
  FinancialSummary,
  AllocationType,
  SpareTransaction,
  ConsumableBudgetSummary,
  BorrowingSummary,
  HeldFund,
  AllocationExpense,
  AllocationFundSummary,
} from '@/features/salary/types/salary.types';
import {
  computeAllocations,
  formatPHP,
  formatPercentage,
} from '@/features/salary/utils/calculations';
import { cn } from '@/lib/utils';
import { CategoryIcon } from '@/components/ui/category-icon';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { MonthYearPicker, monthYearToDateRange, type MonthYearSelection } from '@/components/ui/month-year-picker';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ============================================
// CONSTANTS
// ============================================

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

// ============================================
// ANIMATED NUMBER
// ============================================

function AnimatedNumber({ value, prefix = '' }: { value: number; prefix?: string }) {
  const [displayed, setDisplayed] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const duration = 600;
    const start = performance.now();
    const from = displayed;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(from + (value - from) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
    // Only re-run when value changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span className="tabular-nums font-display">
      {prefix}{formatPHP(displayed)}
    </span>
  );
}

// ============================================
// STAT CARD
// ============================================

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  colorTheme: 'indigo' | 'sky' | 'teal' | 'rose' | 'amber' | 'purple' | 'emerald' | 'violet';
  index: number;
  editable?: boolean;
  onSave?: (value: number) => void;
  subtitle?: string;
  tooltip?: React.ReactNode;
}

function StatCard({
  label,
  value,
  icon: Icon,
  colorTheme,
  index,
  editable,
  onSave,
  subtitle,
  tooltip,
}: StatCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const themeClasses = {
    indigo: {
      accent: 'bg-indigo-500',
      glow: 'from-indigo-500/10 via-indigo-500/5 to-transparent',
      cardBg: 'from-card via-card to-indigo-950/15',
      iconColor: 'text-indigo-500/5 dark:text-indigo-400/5 group-hover:text-indigo-500/10 dark:group-hover:text-indigo-400/10',
    },
    sky: {
      accent: 'bg-sky-500',
      glow: 'from-sky-500/10 via-sky-500/5 to-transparent',
      cardBg: 'from-card via-card to-sky-950/15',
      iconColor: 'text-sky-500/5 dark:text-sky-400/5 group-hover:text-sky-500/10 dark:group-hover:text-sky-400/10',
    },
    teal: {
      accent: 'bg-teal-500',
      glow: 'from-teal-500/10 via-teal-500/5 to-transparent',
      cardBg: 'from-card via-card to-teal-950/15',
      iconColor: 'text-teal-500/5 dark:text-teal-400/5 group-hover:text-teal-500/10 dark:group-hover:text-teal-400/10',
    },
    rose: {
      accent: 'bg-rose-500',
      glow: 'from-rose-500/10 via-rose-500/5 to-transparent',
      cardBg: 'from-card via-card to-rose-950/15',
      iconColor: 'text-rose-500/5 dark:text-rose-400/5 group-hover:text-rose-500/10 dark:group-hover:text-rose-400/10',
    },
    amber: {
      accent: 'bg-amber-500',
      glow: 'from-amber-500/10 via-amber-500/5 to-transparent',
      cardBg: 'from-card via-card to-amber-950/15',
      iconColor: 'text-amber-500/5 dark:text-amber-400/5 group-hover:text-amber-500/10 dark:group-hover:text-amber-400/10',
    },
    purple: {
      accent: 'bg-purple-500',
      glow: 'from-purple-500/10 via-purple-500/5 to-transparent',
      cardBg: 'from-card via-card to-purple-950/15',
      iconColor: 'text-purple-500/5 dark:text-purple-400/5 group-hover:text-purple-500/10 dark:group-hover:text-purple-400/10',
    },
    emerald: {
      accent: 'bg-emerald-500',
      glow: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
      cardBg: 'from-card via-card to-emerald-950/15',
      iconColor: 'text-emerald-500/5 dark:text-emerald-400/5 group-hover:text-emerald-500/10 dark:group-hover:text-emerald-400/10',
    },
    violet: {
      accent: 'bg-violet-500',
      glow: 'from-violet-500/10 via-violet-500/5 to-transparent',
      cardBg: 'from-card via-card to-violet-950/15',
      iconColor: 'text-violet-500/5 dark:text-violet-400/5 group-hover:text-violet-500/10 dark:group-hover:text-violet-400/10',
    },
  }[colorTheme];

  function handleStartEdit() {
    if (!editable) return;
    setEditValue(value.toString());
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleSave() {
    const parsed = parseFloat(editValue);
    if (isNaN(parsed) || parsed < 0) {
      toast.error('Please enter a valid amount');
      setIsEditing(false);
      return;
    }
    onSave?.(parsed);
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setIsEditing(false);
  }

  return (
    <motion.div variants={staggerItem} className="h-full">
      <Card
        className={cn(
          'group relative overflow-hidden border border-border/40 bg-gradient-to-br backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:border-border/80 h-full',
          themeClasses.cardBg,
          editable && 'cursor-pointer'
        )}
        onClick={handleStartEdit}
      >
        {/* Top Accent Line */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-[2px] opacity-35 group-hover:opacity-100 transition-opacity duration-300",
          themeClasses.accent
        )} />

        {/* Dotted Grid Background */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] transition-opacity duration-300 group-hover:opacity-[0.05] dark:group-hover:opacity-[0.09] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--foreground) 1px, transparent 1px)',
            backgroundSize: '12px 12px',
          }}
        />

        {/* Glow backdrop effect */}
        <div className={cn(
          "absolute -right-8 -top-8 h-20 w-20 rounded-full bg-gradient-to-br blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none",
          themeClasses.glow
        )} />

        {/* Large watermark icon in the background */}
        <div className={cn(
          "absolute -right-6 -bottom-6 transition-all duration-500 transform rotate-12 group-hover:scale-110 group-hover:rotate-[15deg] pointer-events-none",
          themeClasses.iconColor
        )}>
          <Icon className="h-28 w-28 stroke-[1.2]" />
        </div>

        <CardContent className="p-3.5 sm:p-5 h-full flex flex-col justify-between gap-3 relative z-10">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] sm:text-xs font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-1">
              {label}
              {editable && !isEditing && (
                <span className="text-[8px] sm:text-[10px] font-normal normal-case tracking-normal text-muted-foreground/50">(click to edit)</span>
              )}
            </span>

            {tooltip && (
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger className="flex shrink-0">
                    <Info className="h-3.5 w-3.5 text-muted-foreground/35 hover:text-muted-foreground/75 cursor-help transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px] text-[10px] leading-relaxed">
                    {tooltip}
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            )}
          </div>

          <div className="mt-1 sm:mt-2">
            {isEditing ? (
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground/60">PHP</span>
                <Input
                  ref={inputRef}
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleSave}
                  onKeyDown={handleKeyDown}
                  className="w-28 text-sm sm:text-base md:text-lg lg:text-xl font-bold tabular-nums font-display bg-transparent border-border/60"
                  min={0}
                  step={100}
                />
              </div>
            ) : (
              <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-foreground font-display tracking-tight flex items-baseline">
                <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground/60 mr-1">PHP</span>
                <AnimatedNumber value={value} />
              </p>
            )}
            {subtitle && !isEditing && (
              <p className="text-[10px] sm:text-[11px] text-muted-foreground/60 mt-1">{subtitle}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================
// FINANCIAL OVERVIEW CARD (read-only)
// ============================================

interface OverviewCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  colorTheme: 'teal' | 'emerald' | 'violet' | 'rose' | 'sky' | 'slate';
  tooltip?: React.ReactNode;
}

function OverviewCard({ label, value, icon: Icon, colorTheme, tooltip }: OverviewCardProps) {
  const themeClasses = {
    teal: {
      accent: 'bg-teal-500',
      glow: 'from-teal-500/10 via-teal-500/5 to-transparent',
      cardBg: 'from-card via-card to-teal-950/15',
      iconColor: 'text-teal-500/5 dark:text-teal-400/5 group-hover:text-teal-500/10 dark:group-hover:text-teal-400/10',
    },
    emerald: {
      accent: 'bg-emerald-500',
      glow: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
      cardBg: 'from-card via-card to-emerald-950/15',
      iconColor: 'text-emerald-500/5 dark:text-emerald-400/5 group-hover:text-emerald-500/10 dark:group-hover:text-emerald-400/10',
    },
    violet: {
      accent: 'bg-violet-500',
      glow: 'from-violet-500/10 via-violet-500/5 to-transparent',
      cardBg: 'from-card via-card to-violet-950/15',
      iconColor: 'text-violet-500/5 dark:text-violet-400/5 group-hover:text-violet-500/10 dark:group-hover:text-violet-400/10',
    },
    rose: {
      accent: 'bg-rose-500',
      glow: 'from-rose-500/10 via-rose-500/5 to-transparent',
      cardBg: 'from-card via-card to-rose-950/15',
      iconColor: 'text-rose-500/5 dark:text-rose-400/5 group-hover:text-rose-500/10 dark:group-hover:text-rose-400/10',
    },
    sky: {
      accent: 'bg-sky-500',
      glow: 'from-sky-500/10 via-sky-500/5 to-transparent',
      cardBg: 'from-card via-card to-sky-950/15',
      iconColor: 'text-sky-500/5 dark:text-sky-400/5 group-hover:text-sky-500/10 dark:group-hover:text-sky-400/10',
    },
    slate: {
      accent: 'bg-slate-500',
      glow: 'from-slate-500/10 via-slate-500/5 to-transparent',
      cardBg: 'from-card via-card to-slate-950/15',
      iconColor: 'text-slate-500/5 dark:text-slate-400/5 group-hover:text-slate-500/10 dark:group-hover:text-slate-400/10',
    },
  }[colorTheme];

  return (
    <motion.div variants={staggerItem} className="h-full">
      <Card className={cn(
        "group relative overflow-hidden border border-border/40 bg-gradient-to-br backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:border-border/80 h-full",
        themeClasses.cardBg
      )}>
        {/* Top Accent Line */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-[2px] opacity-35 group-hover:opacity-100 transition-opacity duration-300",
          themeClasses.accent
        )} />

        {/* Dotted Grid Background */}
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] transition-opacity duration-300 group-hover:opacity-[0.05] dark:group-hover:opacity-[0.09] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--foreground) 1px, transparent 1px)',
            backgroundSize: '12px 12px',
          }}
        />

        {/* Glow backdrop effect */}
        <div className={cn(
          "absolute -right-8 -top-8 h-20 w-20 rounded-full bg-gradient-to-br blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none",
          themeClasses.glow
        )} />
        
        {/* Large watermark icon in the background */}
        <div className={cn(
          "absolute -right-6 -bottom-6 transition-all duration-500 transform rotate-12 group-hover:scale-110 group-hover:rotate-[15deg] pointer-events-none",
          themeClasses.iconColor
        )}>
          <Icon className="h-28 w-28 stroke-[1.2]" />
        </div>

        <CardContent className="p-3.5 sm:p-5 h-full flex flex-col justify-between gap-4 relative z-10">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] sm:text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {label}
            </span>
            
            {tooltip && (
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger className="flex shrink-0">
                    <Info className="h-3.5 w-3.5 text-muted-foreground/35 hover:text-muted-foreground/75 cursor-help transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <div>{tooltip}</div>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            )}
          </div>

          <div className="mt-1 sm:mt-2">
            <p className="text-sm sm:text-base md:text-lg lg:text-2xl xl:text-3xl font-bold text-foreground font-display tracking-tight flex items-baseline">
              <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground/60 mr-1">PHP</span>
              <AnimatedNumber value={value} />
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================
// CUSTOM TOOLTIP (Pie)
// ============================================

interface ChartPayload {
  name: string;
  value: number;
  payload: {
    category: string;
    amount: number;
    percentage: number;
    fill: string;
  };
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ChartPayload[];
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !active) return;

    el.style.transform = '';
    const rect = el.getBoundingClientRect();
    const transforms: string[] = [];

    if (rect.right > window.innerWidth - 16) {
      transforms.push('translateX(calc(-100% - 30px))');
    } else if (rect.left < 16) {
      transforms.push('translateX(30px)');
    }

    if (rect.bottom > window.innerHeight - 16) {
      transforms.push('translateY(calc(-100% - 20px))');
    } else if (rect.top < 16) {
      transforms.push('translateY(20px)');
    }

    if (transforms.length) {
      el.style.transform = transforms.join(' ');
    }
  });

  if (!active || !payload?.length) return null;
  const data = payload[0].payload;

  return (
    <div ref={ref}>
      <Card className="shadow-xl border-border/50 bg-card/95 backdrop-blur-sm">
        <CardContent className="px-3 py-2.5">
          <p className="text-sm font-medium capitalize text-foreground">
            {data.category}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatPercentage(data.percentage)} - PHP {formatPHP(data.amount)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// CUSTOM TOOLTIP (Trend Chart)
// ============================================

interface TrendPayloadItem {
  name: string;
  value: number;
  color: string;
  dataKey: string;
  payload?: {
    label: string;
    fullLabel?: string;
    income: number;
    netPay: number;
    expenses: number;
    spare: number;
    tax: number;
    savings: number;
  };
}

function TrendChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TrendPayloadItem[];
  label?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !active) return;

    // Reset transform to measure natural position
    el.style.transform = '';
    const rect = el.getBoundingClientRect();
    const transforms: string[] = [];

    // Flip horizontally
    if (rect.right > window.innerWidth - 16) {
      transforms.push('translateX(calc(-100% - 30px))');
    } else if (rect.left < 16) {
      transforms.push('translateX(30px)');
    }

    // Flip vertically
    if (rect.bottom > window.innerHeight - 16) {
      transforms.push('translateY(calc(-100% - 20px))');
    } else if (rect.top < 16) {
      transforms.push('translateY(20px)');
    }

    if (transforms.length) {
      el.style.transform = transforms.join(' ');
    }
  });

  if (!active || !payload?.length) return null;

  const income = payload.find((p) => p.dataKey === 'income')?.value ?? 0;
  const expenses = payload.find((p) => p.dataKey === 'expenses')?.value ?? 0;
  const net = income - expenses;
  const showNet = payload.some(p => p.dataKey === 'income') && payload.some(p => p.dataKey === 'expenses');
  const fullLabel = payload[0]?.payload?.fullLabel ?? label;

  return (
    <div ref={ref}>
      <Card className="shadow-xl border-border/50 bg-card/95 backdrop-blur-sm">
        <CardContent className="px-3.5 py-3">
          <p className="text-sm font-semibold text-foreground mb-2">{fullLabel}</p>
          <div className="space-y-1.5">
            {payload.map((entry) => (
              <div key={entry.dataKey} className="flex items-center justify-between gap-6 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  {entry.name}
                </span>
                <span className="font-semibold tabular-nums text-foreground">
                  PHP {formatPHP(entry.value)}
                </span>
              </div>
            ))}
          </div>
          {showNet && (
            <>
              <Separator className="my-2" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Cashflow Net</span>
                <span className={cn(
                  'font-bold tabular-nums',
                  net >= 0 ? 'text-emerald-500' : 'text-rose-500'
                )}>
                  {net >= 0 ? '+' : ''}PHP {formatPHP(net)}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// DONUT CHART CENTER LABEL
// ============================================

function CenterLabel({ salary }: { salary: number }) {
  return (
    <text
      x="50%"
      y="50%"
      textAnchor="middle"
      dominantBaseline="middle"
      className="fill-foreground"
    >
      <tspan x="50%" dy="-8" className="text-xs fill-muted-foreground">
        Total
      </tspan>
      <tspan x="50%" dy="20" className="text-sm font-semibold fill-foreground">
        PHP {formatPHP(salary)}
      </tspan>
    </text>
  );
}

// ============================================
// EMPTY STATE
// ============================================

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card className="px-6 py-16">
        <CardContent className="flex flex-col items-center justify-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Settings className="h-7 w-7 text-primary" />
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-lg font-semibold text-foreground">
              No salary configured yet
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Set up your salary and budget allocations in Settings to see your
              dashboard overview and budget breakdown.
            </p>
          </div>
          <Link href="/dashboard/settings" className={cn(buttonVariants({ size: "lg" }), "gap-1.5")}>
            <Settings className="h-4 w-4" />
            Go to Settings
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================
// LOADING SKELETON
// ============================================

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-7 w-32" />
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Hero */}
      <Skeleton className="h-28 rounded-xl" />
      {/* Two columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

// ============================================
// DATE FILTER TYPES
// ============================================

type DateFilterPreset = 'this-month' | 'last-month' | 'last-3-months' | 'this-year' | 'all-time' | 'custom';

function getDateRange(preset: DateFilterPreset, customRange?: MonthYearSelection | null): { dateFrom?: string; dateTo?: string; billMonth: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  // Helper: build a timezone-safe date string (YYYY-MM-DD or YYYY-MM-DDT23:59:59)
  // Using local-time strings avoids UTC offset issues where midnight local time
  // shifts to the previous day in UTC (e.g. Philippines UTC+8).
  function localDate(y: number, m: number, d: number): string {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  function localDateEnd(y: number, m: number, d: number): string {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}T23:59:59`;
  }
  function lastDay(y: number, m: number): number {
    return new Date(y, m + 1, 0).getDate();
  }

  switch (preset) {
    case 'this-month': {
      const from = localDate(year, month, 1);
      const to = localDateEnd(year, month, lastDay(year, month));
      return { dateFrom: from, dateTo: to, billMonth: `${year}-${String(month + 1).padStart(2, '0')}` };
    }
    case 'last-month': {
      const lmDate = new Date(year, month - 1, 1);
      const lmYear = lmDate.getFullYear();
      const lmMonth = lmDate.getMonth();
      const from = localDate(lmYear, lmMonth, 1);
      const to = localDateEnd(lmYear, lmMonth, lastDay(lmYear, lmMonth));
      return { dateFrom: from, dateTo: to, billMonth: `${lmYear}-${String(lmMonth + 1).padStart(2, '0')}` };
    }
    case 'last-3-months': {
      const l3Date = new Date(year, month - 2, 1);
      const from = localDate(l3Date.getFullYear(), l3Date.getMonth(), 1);
      return { dateFrom: from, billMonth: `${year}-${String(month + 1).padStart(2, '0')}` };
    }
    case 'this-year': {
      const from = localDate(year, 0, 1);
      return { dateFrom: from, billMonth: `${year}-${String(month + 1).padStart(2, '0')}` };
    }
    case 'custom': {
      if (customRange) {
        const cYear = customRange.year;
        const cMonth = customRange.month; // 0-indexed
        const from = localDate(cYear, cMonth, 1);
        const to = localDateEnd(cYear, cMonth, lastDay(cYear, cMonth));
        return { dateFrom: from, dateTo: to, billMonth: `${cYear}-${String(cMonth + 1).padStart(2, '0')}` };
      }
      return { billMonth: `${year}-${String(month + 1).padStart(2, '0')}` };
    }
    case 'all-time':
    default:
      return { billMonth: `${year}-${String(month + 1).padStart(2, '0')}` };
  }
}

const DATE_FILTER_OPTIONS: { value: DateFilterPreset; label: string }[] = [
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'last-3-months', label: 'Last 3 Months' },
  { value: 'this-year', label: 'This Year' },
  { value: 'all-time', label: 'All Time' },
];

// Helper to get category icon
function getCategoryIcon(category: string) {
  const name = category.toLowerCase();
  if (name.includes('dent') || name.includes('teeth') || name.includes('brace')) return Heart;
  if (name.includes('emerg') || name.includes('health') || name.includes('med')) return ShieldAlert;
  if (name.includes('save') || name.includes('invest') || name.includes('fund')) return PiggyBank;
  if (name.includes('bill') || name.includes('util') || name.includes('rent')) return Landmark;
  return Activity;
}

// ============================================
// DASHBOARD PAGE
// ============================================

export default function DashboardPage() {
  const [salaryConfig, setSalaryConfig] = useState<SalaryConfig | null>(null);
  const [allocations, setAllocations] = useState<BudgetAllocationWithAmount[]>([]);
  const [latestPeriod, setLatestPeriod] = useState<PayPeriod | null>(null);
  const [hasPeriods, setHasPeriods] = useState(false);
  const [spareSpent, setSpareSpent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Date filter
  const [dateFilter, setDateFilter] = useState<DateFilterPreset>('this-month');
  const [customMonth, setCustomMonth] = useState<MonthYearSelection | null>(null);

  // New state
  const [billPayments, setBillPayments] = useState<BillPayment[]>([]);
  const [activeBillMonth, setActiveBillMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [allTimeFinancialSummary, setAllTimeFinancialSummary] = useState<FinancialSummary | null>(null);
  const [startingBalanceSummary, setStartingBalanceSummary] = useState<FinancialSummary | null>(null);
  const [trendData, setTrendData] = useState<{ label: string; fullLabel?: string; income: number; netPay: number; expenses: number; spare: number; tax: number; savings: number }[]>([]);
  const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>({
    income: true,
    netPay: true,
    expenses: true,
    spare: false,
    tax: false,
    savings: false,
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [trendLimit, setTrendLimit] = useState(6);
  const [allocationTypes, setAllocationTypes] = useState<AllocationType[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'expense' | 'asset'>('all');
  const [billFilter, setBillFilter] = useState<'all' | 'expense' | 'asset'>('all');
  const [spareTransactions, setSpareTransactions] = useState<SpareTransaction[]>([]);
  const [consumableSummary, setConsumableSummary] = useState<ConsumableBudgetSummary | null>(null);
  const [borrowingSummary, setBorrowingSummary] = useState<BorrowingSummary | null>(null);
  const [heldFunds, setHeldFunds] = useState<HeldFund[]>([]);
  const [allocationFundSummaries, setAllocationFundSummaries] = useState<AllocationFundSummary[]>([]);
  const [actualAllocatedMap, setActualAllocatedMap] = useState<Map<string, number>>(new Map());
  const [hasPeriodData, setHasPeriodData] = useState(false);
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const [isSavingHeldFund, setIsSavingHeldFund] = useState(false);
  const [returningHeldFundIds, setReturningHeldFundIds] = useState<string[]>([]);
  const [deletingHeldFundIds, setDeletingHeldFundIds] = useState<string[]>([]);
  const [convertingHeldFundIds, setConvertingHeldFundIds] = useState<string[]>([]);
  const [processingExpenseIds, setProcessingExpenseIds] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [pendingToggleBill, setPendingToggleBill] = useState<BillPayment | null>(null);

  // Form states for Held Funds
  const [showAddHeldFundForm, setShowAddHeldFundForm] = useState(false);
  const [heldFundName, setHeldFundName] = useState('');
  const [heldFundAmount, setHeldFundAmount] = useState('');
  const [heldFundDescription, setHeldFundDescription] = useState('');

  // Form states for Allocation Fund Expenses
  const [expandedAllocationId, setExpandedAllocationId] = useState<string | null>(null);
  const [addingExpenseForAllocId, setAddingExpenseForAllocId] = useState<string | null>(null);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [isShared, setIsShared] = useState(false);
  const [paidBy, setPaidBy] = useState('');
  const [sharedTotal, setSharedTotal] = useState('');
  const [sharedParties, setSharedParties] = useState(2);

  // Form states for Transfer Funds
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferSource, setTransferSource] = useState('spare');
  const [transferDest, setTransferDest] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDesc, setTransferDesc] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSavingTransfer, setIsSavingTransfer] = useState(false);
  const [deductFromHeldFundId, setDeductFromHeldFundId] = useState('');
  const [deductAmount, setDeductAmount] = useState('');

  // Detect mobile/touch devices to disable chart tooltips
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleLegendClick = useCallback((e: any) => {
    const dataKey = e.dataKey;
    if (!dataKey) return;
    setVisibleSeries((prev) => ({
      ...prev,
      [dataKey]: !prev[dataKey],
    }));
  }, []);

  // Handle trend filter change
  const handleTrendFilter = useCallback(async (limit: number) => {
    setTrendLimit(limit);
    try {
      const { dateFrom, dateTo } = getDateRange(dateFilter, customMonth);
      const trend = await getPayPeriodTrend(limit, { dateFrom, dateTo });
      setTrendData(trend);
    } catch {
      // Silently fail
    }
  }, [dateFilter, customMonth]);

  const fetchData = useCallback(async (filter: DateFilterPreset = 'this-month', custom?: MonthYearSelection | null) => {
    try {
      const supabase = createClient();
      const { dateFrom, dateTo, billMonth } = getDateRange(filter, custom);
      const dateOpts = { dateFrom, dateTo };

      // Calculate starting balance summary date filter
      let startingDateOpts = null;
      if (dateOpts.dateFrom) {
        const dFrom = new Date(dateOpts.dateFrom);
        dFrom.setDate(dFrom.getDate() - 1);
        startingDateOpts = { dateTo: dFrom.toISOString() };
      }

      // STAGE 1: Fetch all independent data in parallel
      const [
        user,
        configRes,
        types,
        periodData,
        rangePeriodsRes,
        summary,
        allTimeSummary,
        startingSummary,
        trend,
        spareTxns,
        bSummary,
        hasAnyPeriods
      ] = await Promise.all([
        getCurrentUser().catch(() => null),
        supabase.from('salary_configs').select('*').single(),
        getAllocationTypes().catch(() => []),
        getLatestPeriodInRange(dateOpts).catch(() => null),
        (() => {
          let q = supabase
            .from('pay_periods')
            .select('allocation_amounts')
            .order('created_at', { ascending: false });
          if (dateOpts.dateFrom) q = q.gte('created_at', dateOpts.dateFrom);
          if (dateOpts.dateTo) q = q.lte('created_at', dateOpts.dateTo);
          return q;
        })(),
        getFinancialSummary(dateOpts).catch(() => null),
        getFinancialSummary().catch(() => null),
        startingDateOpts ? getFinancialSummary(startingDateOpts).catch(() => null) : Promise.resolve(null),
        getPayPeriodTrend(6, dateOpts).catch(() => []),
        getSpareTransactionsInRange(dateOpts).catch(() => []),
        getBorrowingSummary().catch(() => null),
        getPayPeriods(1).catch(() => [])
      ]);

      if (user) {
        setUserId(user.id);
      }

      const configData = configRes.data;
      const configError = configRes.error;

      if (configError && configError.code !== 'PGRST116') {
        throw configError;
      }

      if (!configData) {
        setSalaryConfig(null);
        setIsLoading(false);
        return;
      }

      setSalaryConfig(configData);
      setAllocationTypes(types);
      setLatestPeriod(periodData);
      setFinancialSummary(summary);
      setAllTimeFinancialSummary(allTimeSummary);
      setStartingBalanceSummary(startingSummary);
      setTrendData(trend);
      setSpareTransactions(spareTxns);
      setBorrowingSummary(bSummary);

      const hasPeriodsVal = hasAnyPeriods.length > 0;
      setHasPeriods(hasPeriodsVal);

      // Process range periods
      const rangePeriods = rangePeriodsRes.data;
      if (rangePeriods && rangePeriods.length > 0) {
        const map = new Map<string, number>();
        for (const p of rangePeriods) {
          const amounts = (p.allocation_amounts ?? []) as any[];
          for (const item of amounts) {
            if (item.allocation_id) {
              const current = map.get(item.allocation_id) ?? 0;
              map.set(item.allocation_id, current + Number(item.actual ?? 0));
            }
          }
        }
        setActualAllocatedMap(map);
        setHasPeriodData(true);
      } else {
        setActualAllocatedMap(new Map());
        setHasPeriodData(false);
      }

      // STAGE 2: Fetch data depending on user, configData, and periodData
      const [
        allocRes,
        spent,
        consumable,
        funds
      ] = await Promise.all([
        supabase
          .from('budget_allocations')
          .select('*')
          .eq('salary_config_id', configData.id)
          .order('display_order', { ascending: true }),
        periodData?.id ? getSpareTotal(periodData.id).catch(() => 0) : Promise.resolve(0),
        getConsumableBudgetSummary(billMonth, configData.consumable_allowance ?? 4500).catch(() => null),
        user ? getHeldFunds().catch(() => []) : Promise.resolve([])
      ]);

      if (allocRes.error) throw allocRes.error;

      const allocData = allocRes.data ?? [];
      const totalSalary = (configData.full_time_salary ?? 0) + (configData.part_time_salary ?? 0);
      const computed = computeAllocations(allocData, totalSalary);
      
      setAllocations(computed);
      setSpareSpent(spent);
      setConsumableSummary(consumable);
      setHeldFunds(funds);

      // STAGE 3: Fetch allocations-dependent fund summaries and bills
      setActiveBillMonth(billMonth);

      const [summaries, bills] = await Promise.all([
        user ? getAllocationFundSummaries(
          user.id,
          computed.map((c) => ({ id: c.id, category: c.category, amount: c.amount })),
          dateOpts
        ).catch(() => []) : Promise.resolve([]),
        user && computed.length > 0 && hasPeriodsVal ? initMonthlyBills(
          user.id,
          billMonth,
          computed.map((a) => ({ id: a.id, amount: a.amount }))
        ).catch(() => []) : Promise.resolve([])
      ]);

      setAllocationFundSummaries(summaries);
      if (user && computed.length > 0 && hasPeriodsVal) {
        setBillPayments(bills);
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard data';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(dateFilter, customMonth);
  }, [fetchData, dateFilter, customMonth]);





  // Handle marking a bill as paid
  async function handleMarkBillPaid(bill: BillPayment) {
    if (!userId) return;

    try {
      const updated = await upsertBillPayment(userId, bill.allocation_id, activeBillMonth, {
        amount: bill.amount,
        is_paid: true,
        paid_at: new Date().toISOString(),
      });
      setBillPayments((prev) =>
        prev.map((b) => (b.allocation_id === bill.allocation_id ? updated : b))
      );
      toast.success('Bill marked as paid');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update bill';
      toast.error(message);
    }
  }

  // Handle toggling a bill paid/unpaid
  async function handleToggleBill(bill: BillPayment) {
    if (!userId) return;

    const newIsPaid = !bill.is_paid;
    const alloc = allocationMap.get(bill.allocation_id);
    const fullAmount = alloc?.amount ?? bill.amount;

    try {
      const updated = await upsertBillPayment(userId, bill.allocation_id, activeBillMonth, {
        amount: newIsPaid ? fullAmount : 0,
        is_paid: newIsPaid,
        paid_at: newIsPaid ? new Date().toISOString() : null,
      });
      setBillPayments((prev) =>
        prev.map((b) => (b.allocation_id === bill.allocation_id ? updated : b))
      );
      toast.success(newIsPaid ? 'Bill marked as paid' : 'Bill marked as unpaid');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update bill';
      toast.error(message);
    }
  }

  // ============================================
  // HELD FUNDS HANDLERS
  // ============================================
  async function handleAddHeldFund(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !heldFundName.trim() || !heldFundAmount) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSavingHeldFund(true);
    try {
      const fund = await createHeldFund(userId, {
        person_name: heldFundName.trim(),
        original_amount: parseFloat(heldFundAmount),
        description: heldFundDescription.trim() || undefined,
      });

      setHeldFunds((prev) => [fund, ...prev]);
      setIsLoading(true);
      await fetchData(dateFilter, customMonth);

      setHeldFundName('');
      setHeldFundAmount('');
      setHeldFundDescription('');
      setShowAddHeldFundForm(false);
      toast.success('Held fund recorded successfully');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to record held fund';
      toast.error(msg);
    } finally {
      setIsSavingHeldFund(false);
    }
  }

  async function handleReturnHeldFund(id: string) {
    setReturningHeldFundIds((prev) => [...prev, id]);
    try {
      const updated = await returnHeldFund(id);
      setHeldFunds((prev) => prev.map((f) => (f.id === id ? updated : f)));
      toast.success('Fund marked as returned');
      setIsLoading(true);
      await fetchData(dateFilter, customMonth);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to return held fund';
      toast.error(msg);
    } finally {
      setReturningHeldFundIds((prev) => prev.filter((x) => x !== id));
    }
  }

  async function handleConvertToOnlineDebt(fund: HeldFund) {
    if (!userId) return;

    if (fund.current_amount <= 0) {
      toast.error('Cannot convert a fund with zero balance');
      return;
    }

    setConvertingHeldFundIds((prev) => [...prev, fund.id]);
    try {
      const supabase = createClient();

      // 1. Get all expenses linked to this held fund
      const { data: linkedExpenses, error: expError } = await supabase
        .from('allocation_expenses')
        .select('*')
        .eq('held_fund_id', fund.id);

      if (expError) throw expError;

      // 2. Find the original allocation ID from the linked expenses
      let baseAllocation = null;
      if (linkedExpenses && linkedExpenses.length > 0) {
        const { data: alloc } = await supabase
          .from('budget_allocations')
          .select('*')
          .eq('id', linkedExpenses[0].allocation_id)
          .single();
        baseAllocation = alloc;
      }

      // 3. Create the new "for brother" budget allocation
      const baseCategory = baseAllocation?.category || 'Dental Care';
      const newCategory = `${baseCategory} for ${fund.person_name.toLowerCase()}`;
      
      const { data: newAlloc, error: allocErr } = await supabase
        .from('budget_allocations')
        .insert({
          salary_config_id: salaryConfig?.id || '',
          category: newCategory,
          percentage: 0,
          description: `Converted from ${fund.person_name}'s held fund`,
          icon_name: baseAllocation?.icon_name || 'piggy-bank',
          color: baseAllocation?.color || 'hsl(210, 80%, 60%)',
          display_order: 99,
          allocation_type_id: baseAllocation?.allocation_type_id || null,
          is_fixed: true,
        })
        .select()
        .single();

      if (allocErr) throw allocErr;

      // 4. Update pay period to add original amount to income & budget allocation
      if (latestPeriod) {
        const currentAdditionalIncome = Array.isArray(latestPeriod.additional_income)
          ? latestPeriod.additional_income
          : [];
        
        const newAdditionalIncome = [
          ...currentAdditionalIncome,
          {
            label: `Held Fund Conversion: ${fund.person_name}`,
            amount: fund.original_amount,
          }
        ];

        const currentAllocAmounts = Array.isArray(latestPeriod.allocation_amounts)
          ? latestPeriod.allocation_amounts
          : [];

        const newAllocAmounts = [
          ...currentAllocAmounts,
          {
            allocation_id: newAlloc.id,
            actual: fund.original_amount,
            target: fund.original_amount,
          }
        ];

        const input: any = {
          period_label: latestPeriod.period_label,
          first_wage: latestPeriod.first_wage,
          second_wage: latestPeriod.second_wage,
          part_time: latestPeriod.part_time,
          tax_rate: latestPeriod.tax_rate,
          total_deductions: latestPeriod.total_deductions,
          allocation_amounts: newAllocAmounts,
          additional_income: newAdditionalIncome,
          daily_consumable_rate: latestPeriod.daily_consumable_rate,
          daily_consumable_days: latestPeriod.daily_consumable_days,
          rent: latestPeriod.rent,
          electricity: latestPeriod.electricity,
          monthly_utils_items: latestPeriod.monthly_utils_items,
          emergency_fund: latestPeriod.emergency_fund,
          general_savings: latestPeriod.general_savings,
        };

        await updatePayPeriod(latestPeriod.id, input);
      }

      // 5. Update linked expenses and borrowings
      for (const e of linkedExpenses ?? []) {
        if (e.borrowing_id) {
          // This is a shared expense where you owe Brother (e.g. your share of cleaning)
          // 5a. Settle the borrowing
          await supabase
            .from('borrowings')
            .update({ is_settled: true, settled_at: new Date().toISOString() })
            .eq('id', e.borrowing_id);

          // 5b. Remove the held_fund_id from the original expense (keeps it under your allocation, now settled)
          await supabase
            .from('allocation_expenses')
            .update({ held_fund_id: null })
            .eq('id', e.id);

          // 5c. Create Brother's share of this expense under the new allocation
          const brothersShare = Number(e.shared_total ?? 0) - Number(e.amount);
          if (brothersShare > 0) {
            await supabase
              .from('allocation_expenses')
              .insert({
                user_id: userId,
                allocation_id: newAlloc.id,
                description: `Brother's Share: ${e.description}`,
                amount: brothersShare,
                expense_date: e.expense_date,
                is_shared: false,
                notes: `Auto-generated from held fund conversion`,
              });
          }
        } else {
          const isBrothersExpense = e.description.toLowerCase().includes('brother') || e.description.toLowerCase().includes(fund.person_name.toLowerCase());
          
          if (isBrothersExpense) {
            // This is a direct expense of Brother
            // Move it to the new allocation and remove held_fund_id
            await supabase
              .from('allocation_expenses')
              .update({
                allocation_id: newAlloc.id,
                held_fund_id: null,
              })
              .eq('id', e.id);
          } else {
            // This is a personal expense of the user borrowed from the held fund (Toll, Gas, etc.)
            // 1. Keep under original allocation, but remove held_fund_id
            // 2. Create a borrowing record so they owe Brother
            const { data: bRec, error: bRecErr } = await supabase
              .from('borrowings')
              .insert({
                user_id: userId,
                person_name: fund.person_name,
                type: 'borrowed',
                amount: e.amount,
                description: `Borrowed from held fund: ${e.description}`,
                transaction_date: e.expense_date,
                is_settled: false
              })
              .select()
              .single();

            if (!bRecErr && bRec) {
              await supabase
                .from('allocation_expenses')
                .update({
                  borrowing_id: bRec.id,
                  held_fund_id: null,
                })
                .eq('id', e.id);
            }
          }
        }
      }

      // 6. Create a borrowing record representing the remaining online debt
      await createBorrowing(userId, {
        person_name: fund.person_name,
        type: 'borrowed',
        amount: fund.current_amount,
        description: `Held fund converted to online debt: ${fund.description || ''}`.trim(),
        transaction_date: new Date().toISOString().split('T')[0],
      });

      // 7. Mark the Held Fund as returned (closed)
      const updatedFund = await returnHeldFund(fund.id);
      setHeldFunds((prev) => prev.map((f) => (f.id === fund.id ? updatedFund : f)));

      toast.success(`Converted! Created "${newCategory}" allocation of PHP ${formatPHP(fund.original_amount)}. Remaining PHP ${formatPHP(fund.current_amount)} is online debt.`);
      setIsLoading(true);
      await fetchData(dateFilter, customMonth);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to convert held fund';
      toast.error(msg);
    } finally {
      setConvertingHeldFundIds((prev) => prev.filter((x) => x !== fund.id));
    }
  }

  async function handleDeleteHeldFund(id: string) {
    setDeletingHeldFundIds((prev) => [...prev, id]);
    try {
      await deleteHeldFund(id);
      setHeldFunds((prev) => prev.filter((f) => f.id !== id));
      toast.success('Held fund deleted');
      setIsLoading(true);
      await fetchData(dateFilter, customMonth);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete held fund';
      toast.error(msg);
    } finally {
      setDeletingHeldFundIds((prev) => prev.filter((x) => x !== id));
    }
  }

  // ============================================
  // ALLOCATION EXPENSE HANDLERS
  // ============================================
  async function handleCreateExpense(allocationId: string) {
    if (!userId || !expenseDesc.trim() || !expenseAmount) {
      toast.error('Please fill in description and amount');
      return;
    }

    const amountNum = parseFloat(expenseAmount);
    if (amountNum <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    setIsSavingExpense(true);
    try {
      let finalAmount = amountNum;
      let sTotal: number | undefined;
      let sParties: number | undefined;
      
      if (isShared) {
        sTotal = amountNum;
        sParties = sharedParties;
        finalAmount = sTotal / sParties;
      }

      await createAllocationExpense(userId, {
        allocation_id: allocationId,
        description: expenseDesc.trim(),
        amount: finalAmount,
        expense_date: expenseDate,
        is_shared: isShared,
        paid_by: isShared && paidBy ? paidBy.trim() : undefined,
        shared_total: isShared ? sTotal : undefined,
        shared_parties: isShared ? sParties : undefined,
        held_fund_id: deductFromHeldFundId || undefined,
        held_fund_deduction: deductFromHeldFundId ? parseFloat(deductAmount) || amountNum : undefined,
        notes: undefined,
      });

      setIsLoading(true);
      await fetchData(dateFilter, customMonth);

      toast.success('Expense recorded successfully');
      setExpenseDesc('');
      setExpenseAmount('');
      setIsShared(false);
      setPaidBy('');
      setSharedTotal('');
      setDeductFromHeldFundId('');
      setDeductAmount('');
      setAddingExpenseForAllocId(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to record expense';
      toast.error(msg);
    } finally {
      setIsSavingExpense(false);
    }
  }

  async function handleDeleteExpense(expenseId: string) {
    setProcessingExpenseIds((prev) => [...prev, expenseId]);
    try {
      await deleteAllocationExpense(expenseId);
      toast.success('Expense deleted successfully');
      setIsLoading(true);
      await fetchData(dateFilter, customMonth);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete expense';
      toast.error(msg);
    } finally {
      setProcessingExpenseIds((prev) => prev.filter((x) => x !== expenseId));
    }
  }

  async function handleTransfer() {
    if (!userId || !transferSource || !transferDest || !transferAmount) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (transferSource === transferDest) {
      toast.error('Source and destination must be different');
      return;
    }

    const amountNum = parseFloat(transferAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    const needsPeriod = transferSource === 'spare' || transferDest === 'spare';
    if (needsPeriod && !latestPeriod) {
      toast.error('Please create at least one pay period in Payroll first.');
      return;
    }

    setIsSavingTransfer(true);
    try {
      const transferLinkId = crypto.randomUUID();
      const allocMap = new Map(allocations.map((a) => [a.id, a]));
      const sourceName = transferSource === 'spare' ? 'Spare Cash' : (allocMap.get(transferSource)?.category || 'Allocation');
      const destName = transferDest === 'spare' ? 'Spare Cash' : (allocMap.get(transferDest)?.category || 'Allocation');
      const baseDesc = transferDesc.trim() ? `: ${transferDesc.trim()}` : '';

      if (transferSource === 'spare') {
        // Spare -> Allocation
        await Promise.all([
          createSpareTransaction(userId, latestPeriod!.id, {
            description: `Transfer to ${destName}${baseDesc}`,
            amount: amountNum,
            transaction_date: transferDate,
            transfer_link_id: transferLinkId,
          }),
          createAllocationExpense(userId, {
            allocation_id: transferDest,
            description: `Transfer from Spare Cash${baseDesc}`,
            amount: -amountNum,
            expense_date: transferDate,
            transfer_link_id: transferLinkId,
          })
        ]);
      } else if (transferDest === 'spare') {
        // Allocation -> Spare
        await Promise.all([
          createAllocationExpense(userId, {
            allocation_id: transferSource,
            description: `Transfer to Spare Cash${baseDesc}`,
            amount: amountNum,
            expense_date: transferDate,
            transfer_link_id: transferLinkId,
          }),
          createSpareTransaction(userId, latestPeriod!.id, {
            description: `Transfer from ${sourceName}${baseDesc}`,
            amount: -amountNum,
            transaction_date: transferDate,
            transfer_link_id: transferLinkId,
          })
        ]);
      } else {
        // Allocation -> Allocation
        await Promise.all([
          createAllocationExpense(userId, {
            allocation_id: transferSource,
            description: `Transfer to ${destName}${baseDesc}`,
            amount: amountNum,
            expense_date: transferDate,
            transfer_link_id: transferLinkId,
          }),
          createAllocationExpense(userId, {
            allocation_id: transferDest,
            description: `Transfer from ${sourceName}${baseDesc}`,
            amount: -amountNum,
            expense_date: transferDate,
            transfer_link_id: transferLinkId,
          })
        ]);
      }

      toast.success('Funds transferred successfully');
      setTransferAmount('');
      setTransferDesc('');
      setShowTransferModal(false);
      setIsLoading(true);
      await fetchData(dateFilter, customMonth);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to transfer funds';
      toast.error(msg);
    } finally {
      setIsSavingTransfer(false);
    }
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!salaryConfig) {
    return <EmptyState />;
  }

  // Build a map of allocation_type_id -> classification
  const typeClassificationMap = new Map(
    allocationTypes.map((t) => [t.id, t.classification])
  );

  // Helper to get classification for an allocation
  function getClassification(alloc: BudgetAllocationWithAmount): 'expense' | 'asset' | null {
    if (!alloc.allocation_type_id) return null;
    return typeClassificationMap.get(alloc.allocation_type_id) ?? null;
  }

  // Use aggregated financial summary for card values (sums across ALL periods in range)
  // This prevents a spare-only period from zeroing out salary/expense cards
  const fullTimeSalary = financialSummary?.fullTimeSalary ?? 0;
  const partTimeSalary = financialSummary?.partTimeSalary ?? 0;
  // Show part-time cards if config has part-time salary (even if no period saved yet)
  const hasPartTime = (salaryConfig.part_time_salary ?? 0) > 0;
  const totalSalary = fullTimeSalary + partTimeSalary;
  const taxAmount = financialSummary?.totalTax ?? 0;
  const forgivenLent = financialSummary?.forgivenLent ?? 0;
  const giftedIncome = financialSummary?.giftedIncome ?? 0;

  // Calculate additionalExpenseOutflow:
  const additionalExpenseOutflow = allocations
    .filter((a) => getClassification(a) === 'expense')
    .reduce((sum, alloc) => {
      const bill = billPayments.find((b) => b.allocation_id === alloc.id);
      const allocated = actualAllocatedMap.get(alloc.id) ?? 0;
      const paid = Number(bill?.amount ?? 0);
      return sum + Math.max(0, paid - allocated);
    }, 0);

  const totalExpenses = (financialSummary?.totalExpensesSum ?? 0) + additionalExpenseOutflow + forgivenLent;
  const displayedTotalExpenses = hasPeriodData
    ? totalExpenses
    : allocations.filter((a) => getClassification(a) === 'expense').reduce((sum, a) => sum + a.amount, 0);

  // Spare: use aggregated spare and spent from ALL periods in range
  const spareAmount = (financialSummary?.totalSpare ?? 0) + giftedIncome;
  const totalSpareSpent = financialSummary?.totalSpareSpent ?? 0;
  
  // financialSummary.monthlyExpenses now represents pure budget expenses.
  // We simply add totalAssets to get the "Fixed Allocations" amount.
  const totalAllocated = (financialSummary?.monthlyExpenses ?? 0) + (financialSummary?.totalAssets ?? 0);
  const totalConsumableSpent = financialSummary?.totalConsumableSpent ?? 0;
  const totalBorrowedAmt = financialSummary?.totalBorrowed ?? 0;
  const totalLentAmt = financialSummary?.totalLent ?? 0;
  const totalBorrowingSpent = financialSummary?.totalBorrowingExpensesSpent ?? 0;

  const totalOutflow = totalAllocated + totalSpareSpent + totalConsumableSpent + totalBorrowingSpent + forgivenLent;
  const remainingSpare = spareAmount - totalSpareSpent - totalConsumableSpent - totalBorrowingSpent - additionalExpenseOutflow;

  // Compute all-time remaining spare (Current Wallet Liquid Cash)
  const allTimeSpareAmount = (allTimeFinancialSummary?.totalSpare ?? 0) + (allTimeFinancialSummary?.giftedIncome ?? 0);
  const allTimeRemainingSpare = allTimeSpareAmount 
    - (allTimeFinancialSummary?.totalSpareSpent ?? 0) 
    - (allTimeFinancialSummary?.totalConsumableSpent ?? 0) 
    - (allTimeFinancialSummary?.totalBorrowingExpensesSpent ?? 0);

  // Compute starting balance for the selected date filter
  const startingSpareAmount = (startingBalanceSummary?.totalSpare ?? 0) + (startingBalanceSummary?.giftedIncome ?? 0);
  const startingBalance = startingBalanceSummary ? startingSpareAmount 
    - (startingBalanceSummary.totalSpareSpent ?? 0) 
    - (startingBalanceSummary.totalConsumableSpent ?? 0) 
    - (startingBalanceSummary.totalBorrowingExpensesSpent ?? 0) : 0;

  // The ending balance for the filtered period is the starting balance plus the net flow of this period
  const endingBalance = startingBalance + remainingSpare;

  // Filter allocations based on category filter
  const filteredAllocations = categoryFilter === 'all'
    ? allocations
    : allocations.filter((a) => getClassification(a) === categoryFilter);

  // Chart data (uses filtered allocations)
  const chartData = filteredAllocations.map((a) => ({
    name: a.category,
    category: a.category,
    value: a.amount,
    amount: a.amount,
    percentage: a.percentage,
    fill: a.color || 'hsl(220, 15%, 50%)',
  }));

  // Unpaid bills
  const unpaidBills = billPayments.filter((b) => !b.is_paid);
  const paidCount = billPayments.filter((b) => b.is_paid).length;
  const partialCount = billPayments.filter((b) => !b.is_paid && Number(b.amount) > 0).length;

  // Map allocation_id -> allocation category name for bill display
  const allocationMap = new Map(allocations.map((a) => [a.id, a]));

  // Filter bills based on billFilter
  const filteredBillPayments = (billFilter === 'all'
    ? billPayments
    : billPayments.filter((bill) => {
        const alloc = allocationMap.get(bill.allocation_id);
        if (!alloc?.allocation_type_id) return false;
        return typeClassificationMap.get(alloc.allocation_type_id) === billFilter;
      })
  ).toSorted((a, b) => {
    // Unpaid first, paid last
    if (a.is_paid !== b.is_paid) return a.is_paid ? 1 : -1;
    // Among unpaid: sort by amount paid ascending (0 first, then lowest partial)
    if (!a.is_paid && !b.is_paid) {
      return Number(a.amount) - Number(b.amount);
    }
    return 0;
  });
  const filteredPaidCount = filteredBillPayments.filter((b) => b.is_paid).length;
  const filteredPartialCount = filteredBillPayments.filter((b) => !b.is_paid && Number(b.amount) > 0).length;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-6"
    >
      {/* Date Filter Bar */}
      <div data-onboarding="date-filter" className="sticky top-14 z-20 -mx-4 bg-background/80 px-4 py-3 backdrop-blur-md border-b border-border/20 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 flex items-center justify-between gap-4 overflow-x-auto scrollbar-none">
        <motion.div
          variants={staggerItem}
          className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <CalendarRange className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-center gap-1.5">
            {DATE_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setDateFilter(opt.value); setCustomMonth(null); }}
                className={cn(
                  'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer',
                  dateFilter === opt.value && !customMonth
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {opt.label}
              </button>
            ))}
            <MonthYearPicker
              value={customMonth}
              onChange={(val) => {
                setCustomMonth(val);
                if (val) {
                  setDateFilter('custom');
                } else {
                  setDateFilter('this-month');
                }
              }}
              placeholder="Custom"
            />
          </div>
        </motion.div>

        <motion.div variants={staggerItem} className="shrink-0">
          <Button
            onClick={() => {
              setTransferSource('spare');
              setTransferDest(allocations[0]?.id || 'spare');
              setTransferAmount('');
              setTransferDesc('');
              setTransferDate(new Date().toISOString().split('T')[0]);
              setShowTransferModal(true);
            }}
            className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer shadow-sm"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Transfer Funds
          </Button>
        </motion.div>
      </div>

      {/* Unpaid Bills Alert Banner - only show on This Month and when user has at least one pay period */}
      <AnimatePresence>
        {dateFilter === 'this-month' && unpaidBills.length > 0 && hasPeriods && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <Card className="overflow-hidden border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 dark:from-amber-500/15 dark:via-orange-500/15 dark:to-amber-500/5">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
                    <AlertTriangle className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                      {unpaidBills.length} bill{unpaidBills.length !== 1 ? 's' : ''} unpaid this month
                    </p>
                    {/* Expenses */}
                    {(() => {
                      const unpaidExpenses = unpaidBills.filter((b) => {
                        const alloc = allocationMap.get(b.allocation_id);
                        return alloc && getClassification(alloc) === 'expense';
                      });
                      const unpaidAssets = unpaidBills.filter((b) => {
                        const alloc = allocationMap.get(b.allocation_id);
                        return alloc && getClassification(alloc) === 'asset';
                      });
                      return (
                        <div className="mt-2 space-y-2">
                          {unpaidExpenses.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-400/80 mb-1">Expenses</p>
                              <div className="flex flex-wrap gap-2">
                                {unpaidExpenses.map((bill) => {
                                  const alloc = allocationMap.get(bill.allocation_id);
                                  const budgeted = alloc?.amount ?? Number(bill.amount);
                                  const paid = Number(bill.amount);
                                  const remaining = budgeted - paid;
                                  const isPartial = paid > 0;
                                  return (
                                    <div
                                      key={bill.id}
                                      className="flex items-center gap-2 rounded-lg bg-white/60 px-2.5 py-1.5 text-xs dark:bg-white/10"
                                    >
                                      <span className="font-medium text-foreground capitalize">
                                        {alloc?.category ?? 'Bill'}
                                      </span>
                                      <span className="text-muted-foreground tabular-nums">
                                        PHP {formatPHP(remaining)}{isPartial ? ' left' : ''}
                                      </span>
                                      <Button
                                        size="xs"
                                        variant="secondary"
                                        className="ml-0.5 h-5 px-1.5 text-[10px]"
                                        onClick={() => setPendingToggleBill(bill)}
                                      >
                                        Mark Paid
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {unpaidAssets.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-400/80 mb-1">Savings & Assets</p>
                              <div className="flex flex-wrap gap-2">
                                {unpaidAssets.map((bill) => {
                                  const alloc = allocationMap.get(bill.allocation_id);
                                  const budgeted = alloc?.amount ?? Number(bill.amount);
                                  const paid = Number(bill.amount);
                                  const remaining = budgeted - paid;
                                  const isPartial = paid > 0;
                                  return (
                                    <div
                                      key={bill.id}
                                      className="flex items-center gap-2 rounded-lg bg-white/60 px-2.5 py-1.5 text-xs dark:bg-white/10"
                                    >
                                      <span className="font-medium text-foreground capitalize">
                                        {alloc?.category ?? 'Bill'}
                                      </span>
                                      <span className="text-muted-foreground tabular-nums">
                                        PHP {formatPHP(remaining)}{isPartial ? ' left' : ''}
                                      </span>
                                      <Button
                                        size="xs"
                                        variant="secondary"
                                        className="ml-0.5 h-5 px-1.5 text-[10px]"
                                        onClick={() => setPendingToggleBill(bill)}
                                      >
                                        Mark Paid
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Financial Overview Cards */}
      {financialSummary && (
        <motion.div variants={staggerItem}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <OverviewCard
              label="Current Wallet (Liquid Cash)"
              value={startingBalance}
              icon={Wallet}
              colorTheme="sky"
              tooltip={
                <div className="space-y-1 w-44">
                  <p className="font-semibold mb-1 text-background">Calculation Breakdown:</p>
                  <p className="text-background/70 text-[10px] leading-normal mb-1">
                    Total accumulated spare cash carried over from previous periods:
                  </p>
                  <div className="grid grid-cols-[1fr_auto] gap-x-4 border-t border-background/20 pt-1 mt-1 text-background/90">
                    <span className="text-background/70">Prev. Spare Cash:</span>
                    <span className="font-medium">PHP {formatPHP(startingSpareAmount)}</span>
                    <span className="text-background/70">Prev. Spent:</span>
                    <span className="text-rose-400 dark:text-rose-600 font-medium">- PHP {formatPHP((startingBalanceSummary?.totalSpareSpent ?? 0) + (startingBalanceSummary?.totalConsumableSpent ?? 0) + (startingBalanceSummary?.totalBorrowingExpensesSpent ?? 0))}</span>
                    <span className="font-bold border-t border-background/20 pt-0.5 mt-0.5">Starting Balance:</span>
                    <span className="font-bold border-t border-background/20 pt-0.5 mt-0.5">PHP {formatPHP(startingBalance)}</span>
                  </div>
                </div>
              }
            />
            <OverviewCard
              label="Net Income"
              value={financialSummary?.netIncome ?? 0}
              icon={DollarSign}
              colorTheme="emerald"
              tooltip={
                <div className="space-y-1 w-44">
                  <p className="font-semibold mb-1 text-background">Calculation Breakdown:</p>
                  <div className="grid grid-cols-[1fr_auto] gap-x-4 text-background/90">
                    <span className="text-background/70">Gross Income:</span>
                    <span className="font-medium">PHP {formatPHP(financialSummary?.grossIncome ?? 0)}</span>
                    <span className="text-rose-400 dark:text-rose-600">Taxes:</span>
                    <span className="text-rose-400 dark:text-rose-600 font-medium">- PHP {formatPHP(financialSummary?.totalTax ?? 0)}</span>
                    <span className="text-rose-400 dark:text-rose-600">Deductions:</span>
                    <span className="text-rose-400 dark:text-rose-600 font-medium">- PHP {formatPHP(financialSummary?.totalDeductions ?? 0)}</span>
                    <span className="text-emerald-400 dark:text-emerald-600 font-bold border-t border-background/20 pt-0.5 mt-0.5">Net Income:</span>
                    <span className="text-emerald-400 dark:text-emerald-600 font-bold border-t border-background/20 pt-0.5 mt-0.5">PHP {formatPHP(financialSummary?.netIncome ?? 0)}</span>
                  </div>
                </div>
              }
            />
            <OverviewCard
              label="Total Expenditures"
              value={totalOutflow}
              icon={TrendingDown}
              colorTheme="rose"
              tooltip={
                <div className="space-y-1 w-44">
                  <p className="font-semibold mb-1 text-background">Calculation Breakdown:</p>
                  <div className="grid grid-cols-[1fr_auto] gap-x-4 text-background/90">
                    <span className="text-background/70">Fixed Allocations:</span>
                    <span className="text-rose-400 dark:text-rose-600 font-medium">- PHP {formatPHP(totalAllocated)}</span>
                    <span className="text-background/70">Spare Spent:</span>
                    <span className="text-rose-400 dark:text-rose-600 font-medium">+ PHP {formatPHP(totalSpareSpent)}</span>
                    <span className="text-background/70">Consumables:</span>
                    <span className="text-rose-400 dark:text-rose-600 font-medium">+ PHP {formatPHP(totalConsumableSpent)}</span>
                    <span className="text-background/70">Borrowing Spent:</span>
                    <span className="text-rose-400 dark:text-rose-600 font-medium">+ PHP {formatPHP(totalBorrowingSpent)}</span>
                  </div>
                </div>
              }
            />
            {/* Available Spare Card - Always green */}
            <div className="relative overflow-hidden rounded-xl bg-emerald-500 p-4 shadow-sm border border-emerald-400/20 flex flex-col justify-between">
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-white/90">Available Spare</p>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger className="flex cursor-help opacity-70 transition-opacity hover:opacity-100 shrink-0">
                        <Info className="h-3.5 w-3.5 text-white" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">
                        <div className="space-y-1">
                          <p className="font-semibold mb-1 text-background">Calculation Breakdown:</p>
                          <div className="grid grid-cols-[1fr_auto] gap-x-4 text-background/90">
                            <span className="text-background/70">Starting Balance:</span>
                            <span className="font-medium">PHP {formatPHP(startingBalance)}</span>
                            
                            <span className="text-background/70">Budgeted Spare:</span>
                            <span className="font-medium">+ PHP {formatPHP(financialSummary?.totalSpare ?? 0)}</span>
                            
                            {giftedIncome > 0 && (
                              <>
                                <span className="text-emerald-400 dark:text-emerald-600">Gifted/Forgiven Borrowings:</span>
                                <span className="text-emerald-400 dark:text-emerald-600 font-medium">+ PHP {formatPHP(giftedIncome)}</span>
                              </>
                            )}
                            
                            <span className="text-background/70">Spent from Spare:</span>
                            <span className="text-rose-400 dark:text-rose-600 font-medium">- PHP {formatPHP(totalSpareSpent)}</span>
                            
                            <span className="text-background/70">Consumable Spent:</span>
                            <span className="text-rose-400 dark:text-rose-600 font-medium">- PHP {formatPHP(totalConsumableSpent)}</span>
                            
                            <span className="text-background/70">Borrowing Spent:</span>
                            <span className="text-rose-400 dark:text-rose-600 font-medium">- PHP {formatPHP(totalBorrowingSpent)}</span>
                          </div>
                          
                          {(totalBorrowedAmt > 0 || totalLentAmt > 0) && (
                            <div className="mt-2 pt-2 border-t border-background/20 space-y-1">
                              <p className="font-semibold text-background">True Cash Position:</p>
                              <div className="grid grid-cols-[1fr_auto] gap-x-4 text-background/90">
                                <span className="text-background/70">Available Spare:</span>
                                <span className="font-medium">PHP {formatPHP(endingBalance)}</span>
                                <span className="text-background/70">Owed to Me (Active):</span>
                                <span className="text-emerald-400 dark:text-emerald-600 font-medium">+ PHP {formatPHP(totalLentAmt)}</span>
                                <span className="text-background/70">I Owe (Active):</span>
                                <span className="text-rose-400 dark:text-rose-600 font-medium">- PHP {formatPHP(totalBorrowedAmt)}</span>
                                <span className="font-bold mt-0.5 border-t border-background/20 pt-0.5">True Balance:</span>
                                <span className="font-bold mt-0.5 border-t border-background/20 pt-0.5">PHP {formatPHP(endingBalance + totalLentAmt - totalBorrowedAmt)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 shrink-0">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </div>
              
              <div className="flex flex-col gap-0.5 mt-auto">
                <span className="text-2xl font-semibold tabular-nums font-display text-white">
                  PHP {formatPHP(endingBalance)}
                </span>
                {(totalSpareSpent > 0 || totalConsumableSpent > 0 || totalBorrowingSpent > 0) && (
                  <span className="text-[11px] text-white/75 leading-tight">
                    PHP {formatPHP(totalSpareSpent + totalConsumableSpent + totalBorrowingSpent)} spent from spare
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Monthly Financial Breakdown */}
      {financialSummary && latestPeriod && (
        <motion.div variants={staggerItem}>
          <Card className="overflow-visible">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="flex items-center gap-2">Monthly Financial Breakdown
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger className="flex">
                        <Info className="h-3 w-3 text-muted-foreground/50 cursor-help shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Where your money goes this period
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </CardTitle>
              </div>
              <CardDescription>Where your money goes this period</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Financial Flow Summary */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {[
                  {
                    label: 'Net Income',
                    value: financialSummary.netIncome,
                    color: 'text-emerald-500 dark:text-emerald-400',
                    bg: 'bg-emerald-500/8',
                    tooltip: (
                      <div className="space-y-0.5 text-xs text-background/90">
                        <p className="font-semibold mb-1 text-background">Net Income Calculation:</p>
                        <div className="grid grid-cols-[1fr_auto] gap-x-4">
                          <span className="text-background/70">Gross Income:</span>
                          <span className="font-medium text-background">PHP {formatPHP(financialSummary.grossIncome)}</span>
                          <span className="text-rose-400 dark:text-rose-600 font-medium">Total Tax:</span>
                          <span className="text-rose-400 dark:text-rose-600 font-medium">- PHP {formatPHP(financialSummary.totalTax)}</span>
                          <span className="text-rose-400 dark:text-rose-600 font-medium">Total Deductions:</span>
                          <span className="text-rose-400 dark:text-rose-600 font-medium">- PHP {formatPHP(financialSummary.totalDeductions ?? 0)}</span>
                          <span className="text-emerald-400 dark:text-emerald-600 font-bold border-t border-background/20 pt-0.5 mt-0.5">Net Income:</span>
                          <span className="text-emerald-400 dark:text-emerald-600 font-bold border-t border-background/20 pt-0.5 mt-0.5">PHP {formatPHP(financialSummary.netIncome)}</span>
                        </div>
                      </div>
                    )
                  },
                  {
                    label: 'Budget Expenses',
                    value: totalExpenses,
                    color: 'text-orange-500 dark:text-orange-400',
                    bg: 'bg-orange-500/8',
                    tooltip: (
                      <div className="space-y-0.5 text-xs text-background/90">
                        <p className="font-semibold mb-1 text-background">Budget Expenses Calculation:</p>
                        <div className="grid grid-cols-[1fr_auto] gap-x-4">
                          <span className="text-background/70">Salary Allocation:</span>
                          <span className="font-medium text-background">PHP {formatPHP(financialSummary.totalExpensesSum)}</span>
                          <span className="text-background/70">Additional Paid Bills:</span>
                          <span className="font-medium text-background">+ PHP {formatPHP(additionalExpenseOutflow)}</span>
                          {forgivenLent > 0 && (
                            <>
                              <span className="text-background/70">Forgiven Lent:</span>
                              <span className="font-medium text-background">+ PHP {formatPHP(forgivenLent)}</span>
                            </>
                          )}
                          <span className="text-orange-400 dark:text-orange-600 font-bold border-t border-background/20 pt-0.5 mt-0.5">Total Expenses:</span>
                          <span className="text-orange-400 dark:text-orange-600 font-bold border-t border-background/20 pt-0.5 mt-0.5">PHP {formatPHP(totalExpenses)}</span>
                        </div>
                      </div>
                    )
                  },
                  {
                    label: 'Savings',
                    value: financialSummary.totalSavings ?? financialSummary.totalAssets,
                    color: 'text-violet-500 dark:text-violet-400',
                    bg: 'bg-violet-500/8',
                    tooltip: (
                      <div className="space-y-0.5 text-xs max-w-[220px] text-background/90">
                        <p className="font-semibold mb-1 text-background">Savings Calculation:</p>
                        <div className="grid grid-cols-[1fr_auto] gap-x-4">
                          <span className="text-background/70">Deposited this month:</span>
                          <span className="font-medium text-background">PHP {formatPHP(financialSummary.totalSavings ?? financialSummary.totalAssets)}</span>
                        </div>
                        <p className="text-[10px] text-background/70 mt-1.5 italic leading-normal border-t border-background/20 pt-1">
                          Note: The list below shows a current remaining balance of PHP {formatPHP(financialSummary.totalAssets)} after deducting expenses paid from savings.
                        </p>
                      </div>
                    )
                  },
                  {
                    label: 'Spare Spent',
                    value: totalSpareSpent + totalConsumableSpent + totalBorrowingSpent,
                    color: 'text-amber-500 dark:text-amber-400',
                    bg: 'bg-amber-500/8',
                    tooltip: (
                      <div className="space-y-0.5 text-xs text-background/90">
                        <p className="font-semibold mb-1 text-background">Spare Spent Calculation:</p>
                        <div className="grid grid-cols-[1fr_auto] gap-x-4">
                          <span className="text-background/70">Spare Transactions:</span>
                          <span className="font-medium text-background">PHP {formatPHP(totalSpareSpent)}</span>
                          <span className="text-background/70">Consumable Budget:</span>
                          <span className="font-medium text-background">+ PHP {formatPHP(totalConsumableSpent)}</span>
                          <span className="text-background/70">Borrowing Expenses:</span>
                          <span className="font-medium text-background">+ PHP {formatPHP(totalBorrowingSpent)}</span>
                          <span className="text-amber-400 dark:text-amber-600 font-bold border-t border-background/20 pt-0.5 mt-0.5">Total Spent:</span>
                          <span className="text-amber-400 dark:text-amber-600 font-bold border-t border-background/20 pt-0.5 mt-0.5">PHP {formatPHP(totalSpareSpent + totalConsumableSpent + totalBorrowingSpent)}</span>
                        </div>
                      </div>
                    )
                  },
                  {
                    label: 'Remaining',
                    value: remainingSpare,
                    color: remainingSpare >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-orange-500 dark:text-orange-400',
                    bg: remainingSpare >= 0 ? 'bg-emerald-500/8' : 'bg-orange-500/8',
                    tooltip: (
                      <div className="space-y-0.5 text-xs text-background/90">
                        <p className="font-semibold mb-1 text-background">Remaining Calculation:</p>
                        <div className="grid grid-cols-[1fr_auto] gap-x-4">
                          <span className="text-background/70">Net Income:</span>
                          <span className="font-medium text-background">PHP {formatPHP(financialSummary.netIncome)}</span>
                          
                          {giftedIncome > 0 && (
                            <>
                              <span className="text-emerald-400 dark:text-emerald-600">Gifted Borrowings:</span>
                              <span className="text-emerald-400 dark:text-emerald-600 font-medium">+ PHP {formatPHP(giftedIncome)}</span>
                            </>
                          )}
                          
                          <span className="text-rose-400 dark:text-rose-600">Budget Expenses:</span>
                          <span className="text-rose-400 dark:text-rose-600 font-medium">- PHP {formatPHP(totalExpenses)}</span>
                          
                          <span className="text-rose-400 dark:text-rose-600">Savings & Assets:</span>
                          <span className="text-rose-400 dark:text-rose-600 font-medium">- PHP {formatPHP(financialSummary.totalSavings ?? financialSummary.totalAssets)}</span>
                          
                          <span className="text-rose-400 dark:text-rose-600">Spare Spent:</span>
                          <span className="text-rose-400 dark:text-rose-600 font-medium">- PHP {formatPHP(totalSpareSpent + totalConsumableSpent + totalBorrowingSpent)}</span>
                          
                          <span className="font-bold border-t border-background/20 pt-0.5 mt-0.5 text-background">Total Remaining:</span>
                          <span className="font-bold border-t border-background/20 pt-0.5 mt-0.5 text-background">PHP {formatPHP(remainingSpare)}</span>
                        </div>
                      </div>
                    )
                  },
                ].map((item, i) => {
                  const cardContent = (
                    <div className={cn('flex-1 rounded-lg p-3 w-full', item.bg)}>
                      <div className="flex items-center gap-1">
                        <p className="text-[11px] font-medium text-muted-foreground">{item.label}</p>
                        {item.tooltip && (
                          <TooltipProvider>
                            <UITooltip>
                              <TooltipTrigger className="flex cursor-help opacity-70 transition-opacity hover:opacity-100 shrink-0">
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                {item.tooltip}
                              </TooltipContent>
                            </UITooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <p className={cn('text-sm font-bold tabular-nums', item.color)}>
                        PHP {formatPHP(item.value)}
                      </p>
                    </div>
                  );

                  return (
                    <div key={item.label} className="flex items-center gap-2 w-full">
                      {cardContent}
                      {i < 4 && (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30 hidden lg:block" />
                      )}
                    </div>
                  );
                })}
              </div>

              <Separator />

              {/* 3 Column Grid */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Column 1: Budget Expenses */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Budget Expenses</h3>
                    <Badge variant="secondary" className="text-[10px]">
                      {billPayments.filter(b => b.is_paid && getClassification(allocationMap.get(b.allocation_id)!) === 'expense').length}/{allocations.filter(a => getClassification(a) === 'expense').length} paid
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                    {allocations
                      .filter((a) => getClassification(a) === 'expense')
                      .map((alloc) => {
                        const bill = billPayments.find((b) => b.allocation_id === alloc.id);
                        const isPaid = bill?.is_paid ?? false;
                        const isPartial = !isPaid && Number(bill?.amount ?? 0) > 0;
                        const targetAmount = hasPeriodData ? ((actualAllocatedMap.get(alloc.id) || Number(bill?.amount || 0)) || alloc.amount) : alloc.amount;
                        return (
                          <button
                            key={alloc.id}
                            type="button"
                            onClick={() => bill && setPendingToggleBill(bill)}
                            className={cn(
                              'flex items-center justify-between rounded-lg p-2.5 transition-colors duration-150 cursor-pointer text-left w-full',
                              isPaid
                                ? 'bg-emerald-500/5 hover:bg-emerald-500/10'
                                : 'hover:bg-muted/50'
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="shrink-0">
                                {isPaid ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                ) : isPartial ? (
                                  <Circle className="h-4 w-4 text-amber-400" strokeWidth={2.5} />
                                ) : (
                                  <Circle className="h-4 w-4 text-muted-foreground/40" />
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className={cn(
                                  'text-xs font-medium capitalize truncate',
                                  isPaid ? 'text-muted-foreground line-through' : 'text-foreground'
                                )}>
                                  {alloc.category}
                                </span>
                                {isPaid && bill?.paid_at && (
                                  <span className="text-[10px] text-muted-foreground">
                                    Paid {new Date(bill.paid_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                                {isPartial && (
                                  <span className="text-[10px] text-amber-500">
                                    Paid {formatPHP(Number(bill!.amount))} of {formatPHP(targetAmount)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className={cn(
                              'text-xs font-semibold tabular-nums shrink-0',
                              isPaid ? 'text-muted-foreground' : 'text-foreground'
                            )}>
                              PHP {formatPHP(targetAmount)}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] text-muted-foreground">Total Budget Expenses</span>
                    <span className="text-xs font-bold tabular-nums text-orange-400">
                      PHP {formatPHP(displayedTotalExpenses)}
                    </span>
                  </div>
                </div>

                {/* Column 2: Savings & Assets */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Savings & Assets</h3>
                    <Badge variant="secondary" className="text-[10px] bg-violet-500/10 text-violet-500">
                      {allocations.filter(a => getClassification(a) === 'asset').length} items
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1">
                    {allocations
                      .filter((a) => getClassification(a) === 'asset')
                      .map((alloc) => {
                        const summary = allocationFundSummaries.find((s) => s.allocation_id === alloc.id);
                        const displayedValue = summary ? summary.remaining : (hasPeriodData ? (actualAllocatedMap.get(alloc.id) ?? 0) : alloc.amount);
                        return (
                          <div
                            key={alloc.id}
                            className="flex items-center justify-between rounded-lg p-2.5 hover:bg-muted/50 transition-colors duration-150"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500/10">
                                <Landmark className="h-3.5 w-3.5 text-violet-500" />
                              </div>
                              <span className="text-xs font-medium capitalize text-foreground">{alloc.category}</span>
                            </div>
                            <span className="text-xs font-semibold tabular-nums text-violet-500">
                              PHP {formatPHP(displayedValue)}
                            </span>
                          </div>
                        );
                      })}
                    {allocations.filter((a) => getClassification(a) === 'asset').length === 0 && (
                      <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                        No asset allocations configured
                      </div>
                    )}
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] text-muted-foreground">Total Savings</span>
                    <span className="text-xs font-bold tabular-nums text-violet-500">
                      PHP {formatPHP(hasPeriodData ? (financialSummary?.totalAssets ?? 0) : allocations.filter(a => getClassification(a) === 'asset').reduce((sum, a) => sum + a.amount, 0))}
                    </span>
                  </div>
                </div>

                {/* Column 3: Consumable Budget + Borrowing */}
                <div className="space-y-5">
                  {/* Consumable Budget */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">Consumable Budget</h3>
                      <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-500">
                        {consumableSummary?.expenses.length ?? 0} expenses
                      </Badge>
                    </div>
                    {consumableSummary ? (
                      <>
                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>{consumableSummary.allowance > 0 ? `${Math.min(Math.round((consumableSummary.totalSpent / consumableSummary.allowance) * 100), 100)}%` : '0%'} used</span>
                            <span className={cn('font-medium', consumableSummary.isOverBudget ? 'text-rose-500' : 'text-emerald-500')}>
                              {consumableSummary.isOverBudget ? 'Over budget' : `${formatPHP(consumableSummary.remaining)} left`}
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-500',
                                consumableSummary.isOverBudget ? 'bg-rose-500' : 
                                  (consumableSummary.totalSpent / consumableSummary.allowance) >= 0.8 ? 'bg-amber-500' : 'bg-emerald-500'
                              )}
                              style={{ width: `${Math.min((consumableSummary.totalSpent / Math.max(consumableSummary.allowance, 1)) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                        {/* Recent expenses */}
                        <div className="flex flex-col gap-0.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                          {consumableSummary.expenses.slice(0, 5).map((exp) => (
                            <div
                              key={exp.id}
                              className="flex items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-muted/50 transition-colors duration-150"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 w-12">
                                  {new Date(exp.expense_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                                </span>
                                <span className="text-xs text-foreground truncate">{exp.description}</span>
                              </div>
                              <span className="text-xs font-semibold tabular-nums text-amber-400/80 shrink-0">
                                -PHP {formatPHP(Number(exp.amount))}
                              </span>
                            </div>
                          ))}
                          {consumableSummary.expenses.length === 0 && (
                            <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
                              No consumable expenses this month
                            </div>
                          )}
                        </div>
                        <Separator />
                        <div className="space-y-1 px-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground">Allowance</span>
                            <span className="text-xs tabular-nums text-foreground">PHP {formatPHP(consumableSummary.allowance)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground">Total Spent</span>
                            <span className="text-xs tabular-nums text-amber-400/80">-PHP {formatPHP(consumableSummary.totalSpent)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-foreground">Remaining</span>
                            <span className={cn('text-xs font-bold tabular-nums', consumableSummary.remaining >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                              PHP {formatPHP(consumableSummary.remaining)}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                        Set your consumable budget in Settings
                      </div>
                    )}
                  </div>

                  {/* Borrowing Summary */}
                  {borrowingSummary && borrowingSummary.activeCount > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-foreground">Active Borrowings</h3>
                          <Badge variant="secondary" className="text-[10px]">
                            {borrowingSummary.activeCount} active
                          </Badge>
                        </div>
                        <div className="space-y-1.5">
                          {borrowingSummary.totalBorrowed > 0 && (
                            <div className="flex items-center justify-between rounded-lg bg-rose-500/5 px-2.5 py-2">
                              <span className="text-xs text-muted-foreground">I Owe Others</span>
                              <span className="text-xs font-semibold tabular-nums text-rose-500">PHP {formatPHP(borrowingSummary.totalBorrowed)}</span>
                            </div>
                          )}
                          {borrowingSummary.totalLent > 0 && (
                            <div className="flex items-center justify-between rounded-lg bg-emerald-500/5 px-2.5 py-2">
                              <span className="text-xs text-muted-foreground">Owed To Me</span>
                              <span className="text-xs font-semibold tabular-nums text-emerald-500">PHP {formatPHP(borrowingSummary.totalLent)}</span>
                            </div>
                          )}
                        </div>
                        <Link
                          href="/dashboard/borrowing"
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-border/50 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                        >
                          <HandCoins className="h-3.5 w-3.5" />
                          View All Borrowings
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Fund Tracker & Held Funds Section */}
      {userId && allocations.length > 0 && (
        <motion.div variants={staggerItem} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column: Held Funds */}
          <Card className="lg:col-span-1 border-border/40 bg-card/60 backdrop-blur-md flex flex-col">
            <CardHeader className="pb-4 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                    <Coins className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Held Funds</CardTitle>
                    <CardDescription className="text-[10px] mt-0.5">Money held for other people</CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isSavingHeldFund || returningHeldFundIds.length > 0 || deletingHeldFundIds.length > 0}
                  onClick={() => setShowAddHeldFundForm(!showAddHeldFundForm)}
                  className="h-8 text-xs text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 cursor-pointer"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add New
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 overflow-hidden flex flex-col pb-4">
              {/* Add Held Fund Form */}
              {showAddHeldFundForm && (
                <motion.form
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleAddHeldFund}
                  className="space-y-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 shrink-0"
                >
                  <h6 className="text-[11px] font-bold text-blue-400">Add Held Fund</h6>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Person Name *</label>
                    <Input
                      placeholder="e.g. Brother"
                      value={heldFundName}
                      onChange={(e) => setHeldFundName(e.target.value)}
                      className="h-8 text-xs bg-background/50"
                      required
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Amount (PHP) *</label>
                    <Input
                      type="number"
                      placeholder="e.g. 7500"
                      value={heldFundAmount}
                      onChange={(e) => setHeldFundAmount(e.target.value)}
                      className="h-8 text-xs bg-background/50"
                      required
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Description / Notes</label>
                    <Input
                      placeholder="e.g. For dental share"
                      value={heldFundDescription}
                      onChange={(e) => setHeldFundDescription(e.target.value)}
                      className="h-8 text-xs bg-background/50"
                      autoComplete="off"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isSavingHeldFund}
                      onClick={() => setShowAddHeldFundForm(false)}
                      className="h-7 text-xs cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="default"
                      size="sm"
                      disabled={isSavingHeldFund}
                      className="h-7 bg-blue-600 text-xs hover:bg-blue-500 cursor-pointer"
                    >
                      {isSavingHeldFund ? (
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Saving...
                        </span>
                      ) : (
                        "Save Fund"
                      )}
                    </Button>
                  </div>
                </motion.form>
              )}

              {/* Held Funds List */}
              <div className="space-y-3 overflow-y-auto pr-1 scrollbar-thin flex-1 min-h-[150px] max-h-[350px]">
                {heldFunds.map((fund) => {
                  const percentage = fund.original_amount > 0 ? (fund.current_amount / fund.original_amount) * 100 : 0;
                  const isReturning = returningHeldFundIds.includes(fund.id);
                  const isDeleting = deletingHeldFundIds.includes(fund.id);
                  const isConverting = convertingHeldFundIds.includes(fund.id);
                  const isProcessing = isReturning || isDeleting || isConverting;
                  const isActionDisabled = isSavingHeldFund || returningHeldFundIds.length > 0 || deletingHeldFundIds.length > 0 || convertingHeldFundIds.length > 0;
                  return (
                    <div
                      key={fund.id}
                      className={cn(
                        "group relative rounded-xl border border-border/50 p-3.5 transition-all duration-200 bg-muted/40 hover:bg-muted/60",
                        fund.is_returned && "bg-muted/10 opacity-60 border-border/20",
                        isProcessing && "opacity-50 pointer-events-none"
                      )}
                    >
                      {/* Top row: details and amount */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-bold text-foreground truncate">{fund.person_name}</p>
                            {!fund.is_returned ? (
                              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Active" />
                            ) : (
                              <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5 bg-muted text-muted-foreground leading-none">
                                Returned
                              </Badge>
                            )}
                          </div>
                          {fund.description && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{fund.description}</p>
                          )}
                          <p className="text-[9px] text-muted-foreground mt-1 uppercase font-semibold tracking-wider">
                            Original: <span className="text-foreground">PHP {formatPHP(fund.original_amount)}</span>
                          </p>
                        </div>
                        
                        {/* Right align amount and actions */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0 text-right">
                          <p className="text-xs font-extrabold tabular-nums text-blue-400">
                            PHP {formatPHP(fund.current_amount)}
                          </p>
                          
                          {/* Dedicated actions space (no absolute overlay) */}
                          <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                            {!fund.is_returned && (
                              <>
                                <ConfirmDialog
                                  trigger={
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      disabled={isActionDisabled}
                                      className="h-6 w-6 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 cursor-pointer"
                                      title="Convert to Online Debt"
                                    >
                                      {isConverting ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <ArrowRightLeft className="h-3.5 w-3.5" />
                                      )}
                                    </Button>
                                  }
                                  title="Convert to Online Debt"
                                  description={`Are you sure you want to convert this held fund of PHP ${formatPHP(fund.current_amount)} to online debt? The physical cash on hand will become yours (added to your Available Spare), and an unpaid borrowing debt of PHP ${formatPHP(fund.current_amount)} will be created under ${fund.person_name}.`}
                                  confirmLabel="Convert to Debt"
                                  variant="info"
                                  onConfirm={() => handleConvertToOnlineDebt(fund)}
                                />
                                <ConfirmDialog
                                  trigger={
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      disabled={isActionDisabled}
                                      className="h-6 w-6 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 cursor-pointer"
                                      title="Mark Returned"
                                    >
                                      {isReturning ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                      )}
                                    </Button>
                                  }
                                  title="Mark as Returned"
                                  description={`Are you sure you want to mark this fund as returned? The remaining balance of PHP ${formatPHP(fund.current_amount)} will be set to 0.`}
                                  confirmLabel="Return Fund"
                                  variant="warning"
                                  onConfirm={() => handleReturnHeldFund(fund.id)}
                                />
                              </>
                            )}
                            <ConfirmDialog
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={isActionDisabled}
                                  className="h-6 w-6 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer"
                                  title="Delete"
                                >
                                  {isDeleting ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              }
                              title="Delete Held Fund"
                              description="Are you sure you want to delete this held fund? This action cannot be undone."
                              confirmLabel="Delete"
                              destructive
                              onConfirm={() => handleDeleteHeldFund(fund.id)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {!fund.is_returned && (
                        <div className="mt-3 space-y-1">
                          <div className="flex justify-between text-[9px] text-muted-foreground font-medium">
                            <span>{Math.round(percentage)}% remaining</span>
                          </div>
                          <div className="h-1 w-full overflow-hidden rounded-full bg-muted/60">
                            <div
                              className="h-full rounded-full bg-blue-500 transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {heldFunds.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-xl">
                    <PiggyBank className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <span>No held funds recorded yet</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right Column: Allocation Funds */}
          <Card className="lg:col-span-2 border-border/40 bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <PiggyBank className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Allocation Funds Tracker</CardTitle>
                  <CardDescription className="text-[10px] mt-0.5">Track expenses and shared costs against allocations</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allocationFundSummaries
                  .filter((summary) => {
                    const alloc = allocationMap.get(summary.allocation_id);
                    return alloc && getClassification(alloc) === 'asset';
                  })
                  .map((summary) => {
                    const isExpanded = expandedAllocationId === summary.allocation_id;
                    const isAddingExpense = addingExpenseForAllocId === summary.allocation_id;
                    const spentPct = summary.budgeted > 0 ? (summary.totalSpent / summary.budgeted) * 100 : 0;
                    const isOver = summary.remaining < 0;

                    return (
                      <div
                        key={summary.allocation_id}
                        className={cn(
                          "rounded-xl border border-border/50 p-4 transition-all duration-200 flex flex-col gap-3",
                          isExpanded ? "md:col-span-2 bg-muted/20 border-border" : "bg-muted/40 hover:bg-muted/60"
                        )}
                      >
                        {/* Fund Card Header */}
                        <div 
                          className="flex flex-col gap-2.5 cursor-pointer" 
                          onClick={() => setExpandedAllocationId(isExpanded ? null : summary.allocation_id)}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                                {(() => {
                                  const CategoryIcon = getCategoryIcon(summary.category);
                                  return <CategoryIcon className="h-4.5 w-4.5" />;
                                })()}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-foreground truncate">{summary.category}</h4>
                                <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">Allocation</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={cn(
                                "text-xs font-extrabold tabular-nums",
                                isOver ? "text-rose-400" : "text-emerald-400"
                              )}>
                                PHP {formatPHP(summary.remaining)} {isOver ? "over" : "left"}
                              </span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                spentPct >= 90 ? "bg-rose-500" : spentPct >= 70 ? "bg-amber-500" : "bg-emerald-500"
                              )}
                              style={{ width: `${Math.min(spentPct, 100)}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium px-0.5">
                            <span>Budgeted: <span className="text-foreground font-semibold">PHP {formatPHP(summary.budgeted)}</span></span>
                            <span>Spent: <span className="text-foreground font-semibold">PHP {formatPHP(summary.totalSpent)}</span></span>
                          </div>
                        </div>

                        {/* Expanded Section */}
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-2 pt-4 border-t border-border/20 space-y-3.5 bg-black/15 -mx-4 -mb-4 p-4 rounded-b-xl"
                          >
                            <div className="flex items-center justify-between">
                              <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Expense Log ({summary.expenses.length})</h5>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={isSavingExpense || processingExpenseIds.length > 0}
                                onClick={() => {
                                  if (isAddingExpense) {
                                    setAddingExpenseForAllocId(null);
                                  } else {
                                    setAddingExpenseForAllocId(summary.allocation_id);
                                  }
                                }}
                                className="h-6 text-[10px] text-blue-500 cursor-pointer"
                              >
                                {isAddingExpense ? "Cancel" : "Add Expense"}
                              </Button>
                            </div>

                            {/* Expense Form */}
                            {isAddingExpense && (
                              <div className="rounded-lg border border-border/40 bg-background/40 backdrop-blur-sm p-3.5 space-y-3" onClick={(e) => e.stopPropagation()}>
                                <h6 className="text-[11px] font-bold text-foreground">Record Expense</h6>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Description *</label>
                                    <Input
                                      placeholder="e.g. Cleaning and X-ray"
                                      value={expenseDesc}
                                      onChange={(e) => setExpenseDesc(e.target.value)}
                                      className="h-8 text-xs bg-background/40"
                                      autoComplete="off"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Amount (PHP) *</label>
                                    <Input
                                      type="number"
                                      placeholder="e.g. 5300"
                                      value={expenseAmount}
                                      onChange={(e) => {
                                        setExpenseAmount(e.target.value);
                                        if (deductFromHeldFundId) {
                                          setDeductAmount(e.target.value);
                                        }
                                      }}
                                      className="h-8 text-xs bg-background/40"
                                      autoComplete="off"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Date</label>
                                    <Input
                                      type="date"
                                      value={expenseDate}
                                      onChange={(e) => setExpenseDate(e.target.value)}
                                      className="h-8 text-xs bg-background/40"
                                      autoComplete="off"
                                    />
                                  </div>

                                  {/* Held Fund Dropdown */}
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Deduct from Held Money? (Optional)</label>
                                    <Select
                                      value={deductFromHeldFundId || "none"}
                                      onValueChange={(val) => {
                                        const actualVal = (val === "none" || !val) ? "" : val;
                                        setDeductFromHeldFundId(actualVal);
                                        const found = heldFunds.find(f => f.id === actualVal);
                                        if (found) {
                                          setDeductAmount(expenseAmount || '');
                                        } else {
                                          setDeductAmount('');
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="w-full h-8 text-xs bg-background/40 font-medium">
                                        <SelectValue placeholder="No, use my own cash/bank">
                                          {(val) => {
                                            if (!val || val === "none") return "No, use my own cash/bank";
                                            const fund = heldFunds.find(f => f.id === val);
                                            return fund ? `${fund.person_name} (PHP ${formatPHP(fund.current_amount)} left)` : "No, use my own cash/bank";
                                          }}
                                        </SelectValue>
                                      </SelectTrigger>
                                      <SelectContent alignItemWithTrigger={false} sideOffset={4} align="start" className="bg-popover text-popover-foreground">
                                        <SelectItem value="none" className="text-xs">No, use my own cash/bank</SelectItem>
                                        {heldFunds.filter(f => !f.is_returned).map(f => (
                                          <SelectItem key={f.id} value={f.id} className="text-xs">
                                            {f.person_name} (PHP {formatPHP(f.current_amount)} left)
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                {/* Shared Expense Toggle and Form */}
                                <div className="space-y-3 pt-2 border-t border-border/20">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id={`is-shared-${summary.allocation_id}`}
                                      checked={isShared}
                                      onChange={(e) => {
                                        setIsShared(e.target.checked);
                                      }}
                                      className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor={`is-shared-${summary.allocation_id}`} className="text-xs font-semibold text-foreground cursor-pointer select-none">
                                      This was a shared expense / someone else paid
                                    </label>
                                  </div>

                                  {isShared && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-muted/40 p-3 rounded-lg border border-border/40">
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Who paid? (e.g. Brother) *</label>
                                        <Input
                                          placeholder="e.g. Brother"
                                          value={paidBy}
                                          onChange={(e) => setPaidBy(e.target.value)}
                                          className="h-8 text-xs bg-background/40"
                                          autoComplete="off"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">No. of splits</label>
                                        <Input
                                          type="number"
                                          value={sharedParties}
                                          onChange={(e) => {
                                            const prt = parseInt(e.target.value) || 1;
                                            setSharedParties(prt);
                                          }}
                                          className="h-8 text-xs bg-background/40"
                                          min="1"
                                          autoComplete="off"
                                        />
                                      </div>
                                      <div className="col-span-full text-[10px] text-blue-400 font-medium">
                                        {paidBy && paidBy.trim() ? (
                                          sharedParties === 1 ? (
                                            `You are borrowing the full PHP ${formatPHP(parseFloat(expenseAmount) || 0)} from ${paidBy.trim()}. (This amount will be recorded as a debt and deducted from your allocation once settled)`
                                          ) : (
                                            `Your share: PHP ${formatPHP((parseFloat(expenseAmount) || 0) / sharedParties)} (You borrow this amount from ${paidBy.trim()}, and it gets deducted from your allocation once settled)`
                                          )
                                        ) : (
                                          sharedParties === 1 ? (
                                            `Since you paid, the full PHP ${formatPHP(parseFloat(expenseAmount) || 0)} is deducted from your allocation immediately.`
                                          ) : (
                                            `Your share: PHP ${formatPHP((parseFloat(expenseAmount) || 0) / sharedParties)} (Since you paid, this amount is deducted from your allocation immediately. The remaining PHP ${formatPHP((parseFloat(expenseAmount) || 0) * (sharedParties - 1) / sharedParties)} is paid/lent for others.)`
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Deduction details */}
                                {deductFromHeldFundId && (
                                  <div className="space-y-1 bg-blue-500/5 p-3 rounded-lg border border-blue-500/20">
                                    <label className="text-[9px] font-semibold text-blue-400 block uppercase tracking-wider">Amount to deduct from held money (PHP)</label>
                                    <Input
                                      type="number"
                                      placeholder="Deduction amount"
                                      value={deductAmount}
                                      onChange={(e) => setDeductAmount(e.target.value)}
                                      className="h-8 text-xs border-blue-500/30 bg-background/40"
                                      autoComplete="off"
                                    />
                                    <p className="text-[9px] text-blue-400 mt-1">
                                      This will reduce the active held fund by this amount.
                                    </p>
                                  </div>
                                )}

                                <div className="flex justify-end gap-2 pt-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={isSavingExpense}
                                    onClick={() => setAddingExpenseForAllocId(null)}
                                    className="h-8 text-xs cursor-pointer"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="default"
                                    size="sm"
                                    disabled={isSavingExpense}
                                    onClick={() => handleCreateExpense(summary.allocation_id)}
                                    className="h-8 bg-blue-600 hover:bg-blue-500 text-xs cursor-pointer"
                                  >
                                    {isSavingExpense ? (
                                      <span className="flex items-center gap-1.5">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Recording...
                                      </span>
                                    ) : (
                                      "Record Expense"
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Expense List */}
                            <div className="space-y-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                              {summary.expenses.map((expense) => {
                                const matchingFund = heldFunds.find(f => f.id === expense.held_fund_id);
                                const isExpenseDeleting = processingExpenseIds.includes(expense.id);
                                return (
                                  <div
                                    key={expense.id}
                                    className={cn(
                                      "group flex items-center justify-between border-b border-border/10 py-2.5 last:border-b-0 transition-colors duration-150",
                                      isExpenseDeleting && "opacity-50 pointer-events-none"
                                    )}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="min-w-0 pr-4">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[9px] text-muted-foreground font-medium tabular-nums shrink-0">
                                          {new Date(expense.expense_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                                        </span>
                                        <span className="text-xs font-semibold text-foreground truncate">{expense.description}</span>
                                      </div>
                                      
                                      <div className="flex flex-wrap gap-1.5 mt-1">
                                        {expense.is_shared && (
                                          <Badge variant="secondary" className="text-[8px] h-3.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1 py-0 leading-none">
                                            Shared {expense.shared_parties}x (Total: PHP {formatPHP(expense.shared_total ?? 0)})
                                          </Badge>
                                        )}
                                        {expense.paid_by && (
                                          <Badge variant="secondary" className={cn(
                                            "text-[8px] h-3.5 border px-1 py-0 leading-none",
                                            expense.is_borrowing_settled
                                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                          )}>
                                            {expense.is_borrowing_settled
                                              ? `Paid by ${expense.paid_by}`
                                              : `Owe ${expense.paid_by}`}
                                          </Badge>
                                        )}
                                        {expense.held_fund_id && (
                                          <Badge variant="secondary" className="text-[8px] h-3.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1 py-0 leading-none">
                                            Deducted: {matchingFund?.person_name || "Held Fund"}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className={cn(
                                        "text-xs font-bold tabular-nums text-right",
                                        expense.amount < 0
                                          ? "text-emerald-400 dark:text-emerald-500"
                                          : (expense.borrowing_id && !expense.is_borrowing_settled)
                                            ? "text-amber-500"
                                            : (expense.held_fund_id && !expense.borrowing_id)
                                              ? "text-blue-400"
                                              : "text-rose-400"
                                      )}>
                                        {expense.amount < 0
                                          ? `+PHP ${formatPHP(Math.abs(expense.amount))}`
                                          : (expense.borrowing_id && !expense.is_borrowing_settled)
                                            ? `Owed PHP ${formatPHP(expense.amount)}`
                                            : (expense.held_fund_id && !expense.borrowing_id)
                                              ? `PHP 0.00 (PHP ${formatPHP(expense.amount)} held)`
                                              : `-PHP ${formatPHP(expense.amount)}`}
                                      </span>
                                      <ConfirmDialog
                                        trigger={
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            disabled={isSavingExpense || processingExpenseIds.length > 0}
                                            className={cn(
                                              "h-6 w-6 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer transition-opacity duration-150",
                                              isExpenseDeleting ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                            )}
                                            title="Delete Expense"
                                          >
                                            {isExpenseDeleting ? (
                                              <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                              <Trash2 className="h-3.5 w-3.5" />
                                            )}
                                          </Button>
                                        }
                                        title="Delete Expense"
                                        description="Are you sure you want to delete this expense? This will restore any deducted funds and delete any linked borrowing debt."
                                        confirmLabel="Delete"
                                        destructive
                                        onConfirm={() => handleDeleteExpense(expense.id)}
                                      />
                                    </div>
                                  </div>
                                );
                              })}

                              {summary.expenses.length === 0 && (
                                <div className="flex items-center justify-center py-6 text-[10px] text-muted-foreground border border-dashed border-border/30 rounded-lg">
                                  No expenses logged against this fund
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Monthly Financial Breakdown */}
      <div
        className={cn(
          'grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4',
          hasPartTime ? 'lg:grid-cols-6' : 'lg:grid-cols-4'
        )}
      >
        <StatCard
          label="Gross Income"
          value={financialSummary?.grossIncome ?? 0}
          icon={TrendingUp}
          colorTheme="teal"
          index={0}
          tooltip="Total income before any deductions"
        />
        <StatCard
          label="Tax Amount"
          value={taxAmount}
          icon={Receipt}
          colorTheme="rose"
          index={1}
          tooltip="Total Taxes Deducted (Wage Tax + PT Tax)"
        />
        <StatCard
          label="Total Assets"
          value={financialSummary?.totalAssets ?? 0}
          icon={Landmark}
          colorTheme="violet"
          index={2}
          tooltip="Sum of all asset-type allocations"
        />
        <StatCard
          label="Full-time Salary"
          value={fullTimeSalary}
          icon={Briefcase}
          colorTheme="indigo"
          index={3}
          subtitle={hasPartTime ? undefined : 'Primary income'}
          tooltip="Sum of first and second wage"
        />
        {hasPartTime && (
          <StatCard
            label="Part-time Salary"
            value={partTimeSalary}
            icon={Briefcase}
            colorTheme="sky"
            index={4}
            tooltip="Income from secondary source"
          />
        )}
        {hasPartTime && (
          <StatCard
            label="Total Salary"
            value={totalSalary}
            icon={Wallet}
            colorTheme="teal"
            index={5}
            tooltip="Full-time + Part-time"
          />
        )}
      </div>



      {/* Active Borrowing Impact on Spare */}
      {borrowingSummary && borrowingSummary.activeCount > 0 && (
        <motion.div variants={staggerItem}>
          <Card className="border-rose-500/20 bg-gradient-to-r from-rose-500/5 to-amber-500/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-500/10">
                  <HandCoins className="h-4.5 w-4.5 text-rose-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Active Borrowings</p>
                  <p className="text-xs text-muted-foreground">
                    You owe <span className="text-rose-500 font-medium">PHP {formatPHP(borrowingSummary.totalBorrowed)}</span>
                    {borrowingSummary.totalLent > 0 && (
                      <> and are owed <span className="text-emerald-500 font-medium">PHP {formatPHP(borrowingSummary.totalLent)}</span></>
                    )}
                  </p>
                </div>
                <Link
                  href="/dashboard/borrowing"
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8 text-xs')}
                >
                  View
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Income vs Expenses Trend Chart */}
      <motion.div variants={staggerItem}>
        <Card className="overflow-visible">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <CardTitle>Financial Trend</CardTitle>
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
                      'h-7 px-2.5 text-xs font-medium',
                      trendLimit === filter.value && 'bg-primary/10 text-primary'
                    )}
                    onClick={() => handleTrendFilter(filter.value)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>
            <CardDescription>
              {trendLimit >= 100
                ? `All ${trendData.length} pay periods`
                : `Last ${trendData.length} pay period${trendData.length !== 1 ? 's' : ''}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <div className="h-80 min-w-0">
                <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 100, height: 320 }}>
                  <AreaChart data={trendData} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
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
                      stroke="hsl(220, 13%, 20%)"
                      strokeOpacity={0.5}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                      dy={8}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
                      width={45}
                    />
                    <Tooltip
                      content={<TrendChartTooltip />}
                      allowEscapeViewBox={{ x: true, y: true }}
                      offset={15}
                      isAnimationActive={false}
                      cursor={isMobile ? false : { stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                      wrapperStyle={{ outline: 'none', zIndex: 50 }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      onClick={handleLegendClick}
                      wrapperStyle={{ fontSize: 12, paddingTop: 16, cursor: 'pointer' }}
                      formatter={(value: string, entry: any) => {
                        const dataKey = entry.dataKey;
                        const isVisible = visibleSeries[dataKey];
                        return (
                          <span style={{ 
                            color: isVisible ? '#94a3b8' : '#475569', 
                            fontSize: 12, 
                            textDecoration: isVisible ? 'none' : 'line-through' 
                          }}>
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
                      dot={{ r: 4, fill: '#34d399', stroke: '#1e293b', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#34d399', stroke: '#fff', strokeWidth: 2 }}
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
                      dot={{ r: 4, fill: '#38bdf8', stroke: '#1e293b', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#38bdf8', stroke: '#fff', strokeWidth: 2 }}
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
                      dot={{ r: 4, fill: '#f472b6', stroke: '#1e293b', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#f472b6', stroke: '#fff', strokeWidth: 2 }}
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
                      dot={{ r: 4, fill: '#a78bfa', stroke: '#1e293b', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#a78bfa', stroke: '#fff', strokeWidth: 2 }}
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
                      dot={{ r: 4, fill: '#fbbf24', stroke: '#1e293b', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#fbbf24', stroke: '#fff', strokeWidth: 2 }}
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
                      dot={{ r: 4, fill: '#2dd4bf', stroke: '#1e293b', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#2dd4bf', stroke: '#fff', strokeWidth: 2 }}
                      animationDuration={800}
                    />
                  </AreaChart>
                </ResponsiveContainer>
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
      </motion.div>

      {/* Two Column Layout - only show when there's data for the selected period */}
      {latestPeriod ? (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Budget Donut Chart */}
        <motion.div variants={staggerItem} data-onboarding="budget-chart">
          <Card className="h-full overflow-visible">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Budget Allocation
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger className="flex">
                    <Info className="h-3 w-3 text-muted-foreground/50 cursor-help shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Detailed breakdown of expense allocations
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </CardTitle>
              <CardDescription>
                Percentage breakdown of your {hasPartTime ? 'combined ' : ''}salary
              </CardDescription>
            </CardHeader>

            <CardContent>
              {chartData.length > 0 ? (
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
                        dataKey="value"
                        strokeWidth={0}
                        animationBegin={200}
                        animationDuration={800}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={<CustomTooltip />}
                        allowEscapeViewBox={{ x: true, y: true }}
                        offset={15}
                        isAnimationActive={false}
                        wrapperStyle={{ outline: 'none', zIndex: 50 }}
                      />
                      <CenterLabel salary={totalSalary} />
                    </PieChart>
                  </ResponsiveContainer>
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
        </motion.div>

        {/* Allocation Categories */}
        <motion.div variants={staggerItem}>
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Categories</CardTitle>
                  <CardDescription>
                    Budget allocation breakdown
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  {(['all', 'expense', 'asset'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setCategoryFilter(filter)}
                      className={cn(
                        'whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200 cursor-pointer capitalize',
                        categoryFilter === filter
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {filter === 'all' ? 'All' : filter === 'expense' ? 'Expenses' : 'Assets'}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {filteredAllocations.length > 0 ? (
                <div className="flex flex-col gap-1 max-h-96 overflow-y-auto pr-1 scrollbar-thin">
                  {filteredAllocations.map((allocation, index) => (
                    <motion.div
                      key={allocation.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.3 + index * 0.06,
                        duration: 0.3,
                        ease: 'easeOut',
                      }}
                      className="flex items-center justify-between rounded-lg p-3 transition-colors duration-150 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/65"
                          style={{ color: allocation.color || 'hsl(220, 15%, 50%)' }}
                        >
                          <CategoryIcon name={allocation.icon_name} className="h-4 w-4" />
                        </div>
                        <div className="flex min-w-0 flex-col">
                          <span className="flex items-center gap-1.5 text-sm font-medium capitalize text-foreground">
                            {allocation.category}
                            {allocation.is_fixed && (
                              <Lock className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                            )}
                          </span>
                          {allocation.description && (
                            <span className="truncate text-xs text-muted-foreground">
                              {allocation.description}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <Badge variant="secondary">
                          {formatPercentage(allocation.percentage)}
                        </Badge>
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          PHP {formatPHP(allocation.amount)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    No categories configured
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      ) : (
        <motion.div variants={staggerItem}>
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center text-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">No payroll data for this period</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Budget allocation and categories will appear once you save a pay period in this date range.
                  </p>
                </div>
                <Link href="/dashboard/calculator">
                  <Button variant="outline" size="sm" className="mt-2">
                    <Briefcase className="h-3.5 w-3.5 mr-1.5" />
                    Go to Calculator
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}



      {/* Confirmation Dialog for bill toggle/mark paid */}
      <AlertDialog
        open={!!pendingToggleBill}
        onOpenChange={(open) => { if (!open) setPendingToggleBill(null); }}
      >
        <AlertDialogContent size="sm">
          <div className="flex flex-col items-center text-center pt-2">
            {/* Animated Lottie icon */}
            <div className="h-16 w-16">
              {pendingToggleBill && (
                <Lottie
                  animationData={pendingToggleBill.is_paid ? warningAnimation : successAnimation}
                  loop={false}
                  autoplay
                  className="h-16 w-16"
                />
              )}
            </div>
            <h2 className="mt-3 text-base font-semibold text-foreground">
              {pendingToggleBill?.is_paid ? 'Mark as Unpaid?' : 'Mark as Paid?'}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed max-w-[260px]">
              {(() => {
                if (!pendingToggleBill) return '';
                const alloc = allocationMap.get(pendingToggleBill.allocation_id);
                const name = alloc?.category ?? 'This bill';
                if (pendingToggleBill.is_paid) {
                  return `This will mark "${name}" as unpaid and reset the payment record.`;
                }
                return `This will mark "${name}" as fully paid for this month.`;
              })()}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!pendingToggleBill) return;
                if (pendingToggleBill.is_paid) {
                  await handleToggleBill(pendingToggleBill);
                } else {
                  await handleMarkBillPaid(pendingToggleBill);
                }
                setPendingToggleBill(null);
              }}
              className={cn(
                pendingToggleBill?.is_paid
                  ? 'bg-amber-600 text-white shadow-sm hover:bg-amber-500'
                  : 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-500'
              )}
            >
              {pendingToggleBill?.is_paid ? 'Mark Unpaid' : 'Mark Paid'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer Funds Modal */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent className="sm:max-w-md bg-popover text-popover-foreground rounded-2xl border border-border/40 p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
              Transfer Funds
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Move money dynamically between your Spare Cash and Budget Allocations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="grid grid-cols-2 gap-4">
              {/* Source Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">From (Source)</label>
                <select
                  value={transferSource}
                  onChange={(e) => setTransferSource(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-9 font-medium"
                >
                  <option value="spare">Spare Cash</option>
                  {allocations.map((alloc) => (
                    <option key={alloc.id} value={alloc.id}>
                      {alloc.category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">To (Destination)</label>
                <select
                  value={transferDest}
                  onChange={(e) => setTransferDest(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-9 font-medium"
                >
                  <option value="spare">Spare Cash</option>
                  {allocations.map((alloc) => (
                    <option key={alloc.id} value={alloc.id}>
                      {alloc.category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Amount (PHP)</label>
              <Input
                type="number"
                placeholder="e.g. 2000"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="h-9 text-xs bg-background/50 font-medium"
              />
            </div>

            {/* Description Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description / Note</label>
              <Input
                placeholder="e.g. Brother returned braces money"
                value={transferDesc}
                onChange={(e) => setTransferDesc(e.target.value)}
                className="h-9 text-xs bg-background/50 font-medium"
              />
            </div>

            {/* Date Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Transfer Date</label>
              <Input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className="h-9 text-xs bg-background/50 font-medium"
              />
            </div>
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSavingTransfer}
              onClick={() => setShowTransferModal(false)}
              className="h-9 text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isSavingTransfer}
              onClick={handleTransfer}
              className="h-9 text-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
            >
              {isSavingTransfer ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Transferring...
                </span>
              ) : (
                "Confirm Transfer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </motion.div>
  );
}
