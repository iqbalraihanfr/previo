"use client";

import { FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type NodeData } from "@/lib/db";
import { DELIVERY_MODE_LABELS } from "@/lib/sourceArtifacts";

import { NodeSummarySection } from "./summary/renderers";
import { useSummary } from "./summary/hooks/useSummary";
import { SummaryStatusAlert } from "./summary/components/SummaryStatusAlert";
import { SummaryStats } from "./summary/components/SummaryStats";
import { SummaryCoverage } from "./summary/components/SummaryCoverage";
import { TaskBreakdown } from "./summary/components/TaskBreakdown";
import { APIEndpoints } from "./summary/components/APIEndpoints";
import { ValidationWarnings } from "./summary/components/ValidationWarnings";
import { SummaryFraming } from "./summary/components/SummaryFraming";

type SummaryNodeEditorProps = {
  node: NodeData;
  onCloseAction: () => void;
};

export function SummaryNodeEditor({
  node,
  onCloseAction,
}: SummaryNodeEditorProps) {
  const {
    snapshot,
    isLoading,
    errorWarnings,
    warnWarnings,
    infoWarnings,
    tasksByPriority,
    tasksByStatus,
    coverage,
    apiEndpoints,
    deliveryMode,
    deliveryPlan,
    sprintProposal,
    provenanceSummary,
    framing,
    nonSummaryNodes,
    allNodesDone,
    isProjectReady,
    incompleteNodeCount,
  } = useSummary(node.project_id);

  return (
    <div
      className="flex h-full w-full flex-col bg-card/40 backdrop-blur-md shadow-[-20px_0_40px_-20px_rgba(0,0,0,0.15)] overflow-hidden"
      data-testid="summary-editor"
    >
      <div className="flex items-start justify-between border-b border-border/70 px-8 py-6 bg-card/10 shrink-0">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-readable-2xs font-bold uppercase tracking-widest text-primary">
              Management
            </span>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-readable-2xs font-bold uppercase tracking-widest text-accent-foreground/70">
              System Review
            </span>
            <span className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-readable-2xs font-bold uppercase tracking-widest text-muted-foreground">
              Read-only
            </span>
          </div>

          <div>
            <h2 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground">
              <FileText className="h-6 w-6 text-primary" />
              Project Intel
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground max-w-sm">
              Comprehensive overview of architectural integrity and implementation readiness.
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onCloseAction}
          className="rounded-full h-10 w-10 hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="workspace-scroll flex-1 overflow-y-auto px-8 py-10 bg-card/5">
        <div className="max-w-4xl mx-auto space-y-12">
          {isLoading ? (
            <div className="flex h-[400px] items-center justify-center text-sm font-bold tracking-widest text-muted-foreground animate-pulse uppercase">
              Analyzing Workspace Archetype...
            </div>
          ) : snapshot.displayNodes.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/80 bg-background/40 px-6 py-16 text-center shadow-inner">
              <h3 className="text-lg font-bold text-foreground/80">Blueprint Empty</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-xs mx-auto">
                No specifications found. Populate your project nodes to generate a system summary.
              </p>
            </div>
          ) : (
            <>
              <SummaryStatusAlert
                isReady={isProjectReady}
                incompleteNodeCount={incompleteNodeCount}
                errorCount={errorWarnings.length}
                allNodesDone={allNodesDone}
              />

              <SummaryFraming
                executiveSnapshot={framing.executiveSnapshot}
                readinessGaps={framing.readinessGaps}
                recommendedNextActions={framing.recommendedNextActions}
                traceabilityHighlights={framing.traceabilityHighlights}
              />

              <SummaryStats
                nodesDone={nonSummaryNodes.filter((pn) => pn.status === "Done").length}
                totalNodes={nonSummaryNodes.length}
                totalTasks={snapshot.tasks.length}
                tasksDone={tasksByStatus.done}
                warningCount={snapshot.warnings.length}
              />

              <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
                <SummaryCoverage metrics={coverage} />
                <TaskBreakdown priority={tasksByPriority} status={tasksByStatus} />
              </div>

              <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
                <div
                  className="rounded-3xl border border-border/70 bg-background/50 p-6"
                  data-testid="summary-delivery-framing"
                >
                  <p className="text-readable-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Delivery framing
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-foreground">
                    {DELIVERY_MODE_LABELS[deliveryMode]}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    The canonical task model stays fixed. Previo only changes how the work is grouped and sequenced for this delivery mode.
                  </p>
                  <div className="mt-4 space-y-3">
                    {deliveryPlan.slice(0, 4).map((group) => (
                      <div
                        key={group.id}
                        className="rounded-2xl border border-border/60 bg-background/80 px-4 py-3"
                      >
                        <p className="text-sm font-semibold text-foreground">
                          {group.title}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {group.tasks.length} task(s)
                        </p>
                      </div>
                    ))}
                  </div>
                  {deliveryMode === "agile" && sprintProposal.length > 0 && (
                    <p className="mt-4 text-xs text-muted-foreground">
                      Suggested sprint slices available: {sprintProposal.length}
                    </p>
                  )}
                </div>

                <div
                  className="rounded-3xl border border-border/70 bg-background/50 p-6"
                  data-testid="summary-provenance"
                >
                  <p className="text-readable-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Provenance
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div
                      className="rounded-2xl border border-border/60 bg-background/80 px-4 py-3"
                      data-testid="summary-provenance-imported"
                    >
                      <p className="text-xs text-muted-foreground">Imported nodes</p>
                      <p className="mt-1 text-xl font-semibold text-foreground">
                        {provenanceSummary.imported}
                      </p>
                    </div>
                    <div
                      className="rounded-2xl border border-border/60 bg-background/80 px-4 py-3"
                      data-testid="summary-provenance-generated"
                    >
                      <p className="text-xs text-muted-foreground">Generated nodes</p>
                      <p className="mt-1 text-xl font-semibold text-foreground">
                        {provenanceSummary.generated}
                      </p>
                    </div>
                    <div
                      className="rounded-2xl border border-border/60 bg-background/80 px-4 py-3"
                      data-testid="summary-provenance-manual"
                    >
                      <p className="text-xs text-muted-foreground">Manual structured</p>
                      <p className="mt-1 text-xl font-semibold text-foreground">
                        {provenanceSummary.manual}
                      </p>
                    </div>
                    <div
                      className="rounded-2xl border border-border/60 bg-background/80 px-4 py-3"
                      data-testid="summary-provenance-overridden"
                    >
                      <p className="text-xs text-muted-foreground">Manual overrides</p>
                      <p className="mt-1 text-xl font-semibold text-foreground">
                        {provenanceSummary.overridden}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
                <APIEndpoints endpoints={apiEndpoints} />
                <ValidationWarnings
                  errors={errorWarnings}
                  warnings={warnWarnings}
                  infos={infoWarnings}
                />
              </div>

              <div className="pt-8">
                <div className="flex items-center gap-4 mb-8">
                  <h3 className="text-xl font-bold tracking-tight text-foreground whitespace-nowrap">
                    Architectural Records
                  </h3>
                  <div className="h-px w-full bg-border/40" />
                </div>

                <div className="space-y-12">
                  {snapshot.displayNodes.map((displayNode) => {
                    const content = snapshot.contents[displayNode.id];
                    if (!content) return null;
                    return (
                      <NodeSummarySection
                        key={displayNode.id}
                        node={displayNode}
                        content={content}
                      />
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
