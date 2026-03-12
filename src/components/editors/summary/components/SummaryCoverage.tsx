"use client";

interface CoverageMetric {
  label: string;
  covered: number;
  total: number;
  description?: string;
}

export function SummaryCoverage({ metrics }: { metrics: CoverageMetric[] }) {
  if (metrics.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/70">
          Requirements Coverage
        </h3>
        <div className="h-px flex-1 bg-border/40" />
      </div>

      <div className="grid gap-6">
        {metrics.map((metric, index) => {
          const percentage =
            metric.total > 0
              ? Math.round((metric.covered / metric.total) * 100)
              : 0;

          return (
            <div key={`${metric.label}-${index}`} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground">
                    {metric.label}
                  </span>
                  {metric.description && (
                    <span className="text-[10px] text-muted-foreground leading-relaxed">
                      {metric.description}
                    </span>
                  )}
                </div>
                <span className="font-mono text-xs font-bold text-primary">
                  {metric.covered}/{metric.total}
                </span>
              </div>

              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted/40 shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${
                    percentage === 100
                      ? "bg-primary"
                      : percentage >= 50
                        ? "bg-primary/70"
                        : "bg-destructive/70"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
