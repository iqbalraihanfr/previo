import type { NodeData, ValidationWarning } from "@/lib/db";
import { getValidationTone } from "@/features/workspace/utils";

export const STANDARD_NODE_ORDER = [
  "project_brief",
  "requirements",
  "user_stories",
  "use_cases",
  "flowchart",
  "dfd",
  "erd",
  "sequence",
  "task_board",
  "summary",
  "custom",
] as const;

export function sortWorkspaceNodes(nodes: NodeData[]) {
  return [...nodes].sort((a, b) => {
    const orderA = STANDARD_NODE_ORDER.indexOf(
      a.type as (typeof STANDARD_NODE_ORDER)[number],
    );
    const orderB = STANDARD_NODE_ORDER.indexOf(
      b.type as (typeof STANDARD_NODE_ORDER)[number],
    );
    const normalizedA = orderA === -1 ? Number.MAX_SAFE_INTEGER : orderA;
    const normalizedB = orderB === -1 ? Number.MAX_SAFE_INTEGER : orderB;

    if (normalizedA !== normalizedB) return normalizedA - normalizedB;
    return a.sort_order - b.sort_order;
  });
}

export function getRecommendedNextNode(nodes: NodeData[]) {
  return nodes.find((node) => node.status !== "Done") ?? null;
}

export function buildWorkspaceStats(
  nodes: NodeData[],
  warnings: ValidationWarning[],
) {
  const doneCount = nodes.filter((node) => node.status === "Done").length;
  const errorCount = warnings.filter((warning) => warning.severity === "error").length;
  const warningCount = warnings.filter(
    (warning) => warning.severity === "warning",
  ).length;
  const infoCount = warnings.filter((warning) => warning.severity === "info").length;
  const progressPercent =
    nodes.length > 0 ? Math.round((doneCount / nodes.length) * 100) : 0;
  const validationTone = getValidationTone(errorCount, warningCount);

  return {
    doneCount,
    errorCount,
    warningCount,
    infoCount,
    progressPercent,
    validationTone,
  };
}

export function buildCommandNodes(params: {
  sortedNodes: NodeData[];
  recommendedNextNode: NodeData | null;
}) {
  const { sortedNodes, recommendedNextNode } = params;

  return sortedNodes.map((node) => ({
    id: node.id,
    label: node.label,
    type: node.type,
    status: node.status,
    isNext: node.id === recommendedNextNode?.id,
  }));
}
