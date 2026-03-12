"use client";

import { Globe } from "lucide-react";

const HTTP_METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  POST: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  PUT: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  PATCH: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  DELETE: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
};

export function APIEndpoints({ endpoints }: { endpoints: string[] }) {
  if (endpoints.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/70">
          API Interfaces ({endpoints.length})
        </h3>
        <div className="h-px flex-1 bg-border/40" />
      </div>

      <div className="grid gap-2">
        {endpoints.map((endpoint, index) => {
          const parts = endpoint.match(/^(GET|POST|PUT|PATCH|DELETE)\s+(.+)/i);
          const method = parts ? parts[1].toUpperCase() : "API";
          const path = parts ? parts[2] : endpoint;

          return (
            <div
              key={`${endpoint}-${index}`}
              className="group flex items-center gap-3 rounded-xl border border-border/40 bg-background/30 p-2.5 transition-all hover:bg-card/50 hover:shadow-sm"
            >
              <span
                className={`flex h-6 w-14 items-center justify-center rounded-lg border text-[10px] font-black uppercase tracking-wider ${
                  HTTP_METHOD_COLORS[method] || "bg-muted text-muted-foreground border-border/60"
                }`}
              >
                {method}
              </span>
              <span className="font-mono text-[11px] font-medium tracking-tight text-foreground/80 group-hover:text-foreground">
                {path}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
