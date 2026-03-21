import { describe, expect, it } from "vitest";
import type { Node as FlowNode } from "@xyflow/react";

import type { NodeData, ValidationWarning } from "@/lib/db";
import {
  PROJECT_TEMPLATES,
  getWorkflowDefinition,
} from "@/features/dashboard/projectTemplates";
import { buildCanonicalFlowEdges } from "@/features/workspace/workflowGraph";

function createNode(overrides: Partial<NodeData>): NodeData {
  return {
    id: "node-1",
    project_id: "project-1",
    type: "project_brief",
    label: "Project Brief",
    status: "Empty",
    position_x: 0,
    position_y: 0,
    sort_order: 0,
    updated_at: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

function createFlowNode(overrides: Partial<FlowNode>): FlowNode {
  return {
    id: "node-1",
    position: { x: 0, y: 0 },
    data: {},
    ...overrides,
  };
}

function createWarning(
  overrides: Partial<ValidationWarning>,
): ValidationWarning {
  return {
    id: "warning-1",
    project_id: "project-1",
    source_node_id: "brief",
    severity: "warning",
    message: "Issue",
    target_node_type: "requirements",
    ...overrides,
  };
}

describe("workflow registry", () => {
  it("exposes only quick and full workflow definitions", () => {
    expect(Object.keys(PROJECT_TEMPLATES)).toEqual(["quick", "full"]);
    expect(getWorkflowDefinition("quick").edges.length).toBeGreaterThan(0);
    expect(getWorkflowDefinition("full").edges.length).toBeGreaterThan(0);
  });

  it("builds canonical flow edges from node types instead of persisted edge rows", () => {
    const dbNodes = [
      createNode({
        id: "brief",
        type: "project_brief",
        status: "Done",
        position_x: 0,
      }),
      createNode({
        id: "requirements",
        type: "requirements",
        label: "Requirements",
        status: "In Progress",
        position_x: 320,
        sort_order: 1,
      }),
      createNode({
        id: "task-board",
        type: "task_board",
        label: "Task Board",
        status: "Empty",
        position_x: 640,
        sort_order: 2,
      }),
      createNode({
        id: "summary",
        type: "summary",
        label: "Summary",
        status: "Empty",
        position_x: 960,
        sort_order: 3,
      }),
    ];

    const flowNodes = [
      createFlowNode({ id: "brief", position: { x: 0, y: 0 } }),
      createFlowNode({ id: "requirements", position: { x: 320, y: 0 } }),
      createFlowNode({ id: "task-board", position: { x: 640, y: 0 } }),
      createFlowNode({ id: "summary", position: { x: 960, y: 0 } }),
    ];

    const edges = buildCanonicalFlowEdges({
      projectId: "project-1",
      templateType: "quick",
      dbNodes,
      dbWarnings: [createWarning({ source_node_id: "brief" })],
      nodes: flowNodes,
    });

    expect(edges.map((edge) => edge.id)).toEqual([
      "project-1:project_brief->requirements",
      "project-1:requirements->task_board",
      "project-1:task_board->summary",
    ]);
    expect(edges[0]).toMatchObject({
      source: "brief",
      target: "requirements",
      label: "defines scope",
    });
    expect((edges[0].data as { warnings?: ValidationWarning[] }).warnings).toHaveLength(
      1,
    );
  });
});
