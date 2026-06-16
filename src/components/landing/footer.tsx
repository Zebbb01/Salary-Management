'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Wallet, Globe, ExternalLink, Mail } from 'lucide-react';

const footerLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
];

const socialLinks = [
  { icon: Globe, href: '#', label: 'Website' },
  { icon: ExternalLink, href: '#', label: 'Social' },
  { icon: Mail, href: '#', label: 'Email' },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden">
      {/* Top gradient border */}
      <div className="h-px w-full" aria-hidden="true">
        <div
          className="h-full w-full"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, oklch(0.556 0.17 165 / 0.3) 25%, oklch(0.555 0.175 262 / 0.2) 50%, oklch(0.556 0.17 165 / 0.3) 75%, transparent 100%)',
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
          {/* Brand Column */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="md:col-span-5 flex flex-col items-center md:items-start"
          >
            <Link href="/" className="flex items-center gap-2.5 group mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 transition-colors duration-200 group-hover:bg-primary/25">
                <Wallet className="h-4.5 w-4.5 text-primary" />
              </div>
              <span className="text-lg font-semibold tracking-tight font-display">
                Salary Dashboard
              </span>
            </Link>
            <p className="text-sm text-muted-foreground/70 text-center md:text-left max-w-xs leading-relaxed">
              Built with care for Filipino professionals who want to take control of their finances.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3 mt-5">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/40 bg-card/30 text-muted-foreground/60 transition-all duration-200 hover:border-primary/30 hover:text-primary hover:bg-primary/5"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Links Columns */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="md:col-span-3 flex flex-col items-center md:items-start"
          >
            <h4 className="text-sm font-medium mb-4 text-foreground/80">Quick Links</h4>
            <nav className="flex flex-col gap-2.5">
              {footerLinks.slice(0, 2).map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-muted-foreground/60 hover:text-primary transition-colors duration-200"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="md:col-span-4 flex flex-col items-center md:items-start"
          >
            <h4 className="text-sm font-medium mb-4 text-foreground/80">Legal</h4>
            <nav className="flex flex-col gap-2.5">
              {footerLinks.slice(2).map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm text-muted-foreground/60 hover:text-primary transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-border/30">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground/40">
              &copy; {currentYear} Salary Dashboard. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground/30">
              Designed for Filipino professionals
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
