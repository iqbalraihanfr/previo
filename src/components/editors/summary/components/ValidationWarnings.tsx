"use client";

import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import type { ValidationWarning } from "@/lib/db";

interface ValidationWarningsProps {
  errors: ValidationWarning[];
  warnings: ValidationWarning[];
  infos: ValidationWarning[];
}

export function ValidationWarnings({ errors, warnings, infos }: ValidationWarningsProps) {
  const total = errors.length + warnings.length + infos.length;
  if (total === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/70">
          Validation Intelligence
        </h3>
        <div className="h-px flex-1 bg-border/40" />
      </div>

      <div className="space-y-3">
        {errors.map((w) => (
          <WarningItem
            key={w.id}
            icon={<AlertCircle className="h-4 w-4" />}
            message={w.message}
            color="text-destructive border-destructive/20 bg-destructive/5"
          />
        ))}

        {warnings.map((w) => (
          <WarningItem
            key={w.id}
            icon={<AlertTriangle className="h-4 w-4" />}
            message={w.message}
            color="text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/5"
          />
        ))}

        {infos.map((w) => (
          <WarningItem
            key={w.id}
            icon={<Info className="h-4 w-4" />}
            message={w.message}
            color="text-blue-600 dark:text-blue-400 border-blue-500/20 bg-blue-500/5"
          />
        ))}
      </div>
    </div>
  );
}

function WarningItem({
  icon,
  message,
  color,
}: {
  icon: React.ReactNode;
  message: string;
  color: string;
}) {
  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-4 backdrop-blur-sm ${color}`}>
      <span className="mt-0.5 shrink-0 opacity-80">{icon}</span>
      <p className="text-xs font-medium leading-relaxed tracking-tight">{message}</p>
    </div>
  );
}
