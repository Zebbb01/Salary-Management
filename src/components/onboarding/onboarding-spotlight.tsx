'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useOnboarding } from './onboarding-provider';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ============================================
// TYPES
// ============================================

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TooltipPosition {
  top: number;
  left: number;
}

// ============================================
// HELPERS
// ============================================

const TOOLTIP_GAP = 16;
const TOOLTIP_WIDTH = 320;
const CUTOUT_PADDING = 8;
const CUTOUT_RADIUS = 12;
const VIEWPORT_MARGIN = 16;

function calculateTooltipPosition(
  rect: TargetRect,
  preferredPosition: 'top' | 'bottom' | 'left' | 'right'
): TooltipPosition & { actualPosition: 'top' | 'bottom' | 'left' | 'right' } {
  const padded = {
    top: rect.top - CUTOUT_PADDING,
    left: rect.left - CUTOUT_PADDING,
    width: rect.width + CUTOUT_PADDING * 2,
    height: rect.height + CUTOUT_PADDING * 2,
  };

  const TOOLTIP_EST_HEIGHT = 200;

  function tryPosition(position: 'top' | 'bottom' | 'left' | 'right') {
    let top = 0;
    let left = 0;

    switch (position) {
      case 'bottom':
        top = padded.top + padded.height + TOOLTIP_GAP;
        left = padded.left + padded.width / 2 - TOOLTIP_WIDTH / 2;
        break;
      case 'top':
        top = padded.top - TOOLTIP_GAP - TOOLTIP_EST_HEIGHT;
        left = padded.left + padded.width / 2 - TOOLTIP_WIDTH / 2;
        break;
      case 'right':
        top = padded.top + padded.height / 2 - TOOLTIP_EST_HEIGHT / 2;
        left = padded.left + padded.width + TOOLTIP_GAP;
        break;
      case 'left':
        top = padded.top + padded.height / 2 - TOOLTIP_EST_HEIGHT / 2;
        left = padded.left - TOOLTIP_WIDTH - TOOLTIP_GAP;
        break;
    }

    return { top, left };
  }

  function fitsInViewport(pos: { top: number; left: number }) {
    return (
      pos.top >= VIEWPORT_MARGIN &&
      pos.top + TOOLTIP_EST_HEIGHT <= window.innerHeight - VIEWPORT_MARGIN &&
      pos.left >= VIEWPORT_MARGIN &&
      pos.left + TOOLTIP_WIDTH <= window.innerWidth - VIEWPORT_MARGIN
    );
  }

  // Try preferred position first
  let pos = tryPosition(preferredPosition);
  let actualPosition = preferredPosition;

  if (!fitsInViewport(pos)) {
    // Try opposite side
    const opposite: Record<string, 'top' | 'bottom' | 'left' | 'right'> = {
      top: 'bottom', bottom: 'top', left: 'right', right: 'left',
    };
    const oppPos = tryPosition(opposite[preferredPosition]);
    if (fitsInViewport(oppPos)) {
      pos = oppPos;
      actualPosition = opposite[preferredPosition];
    } else {
      // Try remaining directions
      const alternatives: ('top' | 'bottom' | 'left' | 'right')[] = ['right', 'left', 'bottom', 'top'];
      for (const alt of alternatives) {
        if (alt === preferredPosition || alt === opposite[preferredPosition]) continue;
        const altPos = tryPosition(alt);
        if (fitsInViewport(altPos)) {
          pos = altPos;
          actualPosition = alt;
          break;
        }
      }
    }
  }

  // Final clamping to keep tooltip visible
  if (pos.left < VIEWPORT_MARGIN) pos.left = VIEWPORT_MARGIN;
  if (pos.left + TOOLTIP_WIDTH > window.innerWidth - VIEWPORT_MARGIN) {
    pos.left = window.innerWidth - VIEWPORT_MARGIN - TOOLTIP_WIDTH;
  }
  if (pos.top < VIEWPORT_MARGIN) pos.top = VIEWPORT_MARGIN;
  if (pos.top + TOOLTIP_EST_HEIGHT > window.innerHeight - VIEWPORT_MARGIN) {
    pos.top = window.innerHeight - VIEWPORT_MARGIN - TOOLTIP_EST_HEIGHT;
  }

  return { top: pos.top, left: pos.left, actualPosition };
}

