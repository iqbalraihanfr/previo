import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import type { NodeData } from "../../src/lib/db";
import {
  deriveDFDModel,
  deriveUseCaseDrafts,
} from "../../src/lib/nodeDerivations";
import { NodeSummarySection } from "../../src/components/editors/summary/renderers";
import type { SummaryContent } from "../../src/components/editors/summary/types";

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

describe("node derivations", () => {
  test("derives use cases from normalized brief, requirement, and story inputs", () => {
    const result = deriveUseCaseDrafts({
      briefFields: {
        target_users: ["Finance Admin"],
      },
      requirementFields: {
        items: [
          {
            id: "FR-1",
            description: "Generate monthly finance reports",
            priority: "Must",
          },
        ],
      },
      storyFields: {
        items: [
          {
            id: "US-1",
            role: "Finance Admin",
            goal: "Generate monthly reports",
            benefit: "month-end closes faster",
            related_requirement: "FR-1",
          },
        ],
      },
    });

    expect(result.actors).toEqual(["Finance Admin"]);
    expect(result.useCases).toEqual([
      {
        id: "US-1",
        name: "Generate monthly reports",
        primary_actor: "Finance Admin",
        secondary_actors: [],
        description: "month-end closes faster",
        preconditions: ["Requirement available: Generate monthly finance reports"],
        postconditions: ["Outcome achieved: month-end closes faster"],
        main_flow: [
          {
            actor: "Finance Admin",
            action: "Generate monthly reports",
          },
        ],
        alternative_flows: [],
        related_user_stories: ["US-1"],
        include_extend: [],
      },
    ]);
  });

  test("derives dfd nodes from brief, use cases, and erd inputs", () => {
    const result = deriveDFDModel({
      briefFields: {
        target_users: ["Customer"],
      },
      useCaseFields: {
        useCases: [
          {
            id: "UC-1",
            name: "Submit Order",
            primary_actor: "Customer",
            secondary_actors: [],
            description: "",
            preconditions: [],
            postconditions: [],
            main_flow: [],
            alternative_flows: [],
            related_user_stories: [],
            include_extend: [],
          },
        ],
      },
      erdFields: {
        entities: [
          {
            name: "ORDERS",
          },
        ],
      },
    });

    expect(result.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Customer", type: "entity" }),
        expect.objectContaining({
          label: "Submit Order",
          type: "process",
          related_use_case: "UC-1",
        }),
        expect.objectContaining({
          label: "ORDERS",
          type: "datastore",
          related_erd_entity: "ORDERS",
        }),
      ]),
    );
    expect(result.flows).toHaveLength(2);
  });

  test("does not render free-form notes in node summary output", () => {
    const node = createNode({
      id: "brief-node",
      type: "project_brief",
      label: "Project Brief",
    });

    const content: SummaryContent = {
      id: "content-1",
      node_id: "brief-node",
      updated_at: "2026-03-20T00:00:00.000Z",
      mermaid_auto: "",
      structured_fields: {
        name: "Invoice Portal",
        background: "Automate invoice handling.",
        notes: "Internal scratchpad that must stay out of summary.",
      } as SummaryContent["structured_fields"] & { notes: string },
    };

    const markup = renderToStaticMarkup(
      <NodeSummarySection node={node} content={content} />,
    );

    expect(markup).toContain("Invoice Portal");
    expect(markup).toContain("Automate invoice handling.");
    expect(markup).not.toContain("Internal scratchpad");
  });
});
