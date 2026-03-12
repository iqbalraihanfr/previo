"use client";

import { useEffect, useMemo, useState } from "react";
import { db, NodeData, NodeContent, TaskData, ValidationWarning } from "@/lib/db";
import {
  computeCoverage,
  extractAPIEndpoints,
  getNodeContentMap,
} from "../helpers";
import { ProjectSnapshot } from "../types";

async function loadProjectSnapshot(projectId: string): Promise<ProjectSnapshot> {
  const [projectNodes, allContents, tasks, warnings] = await Promise.all([
    db.nodes.where({ project_id: projectId }).toArray(),
    db.nodeContents.toArray(),
    db.tasks.where({ project_id: projectId }).toArray(),
    db.validationWarnings.where({ project_id: projectId }).toArray(),
  ]);

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
    allProjectNodes: projectNodes,
    displayNodes,
    contents,
    tasks,
    warnings,
  };
}

export function useSummary(projectId: string) {
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

    return {
      errorWarnings,
      warnWarnings,
      infoWarnings,
      tasksByPriority,
      tasksByStatus,
      coverage,
      apiEndpoints,
      nonSummaryNodes,
      allNodesDone,
      isProjectReady: allNodesDone && errorWarnings.length === 0,
      incompleteNodeCount: nonSummaryNodes.filter((pn: NodeData) => pn.status !== "Done").length,
    };
  }, [snapshot]);

  return {
    snapshot,
    isLoading,
    ...stats,
  };
}
