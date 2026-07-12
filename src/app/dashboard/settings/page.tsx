'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Settings,
  Wallet,
  PieChart,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Mail,
  Loader2,
  Save,
  AlertTriangle,
  Check,
  Trash2,
  Plus,
  Tag,
  ChevronDown,
  Info,
  Download,
  Upload,
  Database,
  FileSpreadsheet,
  FileJson,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type {
  SalaryConfig,
  BudgetAllocation,
  AllocationType,
  AllocationClassification,
  PayFrequency,
  PayPeriod,
  SpareTransaction,
  ConsumableExpense,
} from '@/features/salary/types/salary.types';
import {
  getSalaryConfig,
  updateSalaryConfig,
  getBudgetAllocations,
  updateMultipleAllocations,
  createBudgetAllocation,
  deleteBudgetAllocation,
  getCurrentUser,
  signOut,
  getAllocationTypes,
  createAllocationType,
  updateAllocationType,
  deleteAllocationType,
  seedDefaultAllocationTypes,
  exportAllDataAsJson,
  restoreAllDataFromJson,
  importSpareTransactions,
  importConsumableExpenses,
  getAllPayPeriods,
  getAllSpareTransactions,
  getAllConsumableExpenses,
} from '@/features/salary/services/salary.service';
import {
  formatPHP,
} from '@/features/salary/utils/calculations';
import { CATEGORY_ICONS, CategoryIcon } from '@/components/ui/category-icon';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Tooltip as UITooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

// Modern Premium Color Palette for Categories
const PALETTE_COLORS = [
  { name: 'Emerald', value: 'hsl(160, 84%, 39%)' },
  { name: 'Blue', value: 'hsl(217, 91%, 60%)' },
  { name: 'Amber', value: 'hsl(38, 92%, 50%)' },
  { name: 'Rose', value: 'hsl(346, 77%, 50%)' },
  { name: 'Purple', value: 'hsl(270, 76%, 55%)' },
  { name: 'Teal', value: 'hsl(180, 80%, 35%)' },
  { name: 'Indigo', value: 'hsl(240, 80%, 60%)' },
  { name: 'Orange', value: 'hsl(20, 90%, 55%)' },
  { name: 'Gray', value: 'hsl(220, 15%, 50%)' },
];

const PAY_FREQUENCY_OPTIONS: { value: PayFrequency; label: string; description: string }[] = [
  { value: 'semi-monthly', label: 'Semi-Monthly', description: 'Paid twice per month (1st & 2nd wage)' },
  { value: 'monthly', label: 'Monthly', description: 'Paid once per month' },
  { value: 'bi-weekly', label: 'Bi-Weekly', description: 'Paid every two weeks' },
  { value: 'weekly', label: 'Weekly', description: 'Paid every week' },
];

// Helper to assign a sequential color when adding a new category
function getNextColor(existingColorsCount: number): string {
  return PALETTE_COLORS[existingColorsCount % PALETTE_COLORS.length].value;
}

// Helper to assign a random icon when adding a new category
const DEFAULT_ICONS = ['Home', 'Flame', 'Car', 'Heart', 'Shield', 'ShoppingBag', 'PiggyBank', 'Sparkles', 'Coffee', 'Wifi'];
function getRandomIcon(): string {
  return DEFAULT_ICONS[Math.floor(Math.random() * DEFAULT_ICONS.length)];
}

