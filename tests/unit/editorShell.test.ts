import { describe, expect, it } from "vitest";

import { getNodeCapability } from "@/lib/nodeCapabilities";
import {
  buildStructuredPreviewRows,
  getEditorSectionLinks,
  getInitialEditorShellMode,
  hasCanonicalStructuredData,
  hasEntryData,
  hasReferenceContent,
} from "@/components/editors/panel/editorShell";

describe("editor shell helpers", () => {
  it("keeps import-first nodes in entry mode until canonical data exists", () => {
    const capability = getNodeCapability("requirements");

    expect(
      getInitialEditorShellMode({
        capability,
        fields: {},
      }),
    ).toBe("entry");

    expect(
      getInitialEditorShellMode({
        capability,
        fields: {
          items: [{ id: "req-1", description: "User can review invoices" }],
        },
      }),
    ).toBe("review");
  });

  it("treats imported/generated metadata as entry completion even before manual edits", () => {
    expect(
      hasEntryData({
        fields: {},
        generationStatus: "generated",
      }),
    ).toBe(true);

    expect(
      hasEntryData({
        fields: {},
        sourceType: "jira_csv",
      }),
    ).toBe(true);
  });

  it("ignores free notes for canonical structured data detection", () => {
    expect(hasCanonicalStructuredData({ notes: "rough note" })).toBe(false);
    expect(
      hasCanonicalStructuredData({
        background: "Client portal for finance teams",
      }),
    ).toBe(true);
  });

  it("builds preview rows and section links for long-form editors", () => {
    expect(
      buildStructuredPreviewRows({
        background: "Portal",
        objectives: ["Faster close-out", "Shared reports"],
        notes: "ignored",
      }),
    ).toEqual([
      { label: "background", value: "Portal" },
      { label: "objectives", value: "Faster close-out +1 more" },
    ]);

    expect(getEditorSectionLinks("project_brief")).toHaveLength(4);
    expect(getEditorSectionLinks("erd")).toEqual([
      { id: "erd-entities", label: "Entities" },
      { id: "erd-relationships", label: "Relationships" },
    ]);
  });

  it("detects secondary reference content independently from canonical fields", () => {
    expect(
      hasReferenceContent({
        attachments: [],
        freeText: "",
        sqlSchema: "",
      }),
    ).toBe(false);

    expect(
      hasReferenceContent({
        attachments: [],
        freeText: "Keep vendor assumptions here",
        sqlSchema: "",
      }),
    ).toBe(true);
  });
});
