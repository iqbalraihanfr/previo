"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Globe,
  Info,
  Layers,
  ListTodo,
  ShieldCheck,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { db, type NodeData } from "@/lib/db";

import type { ProjectSnapshot } from "./summary/types";
import { computeCoverage, extractAPIEndpoints, getNodeContentMap } from "./summary/helpers";
import { NodeSummarySection } from "./summary/renderers";

type SummaryNodeEditorProps = {
  node: NodeData;
  onCloseAction: () => void;
};

const HTTP_METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-500/10 text-green-700 dark:text-green-400",
  POST: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  PUT: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  PATCH: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  DELETE: "bg-red-500/10 text-red-700 dark:text-red-400",
};

async function loadProjectSnapshot(
  projectId: string,
): Promise<ProjectSnapshot> {
  const [projectNodes, allContents, tasks, warnings] = await Promise.all([
    db.nodes.where({ project_id: projectId }).toArray(),
    db.nodeContents.toArray(),
    db.tasks.where({ project_id: projectId }).toArray(),
    db.validationWarnings.where({ project_id: projectId }).toArray(),
  ]);

  const displayNodes = projectNodes
    .filter(
      (projectNode) =>
        projectNode.type !== "summary" &&
        projectNode.type !== "task_board" &&
        projectNode.status !== "Empty",
    )
    .sort((left, right) => left.sort_order - right.sort_order);

  const contents = getNodeContentMap(projectNodes, allContents);

  return {
    allProjectNodes: projectNodes,
    displayNodes,
    contents,
    tasks,
    warnings,
  };
}

