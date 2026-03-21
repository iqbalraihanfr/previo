"use client";

import { AlertTriangle, ShieldCheck } from "lucide-react";

interface SummaryStatusAlertProps {
  isReady: boolean;
  incompleteNodeCount: number;
  errorCount: number;
  allNodesDone: boolean;
}

export function SummaryStatusAlert({
  isReady,
  incompleteNodeCount,
  errorCount,
  allNodesDone,
}: SummaryStatusAlertProps) {
  return (
    <div
      className={`flex items-start gap-4 rounded-3xl border p-6 transition-all shadow-sm backdrop-blur-md ${
        isReady
          ? "border-primary/20 bg-primary/5 text-primary"
          : "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400"
      }`}
    >
      <div className={`mt-1 h-10 w-10 flex items-center justify-center rounded-2xl ${
        isReady ? "bg-primary/10" : "bg-amber-500/20"
      }`}>
        {isReady ? (
          <ShieldCheck className="h-6 w-6" />
        ) : (
          <AlertTriangle className="h-6 w-6" />
        )}
      </div>

      <div className="flex-1 space-y-1">
        <h4 className="text-base font-bold tracking-tight">
          {isReady ? "Architecture Ready" : "Documentation Incomplete"}
        </h4>

        <div className="text-sm leading-relaxed opacity-80 font-medium">
          {!allNodesDone && (
            <p className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-current opacity-40 shrink-0" />
              {incompleteNodeCount} specification node(s) require completion.
            </p>
          )}
          {errorCount > 0 && (
            <p className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-current opacity-40 shrink-0" />
              {errorCount} critical validation error(s) must be resolved.
            </p>
          )}
          {isReady && (
            <p>The workspace is complete enough for implementation planning, export, and downstream handoff.</p>
          )}
        </div>
      </div>
    </div>
  );
}
