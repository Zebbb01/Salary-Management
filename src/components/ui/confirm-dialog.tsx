'use client';

import * as React from 'react';
import Lottie from 'lottie-react';
import {
  successAnimation,
  deleteAnimation,
  warningAnimation,
  infoAnimation,
} from '@/components/ui/lottie-animations';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ConfirmVariant = 'destructive' | 'success' | 'warning' | 'info';

interface ConfirmDialogProps {
  /** The trigger element (usually a Button) */
  trigger: React.ReactNode;
  /** Title shown in the dialog */
  title: string;
  /** Description/body of the confirmation prompt */
  description: string;
  /** Label for the confirm button (default: "Confirm") */
  confirmLabel?: string;
  /** Label for the cancel button (default: "Cancel") */
  cancelLabel?: string;
  /** Whether the confirm action is destructive (default: true) -- shorthand for variant="destructive" */
  destructive?: boolean;
  /** Visual variant controlling icon and confirm button color */
  variant?: ConfirmVariant;
  /** Callback when user confirms */
  onConfirm: () => void | Promise<void>;
  /** Whether the dialog is disabled (won't open) */
  disabled?: boolean;
  /** Custom class for the trigger span wrapper */
  className?: string;
}

const variantConfig: Record<
  ConfirmVariant,
  {
    animation: object;
    confirmClass: string;
  }
> = {
  destructive: {
    animation: deleteAnimation,
    confirmClass: buttonVariants({ variant: 'destructive' }),
  },
  success: {
    animation: successAnimation,
    confirmClass:
      'bg-emerald-600 text-white shadow-sm hover:bg-emerald-500 focus-visible:ring-emerald-500',
  },
  warning: {
    animation: warningAnimation,
    confirmClass:
      'bg-amber-600 text-white shadow-sm hover:bg-amber-500 focus-visible:ring-amber-500',
  },
  info: {
    animation: infoAnimation,
    confirmClass:
      'bg-blue-600 text-white shadow-sm hover:bg-blue-500 focus-visible:ring-blue-500',
  },
};

/**
 * Reusable confirmation dialog wrapping shadcn AlertDialog.
 * Premium centered design with animated Lottie icons and color-coded actions.
 *
 * Variants:
 * - `destructive` (default when destructive=true): Animated red X
 * - `success`: Animated green checkmark (for save/create)
 * - `warning`: Animated amber exclamation (for status changes)
 * - `info`: Animated blue info (for general confirmations)
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
  variant: variantProp,
  onConfirm,
  disabled = false,
  className,
}: ConfirmDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const resolvedVariant: ConfirmVariant =
    variantProp ?? (destructive ? 'destructive' : 'success');
  const config = variantConfig[resolvedVariant];

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <span
        role="button"
        tabIndex={-1}
        className={cn("inline-flex", className)}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            if (!disabled) setOpen(true);
          }
        }}
      >
        {trigger}
      </span>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent size="sm">
          <div className="flex flex-col items-center text-center pt-2">
            {/* Animated Lottie icon */}
            <div className="h-16 w-16">
              {open && (
                <Lottie
                  animationData={config.animation}
                  loop={false}
                  autoplay
                  className="h-16 w-16"
                />
              )}
            </div>
            <h2 className="mt-3 text-base font-semibold text-foreground">
              {title}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed max-w-[260px]">
              {description}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              {cancelLabel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isLoading}
              className={cn(config.confirmClass)}
            >
              {isLoading ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Processing...
                </span>
              ) : (
                confirmLabel
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
