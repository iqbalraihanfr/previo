import { describe, expect, it } from "vitest";

import type { NodeContent, NodeData, TaskData } from "@/lib/db";
import { resolveTaskProvenance } from "@/components/editors/task-board/provenance";

function createNode(overrides: Partial<NodeData>): NodeData {
  return {
    id: "requirements-node",
    project_id: "project-1",
    type: "requirements",
    label: "Requirements",
    status: "Done",
    position_x: 0,
    position_y: 0,
    sort_order: 0,
    updated_at: "2026-03-21T00:00:00.000Z",
    generation_status: "imported",
    override_status: "none",
    ...overrides,
  };
}

function createContent(overrides: Partial<NodeContent>): NodeContent {
  return {
    id: "requirements-content",
    node_id: "requirements-node",
    structured_fields: {
      items: [
        {
          id: "req-1",
          type: "FR",
          description: "Allow sign up via email",
          related_scope: "Self-service signup",
        },
      ],
    },
    mermaid_auto: "",
    updated_at: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

function createTask(overrides: Partial<TaskData> = {}): TaskData {
  return {
    id: "task-1",
    project_id: "project-1",
    source_node_id: "requirements-node",
    source_item_id: "fr-req-1",
    title: "Deliver Authentication",
    description: "Implement authentication flow.",
    group_key: "Feature Delivery",
    priority: "Must",
    labels: [],
    status: "todo",
    is_manual: false,
    task_origin: "generated",
    sort_order: 0,
    created_at: "2026-03-21T00:00:00.000Z",
    updated_at: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("task provenance", () => {
  it("explains which requirement generated a task", () => {
    const provenance = resolveTaskProvenance({
      task: createTask(),
      nodes: [createNode({ id: "requirements-node" })],
      contents: [createContent({ node_id: "requirements-node" })],
    });

    expect(provenance?.title).toContain("Generated from Requirement FR-001");
    expect(provenance?.relatedBriefScope).toBe("Self-service signup");
    expect(provenance?.reason).toContain("planning rule");
  });
});
