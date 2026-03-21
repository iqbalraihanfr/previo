"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Info,
  Search,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { NodeContent, NodeData, ValidationWarning } from "@/lib/db";
import { buildProjectReadinessModel, type ReadinessIssue } from "@/lib/readiness";

type ValidationSummaryPanelProps = {
  nodes: NodeData[];
  contents: NodeContent[];
  warnings: ValidationWarning[];
  onCloseAction: () => void;
  onNodeNavigateAction: (nodeId: string) => void;
};

function SeveritySummaryCard({
  label,
  count,
  tone,
  icon,
}: {
  label: string;
  count: number;
  tone: "error" | "warning" | "info" | "success";
  icon: React.ReactNode;
}) {
  const toneClass =
    tone === "error"
      ? "border-destructive/20 bg-destructive/10 text-destructive"
      : tone === "warning"
        ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
        : tone === "info"
          ? "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400"
          : "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400";

  return (
    <div className={`rounded-2xl border px-3 py-3 ${toneClass}`}>
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-background/75">
          {icon}
        </div>
        <div>
          <p className="text-readable-xs uppercase tracking-[0.16em] opacity-80">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold leading-none">{count}</p>
        </div>
      </div>
    </div>
  );
}

function IssueCard({
  issue,
  onNodeNavigateAction,
}: {
  issue: ReadinessIssue;
  onNodeNavigateAction: (nodeId: string) => void;
}) {
  const toneClass =
    issue.category === "blocking"
      ? "border-destructive/20 bg-destructive/10 text-destructive"
      : issue.category === "coverage_gap"
        ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
        : "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400";

  const categoryLabel =
    issue.category === "blocking"
      ? "Blocking"
      : issue.category === "coverage_gap"
        ? "Coverage Gap"
        : "Quality Warning";

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClass}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background/75">
          {issue.category === "blocking" ? (
            <AlertCircle className="h-4 w-4" />
          ) : issue.category === "coverage_gap" ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <Info className="h-4 w-4" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{issue.title}</p>
            <span className="rounded-full border border-border/70 bg-background/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {categoryLabel}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 opacity-90">{issue.message}</p>
          <div className="mt-4 flex items-center justify-end">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => onNodeNavigateAction(issue.sourceNodeId)}
              data-testid={`validation-open-node-${issue.sourceNodeId}`}
            >
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              Open source node
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ValidationSummaryPanel({
  nodes,
  contents,
  warnings,
  onCloseAction,
  onNodeNavigateAction,
}: ValidationSummaryPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const readiness = useMemo(
    () => buildProjectReadinessModel({ nodes, contents, warnings }),
    [contents, nodes, warnings],
  );

  const filteredIssues = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const allIssues = [
      ...readiness.blockers,
      ...readiness.coverageGaps,
      ...readiness.qualityWarnings,
    ];

    return allIssues.filter((issue) => {
      if (normalizedQuery.length === 0) return true;
      return (
        issue.title.toLowerCase().includes(normalizedQuery) ||
        issue.message.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [readiness.blockers, readiness.coverageGaps, readiness.qualityWarnings, searchQuery]);

  const sections = [
    {
      id: "blocking",
      title: "Blocking",
      items: filteredIssues.filter((issue) => issue.category === "blocking"),
      toneClass: "text-destructive",
    },
    {
      id: "coverage",
      title: "Coverage gap",
      items: filteredIssues.filter((issue) => issue.category === "coverage_gap"),
      toneClass: "text-yellow-700 dark:text-yellow-400",
    },
    {
      id: "quality",
      title: "Quality warning",
      items: filteredIssues.filter((issue) => issue.category === "quality_warning"),
      toneClass: "text-blue-700 dark:text-blue-400",
    },
  ].filter((section) => section.items.length > 0);

  return (
    <aside
      className="workspace-drawer workspace-scroll flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-border/70"
      data-testid="validation-summary-panel"
    >
      <div className="border-b border-border/70 px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Readiness Summary
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  {readiness.statusLabel}. Fix blockers first, then coverage gaps.
                </p>
              </div>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search blockers or coverage gaps"
                className="h-10 rounded-full pl-9"
                data-testid="validation-search"
              />
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={onCloseAction}
            aria-label="Close validation panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <SeveritySummaryCard
            label="Blocking"
            count={readiness.blockers.length}
            tone="error"
            icon={<AlertCircle className="h-4 w-4" />}
          />
          <SeveritySummaryCard
            label="Coverage gap"
            count={readiness.coverageGaps.length}
            tone="warning"
            icon={<AlertTriangle className="h-4 w-4" />}
          />
          <SeveritySummaryCard
            label="Quality"
            count={readiness.qualityWarnings.length}
            tone="info"
            icon={<Info className="h-4 w-4" />}
          />
          <SeveritySummaryCard
            label="Warnings"
            count={warnings.length}
            tone="success"
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
        </div>
      </div>

      <div className="workspace-scroll flex-1 overflow-y-auto px-4 py-5 sm:px-5">
        {sections.length === 0 ? (
          <div className="rounded-2xl border border-green-500/15 bg-green-500/5 px-4 py-5 text-sm text-green-700 dark:text-green-400">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              No readiness issues found.
            </div>
            <p className="mt-2 text-sm leading-6 opacity-80">
              The project is ready for the next level of implementation review.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sections.map((section) => (
              <section key={section.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-semibold ${section.toneClass}`}>
                    {section.title}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {section.items.length} item(s)
                  </span>
                </div>

                <div className="space-y-3">
                  {section.items.map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      onNodeNavigateAction={onNodeNavigateAction}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
