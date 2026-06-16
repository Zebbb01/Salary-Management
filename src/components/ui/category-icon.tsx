import React from 'react';
import {
  Home,
  Flame,
  Car,
  Heart,
  Shield,
  ShoppingBag,
  PiggyBank,
  Sparkles,
  BookOpen,
  Coffee,
  Receipt,
  DollarSign,
  Wallet,
  Briefcase,
  Lightbulb,
  Wifi,
  HelpCircle,
} from 'lucide-react';

export const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Home,
  Flame,
  Car,
  Heart,
  Shield,
  ShoppingBag,
  PiggyBank,
  Sparkles,
  BookOpen,
  Coffee,
  Receipt,
  DollarSign,
  Wallet,
  Briefcase,
  Lightbulb,
  Wifi,
  HelpCircle,
};

export interface CategoryIconProps {
  name: string | null | undefined;
  className?: string;
}

export function CategoryIcon({ name, className }: CategoryIconProps) {
  const IconComponent = name ? CATEGORY_ICONS[name] : HelpCircle;
  const ResolvedIcon = IconComponent || HelpCircle;
  return <ResolvedIcon className={className} />;
}