// ============================================
// SPOTLIGHT COMPONENT
// ============================================

export function OnboardingSpotlight() {
  const {
    isOnboarding,
    currentStep,
    totalSteps,
    steps,
    nextStep,
    prevStep,
    skipOnboarding,
    completeOnboarding,
  } = useOnboarding();

  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition>({
    top: 0,
    left: 0,
  });
  const observerRef = useRef<MutationObserver | null>(null);
  const rafRef = useRef<number | null>(null);

  const step = steps[currentStep];
  const isLastStep = currentStep === totalSteps - 1;

  // Find the target element and compute its rect
  const updatePosition = useCallback(() => {
    if (!step) return;

    const el = document.querySelector(step.targetSelector);
    if (!el) {
      setTargetRect(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    const newRect: TargetRect = {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };

    setTargetRect(newRect);
    setTooltipPos(calculateTooltipPosition(newRect, step.position));

    // Scroll element into view if it's out of viewport
    const isVisible =
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth;

    if (!isVisible) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [step]);

  // Recalculate on step change, resize, scroll
  useEffect(() => {
    if (!isOnboarding || !step) return;

    // Delay to let DOM settle after page navigation
    const timeout = setTimeout(() => {
      updatePosition();
    }, 300);

    function handleResize() {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updatePosition);
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    // Observe DOM mutations to catch delayed element renders
    observerRef.current = new MutationObserver(() => {
      handleResize();
    });
    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      observerRef.current?.disconnect();
    };
  }, [isOnboarding, step, currentStep, updatePosition]);

  if (!isOnboarding || !step) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`onboarding-${currentStep}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50"
        aria-label="Onboarding overlay"
      >
        {/* Overlay with transparent cutout */}
        {targetRect ? (
          <div
            className="absolute rounded-xl pointer-events-none"
            style={{
              top: targetRect.top - CUTOUT_PADDING,
              left: targetRect.left - CUTOUT_PADDING,
              width: targetRect.width + CUTOUT_PADDING * 2,
              height: targetRect.height + CUTOUT_PADDING * 2,
              borderRadius: CUTOUT_RADIUS,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
              zIndex: 50,
            }}
          />
        ) : (
          <div
            className="absolute inset-0 bg-black/70 pointer-events-none"
            style={{ zIndex: 50 }}
          />
        )}

        {/* Clickable backdrop to prevent interaction behind overlay */}
        <div
          className="absolute inset-0"
          style={{ zIndex: 49 }}
          onClick={(e) => e.stopPropagation()}
        />

        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }}
          className={cn(
            'absolute bg-popover text-popover-foreground border border-border',
            'rounded-xl shadow-2xl p-5',
            'pointer-events-auto'
          )}
          style={{
            top: tooltipPos.top,
            left: tooltipPos.left,
            width: TOOLTIP_WIDTH,
            zIndex: 51,
          }}
        >
          {/* Step Counter */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground">
              {currentStep + 1} of {totalSteps}
            </span>
            <button
              onClick={skipOnboarding}
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close onboarding"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mb-4">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1 rounded-full transition-all duration-300',
                  i === currentStep
                    ? 'w-6 bg-primary'
                    : i < currentStep
                      ? 'w-3 bg-primary/40'
                      : 'w-3 bg-muted'
                )}
              />
            ))}
          </div>

          {/* Content */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-foreground mb-1.5">
              {step.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary/40 hover:text-primary"
              onClick={skipOnboarding}
            >
              Skip Tour
            </Button>
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 px-3"
                  onClick={prevStep}
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  Back
                </Button>
              )}
              <Button
                size="sm"
                className="text-xs h-8 px-4"
                onClick={isLastStep ? completeOnboarding : nextStep}
              >
                {isLastStep ? (
                  'Go to Dashboard'
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
