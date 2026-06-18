'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  /** The trigger element (usually a Button) */
  trigger: React.ReactNode;
  /** Title shown in the dialog */
  title: string;
  /** Description/body of the confirmation prompt */
  description: string;
  /** Label for the confirm button (default: "Delete") */
  confirmLabel?: string;
  /** Label for the cancel button (default: "Cancel") */
  cancelLabel?: string;
  /** Whether the confirm action is destructive (default: true) */
  destructive?: boolean;
  /** Callback when user confirms */
  onConfirm: () => void | Promise<void>;
  /** Whether the dialog is disabled (won't open) */
  disabled?: boolean;
}

/**
 * Reusable confirmation dialog wrapping shadcn AlertDialog.
 * Use for any destructive or irreversible action (delete, sign out, etc).
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
  disabled = false,
}: ConfirmDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <span
        role="button"
        tabIndex={-1}
        className="inline-flex"
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await onConfirm();
                setOpen(false);
              }}
              className={cn(
                destructive &&
                  buttonVariants({ variant: 'destructive' })
              )}
            >
              {confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
