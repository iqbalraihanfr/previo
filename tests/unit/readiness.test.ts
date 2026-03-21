import { describe, expect, it } from "vitest";

import type { NodeContent, NodeData, ValidationWarning } from "@/lib/db";
import { buildProjectReadinessModel } from "@/lib/readiness";

function createNode(overrides: Partial<NodeData>): NodeData {
  return {
    id: "node-1",
    project_id: "project-1",
    type: "project_brief",
    label: "Project Brief",
    status: "In Progress",
    position_x: 0,
    position_y: 0,
    sort_order: 0,
    updated_at: "2026-03-21T00:00:00.000Z",
    generation_status: "none",
    override_status: "none",
    ...overrides,
  };
}

function createContent(overrides: Partial<NodeContent>): NodeContent {
  return {
    id: "content-1",
    node_id: "node-1",
    structured_fields: {},
    mermaid_auto: "",
    updated_at: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("project readiness model", () => {
  it("groups blockers and coverage gaps for the brief + requirements wedge", () => {
    const nodes = [
      createNode({
        id: "brief-node",
        type: "project_brief",
      }),
      createNode({
        id: "requirements-node",
        type: "requirements",
        label: "Requirements",
        sort_order: 1,
      }),
    ];

    const contents = [
      createContent({
        id: "brief-content",
        node_id: "brief-node",
        structured_fields: {
          name: "",
          background: "",
          target_users: [],
          scope_in: ["Self-service signup"],
          objectives: [],
        },
      }),
      createContent({
        id: "requirements-content",
        node_id: "requirements-node",
        structured_fields: {
          items: [
            {
              id: "req-1",
              type: "FR",
              description: "Allow sign up",
              related_scope: "",
            },
          ],
        },
      }),
    ];

    const warnings: ValidationWarning[] = [
      {
        id: "warning-1",
        project_id: "project-1",
        source_node_id: "requirements-node",
        target_node_type: "user_stories",
        severity: "warning",
        message: "FR-001 has no user story.",
        rule_id: "CV-04",
      },
    ];

    const model = buildProjectReadinessModel({
      nodes,
      contents,
      warnings,
    });

    expect(model.statusLabel).toBe("Not ready");
    expect(model.status).toBe("not_ready");
    expect(model.blockers.some((issue) => issue.id === "brief-name")).toBe(true);
    expect(
      model.coverageGaps.some((issue) =>
        issue.message.includes("still need a related scope"),
      ),
    ).toBe(true);
    expect(model.coverageGaps.some((issue) => issue.id === "warning-1")).toBe(true);
  });
});