// ---------------------------------------------------------------------------
// Main Settings Page
// ---------------------------------------------------------------------------
export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  // State
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [config, setConfig] = useState<SalaryConfig | null>(null);
  const [allocations, setAllocations] = useState<BudgetAllocation[]>([]);

  // Form fields - salary config
  const [name, setName] = useState('');
  const [salary, setSalary] = useState(0);
  const [partTimeSalary, setPartTimeSalary] = useState(0);
  const [payFrequency, setPayFrequency] = useState<PayFrequency>('semi-monthly');
  const [consumableAllowance, setConsumableAllowance] = useState(4500);

  // Form fields - allocations (amounts, category names, descriptions, colors, icons)
  const [allocationAmounts, setAllocationAmounts] = useState<
    Record<string, number>
  >({});
  const [allocationNames, setAllocationNames] = useState<
    Record<string, string>
  >({});
  const [allocationDescriptions, setAllocationDescriptions] = useState<
    Record<string, string>
  >({});
  const [allocationColors, setAllocationColors] = useState<
    Record<string, string>
  >({});
  const [allocationIcons, setAllocationIcons] = useState<
    Record<string, string>
  >({});
  const [allocationFixedStates, setAllocationFixedStates] = useState<
    Record<string, boolean>
  >({});

  // Active pickers states
  const [activeColorPickerId, setActiveColorPickerId] = useState<string | null>(null);
  const [activeIconPickerId, setActiveIconPickerId] = useState<string | null>(null);

  // Allocation Types state
  const [allocationTypes, setAllocationTypes] = useState<AllocationType[]>([]);
  const [allocationTypeIds, setAllocationTypeIds] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeClassification, setNewTypeClassification] = useState<AllocationClassification>('expense');
  const [isSavingType, setIsSavingType] = useState(false);
  const [deletingTypeIds, setDeletingTypeIds] = useState<Set<string>>(new Set());

  // Loading states
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isSavingAllocations, setIsSavingAllocations] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Data Management states
  const [isExporting, setIsExporting] = useState<Record<string, boolean>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [importType, setImportType] = useState<'spare' | 'consumable'>('spare');
  const importFileRef = useRef<HTMLInputElement>(null);
  const restoreFileRef = useRef<HTMLInputElement>(null);

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPayPeriods = async () => {
    if (!userId) return;
    setIsExporting(prev => ({ ...prev, payPeriods: true }));
    try {
      const periods = await getAllPayPeriods(userId);

      const headers = ['Period Label', 'Gross Income', 'Total Tax', 'Total Deductions', 'Net Income', 'Total Expenses', 'Total Savings', 'Spare Amount', 'Date Created'];
      const csvRows = [headers.join(',')];

      for (const p of periods) {
        const income = Number(p.total_income ?? 0);
        const tax = Number(p.total_tax ?? 0);
        const deductions = Number(p.total_deductions ?? 0);
        const net = income - tax - deductions;
        const row = [
          `"${(p.period_label || '').replace(/"/g, '""')}"`,
          income,
          tax,
          deductions,
          net,
          Number(p.total_expenses ?? 0),
          Number(p.total_savings ?? 0),
          Number(p.spare_amount ?? 0),
          p.created_at ? p.created_at.split('T')[0] : '',
        ];
        csvRows.push(row.join(','));
      }

      downloadFile(csvRows.join('\n'), 'pay_periods.csv', 'text/csv');
      toast.success('Pay periods exported successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to export pay periods');
    } finally {
      setIsExporting(prev => ({ ...prev, payPeriods: false }));
    }
  };

  const handleExportSpareTransactions = async () => {
    if (!userId) return;
    setIsExporting(prev => ({ ...prev, spareTxns: true }));
    try {
      const txns = await getAllSpareTransactions(userId);

      const headers = ['Date', 'Description', 'Amount (PHP)'];
      const csvRows = [headers.join(',')];

      for (const t of txns) {
        const row = [
          t.transaction_date,
          `"${(t.description || '').replace(/"/g, '""')}"`,
          Number(t.amount ?? 0),
        ];
        csvRows.push(row.join(','));
      }

      downloadFile(csvRows.join('\n'), 'spare_transactions.csv', 'text/csv');
      toast.success('Spare transactions exported successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to export spare transactions');
    } finally {
      setIsExporting(prev => ({ ...prev, spareTxns: false }));
    }
  };

  const handleExportConsumableExpenses = async () => {
    if (!userId) return;
    setIsExporting(prev => ({ ...prev, consumableExpenses: true }));
    try {
      const txns = await getAllConsumableExpenses(userId);

      const headers = ['Date', 'Description', 'Amount (PHP)', 'Month'];
      const csvRows = [headers.join(',')];

      for (const t of txns) {
        const row = [
          t.expense_date,
          `"${(t.description || '').replace(/"/g, '""')}"`,
          Number(t.amount ?? 0),
          t.month,
        ];
        csvRows.push(row.join(','));
      }

      downloadFile(csvRows.join('\n'), 'consumable_expenses.csv', 'text/csv');
      toast.success('Consumable expenses exported successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to export consumable expenses');
    } finally {
      setIsExporting(prev => ({ ...prev, consumableExpenses: false }));
    }
  };

  const handleExportBackup = async () => {
    if (!userId) return;
    setIsExporting(prev => ({ ...prev, backup: true }));
    try {
      const backup = await exportAllDataAsJson(userId);
      downloadFile(JSON.stringify(backup, null, 2), `salary_dashboard_backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
      toast.success('Database backup downloaded successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate backup');
    } finally {
      setIsExporting(prev => ({ ...prev, backup: false }));
    }
  };

  const parseCSV = (text: string) => {
    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentVal = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentVal += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentVal.trim());
        currentVal = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(currentVal.trim());
        if (row.length > 0 && row.some(cell => cell !== '')) {
          lines.push(row);
        }
        row = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    if (currentVal || row.length > 0) {
      row.push(currentVal.trim());
      if (row.some(cell => cell !== '')) {
        lines.push(row);
      }
    }
    return lines;
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = parseCSV(text);

        if (rows.length < 2) {
          throw new Error('CSV file is empty or missing headers');
        }

        const headers = rows[0].map(h => h.toLowerCase());
        const dateIdx = headers.findIndex(h => h.includes('date'));
        const descIdx = headers.findIndex(h => h.includes('desc'));
        const amountIdx = headers.findIndex(h => h.includes('amount') || h.includes('val'));

        if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) {
          throw new Error('CSV must contain Date, Description, and Amount columns');
        }

        const parsedRecords = rows.slice(1).map((row, lineNum) => {
          const dateStr = row[dateIdx];
          const description = row[descIdx];
          const amountStr = row[amountIdx]?.replace(/[^\d.-]/g, '');

          if (!dateStr || !description || isNaN(Number(amountStr))) {
            throw new Error(`Invalid data on row ${lineNum + 2}`);
          }

          const parsedDate = new Date(dateStr);
          if (isNaN(parsedDate.getTime())) {
            throw new Error(`Invalid date format "${dateStr}" on row ${lineNum + 2}`);
          }

          return {
            date: dateStr,
            description,
            amount: Number(amountStr),
          };
        });

        if (importType === 'spare') {
          const spareData = parsedRecords.map(r => ({
            transaction_date: r.date,
            description: r.description,
            amount: r.amount,
          }));
          await importSpareTransactions(userId, spareData);
          toast.success(`Successfully imported ${spareData.length} spare transactions`);
        } else {
          const consumableData = parsedRecords.map(r => ({
            expense_date: r.date,
            description: r.description,
            amount: r.amount,
          }));
          await importConsumableExpenses(userId, consumableData);
          toast.success(`Successfully imported ${consumableData.length} consumable expenses`);
        }

        if (importFileRef.current) importFileRef.current.value = '';
      } catch (err: any) {
        toast.error(err.message || 'Failed to parse CSV file');
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setIsRestoring(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const backup = JSON.parse(text);

        if (!backup || !backup.data || typeof backup.data !== 'object') {
          throw new Error('Invalid JSON backup structure');
        }

        await restoreAllDataFromJson(userId, backup);
        toast.success('Database backup restored successfully!');
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (err: any) {
        toast.error(err.message || 'Failed to restore backup');
      } finally {
        setIsRestoring(false);
        if (restoreFileRef.current) restoreFileRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Computed: total salary
  const totalSalary = salary + partTimeSalary;

  // ---------------------------------------------------------------------------
  // Fetch data on mount
  // ---------------------------------------------------------------------------
  const fetchData = useCallback(async () => {
    try {
      const [user, salaryConfig] = await Promise.all([
        getCurrentUser().catch(() => null),
        getSalaryConfig().catch(() => null),
      ]);

      if (user?.email) setUserEmail(user.email);
      if (user?.id) setUserId(user.id);

      if (salaryConfig) {
        setConfig(salaryConfig);
        setName(salaryConfig.name);
        setSalary(salaryConfig.full_time_salary);
        setPartTimeSalary(salaryConfig.part_time_salary ?? 0);
        setPayFrequency(salaryConfig.pay_frequency ?? 'semi-monthly');
        setConsumableAllowance(salaryConfig.consumable_allowance ?? 4500);
      }

      // Stage 2: Fetch budget allocations and seed allocation types in parallel
      const [allocs, types] = await Promise.all([
        salaryConfig ? getBudgetAllocations(salaryConfig.id).catch(() => []) : Promise.resolve([]),
        user?.id ? seedDefaultAllocationTypes(user.id).catch(() => []) : Promise.resolve([]),
      ]);

      if (salaryConfig && allocs) {
        setAllocations(allocs);

        const combinedSalary = salaryConfig.full_time_salary + (salaryConfig.part_time_salary ?? 0);
        const amountMap: Record<string, number> = {};
        const nameMap: Record<string, string> = {};
        const descMap: Record<string, string> = {};
        const colorMap: Record<string, string> = {};
        const iconMap: Record<string, string> = {};
        const typeIdMap: Record<string, string> = {};
        const fixedMap: Record<string, boolean> = {};

        for (const a of allocs) {
          amountMap[a.id] = Math.round(a.percentage * combinedSalary * 100) / 100;
          nameMap[a.id] = a.category;
          descMap[a.id] = a.description ?? '';
          colorMap[a.id] = a.color ?? 'hsl(220, 15%, 50%)';
          iconMap[a.id] = a.icon_name ?? 'HelpCircle';
          fixedMap[a.id] = a.is_fixed ?? false;
          if (a.allocation_type_id) typeIdMap[a.id] = a.allocation_type_id;
        }
        setAllocationAmounts(amountMap);
        setAllocationNames(nameMap);
        setAllocationDescriptions(descMap);
        setAllocationColors(colorMap);
        setAllocationIcons(iconMap);
        setAllocationTypeIds(typeIdMap);
        setAllocationFixedStates(fixedMap);
      }

      if (types) {
        setAllocationTypes(types);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load settings.';
      toast.error(message);
    } finally {
      setIsLoadingConfig(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Track previous total salary to scale percentage-based allocations in real-time
  const prevTotalSalaryRef = useRef(totalSalary);

  useEffect(() => {
    if (allocations.length === 0 || totalSalary <= 0) {
      prevTotalSalaryRef.current = totalSalary;
      return;
    }

    const prevTotalSalary = prevTotalSalaryRef.current;
    if (prevTotalSalary !== totalSalary && prevTotalSalary > 0) {
      const ratio = totalSalary / prevTotalSalary;
      setAllocationAmounts((prev) => {
        const next = { ...prev };
        for (const a of allocations) {
          const isFixed = allocationFixedStates[a.id] ?? false;
          if (!isFixed) {
            next[a.id] = Math.round((prev[a.id] ?? 0) * ratio * 100) / 100;
          }
        }
        return next;
      });
    }
    prevTotalSalaryRef.current = totalSalary;
  }, [totalSalary, allocations, allocationFixedStates]);

  // ---------------------------------------------------------------------------
  // Save salary config (full-time + part-time)
  // ---------------------------------------------------------------------------
  async function handleSaveConfig() {
    if (!config) return;
    setIsSavingConfig(true);
    try {
      const updated = await updateSalaryConfig(config.id, {
        name,
        full_time_salary: salary,
        part_time_salary: partTimeSalary,
        pay_frequency: payFrequency,
        consumable_allowance: consumableAllowance,
      });
      setConfig(updated);
      toast.success('Salary configuration saved.');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to save configuration.';
      toast.error(message);
    } finally {
      setIsSavingConfig(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Save allocations (convert amounts to decimal percentages for DB)
  // ---------------------------------------------------------------------------
  async function handleSaveAllocations() {
    if (totalSalary <= 0) {
      toast.error('Total salary must be greater than 0 to save allocations.');
      return;
    }
    setIsSavingAllocations(true);
    try {
      const updates = allocations.map((a) => ({
        id: a.id,
        percentage: (allocationAmounts[a.id] ?? 0) / totalSalary,
        category: allocationNames[a.id] ?? a.category,
        description: allocationDescriptions[a.id] ?? a.description ?? '',
        color: allocationColors[a.id] ?? a.color ?? 'hsl(220, 15%, 50%)',
        icon_name: allocationIcons[a.id] ?? a.icon_name ?? 'HelpCircle',
        allocation_type_id: allocationTypeIds[a.id] || a.allocation_type_id || null,
        is_fixed: allocationFixedStates[a.id] ?? false,
      }));
      await updateMultipleAllocations(updates);

      setAllocations((prev) =>
        prev.map((a) => ({
          ...a,
          percentage: (allocationAmounts[a.id] ?? 0) / totalSalary,
          category: allocationNames[a.id] ?? a.category,
          description: allocationDescriptions[a.id] ?? a.description,
          color: allocationColors[a.id] ?? a.color,
          icon_name: allocationIcons[a.id] ?? a.icon_name,
          allocation_type_id: allocationTypeIds[a.id] ?? a.allocation_type_id,
          is_fixed: allocationFixedStates[a.id] ?? false,
        }))
      );

      toast.success('Budget allocations saved.');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to save allocations.';
      toast.error(message);
    } finally {
      setIsSavingAllocations(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Add new category
  // ---------------------------------------------------------------------------
  async function handleAddCategory() {
    if (!config) return;
    setIsAddingCategory(true);
    try {
      const assignedColor = getNextColor(allocations.length);
      const assignedIcon = getRandomIcon();
      
      const newAlloc = await createBudgetAllocation(config.id, {
        category: 'New Category',
        percentage: 0,
        description: '',
        color: assignedColor,
        icon_name: assignedIcon,
        is_fixed: false,
      });

      setAllocations((prev) => [...prev, newAlloc]);
      setAllocationAmounts((prev) => ({
        ...prev,
        [newAlloc.id]: 0,
      }));
      setAllocationNames((prev) => ({
        ...prev,
        [newAlloc.id]: newAlloc.category,
      }));
      setAllocationDescriptions((prev) => ({
        ...prev,
        [newAlloc.id]: '',
      }));
      setAllocationColors((prev) => ({
        ...prev,
        [newAlloc.id]: assignedColor,
      }));
      setAllocationIcons((prev) => ({
        ...prev,
        [newAlloc.id]: assignedIcon,
      }));
      setAllocationFixedStates((prev) => ({
        ...prev,
        [newAlloc.id]: false,
      }));

      toast.success('Category added.');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to add category.';
      toast.error(message);
    } finally {
      setIsAddingCategory(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Delete category
  // ---------------------------------------------------------------------------
  async function handleDeleteCategory(id: string) {
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      await deleteBudgetAllocation(id);

      setAllocations((prev) => prev.filter((a) => a.id !== id));
      setAllocationAmounts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setAllocationNames((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setAllocationDescriptions((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setAllocationColors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setAllocationIcons((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

      toast.success('Category deleted.');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete category.';
      toast.error(message);
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Sign out
  // ---------------------------------------------------------------------------
  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push('/');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to sign out.';
      toast.error(message);
      setIsSigningOut(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Budget summary: total allocated vs total salary
  // ---------------------------------------------------------------------------
  const totalAllocated = Object.values(allocationAmounts).reduce(
    (sum, val) => sum + (val || 0),
    0
  );
  const remaining = totalSalary - totalAllocated;
  const isOverBudget = remaining < 0;
  const isExactBudget = Math.abs(remaining) < 0.01;

  // ---------------------------------------------------------------------------
  // Loading Skeleton
  // ---------------------------------------------------------------------------
  if (isLoadingConfig) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-40 w-full rounded-xl"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Click-away overlay when a picker is active */}
      {(activeColorPickerId || activeIconPickerId) && (
        <div
          className="fixed inset-0 z-40 cursor-default"
          onClick={() => {
            setActiveColorPickerId(null);
            setActiveIconPickerId(null);
          }}
        />
      )}

      <Tabs defaultValue="salary" className="w-full">
        <div className="sticky top-14 z-20 -mx-4 bg-background/80 px-4 py-3 backdrop-blur-md border-b border-border/20 mb-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <TabsList className="flex w-full items-center justify-start overflow-x-auto flex-nowrap p-1 gap-1 h-11 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:inline-flex sm:w-fit">
            <TabsTrigger value="salary" className="flex-1 sm:flex-initial h-9 gap-1 sm:gap-2 px-2.5 sm:px-5 text-xs sm:text-sm shrink-0 whitespace-nowrap">
              <Wallet className="h-4 w-4" />
              <span className="tab-label-reveal">Salary</span>
            </TabsTrigger>
            <TabsTrigger value="budget" className="flex-1 sm:flex-initial h-9 gap-1 sm:gap-2 px-2.5 sm:px-5 text-xs sm:text-sm shrink-0 whitespace-nowrap" data-onboarding="budget-tab">
              <PieChart className="h-4 w-4" />
              <span className="tab-label-reveal">Budget</span>
            </TabsTrigger>
            <TabsTrigger value="general" className="flex-1 sm:flex-initial h-9 gap-1 sm:gap-2 px-2.5 sm:px-5 text-xs sm:text-sm shrink-0 whitespace-nowrap">
              <Settings className="h-4 w-4" />
              <span className="tab-label-reveal">General</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ======================== SALARY TAB ======================== */}
        <TabsContent value="salary" className="space-y-6">
      {/* ============================================================ */}
      {/* Salary Configuration                                         */}
      {/* ============================================================ */}
      <Card data-onboarding="salary-config">
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="flex items-center gap-2">Salary Configuration
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger className="flex">
                        <Info className="h-3 w-3 text-muted-foreground/50 cursor-help shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Configure base salary and automated deductions
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </CardTitle>
          </div>
          <CardDescription>
            Set your name and salary details for calculations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="config-name">Name</Label>
            <Input
              id="config-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Salary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="full-time-salary">Full-Time Salary</Label>
            <Input
              id="full-time-salary"
              type="number"
              step="100"
              value={salary || ''}
              onChange={(e) => setSalary(Number(e.target.value) || 0)}
              className="tabular-nums"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="part-time-salary">Part-Time Salary</Label>
            <Input
              id="part-time-salary"
              type="number"
              step="100"
              value={partTimeSalary || ''}
              onChange={(e) => setPartTimeSalary(Number(e.target.value) || 0)}
              className="tabular-nums"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-frequency" className="font-semibold">Pay Frequency</Label>
            <select
              id="pay-frequency"
              value={payFrequency}
              onChange={(e) => setPayFrequency(e.target.value as PayFrequency)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
            >
              {PAY_FREQUENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} — {opt.description}
                </option>
              ))}
            </select>
          </div>

          {/* Consumable Budget */}
          <div className="space-y-2">
            <Label htmlFor="consumable-allowance" className="font-semibold">Monthly Consumable Budget</Label>
            <p className="text-xs text-muted-foreground">
              Set your monthly budget for daily consumables (food, water, necessities). Track spending against this budget on the Dashboard.
            </p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">PHP</span>
              <Input
                id="consumable-allowance"
                type="number"
                step="100"
                min="0"
                value={consumableAllowance || ''}
                onChange={(e) => setConsumableAllowance(Number(e.target.value) || 0)}
                className="tabular-nums pl-12"
                placeholder="4500"
              />
            </div>
          </div>

          {/* Combined total display */}
          {partTimeSalary > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span className="text-sm text-muted-foreground">Total Salary</span>
              <span className="text-sm font-semibold tabular-nums">
                PHP {formatPHP(totalSalary)}
              </span>
            </div>
          )}

          <Separator />
          <ConfirmDialog
            trigger={
              <Button
                disabled={isSavingConfig || !config}
                className="w-full"
                size="lg"
              >
                {isSavingConfig ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Configuration
                  </>
                )}
              </Button>
            }
            title="Save Configuration?"
            description="This will update your salary configuration. These changes will affect all future pay period calculations."
            confirmLabel="Save"
            destructive={false}
            onConfirm={handleSaveConfig}
            disabled={isSavingConfig || !config}
          />
        </CardContent>
      </Card>
        </TabsContent>

        {/* ======================== BUDGET TAB ======================== */}
        <TabsContent value="budget" className="space-y-6">
      {/* ============================================================ */}
      {/* Budget Allocations (Amount-based)                             */}
      {/* ============================================================ */}
      <Card data-onboarding="budget-allocations">
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <PieChart className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="flex items-center gap-2">Budget Allocations
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger className="flex">
                        <Info className="h-3 w-3 text-muted-foreground/50 cursor-help shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Allocate percentages or fixed amounts for categories
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </CardTitle>
          </div>
          <CardDescription>
            Set how much you allocate for each category (in PHP)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Budget summary bar */}
          {totalSalary > 0 && (
            <div className={cn(
              'rounded-lg border p-3',
              isOverBudget
                ? 'border-rose-500/30 bg-rose-500/5'
                : isExactBudget
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-amber-500/30 bg-amber-500/5'
            )}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isOverBudget ? (
                    <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
                  ) : isExactBudget ? (
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                  )}
                  <span className={cn(
                    'text-xs font-medium',
                    isOverBudget ? 'text-rose-500' : isExactBudget ? 'text-emerald-500' : 'text-amber-500'
                  )}>
                    {isOverBudget
                      ? `Over budget by PHP ${formatPHP(Math.abs(remaining))}`
                      : isExactBudget
                        ? 'Budget is fully allocated'
                        : `PHP ${formatPHP(remaining)} remaining`}
                  </span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    isOverBudget ? 'bg-rose-500' : isExactBudget ? 'bg-emerald-500' : 'bg-primary'
                  )}
                  style={{ width: `${Math.min((totalAllocated / totalSalary) * 100, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  PHP {formatPHP(totalAllocated)} allocated
                </span>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  PHP {formatPHP(totalSalary)} total
                </span>
              </div>
            </div>
          )}

          {/* Allocation rows */}
          {allocations.length > 0 && (
            <div className="space-y-3">
              {allocations.map((alloc) => (
                <div
                  key={alloc.id}
                  className={cn(
                    'rounded-lg border border-border/60 p-3 space-y-3 transition-opacity',
                    deletingIds.has(alloc.id) && 'opacity-50 pointer-events-none'
                  )}
                >
                  {/* Top row: Icon selection + Color selection + Category Name + Delete */}
                  <div className="flex items-center gap-2">
                    {/* Icon Selector */}
                    <div className="relative">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0 hover:bg-muted/80"
                        onClick={() => {
                          setActiveIconPickerId(activeIconPickerId === alloc.id ? null : alloc.id);
                          setActiveColorPickerId(null);
                        }}
                      >
                        <CategoryIcon name={allocationIcons[alloc.id]} className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      
                      {activeIconPickerId === alloc.id && (
                        <div className="absolute left-0 top-9 z-50 grid grid-cols-4 gap-1 p-2 bg-popover border border-border rounded-md shadow-md w-44">
                          {Object.keys(CATEGORY_ICONS).map((iconName) => {
                            const IconComponent = CATEGORY_ICONS[iconName];
                            return (
                              <button
                                key={iconName}
                                type="button"
                                className={cn(
                                  "flex h-8 w-8 items-center justify-center rounded hover:bg-muted transition-colors",
                                  allocationIcons[alloc.id] === iconName && "bg-primary/20 text-primary"
                                )}
                                onClick={() => {
                                  setAllocationIcons((prev) => ({ ...prev, [alloc.id]: iconName }));
                                  setActiveIconPickerId(null);
                                }}
                                title={iconName}
                              >
                                <IconComponent className="h-4 w-4" />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Color Selector */}
                    <div className="relative">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0 hover:bg-muted/80"
                        onClick={() => {
                          setActiveColorPickerId(activeColorPickerId === alloc.id ? null : alloc.id);
                          setActiveIconPickerId(null);
                        }}
                      >
                        <div
                          className="h-3.5 w-3.5 rounded-full border border-border/40"
                          style={{ backgroundColor: allocationColors[alloc.id] ?? 'hsl(220, 15%, 50%)' }}
                        />
                      </Button>
                      
                      {activeColorPickerId === alloc.id && (
                        <div className="absolute left-0 top-9 z-50 grid grid-cols-3 gap-1.5 p-2 bg-popover border border-border rounded-md shadow-md w-36">
                          {PALETTE_COLORS.map((c) => (
                            <button
                              key={c.value}
                              type="button"
                              className={cn(
                                "flex h-7 w-7 items-center justify-center rounded-full border border-transparent hover:border-muted-foreground/30 transition-all",
                                allocationColors[alloc.id] === c.value && "border-primary scale-110 shadow-sm"
                              )}
                              style={{ backgroundColor: c.value }}
                              onClick={() => {
                                  setAllocationColors((prev) => ({ ...prev, [alloc.id]: c.value }));
                                  setActiveColorPickerId(null);
                              }}
                              title={c.name}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <Input
                        type="text"
                        value={allocationNames[alloc.id] ?? alloc.category}
                        onChange={(e) =>
                          setAllocationNames((prev) => ({
                            ...prev,
                            [alloc.id]: e.target.value,
                          }))
                        }
                        placeholder="Category name"
                        className="text-sm font-medium h-8"
                      />
                    </div>
                    <ConfirmDialog
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deletingIds.has(alloc.id)}
                          className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          {deletingIds.has(alloc.id) ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      }
                      title="Delete Budget Category"
                      description={`Are you sure you want to delete the "${alloc.category}" budget category? This action cannot be undone.`}
                      confirmLabel="Delete Category"
                      onConfirm={() => handleDeleteCategory(alloc.id)}
                      disabled={deletingIds.has(alloc.id)}
                    />
                  </div>

                  {/* Bottom row: description + amount */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <Input
                        type="text"
                        value={allocationDescriptions[alloc.id] ?? alloc.description ?? ''}
                        onChange={(e) =>
                          setAllocationDescriptions((prev) => ({
                            ...prev,
                            [alloc.id]: e.target.value,
                          }))
                        }
                        placeholder="Description (optional)"
                        className="text-xs h-8 text-muted-foreground"
                      />
                    </div>
                    <div className="w-28 shrink-0">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                          PHP
                        </span>
                        <Input
                          type="number"
                          step="100"
                          min="0"
                          value={allocationAmounts[alloc.id] ?? 0}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setAllocationAmounts((prev) => ({
                              ...prev,
                              [alloc.id]: val,
                            }));
                          }}
                          className="pl-10 text-right tabular-nums text-xs h-8"
                        />
                      </div>
                      {!(allocationFixedStates[alloc.id] ?? false) && totalSalary > 0 && (
                        <p className="text-[9px] text-right text-muted-foreground mt-0.5 font-medium">
                          {(((allocationAmounts[alloc.id] ?? 0) / totalSalary) * 100).toFixed(1)}% of salary
                        </p>
                      )}
                      {(allocationFixedStates[alloc.id] ?? false) && (
                        <p className="text-[9px] text-right text-muted-foreground/50 mt-0.5 font-medium italic">
                          Fixed amount
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Type selector & Fixed checkbox row */}
                  <div className="flex items-center justify-between gap-4 mt-1">
                    {allocationTypes.length > 0 ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Tag className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                        <select
                          value={allocationTypeIds[alloc.id] ?? ''}
                          onChange={(e) =>
                            setAllocationTypeIds((prev) => ({
                              ...prev,
                              [alloc.id]: e.target.value,
                            }))
                          }
                          className="flex-1 h-7 text-xs bg-muted/50 border border-border/60 rounded-md px-2 text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/50"
                        >
                          <option value="">No type</option>
                          {allocationTypes.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.classification === 'asset' ? 'Asset' : 'Expense'})
                            </option>
                          ))}
                        </select>
                        {(() => {
                          const selectedType = allocationTypes.find((t) => t.id === allocationTypeIds[alloc.id]);
                          if (!selectedType) return null;
                          return (
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-[10px] px-1.5 py-0 shrink-0',
                                selectedType.classification === 'asset'
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              )}
                            >
                              {selectedType.classification === 'asset' ? 'Asset' : 'Expense'}
                            </Badge>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="flex-1" />
                    )}

                    {/* Fixed Amount checkbox */}
                    <div className="flex items-center gap-1.5 shrink-0 select-none">
                      <input
                        type="checkbox"
                        id={`fixed-${alloc.id}`}
                        checked={allocationFixedStates[alloc.id] ?? false}
                        onChange={(e) =>
                          setAllocationFixedStates((prev) => ({
                            ...prev,
                            [alloc.id]: e.target.checked,
                          }))
                        }
                        className="h-3.5 w-3.5 rounded border-input text-primary focus:ring-primary/50 cursor-pointer accent-primary bg-background"
                      />
                      <label
                        htmlFor={`fixed-${alloc.id}`}
                        className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      >
                        Fixed Amount
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {allocations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <PieChart className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">
                No budget categories yet
              </p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                Add your first category to start allocating your salary
              </p>
            </div>
          )}

          {/* Add Category button */}
          <Button
            variant="outline"
            onClick={handleAddCategory}
            disabled={isAddingCategory || !config}
            className="w-full"
          >
            {isAddingCategory ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add Category
              </>
            )}
          </Button>

          <Separator />

          <ConfirmDialog
            trigger={
              <Button
                disabled={isSavingAllocations || allocations.length === 0}
                className="w-full"
                size="lg"
              >
                {isSavingAllocations ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Allocations
                  </>
                )}
              </Button>
            }
            title="Save Allocations?"
            description="This will update all budget allocation percentages and amounts. Make sure the total allocation is correct before saving."
            confirmLabel="Save"
            destructive={false}
            onConfirm={handleSaveAllocations}
            disabled={isSavingAllocations || allocations.length === 0}
          />
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* Budget Types                                                  */}
      {/* ============================================================ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Tag className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="flex items-center gap-2">Budget Types
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger className="flex">
                        <Info className="h-3 w-3 text-muted-foreground/50 cursor-help shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Manage custom budget categories
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </CardTitle>
          </div>
          <CardDescription>
            Define types to classify your budget allocations (e.g., Expense, Savings)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing types */}
          {allocationTypes.length > 0 && (
            <div className="space-y-2">
              {allocationTypes.map((t) => (
                <div
                  key={t.id}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border border-border/60 p-2.5 transition-opacity',
                    deletingTypeIds.has(t.id) && 'opacity-50 pointer-events-none'
                  )}
                >
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: t.color ?? 'hsl(220, 15%, 50%)' }}
                  />
                  <Input
                    type="text"
                    value={t.name}
                    onChange={async (e) => {
                      const newName = e.target.value;
                      setAllocationTypes((prev) =>
                        prev.map((at) => at.id === t.id ? { ...at, name: newName } : at)
                      );
                    }}
                    onBlur={async () => {
                      try {
                        await updateAllocationType(t.id, { name: t.name });
                      } catch {
                        toast.error('Failed to update type name.');
                      }
                    }}
                    className="flex-1 text-sm font-medium h-7"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      const newClass = t.classification === 'expense' ? 'asset' : 'expense';
                      try {
                        const updated = await updateAllocationType(t.id, { classification: newClass as AllocationClassification });
                        setAllocationTypes((prev) =>
                          prev.map((at) => at.id === t.id ? updated : at)
                        );
                      } catch {
                        toast.error('Failed to update classification.');
                      }
                    }}
                    className={cn(
                      'px-2 py-0.5 text-[10px] font-semibold rounded-full border transition-colors shrink-0',
                      t.classification === 'asset'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/25'
                    )}
                  >
                    {t.classification === 'asset' ? 'Asset' : 'Expense'}
                  </button>
                  <ConfirmDialog
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-7 w-7 text-muted-foreground hover:text-destructive"
                        disabled={deletingTypeIds.has(t.id)}
                      >
                        {deletingTypeIds.has(t.id) ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    }
                    title="Delete Allocation Type"
                    description={`Are you sure you want to delete the "${t.name}" allocation type? Existing allocations using this type will have their type cleared.`}
                    confirmLabel="Delete Type"
                    onConfirm={async () => {
                      setDeletingTypeIds((prev) => new Set(prev).add(t.id));
                      try {
                        await deleteAllocationType(t.id);
                        setAllocationTypes((prev) => prev.filter((at) => at.id !== t.id));
                        // Clear any allocations that used this type
                        setAllocationTypeIds((prev) => {
                          const next = { ...prev };
                          Object.keys(next).forEach((k) => {
                            if (next[k] === t.id) delete next[k];
                          });
                          return next;
                        });
                        toast.success('Type deleted.');
                      } catch {
                        toast.error('Failed to delete type.');
                      } finally {
                        setDeletingTypeIds((prev) => {
                          const next = new Set(prev);
                          next.delete(t.id);
                          return next;
                        });
                      }
                    }}
                    disabled={deletingTypeIds.has(t.id)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Add new type */}
          <Separator />
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="New type name"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              className="flex-1 text-sm h-8"
            />
            <select
              value={newTypeClassification}
              onChange={(e) => setNewTypeClassification(e.target.value as AllocationClassification)}
              className="h-8 text-xs bg-muted/50 border border-border/60 rounded-md px-2 text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/50 w-24"
              style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
            >
              <option value="expense">Expense</option>
              <option value="asset">Asset</option>
            </select>
            <Button
              size="sm"
              variant="outline"
              className="h-8 shrink-0"
              disabled={isSavingType || !newTypeName.trim() || !userId}
              onClick={async () => {
                if (!userId || !newTypeName.trim()) return;
                setIsSavingType(true);
                try {
                  // Auto-assign a color from the palette based on how many types exist
                  const TYPE_COLORS = [
                    'hsl(346, 77%, 50%)', // rose
                    'hsl(38, 92%, 50%)',  // amber
                    'hsl(160, 84%, 39%)', // emerald
                    'hsl(270, 76%, 55%)', // purple
                    'hsl(199, 89%, 48%)', // sky
                    'hsl(24, 95%, 53%)',  // orange
                    'hsl(142, 71%, 45%)', // green
                    'hsl(326, 80%, 55%)', // pink
                    'hsl(217, 91%, 60%)', // blue
                    'hsl(47, 96%, 53%)',  // yellow
                  ];
                  const nextColor = TYPE_COLORS[allocationTypes.length % TYPE_COLORS.length];

                  const created = await createAllocationType(userId, {
                    name: newTypeName.trim(),
                    classification: newTypeClassification,
                    display_order: allocationTypes.length,
                    color: nextColor,
                  });
                  setAllocationTypes((prev) => [...prev, created]);
                  setNewTypeName('');
                  toast.success('Type added.');
                } catch {
                  toast.error('Failed to add type.');
                } finally {
                  setIsSavingType(false);
                }
              }}
            >
              {isSavingType ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        {/* ======================== GENERAL TAB ======================== */}
        <TabsContent value="general" className="space-y-6">
      {/* ============================================================ */}
      {/* Appearance                                                    */}
      {/* ============================================================ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Sun className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="flex items-center gap-2">Appearance
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger className="flex">
                        <Info className="h-3 w-3 text-muted-foreground/50 cursor-help shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Customize the look and feel of the app
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </CardTitle>
          </div>
          <CardDescription>
            Choose your preferred color theme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={theme ?? 'system'}
            onValueChange={(val) => setTheme(val as string)}
          >
            <TabsList className="w-full h-auto p-1 sm:h-11">
              <TabsTrigger value="light" className="flex-1 h-9 gap-2 text-sm">
                <Sun className="h-4 w-4" />
                Light
              </TabsTrigger>
              <TabsTrigger value="dark" className="flex-1 h-9 gap-2 text-sm">
                <Moon className="h-4 w-4" />
                Dark
              </TabsTrigger>
              <TabsTrigger value="system" className="flex-1 h-9 gap-2 text-sm">
                <Monitor className="h-4 w-4" />
                System
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* Data Management                                               */}
      {/* ============================================================ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Database className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="flex items-center gap-2">Data Management
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger className="flex animate-none opacity-70 transition-opacity hover:opacity-100 shrink-0">
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Export your payroll details and import transaction logs
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </CardTitle>
          </div>
          <CardDescription>
            Import or export your transactions, payrolls, and configurations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Data */}
          <div>
            <h4 className="text-sm font-semibold mb-2.5 text-foreground">Export Data</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Button
                key="export-payperiods"
                variant="outline"
                className="w-full flex items-center justify-start gap-2 h-12 px-3.5 text-xs text-muted-foreground hover:text-foreground border-border/50 bg-muted/20"
                onClick={handleExportPayPeriods}
                disabled={isExporting.payPeriods}
              >
                {isExporting.payPeriods ? (
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 text-emerald-500 shrink-0" />
                )}
                <div className="text-left">
                  <p className="font-medium text-foreground">Export Pay Periods</p>
                  <p className="text-[10px] text-muted-foreground">Download .csv log of periods</p>
                </div>
              </Button>

              <Button
                key="export-spare"
                variant="outline"
                className="w-full flex items-center justify-start gap-2 h-12 px-3.5 text-xs text-muted-foreground hover:text-foreground border-border/50 bg-muted/20"
                onClick={handleExportSpareTransactions}
                disabled={isExporting.spareTxns}
              >
                {isExporting.spareTxns ? (
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 text-amber-500 shrink-0" />
                )}
                <div className="text-left">
                  <p className="font-medium text-foreground">Export Spare Spending</p>
                  <p className="text-[10px] text-muted-foreground">Download .csv log of spare spend</p>
                </div>
              </Button>

              <Button
                key="export-consumable"
                variant="outline"
                className="w-full flex items-center justify-start gap-2 h-12 px-3.5 text-xs text-muted-foreground hover:text-foreground border-border/50 bg-muted/20"
                onClick={handleExportConsumableExpenses}
                disabled={isExporting.consumableExpenses}
              >
                {isExporting.consumableExpenses ? (
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 text-violet-500 shrink-0" />
                )}
                <div className="text-left">
                  <p className="font-medium text-foreground">Export Consumable Spending</p>
                  <p className="text-[10px] text-muted-foreground">Download .csv log of allowance spend</p>
                </div>
              </Button>

              <Button
                key="export-json"
                variant="outline"
                className="w-full flex items-center justify-start gap-2 h-12 px-3.5 text-xs text-muted-foreground hover:text-foreground border-border/50 bg-muted/20"
                onClick={handleExportBackup}
                disabled={isExporting.backup}
              >
                {isExporting.backup ? (
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                ) : (
                  <FileJson className="h-4 w-4 text-blue-500 shrink-0" />
                )}
                <div className="text-left">
                  <p className="font-medium text-foreground">Download JSON Backup</p>
                  <p className="text-[10px] text-muted-foreground">Full database snapshot download</p>
                </div>
              </Button>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Import Data */}
          <div>
            <h4 className="text-sm font-semibold mb-2 text-foreground">Import Transactions (CSV)</h4>
            <p className="text-xs text-muted-foreground mb-4 leading-normal">
              Upload a CSV file containing columns for <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono text-foreground font-semibold">Date</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono text-foreground font-semibold">Description</code>, and <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono text-foreground font-semibold">Amount</code>.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full space-y-1.5">
                <Label className="text-xs text-muted-foreground font-semibold">Import Destination</Label>
                <div className="relative">
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none pr-8 text-foreground"
                    value={importType}
                    onChange={(e) => setImportType(e.target.value as 'spare' | 'consumable')}
                  >
                    <option value="spare" className="bg-background text-foreground">Spare Transactions (linked by period date)</option>
                    <option value="consumable" className="bg-background text-foreground">Consumable Monthly Expenses (linked by month)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div className="w-full sm:w-auto shrink-0">
                <input
                  type="file"
                  ref={importFileRef}
                  accept=".csv"
                  className="hidden"
                  onChange={handleImportCSV}
                />
                <Button
                  onClick={() => importFileRef.current?.click()}
                  disabled={isImporting}
                  className="w-full flex items-center justify-center gap-2 h-9 px-4 text-xs font-semibold"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Select CSV & Import
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Database Recovery */}
          <div>
            <h4 className="text-sm font-semibold mb-1 text-foreground">Database Recovery</h4>
            <p className="text-xs text-muted-foreground mb-4 leading-normal">
              Restore your complete salary dashboard account profile using a previously downloaded JSON backup file.
            </p>

            <input
              type="file"
              ref={restoreFileRef}
              accept=".json"
              className="hidden"
              onChange={handleRestoreBackup}
            />

            <ConfirmDialog
              title="Restore Database Backup"
              description="WARNING: Restoring a backup will permanently delete all your current salary configurations, budget allocations, transactions, and borrowing histories and replace them with the backup data. This action cannot be undone. Are you sure you want to proceed?"
              confirmLabel="Yes, Proceed"
              cancelLabel="Cancel"
              variant="destructive"
              onConfirm={() => {
                restoreFileRef.current?.click();
              }}
              className="w-full"
              trigger={
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-400 text-rose-500/80 h-9 text-xs font-semibold bg-rose-500/5"
                  disabled={isRestoring}
                >
                  {isRestoring ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Restoring...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4" />
                      Restore JSON Backup
                    </>
                  )}
                </Button>
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* Account                                                       */}
      {/* ============================================================ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="flex items-center gap-2">Account
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger className="flex">
                        <Info className="h-3 w-3 text-muted-foreground/50 cursor-help shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Manage your user account settings
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </CardTitle>
          </div>
          <CardDescription>
            Manage your account settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {userEmail && (
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground truncate">
                {userEmail}
              </span>
            </div>
          )}
          <Separator />
          <ConfirmDialog
            title="Sign Out"
            description="Are you sure you want to sign out of your account?"
            confirmLabel="Sign Out"
            cancelLabel="Cancel"
            variant="destructive"
            onConfirm={handleSignOut}
            className="w-full"
            trigger={
              <Button
                variant="destructive"
                className="w-full"
                size="lg"
                disabled={isSigningOut}
              >
                {isSigningOut ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing out...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </>
                )}
              </Button>
            }
          />
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
