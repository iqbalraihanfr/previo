import { describe, expect, it } from "vitest";

import {
  createEmptyArtifactInput,
  DELIVERY_MODE_LABELS,
  GENERATION_STATUS_LABELS,
  OVERRIDE_STATUS_LABELS,
  SOURCE_ARTIFACT_PARSER_VERSION,
  SOURCE_TYPE_LABELS,
} from "@/lib/sourceArtifacts";

describe("source artifact metadata", () => {
  it("exposes stable labels for source and delivery metadata", () => {
    expect(SOURCE_TYPE_LABELS.dbml).toBe("DBML schema");
    expect(DELIVERY_MODE_LABELS.hybrid).toBe("Hybrid");
    expect(GENERATION_STATUS_LABELS.imported).toBe("Imported source");
    expect(OVERRIDE_STATUS_LABELS.manual_override).toBe("Manual override");
  });

  it("creates empty source artifacts with parser metadata", () => {
    expect(
      createEmptyArtifactInput({
        project_id: "project-1",
        node_id: "node-1",
        source_type: "requirements_doc",
      }),
    ).toEqual({
      project_id: "project-1",
      node_id: "node-1",
      source_type: "requirements_doc",
      title: "Requirements doc",
      raw_content: "",
      normalized_data: {},
      parser_version: SOURCE_ARTIFACT_PARSER_VERSION,
    });
  });
});
