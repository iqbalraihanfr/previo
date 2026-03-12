"use client";

import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RequirementValidationHeaderProps {
  frCount: number;
  nfrCount: number;
  hasMust: boolean;
}

export function RequirementValidationHeader({
  frCount,
  nfrCount,
  hasMust,
}: RequirementValidationHeaderProps) {
  const validations = [
    {
      label: `Functional Scale (${frCount}/3)`,
      passed: frCount >= 3,
      hint: "Need at least 3 FRs for adequate functional coverage.",
    },
    {
      label: `Non-Functional Coverage (${nfrCount}/1)`,
      passed: nfrCount >= 1,
      hint: "Quality of service (NFR) is mandatory for architectural integrity.",
    },
    {
      label: "Mission Criticality",
      passed: hasMust,
      hint: "At least one requirement must be marked as 'Must Have'.",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {validations.map((v, i) => (
        <div
          key={i}
          className={cn(
            "p-5 rounded-[2rem] border transition-all flex flex-col gap-2",
            v.passed
              ? "bg-emerald-500/5 border-emerald-500/10"
              : "bg-amber-500/5 border-amber-500/10"
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn(
              "text-[10px] font-black uppercase tracking-widest",
              v.passed ? "text-emerald-600/60" : "text-amber-600/60"
            )}>
              {v.label}
            </span>
            {v.passed ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
          </div>
          <p className={cn(
            "text-[10px] font-medium leading-relaxed",
            v.passed ? "text-emerald-700/40" : "text-amber-700/60"
          )}>
            {v.hint}
          </p>
        </div>
      ))}
    </div>
  );
}
