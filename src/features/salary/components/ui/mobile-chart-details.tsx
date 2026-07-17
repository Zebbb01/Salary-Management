'use client';

import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface DetailField {
  label: string;
  value: string | number;
  color?: string;
}

interface MobileChartDetailsProps {
  title?: string;
  fields: DetailField[];
  onClose: () => void;
  visible: boolean;
}

export function MobileChartDetails({
  title = 'Selected Details',
  fields,
  onClose,
  visible,
}: MobileChartDetailsProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="mt-3 block md:hidden rounded-xl border border-border bg-card/60 p-4 backdrop-blur-md shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {title}
            </h4>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 rounded-full hover:bg-muted"
              onClick={onClose}
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {fields.map((field, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-1 rounded-lg bg-muted/40 p-2 border border-border/20"
              >
                <span className="text-[10px] text-muted-foreground uppercase font-medium">
                  {field.label}
                </span>
                <span
                  className="text-sm font-semibold tabular-nums"
                  style={{ color: field.color }}
                >
                  {field.value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
