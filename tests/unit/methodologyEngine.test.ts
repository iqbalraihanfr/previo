import { describe, expect, test } from "vitest";

import type { NodeData, TaskData } from "../../src/lib/db";
import {
  buildAgileSprintProposal,
  buildDeliveryPlan,
} from "../../src/lib/methodologyEngine";

function createNode(overrides: Partial<NodeData>): NodeData {
  return {
    id: overrides.id ?? "node-1",
    project_id: overrides.project_id ?? "project-1",
    type: overrides.type ?? "project_brief",
    label: overrides.label ?? "Project Brief",
    status: overrides.status ?? "Done",
    position_x: overrides.position_x ?? 0,
    position_y: overrides.position_y ?? 0,
    sort_order: overrides.sort_order ?? 0,
    updated_at: overrides.updated_at ?? "2026-03-20T00:00:00.000Z",
    generation_status: overrides.generation_status ?? "none",
    override_status: overrides.override_status ?? "none",
  };
}

function createTask(overrides: Partial<TaskData>): TaskData {
  return {
    id: overrides.id ?? "task-1",
    project_id: overrides.project_id ?? "project-1",
    source_node_id: overrides.source_node_id ?? "node-1",
    title: overrides.title ?? "Default task",
    description: overrides.description ?? "",
    group_key: overrides.group_key ?? "General",
    priority: overrides.priority ?? "Should",
    labels: overrides.labels ?? [],
    status: overrides.status ?? "todo",
    is_manual: overrides.is_manual ?? false,
    sort_order: overrides.sort_order ?? 0,
    created_at: overrides.created_at ?? "2026-03-20T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2026-03-20T00:00:00.000Z",
    ...overrides,
  };
}

describe("methodology engine", () => {
  test("keeps one canonical task set while grouping differently by delivery mode", () => {
    const nodes = [
      createNode({ id: "brief-node", type: "project_brief", label: "Project Brief" }),
      createNode({ id: "erd-node", type: "erd", label: "ERD" }),
      createNode({ id: "qa-node", type: "user_stories", label: "User Stories" }),
      createNode({ id: "release-node", type: "summary", label: "Summary" }),
    ];

    const tasks = [
      createTask({
        id: "task-discovery",
        source_node_id: "brief-node",
        title: "Discover client scope",
        feature_name: "Discovery",
        group_key: "Planning",
        priority: "Must",
      }),
      createTask({
        id: "task-design",
        source_node_id: "erd-node",
        title: "Design persistence model",
        feature_name: "Reporting",
        group_key: "Database",
        priority: "Should",
        sort_order: 1,
      }),
      createTask({
        id: "task-qa",
        source_node_id: "qa-node",
        title: "Validate acceptance criteria",
        feature_name: "Reporting",
        group_key: "QA",
        priority: "Could",
        sort_order: 2,
      }),
      createTask({
        id: "task-release",
        source_node_id: "release-node",
        title: "Release reporting handoff",
        feature_name: "Launch",
        group_key: "Release",
        priority: "Should",
        sort_order: 3,
      }),
    ];

    const agile = buildDeliveryPlan({
      deliveryMode: "agile",
      tasks,
      nodes,
    });
    const waterfall = buildDeliveryPlan({
      deliveryMode: "waterfall",
      tasks,
      nodes,
    });
    const hybrid = buildDeliveryPlan({
      deliveryMode: "hybrid",
      tasks,
      nodes,
    });

    expect(agile.map((group) => group.title)).toEqual([
      "Discovery",
      "Reporting",
      "Launch",
    ]);
    expect(waterfall.map((group) => group.title)).toEqual([
      "Discovery",
      "Design",
      "QA",
      "Release",
    ]);
    expect(hybrid.map((group) => group.title)).toEqual([
      "Discovery",
      "Reporting",
      "Launch",
    ]);

    const canonicalTaskIds = tasks.map((task) => task.id).sort();
    expect(
      agile.flatMap((group) => group.tasks).map((task) => task.id).sort(),
    ).toEqual(canonicalTaskIds);
    expect(
      waterfall.flatMap((group) => group.tasks).map((task) => task.id).sort(),
    ).toEqual(canonicalTaskIds);
    expect(
      hybrid.flatMap((group) => group.tasks).map((task) => task.id).sort(),
    ).toEqual(canonicalTaskIds);
  });

  test("builds sprint proposals from unfinished tasks only", () => {
    const tasks = Array.from({ length: 8 }, (_, index) =>
      createTask({
        id: `task-${index + 1}`,
        title: `Task ${index + 1}`,
        priority: index === 0 ? "Must" : "Should",
        sort_order: index,
        status: index === 7 ? "done" : "todo",
      }),
    );

    const sprints = buildAgileSprintProposal(tasks);

    expect(sprints).toHaveLength(2);
    expect(sprints[0]?.title).toBe("Sprint 1");
    expect(sprints[0]?.tasks).toHaveLength(6);
    expect(sprints[1]?.tasks.map((task) => task.id)).toEqual(["task-7"]);
    expect(sprints.flatMap((sprint) => sprint.tasks).some((task) => task.id === "task-8")).toBe(false);
  });
});
