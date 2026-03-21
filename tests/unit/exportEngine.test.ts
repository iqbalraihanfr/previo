import { afterEach, describe, expect, it, vi } from "vitest";

import {
  compileProjectToMarkdown,
  exportProjectToMarkdown,
  exportTasksToJSON,
} from "@/lib/exportEngine";
import type { NodeContent, NodeData, Project, TaskData } from "@/lib/db";

function createProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "project-1",
    name: "Previo QA",
    description: "Workspace export coverage",
    template_type: "full",
    delivery_mode: "agile",
    project_notes: "",
    created_at: "2026-03-21T00:00:00.000Z",
    updated_at: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

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
    generation_status: "none",
    override_status: "none",
    updated_at: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

function createContent(overrides: Partial<NodeContent>): NodeContent {
  return {
    id: "content-1",
    node_id: "node-1",
    mermaid_auto: "",
    mermaid_manual: "",
    structured_fields: {},
    updated_at: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("export engine", () => {
  it("compiles canonical project nodes into markdown and skips derived-only exports", () => {
    const project = createProject({ project_notes: "internal note should stay private" });
    const nodes = [
      createNode({
        id: "brief",
        type: "project_brief",
        label: "Project Brief",
        sort_order: 0,
      }),
      createNode({
        id: "requirements",
        type: "requirements",
        label: "Requirements",
        sort_order: 1,
      }),
      createNode({
        id: "stories",
        type: "user_stories",
        label: "User Stories",
        sort_order: 2,
      }),
      createNode({
        id: "summary",
        type: "summary",
        label: "Summary",
        sort_order: 99,
      }),
    ];
    const contents = [
      createContent({
        node_id: "brief",
        structured_fields: {
          name: "Previo QA",
          background: "Replace fragmented discovery artifacts.",
          objectives: ["Consolidate imports"],
          target_users: ["Solo developer"],
        },
      }),
      createContent({
        node_id: "requirements",
        structured_fields: {
          items: [{ priority: "Must", description: "User can import brief docs" }],
        },
      }),
      createContent({
        node_id: "stories",
        structured_fields: {
          items: [
            {
              role: "solo developer",
              goal: "review generated tasks",
              benefit: "handoff is faster",
            },
          ],
        },
        mermaid_manual: "flowchart TD\nA[Import] --> B[Review]",
      }),
      createContent({
        node_id: "summary",
        structured_fields: { notes: "Should not be included" },
      }),
    ];

    const markdown = compileProjectToMarkdown(project, nodes, contents);

    expect(markdown).toContain("# Previo QA");
    expect(markdown).toContain("## Project Brief (project_brief)");
    expect(markdown).toContain("Replace fragmented discovery artifacts.");
    expect(markdown).toContain("[Must] User can import brief docs");
    expect(markdown).toContain("**As a** solo developer");
    expect(markdown).toContain("```mermaid");
    expect(markdown).not.toContain("## Summary (summary)");
    expect(markdown).not.toContain("internal note should stay private");
  });

  it("triggers downloads for project and task exports with stable filenames", () => {
    const appendChild = vi.fn();
    const removeChild = vi.fn();
    const click = vi.fn();
    const anchor = {
      href: "",
      download: "",
      click,
    };
    const createObjectURL = vi.fn(() => "blob:mock");
    const revokeObjectURL = vi.fn();

    vi.stubGlobal("document", {
      createElement: vi.fn(() => anchor),
      body: {
        appendChild,
        removeChild,
      },
    });
    vi.stubGlobal("URL", {
      createObjectURL,
      revokeObjectURL,
    });

    const project = createProject({ name: "Workspace Export" });
    exportProjectToMarkdown(project, [], []);

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(anchor.download).toBe("Workspace Export-Documentation.md");
    expect(click).toHaveBeenCalledTimes(1);

    const tasks: TaskData[] = [
      {
        id: "task-1",
        project_id: "project-1",
        source_node_id: "node-1",
        source_item_id: "story-1",
        title: "Review imports",
        description: "Check normalized output",
        feature_name: "Import",
        group_key: "Execution",
        labels: [],
        priority: "must",
        is_manual: false,
        task_origin: "generated",
        status: "todo",
        sort_order: 0,
        created_at: "2026-03-21T00:00:00.000Z",
        updated_at: "2026-03-21T00:00:00.000Z",
      },
    ];

    exportTasksToJSON(tasks, "Workspace Export");

    expect(createObjectURL).toHaveBeenCalledTimes(2);
    expect(anchor.download).toBe("Workspace Export-tasks.json");
    expect(click).toHaveBeenCalledTimes(2);
    expect(revokeObjectURL).toHaveBeenCalledTimes(2);
  });
});
