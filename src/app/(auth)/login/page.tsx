'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Loader2, Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import {
  loginSchema,
  type LoginFormData,
} from '@/features/salary/validations/schemas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

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

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginFormData) {
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      toast.error('Login failed', {
        description: error.message,
      });
      return;
    }

    toast.success('Welcome back!');
    router.push('/dashboard');
    router.refresh();
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

        <div className="relative px-6 pt-8 pb-2 sm:px-8">
          {/* Header */}
          <motion.div variants={itemVariants} className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to your account to continue
            </p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.email}
                  className="h-10 pl-9"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </motion.div>

            {/* Password */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
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
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  Forgot password?
                </Link>
              </div>
            </motion.div>

            {/* Divider */}
            <motion.div
              variants={itemVariants}
              className="relative flex items-center gap-3 py-1"
            >
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
              <span className="text-[11px] font-medium tracking-wide text-muted-foreground/50 uppercase">
                Continue with email
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
                    Sign In
                    <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </Button>
            </motion.div>
          </form>
        </div>

        {/* Footer */}
        <motion.div
          variants={itemVariants}
          className="mt-4 flex items-center justify-center gap-1.5 border-t border-foreground/[0.05] bg-muted/30 px-6 py-4"
        >
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?
          </p>
          <Link
            href="/signup"
            className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            Create one
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
