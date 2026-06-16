export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background p-4">
      {/* Subtle radial glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30 dark:opacity-20"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 40%, oklch(0.506 0.155 165 / 0.1), transparent)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
