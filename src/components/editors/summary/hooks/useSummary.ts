"use client";

import { useEffect, useMemo, useState } from "react";
import { type NodeData, type TaskData, type ValidationWarning, type ReadinessSnapshot } from "@/lib/db";
import { buildAgileSprintProposal, buildDeliveryPlan } from "@/lib/methodologyEngine";
import { buildProjectReadinessModel } from "@/lib/readiness";
import { resolveTaskProvenance } from "@/components/editors/task-board/provenance";
import {
  computeCoverage,
  buildSummaryFraming,
  extractAPIEndpoints,
  getNodeContentMap,
} from "../helpers";
import { ProjectSnapshot } from "../types";
import { DELIVERY_MODE_LABELS } from "@/lib/sourceArtifacts";
import { ProjectRepository } from "@/repositories/ProjectRepository";
import { NodeContentRepository, NodeRepository } from "@/repositories/NodeRepository";
import { TaskRepository } from "@/repositories/TaskRepository";
import { ReadinessSnapshotRepository } from "@/repositories/ReadinessRepository";
import { ValidationWarningRepository } from "@/repositories/MiscRepository";

async function loadProjectSnapshot(projectId: string): Promise<ProjectSnapshot> {
  const [project, projectNodes, tasks, warnings, readinessSnapshot] =
    await Promise.all([
      ProjectRepository.findById(projectId),
      NodeRepository.findAllByProjectId(projectId),
      TaskRepository.findAllByProjectId(projectId),
      ValidationWarningRepository.findAllByProjectId(projectId),
      ReadinessSnapshotRepository.findByProjectId(projectId),
    ]);

  const nodeIds = projectNodes.map((node) => node.id);
  const allContents = await NodeContentRepository.findAllByNodeIds(nodeIds);

  const displayNodes = projectNodes
    .filter(
      (pn) =>
        pn.type !== "summary" &&
        pn.type !== "task_board" &&
        pn.status !== "Empty"
    )
    .sort((a, b) => a.sort_order - b.sort_order);

  const contents = getNodeContentMap(projectNodes, allContents);

  return {
    project: project ?? null,
    allProjectNodes: projectNodes,
    displayNodes,
    contents,
    tasks,
    warnings,
    readinessSnapshot: readinessSnapshot ?? null,
  };
}

