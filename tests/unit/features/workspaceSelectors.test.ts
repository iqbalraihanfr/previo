import { describe, expect, it } from "vitest";

import type { NodeData, ValidationWarning } from "@/lib/db";
import {
  buildCommandNodes,
  buildWorkspaceStats,
  getRecommendedNextNode,
  sortWorkspaceNodes,
} from "@/features/workspace/selectors";

function createNode(overrides: Partial<NodeData>): NodeData {
  return {
    id: "node-1",
    project_id: "project-1",
    type: "project_brief",
    label: "Node",
    status: "Empty",
    position_x: 0,
    position_y: 0,
    sort_order: 0,
    updated_at: "2026-03-20T00:00:00.000Z",
    ...overrides,
  };
}

function createWarning(
  overrides: Partial<ValidationWarning>,
): ValidationWarning {
  return {
    id: "warning-1",
    project_id: "project-1",
    source_node_id: "node-1",
    severity: "warning",
    message: "Issue",
    ...overrides,
  };
}

describe("workspace selectors", () => {
  it("sorts nodes by canonical workspace order and sort_order", () => {
    const nodes = [
      createNode({ id: "node-1", type: "task_board", sort_order: 4 }),
      createNode({ id: "node-2", type: "requirements", sort_order: 1 }),
      createNode({ id: "node-3", type: "project_brief", sort_order: 2 }),
    ];

    expect(sortWorkspaceNodes(nodes).map((node) => node.id)).toEqual([
      "node-3",
      "node-2",
      "node-1",
    ]);
  });

  it("computes recommended next node and command nodes", () => {
    const sortedNodes = [
      createNode({ id: "node-1", label: "Brief", status: "Done" }),
      createNode({ id: "node-2", label: "Requirements", status: "In Progress" }),
    ];

    const recommendedNextNode = getRecommendedNextNode(sortedNodes);
    const commandNodes = buildCommandNodes({
      sortedNodes,
      recommendedNextNode,
    });

    expect(recommendedNextNode?.id).toBe("node-2");
    expect(commandNodes[1]).toMatchObject({
      id: "node-2",
      isNext: true,
    });
  });

  it("computes workspace stats and validation tone", () => {
    const nodes = [
      createNode({ id: "node-1", status: "Done" }),
      createNode({ id: "node-2", status: "In Progress" }),
    ];
    const warnings = [
      createWarning({ id: "warning-1", severity: "error" }),
      createWarning({ id: "warning-2", severity: "warning" }),
    ];

    expect(buildWorkspaceStats(nodes, warnings)).toMatchObject({
      doneCount: 1,
      errorCount: 1,
      warningCount: 1,
      infoCount: 0,
      progressPercent: 50,
      validationTone: "danger",
    });
  });
});
