import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { NodeData } from "../../src/lib/db";
import { SummaryNodeEditor } from "../../src/components/editors/SummaryNodeEditor";

const mockUseSummary = vi.hoisted(() => vi.fn());

vi.mock("../../src/components/editors/summary/hooks/useSummary", () => ({
  useSummary: mockUseSummary,
}));

function createNode(overrides: Partial<NodeData>): NodeData {
  return {
    id: overrides.id ?? "summary-node",
    project_id: overrides.project_id ?? "project-1",
    type: overrides.type ?? "summary",
    label: overrides.label ?? "Summary",
    status: overrides.status ?? "Done",
    position_x: overrides.position_x ?? 0,
    position_y: overrides.position_y ?? 0,
    sort_order: overrides.sort_order ?? 0,
    updated_at: overrides.updated_at ?? "2026-03-21T00:00:00.000Z",
    generation_status: overrides.generation_status ?? "none",
    override_status: overrides.override_status ?? "none",
  };
}

beforeEach(() => {
  mockUseSummary.mockReturnValue({
    snapshot: {
      project: {
        id: "project-1",
        name: "Invoice Portal",
        description: "Test project",
        template_type: "full",
        delivery_mode: "agile",
        created_at: "2026-03-21T00:00:00.000Z",
        updated_at: "2026-03-21T00:00:00.000Z",
      },
      allProjectNodes: [
        createNode({
          id: "brief-node",
          type: "project_brief",
          label: "Project Brief",
        }),
      ],
      displayNodes: [
        createNode({
          id: "brief-node",
          type: "project_brief",
          label: "Project Brief",
        }),
      ],
      contents: {
        "brief-node": {
          id: "content-1",
          node_id: "brief-node",
          structured_fields: {
            name: "Invoice Portal",
            background: "Automate invoice handling.",
          },
          mermaid_auto: "",
          updated_at: "2026-03-21T00:00:00.000Z",
        },
      },
      tasks: [],
      warnings: [],
    },
    isLoading: false,
    errorWarnings: [],
    warnWarnings: [],
    infoWarnings: [],
    tasksByPriority: { must: 1, should: 2, could: 0 },
    tasksByStatus: { todo: 2, in_progress: 1, done: 4 },
    coverage: [],
    apiEndpoints: ["GET /api/invoices", "POST /api/invoices"],
    deliveryMode: "agile",
    deliveryPlan: [{ id: "plan-1", title: "Sprint 1", tasks: [] }],
    sprintProposal: [{ id: "sprint-1", title: "Sprint 1", tasks: [] }],
    provenanceSummary: {
      imported: 1,
      generated: 2,
      manual: 3,
      overridden: 1,
    },
    framing: {
      executiveSnapshot: ["Agile delivery is on track."],
      readinessGaps: ["No blocking gaps detected."],
      topBlockers: ["Requirements are linked and ready."],
      recommendedNextActions: ["Start with Sprint 1."],
      traceabilityHighlights: ["API coverage includes GET /api/invoices."],
      implementationProvenance: ["Requirements contributes 4 task(s) to the current plan."],
    },
    nonSummaryNodes: [
      createNode({
        id: "brief-node",
        type: "project_brief",
        label: "Project Brief",
      }),
    ],
    allNodesDone: true,
    isProjectReady: true,
    incompleteNodeCount: 0,
  });
});

describe("SummaryNodeEditor", () => {
  test("renders the richer framing as a read-only summary view", () => {
    const markup = renderToStaticMarkup(
      <SummaryNodeEditor
        node={createNode({ type: "summary", label: "Summary" })}
        onCloseAction={() => {}}
      />,
    );

    expect(markup).toContain("Read-only");
    expect(markup).toContain("Executive Snapshot");
    expect(markup).toContain("Readiness Gap");
    expect(markup).toContain("Top Blockers");
    expect(markup).toContain("Recommended Next Actions");
    expect(markup).toContain("Traceability Highlights");
    expect(markup).toContain("Implementation Provenance");
    expect(markup).not.toContain("<input");
    expect(markup).not.toContain("<textarea");
  });
});
