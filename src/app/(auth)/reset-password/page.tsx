'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Eye, EyeOff, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
} as const;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: ResetPasswordFormData) {
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      toast.error('Failed to reset password', {
        description: error.message,
      });
      return;
    }

    setIsComplete(true);
    toast.success('Password updated successfully!');

    // Redirect to dashboard after a short delay
    setTimeout(() => {
      router.push('/dashboard');
      router.refresh();
    }, 2000);
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Glassmorphism card */}
      <div className="relative overflow-hidden rounded-2xl border border-foreground/[0.08] bg-card/80 shadow-xl shadow-black/5 backdrop-blur-xl">
        {/* Top gradient accent line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

        {/* Card inner glow */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-emerald-500/[0.03] to-transparent" />

        <AnimatePresence mode="wait">
          {isComplete ? (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="relative px-6 py-12 text-center sm:px-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.2,
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20"
              >
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </motion.div>
              <h2 className="text-xl font-bold text-foreground">
                Password Updated
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your password has been updated successfully.
              </p>
              <div className="mt-4 rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3">
                <p className="text-xs text-muted-foreground">
                  Redirecting you to the dashboard...
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="form">
              <div className="relative px-6 pt-8 pb-6 sm:px-8">
                {/* Header */}
                <motion.div
                  variants={itemVariants}
                  className="mb-6 text-center"
                >
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Choose New Password
                  </h1>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Enter your new password below
                  </p>
                </motion.div>

                {/* Form */}
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  {/* New Password */}
                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Enter new password"
                        disabled={isSubmitting}
                        aria-invalid={!!errors.password}
                        className="h-10 pr-10 pl-9"
                        {...register('password')}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                        aria-label={
                          showPassword ? 'Hide password' : 'Show password'
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-destructive">
                        {errors.password.message}
                      </p>
                    )}
                  </motion.div>

                  {/* Confirm Password */}
                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                      <Input
                        id="confirmPassword"
                        type={showConfirm ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Confirm new password"
                        disabled={isSubmitting}
                        aria-invalid={!!errors.confirmPassword}
                        className="h-10 pr-10 pl-9"
                        {...register('confirmPassword')}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                        aria-label={
                          showConfirm ? 'Hide password' : 'Show password'
                        }
                      >
                        {showConfirm ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-destructive">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </motion.div>

                  {/* Divider */}
                  <motion.div
                    variants={itemVariants}
                    className="relative flex items-center gap-3 py-1"
                  >
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
                    <span className="text-[11px] font-medium tracking-wide text-muted-foreground/50 uppercase">
                      Secure reset
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
                  </motion.div>

                  {/* Submit */}
                  <motion.div variants={itemVariants} className="pt-1">
                    <Button
                      type="submit"
                      variant="default"
                      size="lg"
                      disabled={isSubmitting}
                      className="group w-full"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          Update Password
                          <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
