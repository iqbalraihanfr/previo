import { describe, expect, it } from "vitest";

import type { NodeData, Project } from "@/lib/db";
import {
  buildDashboardStats,
  buildProjectCards,
  getProgressMeta,
  getRecentProject,
} from "@/features/dashboard/selectors";

function createProject(overrides: Partial<Project>): Project {
  return {
    id: "project-1",
    name: "Previo",
    description: "Architecture workspace",
    template_type: "quick",
    delivery_mode: "agile",
    created_at: "2026-03-20T00:00:00.000Z",
    updated_at: "2026-03-20T00:00:00.000Z",
    ...overrides,
  };
}

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
    updated_at: "2026-03-20T00:00:00.000Z",
    ...overrides,
  };
}

describe("dashboard selectors", () => {
  it("builds project cards with filters and recent-first sort", () => {
    const projects = [
      createProject({
        id: "project-1",
        name: "Beta Workspace",
        description: "Second project",
        template_type: "full",
        updated_at: "2026-03-18T00:00:00.000Z",
      }),
      createProject({
        id: "project-2",
        name: "Alpha Workspace",
        description: "First project",
        template_type: "quick",
        updated_at: "2026-03-20T00:00:00.000Z",
      }),
    ];
    const nodes = [
      createNode({ id: "node-1", project_id: "project-2", status: "Done" }),
      createNode({ id: "node-2", project_id: "project-2", status: "In Progress" }),
      createNode({ id: "node-3", project_id: "project-1", status: "Empty" }),
    ];

    const cards = buildProjectCards({
      projects,
      allNodes: nodes,
      searchQuery: "workspace",
      sortBy: "recent",
      filterBy: "all",
    });

    expect(cards).toHaveLength(2);
    expect(cards[0].project.id).toBe("project-2");
    expect(cards[0].progress.percent).toBe(50);
    expect(cards[1].templateLabel).toBe("Full Architecture");
  });

  it("builds aggregate dashboard stats", () => {
    const projects = [
      createProject({ id: "project-1", template_type: "quick" }),
      createProject({ id: "project-2", template_type: "full" }),
    ];
    const nodes = [
      createNode({ id: "node-1", project_id: "project-1", status: "Done" }),
      createNode({ id: "node-2", project_id: "project-2", status: "In Progress" }),
    ];

    expect(buildDashboardStats(projects, nodes)).toEqual({
      totalProjects: 2,
      totalNodes: 2,
      completedNodes: 1,
      quickProjects: 1,
    });
  });

  it("returns progress metadata and the latest recent project", () => {
    const projects = [
      createProject({
        id: "project-1",
        updated_at: "2026-03-18T00:00:00.000Z",
      }),
      createProject({
        id: "project-2",
        updated_at: "2026-03-21T00:00:00.000Z",
      }),
    ];

    expect(getProgressMeta(0, 0).label).toBe("Not started");
    expect(getProgressMeta(3, 3).label).toBe("Completed");
    expect(getRecentProject(projects)?.id).toBe("project-2");
  });
});