export function useSummary(projectId: string) {
  const [snapshot, setSnapshot] = useState<ProjectSnapshot>({
    project: null,
    allProjectNodes: [],
    displayNodes: [],
    contents: {},
    tasks: [],
    warnings: [],
    readinessSnapshot: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    async function run() {
      setIsLoading(true);
      const next = await loadProjectSnapshot(projectId);
      if (!isCancelled) {
        setSnapshot(next);
        setIsLoading(false);
      }
    }
    void run();
    return () => { isCancelled = true; };
  }, [projectId]);

  const nonSummaryNodes = useMemo(
    () => snapshot.allProjectNodes.filter((pn: NodeData) => pn.type !== "summary"),
    [snapshot.allProjectNodes]
  );

  const allNodesDone = useMemo(
    () => nonSummaryNodes.length > 0 && nonSummaryNodes.every((pn: NodeData) => pn.status === "Done"),
    [nonSummaryNodes]
  );

  const stats = useMemo(() => {
    const errorWarnings = snapshot.warnings.filter((w: ValidationWarning) => w.severity === "error");
    const warnWarnings = snapshot.warnings.filter((w: ValidationWarning) => w.severity === "warning");
    const infoWarnings = snapshot.warnings.filter((w: ValidationWarning) => w.severity === "info");

    const tasksByPriority = {
      must: snapshot.tasks.filter((t: TaskData) => t.priority?.toLowerCase() === "must").length,
      should: snapshot.tasks.filter((t: TaskData) => t.priority?.toLowerCase() === "should").length,
      could: snapshot.tasks.filter((t: TaskData) => t.priority?.toLowerCase() === "could").length,
    };

    const tasksByStatus = {
      todo: snapshot.tasks.filter((t: TaskData) => t.status === "todo").length,
      in_progress: snapshot.tasks.filter((t: TaskData) => t.status === "in_progress").length,
      done: snapshot.tasks.filter((t: TaskData) => t.status === "done").length,
    };

    const coverage = computeCoverage(snapshot.allProjectNodes, snapshot.contents);
    const apiEndpoints = extractAPIEndpoints(snapshot.contents, snapshot.allProjectNodes);
    const deliveryMode = snapshot.project?.delivery_mode ?? "agile";
    const deliveryPlan = buildDeliveryPlan({
      deliveryMode,
      tasks: snapshot.tasks,
      nodes: snapshot.allProjectNodes,
    });
    const sprintProposal = buildAgileSprintProposal(snapshot.tasks);
    const derivedReadiness = buildProjectReadinessModel({
      nodes: snapshot.allProjectNodes,
      contents: Object.values(snapshot.contents),
      warnings: snapshot.warnings,
    });
    const readiness = normalizeReadinessSnapshot(
      snapshot.readinessSnapshot,
      derivedReadiness,
    );
    const provenanceSummary = snapshot.allProjectNodes.reduce(
      (accumulator, projectNode) => {
        if (projectNode.generation_status === "imported") {
          accumulator.imported += 1;
        } else if (projectNode.generation_status === "generated") {
          accumulator.generated += 1;
        } else {
          accumulator.manual += 1;
        }

        if (projectNode.override_status === "manual_override") {
          accumulator.overridden += 1;
        }

        return accumulator;
      },
      {
        imported: 0,
        generated: 0,
        manual: 0,
        overridden: 0,
      },
    );
    const topTaskSources = Object.entries(
      snapshot.tasks.reduce<Record<string, number>>((accumulator, task) => {
        let key =
          task.task_origin === "manual"
            ? "Manual Tasks"
            : task.task_origin === "imported_backlog"
              ? "Imported Backlog"
              : "Generated Tasks";

        if (task.task_origin === "generated") {
          const sourceNode = snapshot.allProjectNodes.find(
            (node) => node.id === task.source_node_id,
          );
          const provenance = resolveTaskProvenance({
            task,
            nodes: snapshot.allProjectNodes,
            contents: Object.values(snapshot.contents),
          });

          key =
            sourceNode?.type === "requirements"
              ? "Requirements"
              : sourceNode?.type === "user_stories"
                ? "User Stories"
                : sourceNode?.type === "use_cases"
                  ? "Use Cases"
                  : sourceNode?.type === "flowchart"
                    ? "Flowchart"
                    : sourceNode?.type === "sequence"
                      ? "Sequence"
                      : sourceNode?.type === "erd"
                        ? "ERD"
                        : sourceNode?.type === "dfd"
                          ? "DFD"
                          : provenance?.title ?? sourceNode?.label ?? "Generated Tasks";
        }

        accumulator[key] = (accumulator[key] ?? 0) + 1;
        return accumulator;
      }, {}),
    )
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3)
      .map(([label, count]) => {
        if (label === "Sequence") {
          return `Sequence contributes ${count} integration and API task(s).`;
        }
        if (label === "ERD") {
          return `ERD contributes ${count} schema and relationship task(s).`;
        }
        if (label === "Flowchart") {
          return `Flowchart contributes ${count} process implementation task(s).`;
        }
        if (label === "DFD") {
          return `DFD contributes ${count} backend and integration task(s).`;
        }
        return `${label} contributes ${count} task(s) to the current plan.`;
      });
    const framing = buildSummaryFraming({
      deliveryModeLabel:
        DELIVERY_MODE_LABELS[
          (snapshot.project?.delivery_mode ?? deliveryMode) as keyof typeof DELIVERY_MODE_LABELS
        ] ?? String(snapshot.project?.delivery_mode ?? deliveryMode),
      nodesDone: nonSummaryNodes.filter((pn: NodeData) => pn.status === "Done").length,
      totalTasks: snapshot.tasks.length,
      tasksDone: tasksByStatus.done,
      warningCount: snapshot.warnings.length,
      isProjectReady: allNodesDone && errorWarnings.length === 0,
      incompleteNodeCount: nonSummaryNodes.filter((pn: NodeData) => pn.status !== "Done").length,
      errorWarnings: errorWarnings.length,
      warnWarnings: warnWarnings.length,
      coverage,
      deliveryPlanTitles: deliveryPlan.map((group) => group.title),
      sprintProposalTitles: sprintProposal.map((group) => group.title),
      apiEndpoints,
      importedNodes: provenanceSummary.imported,
      generatedNodes: provenanceSummary.generated,
      manualNodes: provenanceSummary.manual,
      overriddenNodes: provenanceSummary.overridden,
      readinessStatusLabel: readiness.statusLabel,
      readinessStatusSummary: readiness.statusSummary,
      topBlockers: readiness.blockers.slice(0, 3).map((issue) => issue.message),
      topTaskSources,
    });

    return {
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
      isProjectReady: allNodesDone && errorWarnings.length === 0,
      incompleteNodeCount: nonSummaryNodes.filter((pn: NodeData) => pn.status !== "Done").length,
    };
  }, [allNodesDone, nonSummaryNodes, snapshot]);

  return {
    snapshot,
    isLoading,
    ...stats,
  };
}

function normalizeReadinessSnapshot(
  snapshot: ReadinessSnapshot | null | undefined,
  fallback: ReturnType<typeof buildProjectReadinessModel>,
) {
  if (!snapshot) return fallback;

  return {
    ...fallback,
    status: snapshot.status,
    statusLabel: snapshot.status_label,
    statusSummary: snapshot.status_summary,
    nextActions: snapshot.next_actions,
  };
}
