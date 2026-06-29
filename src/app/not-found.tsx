'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, Bot, Sparkles, Zap, Cpu, WifiOff } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { useEffect, useState } from 'react';

export default function NotFound() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background relative overflow-hidden">
      <AnimatedBackground variant="dashboard" />
      
      {/* Background Floating Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {mounted && [...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-primary/20 blur-xl"
            style={{
              width: Math.random() * 80 + 40,
              height: Math.random() * 80 + 40,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, Math.random() * 100 - 50, 0],
              x: [0, Math.random() * 100 - 50, 0],
              scale: [1, Math.random() + 0.5, 1],
              opacity: [0.05, 0.2, 0.05],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-2xl"
      >
        {/* Animated Robot / Centerpiece */}
        <div className="relative mb-12 flex items-center justify-center h-48 w-48">
          {/* Outer rotating rings */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-6 rounded-full border border-primary/20"
          />
          
          {/* Floating Robot */}
          <motion.div
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-card shadow-2xl border border-primary/20 backdrop-blur-md overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <Bot className="h-14 w-14 text-primary relative z-10" />
            
            {/* Robot Eye Scanline */}
            <motion.div 
              animate={{ top: ['-20%', '120%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-1 bg-primary/50 blur-[2px] z-20"
            />
          </motion.div>

          {/* Floating sparks around robot */}
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -top-4 -right-4">
            <Sparkles className="h-8 w-8 text-emerald-400" />
          </motion.div>
          <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} className="absolute -bottom-6 -left-2">
            <Zap className="h-6 w-6 text-amber-400" />
          </motion.div>
          <motion.div animate={{ rotate: [0, 90, 0] }} transition={{ duration: 5, repeat: Infinity }} className="absolute top-10 -left-10">
            <Cpu className="h-7 w-7 text-violet-400 opacity-60" />
          </motion.div>
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute bottom-6 -right-12">
            <WifiOff className="h-7 w-7 text-rose-400 opacity-60" />
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative"
        >
          <h1 className="text-8xl md:text-9xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/40 drop-shadow-sm mb-4">
            404
          </h1>
          {/* Glitch overlay */}
          <motion.h1 
            animate={{ x: [-2, 2, -1, 1, 0], opacity: [0, 0.8, 0, 0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="absolute top-0 left-0 text-8xl md:text-9xl font-black tracking-tighter text-destructive/80 mix-blend-screen pointer-events-none"
          >
            404
          </motion.h1>
          <motion.h1 
            animate={{ x: [2, -2, 1, -1, 0], opacity: [0, 0.8, 0, 0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3.1 }}
            className="absolute top-0 left-0 text-8xl md:text-9xl font-black tracking-tighter text-emerald-500/80 mix-blend-screen pointer-events-none"
          >
            404
          </motion.h1>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-10 text-xl text-muted-foreground"
        >
          System malfunction. The route you are trying to access has been lost in the void.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link href="/dashboard" className={cn(
            buttonVariants({ size: "lg" }), 
            "h-14 px-8 rounded-full text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all relative overflow-hidden group"
          )}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
            <Home className="mr-2 h-5 w-5 relative z-10" />
            <span className="relative z-10">Reboot to Dashboard</span>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
