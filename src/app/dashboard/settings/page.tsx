'use client';

import { useEffect, useState, useCallback } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type {
  SalaryConfig,
  BudgetAllocation,
  AllocationType,
  AllocationClassification,
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

  // Computed: total salary
  const totalSalary = salary + partTimeSalary;

  // ---------------------------------------------------------------------------
  // Fetch data on mount
  // ---------------------------------------------------------------------------
  const fetchData = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (user?.email) setUserEmail(user.email);
      if (user?.id) setUserId(user.id);

      const salaryConfig = await getSalaryConfig();
      if (salaryConfig) {
        setConfig(salaryConfig);
        setName(salaryConfig.name);
        setSalary(salaryConfig.full_time_salary);
        setPartTimeSalary(salaryConfig.part_time_salary ?? 0);

        const allocs = await getBudgetAllocations(salaryConfig.id);
        setAllocations(allocs);

        const combinedSalary = salaryConfig.full_time_salary + (salaryConfig.part_time_salary ?? 0);
        const amountMap: Record<string, number> = {};
        const nameMap: Record<string, string> = {};
        const descMap: Record<string, string> = {};
        const colorMap: Record<string, string> = {};
        const iconMap: Record<string, string> = {};
        const typeIdMap: Record<string, string> = {};

        for (const a of allocs) {
          amountMap[a.id] = Math.round(a.percentage * combinedSalary * 100) / 100;
          nameMap[a.id] = a.category;
          descMap[a.id] = a.description ?? '';
          colorMap[a.id] = a.color ?? 'hsl(220, 15%, 50%)';
          iconMap[a.id] = a.icon_name ?? 'HelpCircle';
          if (a.allocation_type_id) typeIdMap[a.id] = a.allocation_type_id;
        }
        setAllocationAmounts(amountMap);
        setAllocationNames(nameMap);
        setAllocationDescriptions(descMap);
        setAllocationColors(colorMap);
        setAllocationIcons(iconMap);
        setAllocationTypeIds(typeIdMap);
      }

      // Load or seed allocation types
      if (user?.id) {
        const types = await seedDefaultAllocationTypes(user.id);
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="salary" className="gap-1.5">
              <Wallet className="h-3.5 w-3.5" />
              Salary
            </TabsTrigger>
            <TabsTrigger value="budget" className="gap-1.5">
              <PieChart className="h-3.5 w-3.5" />
              Budget
            </TabsTrigger>
            <TabsTrigger value="general" className="gap-1.5">
              <Settings className="h-3.5 w-3.5" />
              General
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ======================== SALARY TAB ======================== */}
        <TabsContent value="salary" className="space-y-6">
      {/* ============================================================ */}
      {/* Salary Configuration                                         */}
      {/* ============================================================ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <CardTitle>Salary Configuration</CardTitle>
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
          <Button
            onClick={handleSaveConfig}
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
        </CardContent>
      </Card>
        </TabsContent>

        {/* ======================== BUDGET TAB ======================== */}
        <TabsContent value="budget" className="space-y-6">
      {/* ============================================================ */}
      {/* Budget Allocations (Amount-based)                             */}
      {/* ============================================================ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <PieChart className="h-4 w-4 text-primary" />
            </div>
            <CardTitle>Budget Allocations</CardTitle>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCategory(alloc.id)}
                      disabled={deletingIds.has(alloc.id)}
                      className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      {deletingIds.has(alloc.id) ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
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
                    </div>
                  </div>

                  {/* Type selector row */}
                  {allocationTypes.length > 0 && (
                    <div className="flex items-center gap-2">
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
                  )}
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

          <Button
            onClick={handleSaveAllocations}
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
            <CardTitle>Budget Types</CardTitle>
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-7 w-7 text-muted-foreground hover:text-destructive"
                    disabled={deletingTypeIds.has(t.id)}
                    onClick={async () => {
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
                  >
                    {deletingTypeIds.has(t.id) ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
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
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>
            Choose your preferred color theme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue={theme ?? 'system'}
            onValueChange={(val) => setTheme(val as string)}
          >
            <TabsList className="w-full">
              <TabsTrigger value="light" className="flex-1 gap-1.5">
                <Sun className="h-4 w-4" />
                Light
              </TabsTrigger>
              <TabsTrigger value="dark" className="flex-1 gap-1.5">
                <Moon className="h-4 w-4" />
                Dark
              </TabsTrigger>
              <TabsTrigger value="system" className="flex-1 gap-1.5">
                <Monitor className="h-4 w-4" />
                System
              </TabsTrigger>
            </TabsList>
          </Tabs>
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
            <CardTitle>Account</CardTitle>
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
          <Button
            variant="destructive"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="w-full"
            size="lg"
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
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