export function SummaryNodeEditor({
  node,
  onCloseAction,
}: SummaryNodeEditorProps) {
  const [snapshot, setSnapshot] = useState<ProjectSnapshot>({
    allProjectNodes: [],
    displayNodes: [],
    contents: {},
    tasks: [],
    warnings: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function run() {
      setIsLoading(true);

      const nextSnapshot = await loadProjectSnapshot(node.project_id);

      if (!isCancelled) {
        setSnapshot(nextSnapshot);
        setIsLoading(false);
      }
    }

    void run();

    return () => {
      isCancelled = true;
    };
  }, [node.project_id]);

  const nonSummaryNodes = useMemo(
    () =>
      snapshot.allProjectNodes.filter(
        (projectNode) => projectNode.type !== "summary",
      ),
    [snapshot.allProjectNodes],
  );

  const allNodesDone = useMemo(
    () =>
      nonSummaryNodes.length > 0 &&
      nonSummaryNodes.every((projectNode) => projectNode.status === "Done"),
    [nonSummaryNodes],
  );

  const errorWarnings = useMemo(
    () => snapshot.warnings.filter((warning) => warning.severity === "error"),
    [snapshot.warnings],
  );
  const warnWarnings = useMemo(
    () => snapshot.warnings.filter((warning) => warning.severity === "warning"),
    [snapshot.warnings],
  );
  const infoWarnings = useMemo(
    () => snapshot.warnings.filter((warning) => warning.severity === "info"),
    [snapshot.warnings],
  );

  const isProjectDone = allNodesDone && errorWarnings.length === 0;

  const coverage = useMemo(
    () => computeCoverage(snapshot.allProjectNodes, snapshot.contents),
    [snapshot.allProjectNodes, snapshot.contents],
  );

  const apiEndpoints = useMemo(
    () => extractAPIEndpoints(snapshot.contents, snapshot.allProjectNodes),
    [snapshot.contents, snapshot.allProjectNodes],
  );

  const tasksByPriority = useMemo(
    () => ({
      must: snapshot.tasks.filter(
        (task) => task.priority?.toLowerCase() === "must",
      ).length,
      should: snapshot.tasks.filter(
        (task) => task.priority?.toLowerCase() === "should",
      ).length,
      could: snapshot.tasks.filter(
        (task) => task.priority?.toLowerCase() === "could",
      ).length,
    }),
    [snapshot.tasks],
  );

  const tasksByStatus = useMemo(
    () => ({
      todo: snapshot.tasks.filter((task) => task.status === "todo").length,
      in_progress: snapshot.tasks.filter(
        (task) => task.status === "in_progress",
      ).length,
      done: snapshot.tasks.filter((task) => task.status === "done").length,
    }),
    [snapshot.tasks],
  );

  const incompleteNodeCount = nonSummaryNodes.filter(
    (projectNode) => projectNode.status !== "Done",
  ).length;

  return (
    <div className="relative z-20 flex h-full w-175 shrink-0 flex-col border-l bg-card shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.1)] transition-all">
      <div className="flex items-center justify-between border-b bg-muted/30 p-4 shrink-0">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <FileText className="h-5 w-5 text-primary" />
            Project Summary
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Auto-compiled from your architecture workspace.
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onCloseAction}
          className="rounded-full hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto bg-muted/10 p-6">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Loading summary...
          </div>
        ) : snapshot.displayNodes.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed p-8 text-center text-muted-foreground">
            No completed or in-progress nodes found. Start filling out your
            project nodes to see the summary.
          </div>
        ) : (
          <>
            <div
              className={`flex items-center gap-3 rounded-lg border p-4 ${
                isProjectDone
                  ? "border-green-500/20 bg-green-500/10"
                  : "border-amber-500/20 bg-amber-500/10"
              }`}
            >
              {isProjectDone ? (
                <ShieldCheck className="h-6 w-6 shrink-0 text-green-600" />
              ) : (
                <AlertTriangle className="h-6 w-6 shrink-0 text-amber-600" />
              )}

              <div>
                <p
                  className={`text-sm font-semibold ${
                    isProjectDone
                      ? "text-green-700 dark:text-green-400"
                      : "text-amber-700 dark:text-amber-400"
                  }`}
                >
                  {isProjectDone ? "Project Ready" : "Project Not Ready"}
                </p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  {!allNodesDone &&
                    `${incompleteNodeCount} node(s) not marked Done. `}
                  {errorWarnings.length > 0 &&
                    `${errorWarnings.length} error(s) need fixing. `}
                  {isProjectDone &&
                    "All nodes completed with no errors. Ready to export and start building."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="flex flex-col items-center justify-center rounded-lg border bg-background p-4 text-center shadow-sm">
                <div className="mb-2 rounded-full bg-primary/10 p-2 text-primary">
                  <Layers className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold">
                  {
                    nonSummaryNodes.filter(
                      (projectNode) => projectNode.status === "Done",
                    ).length
                  }
                  /{nonSummaryNodes.length}
                </div>
                <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                  Nodes Done
                </div>
              </div>

              <div className="flex flex-col items-center justify-center rounded-lg border bg-background p-4 text-center shadow-sm">
                <div className="mb-2 rounded-full bg-blue-500/10 p-2 text-blue-500">
                  <ListTodo className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold">
                  {snapshot.tasks.length}
                </div>
                <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                  Tasks
                </div>
              </div>

              <div className="flex flex-col items-center justify-center rounded-lg border bg-background p-4 text-center shadow-sm">
                <div className="mb-2 rounded-full bg-green-500/10 p-2 text-green-500">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold">
                  {tasksByStatus.done}/{snapshot.tasks.length}
                </div>
                <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                  Tasks Done
                </div>
              </div>

              <div className="flex flex-col items-center justify-center rounded-lg border bg-background p-4 text-center shadow-sm">
                <div
                  className={`mb-2 rounded-full p-2 ${
                    snapshot.warnings.length > 0
                      ? "bg-amber-500/10 text-amber-500"
                      : "bg-green-500/10 text-green-500"
                  }`}
                >
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold">
                  {snapshot.warnings.length}
                </div>
                <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                  Warnings
                </div>
              </div>
            </div>

            {coverage.length > 0 && (
              <div className="space-y-3">
                <h3 className="border-b pb-2 text-sm font-semibold">
                  Requirements Coverage
                </h3>

                <div className="space-y-3">
                  {coverage.map((metric, index) => {
                    const percentage =
                      metric.total > 0
                        ? Math.round((metric.covered / metric.total) * 100)
                        : 0;

                    return (
                      <div
                        key={`${metric.label}-${index}`}
                        className="space-y-1"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-50 shrink-0 text-xs text-muted-foreground">
                            {metric.label}
                          </span>

                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full transition-all ${
                                percentage === 100
                                  ? "bg-green-500"
                                  : percentage >= 50
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>

                          <span className="w-15 text-right font-mono text-xs">
                            {metric.covered}/{metric.total}
                          </span>
                        </div>

                        {metric.description && (
                          <p className="pl-53 text-[11px] text-muted-foreground">
                            {metric.description} ({percentage}%)
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="border-b pb-2 text-sm font-semibold">
                Task Summary
              </h3>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded border bg-background p-3">
                  <div className="text-lg font-bold text-red-600">
                    {tasksByPriority.must}
                  </div>
                  <div className="text-[10px] uppercase text-muted-foreground">
                    Must
                  </div>
                </div>
                <div className="rounded border bg-background p-3">
                  <div className="text-lg font-bold text-amber-600">
                    {tasksByPriority.should}
                  </div>
                  <div className="text-[10px] uppercase text-muted-foreground">
                    Should
                  </div>
                </div>
                <div className="rounded border bg-background p-3">
                  <div className="text-lg font-bold text-blue-600">
                    {tasksByPriority.could}
                  </div>
                  <div className="text-[10px] uppercase text-muted-foreground">
                    Could
                  </div>
                </div>
              </div>

              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>{tasksByStatus.todo} todo</span>
                <span>·</span>
                <span>{tasksByStatus.in_progress} in progress</span>
                <span>·</span>
                <span>{tasksByStatus.done} done</span>
              </div>
            </div>

            {apiEndpoints.length > 0 && (
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 border-b pb-2 text-sm font-semibold">
                  <Globe className="h-4 w-4" />
                  API Endpoints ({apiEndpoints.length})
                </h3>

                <div className="space-y-1">
                  {apiEndpoints.map((endpoint, index) => {
                    const parts = endpoint.match(
                      /^(GET|POST|PUT|PATCH|DELETE)\s+(.+)/i,
                    );
                    const method = parts ? parts[1].toUpperCase() : "API";
                    const path = parts ? parts[2] : endpoint;

                    return (
                      <div
                        key={`${endpoint}-${index}`}
                        className="flex items-center gap-2 font-mono text-xs"
                      >
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            HTTP_METHOD_COLORS[method] ||
                            "bg-muted text-muted-foreground"
                          }`}
                        >
                          {method}
                        </span>
                        <span>{path}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {snapshot.warnings.length > 0 && (
              <div className="space-y-3">
                <h3 className="border-b pb-2 text-sm font-semibold">
                  Validation Warnings
                </h3>

                {errorWarnings.length > 0 && (
                  <div className="space-y-1">
                    {errorWarnings.map((warning) => (
                      <div
                        key={warning.id}
                        className="flex items-start gap-2 text-xs"
                      >
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                        <span className="text-red-700 dark:text-red-400">
                          {warning.message}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {warnWarnings.length > 0 && (
                  <div className="space-y-1">
                    {warnWarnings.map((warning) => (
                      <div
                        key={warning.id}
                        className="flex items-start gap-2 text-xs"
                      >
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                        <span className="text-amber-700 dark:text-amber-400">
                          {warning.message}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {infoWarnings.length > 0 && (
                  <div className="space-y-1">
                    {infoWarnings.map((warning) => (
                      <div
                        key={warning.id}
                        className="flex items-start gap-2 text-xs"
                      >
                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                        <span className="text-blue-700 dark:text-blue-400">
                          {warning.message}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <h3 className="border-b pb-2 pt-4 text-lg font-bold text-foreground">
              Architecture Documentation
            </h3>

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
          </>
        )}
      </div>
    </div>
  );
}
