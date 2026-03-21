import { afterEach, describe, expect, test, vi } from "vitest";

import {
  resolveBacklogImport,
  resolveNodeImport,
} from "../../src/lib/sourceIntake";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("source intake adapters", () => {
  test("imports project brief text through the brief adapter", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        fields: {
          name: "Client Portal",
          background: "Replace manual intake.",
          objectives: ["Reduce turnaround"],
        },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await resolveNodeImport({
      nodeType: "project_brief",
      sourceType: "brief_doc",
      rawContent: "# Client Portal\n\nReplace manual intake.",
      projectId: "project-1",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.sourceType).toBe("brief_doc");
    expect(result.title).toBe("Imported brief");
    expect(result.fields).toMatchObject({
      name: "Client Portal",
      background: "Replace manual intake.",
    });
  });

  test("parses requirements text into normalized requirement items", async () => {
    const result = await resolveNodeImport({
      nodeType: "requirements",
      sourceType: "requirements_doc",
      rawContent: [
        "[FR] [Must] User can create invoice | Billing | Invoice Creation",
        "[NFR] [Should] Response time below target | Performance | | p95 latency | 200ms",
      ].join("\n"),
      projectId: "project-1",
    });

    expect(result.fields).toMatchObject({
      items: [
        {
          id: "req-1",
          type: "FR",
          priority: "Must",
          description: "User can create invoice",
          category: "Billing",
          related_scope: "Invoice Creation",
        },
        {
          id: "req-2",
          type: "NFR",
          priority: "Should",
          category: "Performance",
          metric: "p95 latency",
          target: "200ms",
        },
      ],
    });
  });

  test("parses user story csv and backlog csv imports", async () => {
    const storyImport = await resolveNodeImport({
      nodeType: "user_stories",
      sourceType: "jira_csv",
      rawContent: [
        "id,story,acceptance_criteria,related_requirement",
        'US-1,"As a finance admin, I want generate reports, so that month-end is faster","Given data exists||When I click generate||Then report is created",FR-1',
      ].join("\n"),
      projectId: "project-1",
    });

    const backlogImport = await resolveBacklogImport({
      sourceType: "jira_csv",
      rawContent: [
        "id,title,description,priority,status",
        'JIRA-12,"Implement report export","Create export endpoint",High,In Progress',
      ].join("\n"),
    });

    expect(storyImport.fields).toMatchObject({
      items: [
        {
          id: "US-1",
          role: "finance admin",
          goal: "generate reports",
          benefit: "month-end is faster",
          related_requirement: "FR-1",
        },
      ],
    });
    expect(backlogImport.items).toEqual([
      {
        title: "Implement report export",
        description: "Create export endpoint",
        priority: "must",
        status: "in_progress",
        external_source: "jira",
        external_task_id: "JIRA-12",
        external_status: "In Progress",
        normalized_title: "implement report export",
      },
    ]);
  });

  test("normalizes quoted backlog fields and default priority/status fallbacks", async () => {
    const backlogImport = await resolveBacklogImport({
      sourceType: "linear_csv",
      rawContent: [
        "id,title,description,priority,status",
        'LIN-7,"Review import, export, and QA","Check commas, quotes, and fallback status",Unknown,Started',
      ].join("\n"),
    });

    expect(backlogImport.items).toEqual([
      {
        title: "Review import, export, and QA",
        description: "Check commas, quotes, and fallback status",
        priority: "should",
        status: "in_progress",
        external_source: "linear",
        external_task_id: "LIN-7",
        external_status: "Started",
        normalized_title: "review import, export, and qa",
      },
    ]);
  });

  test("parses mermaid flowchart, sequence, use case text, and dfd inputs", async () => {
    const flowchart = await resolveNodeImport({
      nodeType: "flowchart",
      sourceType: "mermaid",
      rawContent: "flowchart TD\nA[Start] --> B{Approved}\nB --> C[Finish]",
      projectId: "project-1",
    });

    const sequence = await resolveNodeImport({
      nodeType: "sequence",
      sourceType: "mermaid",
      rawContent: [
        "sequenceDiagram",
        "actor User",
        "participant API",
        "User->>API: GET /api/reports",
      ].join("\n"),
      projectId: "project-1",
    });

    const useCases = await resolveNodeImport({
      nodeType: "use_cases",
      sourceType: "meeting_text",
      rawContent: [
        "Generate Report",
        "Actor: Finance Admin",
        "- Choose date range",
        "- Submit report request",
      ].join("\n"),
      projectId: "project-1",
    });

    const dfd = await resolveNodeImport({
      nodeType: "dfd",
      sourceType: "mermaid",
      rawContent: "graph TD\nUser[User] -->|submit| Process((Generate Report))\nProcess --> Store[(REPORTS)]",
      projectId: "project-1",
    });

    expect(flowchart.mermaidSyntax).toContain("flowchart TD");
    expect(flowchart.fields).toMatchObject({
      flows: [
        {
          steps: [
            { id: "A", label: "Start", type: "process" },
            { id: "B", label: "Approved", type: "decision" },
            { id: "C", label: "Finish", type: "process" },
          ],
        },
      ],
    });
    expect(sequence.fields).toMatchObject({
      participants: [
        { name: "User", type: "actor", order: 0 },
        { name: "API", type: "system", order: 1 },
      ],
    });
    expect(useCases.fields).toMatchObject({
      actors: ["Finance Admin"],
      useCases: [
        {
          name: "Generate Report",
          primary_actor: "Finance Admin",
        },
      ],
    });
    expect(dfd.fields).toMatchObject({
      nodes: [
        { id: "User", label: "User", type: "entity" },
        { id: "Process", label: "Generate Report", type: "process" },
        { id: "Store", label: "REPORTS", type: "datastore" },
      ],
    });
  });

  test("parses DBML and SQL schemas into ERD fields", async () => {
    const dbmlImport = await resolveNodeImport({
      nodeType: "erd",
      sourceType: "dbml",
      rawContent: [
        "Table users {",
        "  id uuid [pk]",
        "  role_id uuid",
        "}",
        "",
        "Table roles {",
        "  id uuid [pk]",
        "}",
        "",
        "Ref: users.role_id > roles.id",
      ].join("\n"),
      projectId: "project-1",
    });

    const sqlImport = await resolveNodeImport({
      nodeType: "erd",
      sourceType: "sql_schema",
      rawContent: [
        "CREATE TABLE users (",
        "  id UUID PRIMARY KEY,",
        "  role_id UUID REFERENCES roles(id)",
        ");",
        "CREATE TABLE roles (",
        "  id UUID PRIMARY KEY",
        ");",
      ].join("\n"),
      projectId: "project-1",
    });

    expect(dbmlImport.fields).toMatchObject({
      entities: [
        { name: "USERS" },
        { name: "ROLES" },
      ],
      relationships: [
        { from: "USERS", to: "ROLES", type: "many-to-one" },
      ],
    });
    expect(sqlImport.fields).toMatchObject({
      entities: [
        { name: "USERS" },
        { name: "ROLES" },
      ],
      relationships: [
        { from: "USERS", to: "ROLES", type: "one-to-many" },
      ],
    });
  });

  test("rejects unsupported node imports and malformed schema sources", async () => {
    await expect(
      resolveNodeImport({
        nodeType: "summary",
        sourceType: "brief_doc",
        rawContent: "unsupported",
        projectId: "project-1",
      }),
    ).rejects.toThrow('Import is not supported for node type "summary".');

    await expect(
      resolveNodeImport({
        nodeType: "erd",
        sourceType: "dbml",
        rawContent: "not valid dbml",
        projectId: "project-1",
      }),
    ).rejects.toThrow();

    await expect(
      resolveNodeImport({
        nodeType: "erd",
        sourceType: "sql_schema",
        rawContent: "SELECT * FROM users;",
        projectId: "project-1",
      }),
    ).rejects.toThrow();
  });
});
