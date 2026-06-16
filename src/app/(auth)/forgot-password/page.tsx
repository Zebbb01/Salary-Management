'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowLeft, Mail, ArrowRight, Send } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

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

export default function ForgotPasswordPage() {
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(data: ForgotPasswordFormData) {
    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error('Failed to send reset email', {
        description: error.message,
      });
      return;
    }

    setSentEmail(data.email);
    setEmailSent(true);
    toast.success('Reset link sent! Check your email.');
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
          {emailSent ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="relative px-6 py-8 sm:px-8"
            >
              {/* Header */}
              <div className="mb-6 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: 0.2,
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                  }}
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20"
                >
                  <Send className="h-6 w-6 text-emerald-500" />
                </motion.div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Check Your Email
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  We sent a password reset link to{' '}
                  <span className="font-medium text-foreground">
                    {sentEmail}
                  </span>
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4 text-center">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Click the link in your email to choose a new password. If
                    you don&apos;t see it, check your spam folder.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setEmailSent(false);
                    setSentEmail('');
                  }}
                >
                  Send Again
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="form">
              <div className="relative px-6 pt-8 pb-2 sm:px-8">
                {/* Header */}
                <motion.div
                  variants={itemVariants}
                  className="mb-6 text-center"
                >
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Reset Password
                  </h1>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Enter your email and we&apos;ll send you a reset link
                  </p>
                </motion.div>

                {/* Form */}
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-4"
                >
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

                  {/* Submit */}
                  <motion.div variants={itemVariants} className="pt-2">
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
                          Send Reset Link
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

        {/* Footer */}
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-center border-t border-foreground/[0.05] bg-muted/30 px-6 py-4"
        >
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Sign In
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
