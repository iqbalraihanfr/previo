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
import type { WorkspaceNavigationIntent } from "@/features/workspace/navigationIntent";

type ValidationSummaryPanelProps = {
  nodes: NodeData[];
  contents: NodeContent[];
  warnings: ValidationWarning[];
  onCloseAction: () => void;
  onNodeNavigateAction: (intent: WorkspaceNavigationIntent) => void;
};

function IssueRow({
  issue,
  onNodeNavigateAction,
}: {
  issue: ReadinessIssue;
  onNodeNavigateAction: (intent: WorkspaceNavigationIntent) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const { icon, labelColor } =
    issue.category === "blocking"
      ? { icon: <AlertCircle className="h-3.5 w-3.5 text-destructive" />, labelColor: "text-destructive" }
      : issue.category === "coverage_gap"
        ? { icon: <AlertTriangle className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />, labelColor: "text-yellow-700 dark:text-yellow-400" }
        : { icon: <Info className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />, labelColor: "text-blue-700 dark:text-blue-400" };

  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        type="button"
        className="flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-muted/40"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="mt-0.5 shrink-0">{icon}</span>
        <span className={`flex-1 text-sm font-medium leading-snug ${labelColor}`}>
          {issue.title}
        </span>
        <span className="mt-0.5 shrink-0 text-xs text-muted-foreground">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-3 pl-9">
          <p className="text-sm leading-6 text-muted-foreground">{issue.message}</p>
          {issue.resolutionHint && (
            <p className="mt-1 text-xs leading-5 text-muted-foreground/70">{issue.resolutionHint}</p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="mt-2 h-7 rounded-full text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onNodeNavigateAction({
                nodeId: issue.sourceNodeId,
                label: issue.itemLabel ?? issue.title,
                sectionId: issue.sectionId,
                itemLabel: issue.itemLabel,
                reason: issue.resolutionHint ?? issue.message,
              });
            }}
            data-testid={`validation-open-node-${issue.sourceNodeId}`}
          >
            <ExternalLink className="mr-1.5 h-3 w-3" />
            Open node
          </Button>
        </div>
      )}
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
    const q = searchQuery.trim().toLowerCase();
    const all = [
      ...readiness.blockers,
      ...readiness.coverageGaps,
      ...readiness.qualityWarnings,
    ];
    if (!q) return all;
    return all.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.message.toLowerCase().includes(q),
    );
  }, [readiness.blockers, readiness.coverageGaps, readiness.qualityWarnings, searchQuery]);

  const totalIssues =
    readiness.blockers.length +
    readiness.coverageGaps.length +
    readiness.qualityWarnings.length;

  return (
    <aside
      className="workspace-drawer workspace-scroll flex h-full flex-col overflow-hidden rounded-2xl border border-border/70"
      data-testid="validation-summary-panel"
    >
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-border/60 px-4">
        <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
        <span className="flex-1 text-sm font-semibold text-foreground">
          Validation
        </span>
        {/* Summary pills */}
        <div className="flex items-center gap-1.5 text-xs">
          {readiness.blockers.length > 0 && (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 font-medium text-destructive">
              {readiness.blockers.length} blocking
            </span>
          )}
          {readiness.coverageGaps.length > 0 && (
            <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 font-medium text-yellow-700 dark:text-yellow-400">
              {readiness.coverageGaps.length} gap
            </span>
          )}
          {totalIssues === 0 && (
            <span className="rounded-full bg-green-500/10 px-2 py-0.5 font-medium text-green-700 dark:text-green-400">
              All clear
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 rounded-md text-muted-foreground/60 hover:bg-muted"
          onClick={onCloseAction}
          aria-label="Close validation panel"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Status line */}
      <div className="shrink-0 border-b border-border/50 px-4 py-2.5">
        <p className="text-xs text-muted-foreground">
          {readiness.statusLabel}. {readiness.statusSummary}
        </p>
        {readiness.nextActions.length > 0 && (
          <p className="mt-0.5 text-xs font-medium text-foreground/80">
            → {readiness.nextActions[0]}
          </p>
        )}
      </div>

      {/* Search */}
      <div className="shrink-0 border-b border-border/50 px-3 py-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search issues…"
            className="h-8 rounded-lg pl-8 text-xs"
            data-testid="validation-search"
          />
        </div>
      </div>

      {/* Issue list */}
      <div className="flex-1 overflow-y-auto">
        {filteredIssues.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            {searchQuery ? "No issues match your search." : "No readiness issues found."}
          </div>
        ) : (
          <div>
            {filteredIssues.map((issue) => (
              <IssueRow
                key={issue.id}
                issue={issue}
                onNodeNavigateAction={onNodeNavigateAction}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
