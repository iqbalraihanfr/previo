"use client";

import { useMemo } from "react";
import {
  ArrowRight,
  Clock3,
  GitBranch,
  Link2,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { NodeContent, NodeData, Project, SourceArtifact } from "@/lib/db";
import { buildWorkspaceTraceabilityModel } from "@/features/workspace/traceability";
import type { WorkspaceNavigationIntent } from "@/features/workspace/navigationIntent";

type WorkspaceTraceabilityPanelProps = {
  project: Project;
  nodes: NodeData[];
  contents: NodeContent[];
  sourceArtifacts: SourceArtifact[];
  onCloseAction: () => void;
  onNodeNavigateAction: (intent: WorkspaceNavigationIntent) => void;
};

function formatTimestamp(value: string | null) {
  if (!value) return "not available";

  const date = new Date(value);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function WorkspaceTraceabilityPanel({
  project,
  nodes,
  contents,
  sourceArtifacts,
  onCloseAction,
  onNodeNavigateAction,
}: WorkspaceTraceabilityPanelProps) {
  const model = useMemo(
    () => buildWorkspaceTraceabilityModel({ nodes, contents, sourceArtifacts }),
    [contents, nodes, sourceArtifacts],
  );

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden bg-card/40 shadow-[-20px_0_40px_-20px_rgba(0,0,0,0.15)] backdrop-blur-md"
      data-testid="workspace-traceability-panel"
    >
      <div className="shrink-0 border-b border-border/70 bg-card/10 px-8 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full px-3 py-1 text-readable-2xs font-bold uppercase tracking-widest">
                Read only
              </Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                Structured traceability
              </Badge>
            </div>

            <div>
              <h2 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground">
                <GitBranch className="h-6 w-6 text-primary" />
                Traceability panel
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Read-only links derived from structured fields and provenance
                records. No canvas edges are edited here.
              </p>
            </div>

            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {project.name}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onCloseAction}
            className="h-10 w-10 shrink-0 rounded-full hover:bg-destructive/10 hover:text-destructive"
            aria-label="Close traceability panel"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-border/60 bg-background/75 px-4 py-3">
            <p className="text-readable-xs uppercase tracking-[0.16em] text-muted-foreground">
              Linked rows
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {model.linkedRowCount}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/75 px-4 py-3">
            <p className="text-readable-xs uppercase tracking-[0.16em] text-muted-foreground">
              Provenance cards
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {model.artifactCount}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/75 px-4 py-3">
            <p className="text-readable-xs uppercase tracking-[0.16em] text-muted-foreground">
              Imported
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {model.summary.imported}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/75 px-4 py-3">
            <p className="text-readable-xs uppercase tracking-[0.16em] text-muted-foreground">
              Overrides
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {model.summary.overridden}
            </p>
          </div>
        </div>
      </div>

      <div className="workspace-scroll flex-1 overflow-y-auto px-8 py-6">
        <div className="space-y-5">
          {model.sections.map((section) => (
            <section
              key={section.id}
              className="rounded-3xl border border-border/70 bg-background/50 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-readable-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {section.title}
                  </p>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    {section.description}
                  </p>
                </div>
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  {section.rows.filter((row) => row.targetLabels.length > 0).length}/
                  {section.rows.length} linked
                </Badge>
              </div>

              <div className="mt-4 space-y-3">
                {section.rows.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 px-4 py-5 text-sm text-muted-foreground">
                    No source content yet for this relationship.
                  </div>
                ) : (
                  section.rows.map((row) => (
                    <div
                      key={`${section.id}:${row.sourceLabel}`}
                      className="rounded-2xl border border-border/60 bg-background/80 px-4 py-4"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="rounded-full px-3 py-1 text-xs">
                              {row.sourceLabel}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.14em]"
                            >
                              {row.status}
                            </Badge>
                            <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                              {row.relationLabel}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {row.evidenceLabel}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {row.targetLabels.length > 0 ? (
                            row.targetLabels.map((targetLabel) => (
                              <Badge
                                key={targetLabel}
                                variant="outline"
                                className="rounded-full px-3 py-1"
                              >
                                <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
                                {targetLabel}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {row.status === "unresolved" ? "Unresolved" : "Unlinked"}
                            </span>
                          )}

                          {row.navigationTarget.nodeId && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full"
                              onClick={() => onNodeNavigateAction(row.navigationTarget)}
                              data-testid={`traceability-open-${row.navigationTarget.nodeId}`}
                            >
                              Open {row.navigationTarget.label}
                            </Button>
                          )}
                        </div>
                      </div>
                      {row.navigationTarget.reason && (
                        <p className="mt-3 text-xs leading-5 text-muted-foreground">
                          {row.navigationTarget.reason}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          ))}

          <section className="rounded-3xl border border-border/70 bg-background/50 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-readable-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Provenance surface
                </p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  The workspace only exposes structured provenance here: source
                  type, parser version, sync state, and override state.
                </p>
              </div>
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                {model.artifactCards.length} visible
              </Badge>
            </div>

            <div className="mt-4 space-y-3">
              {model.artifactCards.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 px-4 py-5 text-sm text-muted-foreground">
                  No imported artifacts or provenance records are visible yet.
                </div>
              ) : (
                model.artifactCards.map((card) => (
                  <div
                    key={card.id}
                    className="rounded-2xl border border-border/60 bg-background/80 px-4 py-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="rounded-full px-3 py-1 text-xs">
                            {card.nodeLabel}
                          </Badge>
                          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                            {card.nodeType}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          {card.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {card.sourceTypeLabel} • Parser {card.parserVersion}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                          {card.generationLabel}
                        </Badge>
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                          <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                          {card.overrideLabel}
                        </Badge>
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                          <Clock3 className="mr-1.5 h-3.5 w-3.5" />
                          {formatTimestamp(card.syncedAt)}
                        </Badge>
                      </div>
                    </div>

                    <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <Link2 className="h-3.5 w-3.5" />
                      {card.hasArtifactRecord
                        ? "Backed by a sourceArtifacts record"
                        : "Backed by node provenance only"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
