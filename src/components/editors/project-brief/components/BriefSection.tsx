"use client";

import { cn } from "@/lib/utils";

interface BriefSectionProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function BriefSection({ children, className, title }: BriefSectionProps) {
  return (
    <section className={cn("space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700", className)}>
      {title && (
        <div className="flex items-center gap-4 px-2">
          <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 whitespace-nowrap">
            {title}
          </h3>
          <div className="h-px w-full bg-gradient-to-r from-border/60 to-transparent" />
        </div>
      )}
      <div className="space-y-8 px-2">
        {children}
      </div>
    </section>
  );
}
