import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-12 sm:px-8 lg:px-10">
        <div className="mb-10">
          <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}>
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        <article className="space-y-8">{children}</article>

        <footer className="mt-16 border-t border-border/50 pt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Salary Dashboard &mdash; A personal finance tool for Filipino
            professionals.
          </p>
        </footer>
      </div>
    </div>
  );
}
