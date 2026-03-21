import { describe, expect, test } from "vitest";

import type { NodeContent, NodeData, TaskData } from "../../src/lib/db";
import { generateTasksFromNode } from "../../src/services/taskEngine";
import { dedupeGeneratedTasks } from "../../src/services/taskEngine/utils";

function createNode(overrides: Partial<NodeData>): NodeData {
  return {
    id: overrides.id ?? "node-1",
    project_id: overrides.project_id ?? "project-1",
    type: overrides.type ?? "requirements",
    label: overrides.label ?? "Requirements",
    status: overrides.status ?? "Done",
    position_x: overrides.position_x ?? 0,
    position_y: overrides.position_y ?? 0,
    sort_order: overrides.sort_order ?? 0,
    updated_at: overrides.updated_at ?? "2026-03-21T00:00:00.000Z",
    generation_status: overrides.generation_status ?? "none",
    override_status: overrides.override_status ?? "none",
  };
}

function createContent(overrides: Partial<NodeContent>): NodeContent {
  return {
    id: overrides.id ?? "content-1",
    node_id: overrides.node_id ?? "node-1",
    structured_fields: overrides.structured_fields ?? {},
    mermaid_auto: overrides.mermaid_auto ?? "",
    mermaid_manual: overrides.mermaid_manual ?? "",
    updated_at: overrides.updated_at ?? "2026-03-21T00:00:00.000Z",
  };
}

describe("task engine", () => {
  test("dedupes planner tasks that describe the same work with different verbs", () => {
    const tasks: Pick<
      TaskData,
      "title" | "description" | "group_key" | "feature_name" | "source_item_id" | "sort_order"
    >[] = [
      {
        title: "Build billing dashboard",
        description: "Deliver the billing dashboard",
        group_key: "Feature Delivery",
        feature_name: "Billing",
        source_item_id: "a",
        sort_order: 0,
      },
      {
        title: "Deliver billing dashboard",
        description: "Deliver the billing dashboard",
        group_key: "Feature Delivery",
        feature_name: "Billing",
        source_item_id: "b",
        sort_order: 1,
      },
      {
        title: "Verify billing dashboard",
        description: "Validate the billing dashboard",
        group_key: "Feature Validation",
        feature_name: "Billing",
        source_item_id: "c",
        sort_order: 2,
      },
    ];

    const deduped = dedupeGeneratedTasks(tasks);

    expect(deduped).toHaveLength(2);
    expect(deduped.map((task) => task.title)).toEqual([
      "Build billing dashboard",
      "Verify billing dashboard",
    ]);
  });

  test("phrases requirement tasks as grouped delivery and quality work", () => {
    const node = createNode({ type: "requirements", label: "Requirements" });
    const content = createContent({
      node_id: node.id,
      structured_fields: {
        items: [
          {
            id: "fr-1",
            type: "FR",
            category: "Checkout",
            priority: "Must",
            description: "Users can save checkout details",
          },
          {
            id: "fr-2",
            type: "FR",
            category: "Checkout",
            priority: "Must",
            description: "Users can save checkout details",
          },
          {
            id: "fr-3",
            type: "FR",
            category: "Checkout",
            priority: "Should",
            description:
              "Users can save checkout details with additional validation and compliance checks that exceed one hundred characters for the split task preview.",
          },
          {
            id: "nfr-1",
            type: "NFR",
            category: "Performance",
            metric: "P95 latency",
            target: "< 200ms",
            description: "Checkout requests should stay fast.",
          },
        ],
      },
    });

    const tasks = generateTasksFromNode(node, content, "project-1");

    expect(tasks).toHaveLength(3);
    expect(tasks[0]?.title).toBe("Deliver Checkout");
    expect(tasks[1]?.title).toMatch(/^Split Checkout requirement: /);
    expect(tasks[1]?.title).toContain("...");
    expect(tasks[2]?.title).toBe("Harden Performance: P95 latency");
    expect(tasks.map((task) => task.group_key)).toEqual([
      "Feature Delivery",
      "Feature Delivery",
      "Quality & Performance",
    ]);
  });
});
