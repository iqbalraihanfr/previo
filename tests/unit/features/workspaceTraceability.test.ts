import { describe, expect, it } from "vitest";

import type { NodeContent, NodeData, SourceArtifact } from "@/lib/db";
import { buildWorkspaceTraceabilityModel } from "@/features/workspace/traceability";

function createNode(overrides: Partial<NodeData>): NodeData {
  return {
    id: "node-1",
    project_id: "project-1",
    type: "project_brief",
    label: "Project Brief",
    status: "Done",
    position_x: 0,
    position_y: 0,
    sort_order: 0,
    updated_at: "2026-03-20T00:00:00.000Z",
    ...overrides,
  };
}

function createContent(overrides: Partial<NodeContent>): NodeContent {
  return {
    id: "content-1",
    node_id: "node-1",
    structured_fields: {},
    mermaid_auto: "",
    updated_at: "2026-03-20T00:00:00.000Z",
    ...overrides,
  };
}

function createArtifact(overrides: Partial<SourceArtifact>): SourceArtifact {
  return {
    id: "artifact-1",
    project_id: "project-1",
    node_id: "node-1",
    source_type: "brief_doc",
    title: "Imported brief",
    raw_content: "",
    normalized_data: {},
    parser_version: "v1",
    created_at: "2026-03-20T00:00:00.000Z",
    updated_at: "2026-03-20T00:00:00.000Z",
    ...overrides,
  };
}

describe("workspace traceability model", () => {
  it("derives structured trace links and provenance cards without graph edges", () => {
    const nodes = [
      createNode({
        id: "brief-node",
        type: "project_brief",
        label: "Project Brief",
        source_type: "brief_doc",
        source_artifact_id: "artifact-1",
        imported_at: "2026-03-20T00:00:00.000Z",
        generation_status: "imported",
      }),
      createNode({
        id: "requirements-node",
        type: "requirements",
        label: "Requirements",
        sort_order: 1,
      }),
      createNode({
        id: "stories-node",
        type: "user_stories",
        label: "User Stories",
        sort_order: 2,
      }),
      createNode({
        id: "use-cases-node",
        type: "use_cases",
        label: "Use Cases",
        sort_order: 3,
      }),
      createNode({
        id: "flowchart-node",
        type: "flowchart",
        label: "Flowchart",
        sort_order: 4,
      }),
      createNode({
        id: "sequence-node",
        type: "sequence",
        label: "Sequence",
        sort_order: 5,
      }),
    ];

    const contents = [
      createContent({
        id: "brief-content",
        node_id: "brief-node",
        structured_fields: {
          scope_in: ["Self-service signup"],
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
              description: "Allow sign up via email",
              related_scope: "Self-service signup",
            },
          ],
        },
      }),
      createContent({
        id: "stories-content",
        node_id: "stories-node",
        structured_fields: {
          items: [
            {
              id: "story-1",
              role: "Visitor",
              goal: "Create an account",
              benefit: "Start using the app",
              related_requirement: "req-1",
            },
          ],
        },
      }),
      createContent({
        id: "use-cases-content",
        node_id: "use-cases-node",
        structured_fields: {
          useCases: [
            {
              id: "uc-1",
              name: "Sign up",
              related_user_stories: ["story-1"],
            },
          ],
        },
      }),
      createContent({
        id: "flowchart-content",
        node_id: "flowchart-node",
        structured_fields: {
          flows: [{ id: "flow-1", related_use_case: "uc-1" }],
        },
      }),
      createContent({
        id: "sequence-content",
        node_id: "sequence-node",
        structured_fields: {
          related_use_case: "uc-1",
          messages: [],
        },
      }),
    ];

    const artifacts = [createArtifact({ node_id: "brief-node" })];

    const model = buildWorkspaceTraceabilityModel({
      nodes,
      contents,
      sourceArtifacts: artifacts,
    });

    const briefSection = model.sections.find(
      (section) => section.id === "brief-requirements",
    );
    const requirementsSection = model.sections.find(
      (section) => section.id === "requirements-stories",
    );
    const storiesSection = model.sections.find(
      (section) => section.id === "stories-use-cases",
    );

    expect(briefSection?.rows[0]).toMatchObject({
      sourceLabel: "Self-service signup",
      relationLabel: "related_scope",
      evidenceLabel: "Linked by requirement scope",
      status: "linked",
    });
    expect(briefSection?.rows[0].targetLabels[0]).toContain("FR-001");
    expect(briefSection?.rows[0].targetLabels[0]).toContain(
      "Allow sign up via email",
    );

    expect(requirementsSection?.rows[0].targetLabels[0]).toContain("US-001");
    expect(requirementsSection?.rows[0].targetLabels[0]).toContain(
      "Create an account",
    );

    expect(storiesSection?.rows[0].targetLabels[0]).toContain("UC-001");
    expect(storiesSection?.rows[0].targetLabels[0]).toContain("Sign up");

    expect(model.artifactCards[0]).toMatchObject({
      nodeLabel: "Project Brief",
      title: "Imported brief",
      sourceTypeLabel: "Brief document",
      generationLabel: "Imported source",
    });
    expect(briefSection?.rows[0].navigationTarget).toMatchObject({
      nodeId: "requirements-node",
      label: "Requirements",
    });
    expect(model.summary.imported).toBe(1);
    expect(model.linkedRowCount).toBeGreaterThanOrEqual(3);
  });
});
