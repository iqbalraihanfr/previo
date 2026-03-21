import { describe, expect, it } from "vitest";

import { revalidateResolvedNodeImport } from "@/lib/sourceIntake";

describe("source intake review", () => {
  it("flags unresolved brief fields before canonical save", () => {
    const result = revalidateResolvedNodeImport(
      {
        nodeType: "project_brief",
        fields: {},
        sourceType: "brief_doc",
        rawContent: "raw",
        parserVersion: "v1",
        title: "Imported brief",
      },
      {
        name: "",
        background: "",
        target_users: [],
        scope_in: [],
        objectives: [],
      },
    );

    expect(result.unresolvedFields).toContain("name");
    expect(result.unresolvedFields).toContain("background");
    expect(result.issues.some((issue) => issue.field === "scope_in")).toBe(true);
  });

  it("flags requirement rows that miss category and related scope", () => {
    const result = revalidateResolvedNodeImport(
      {
        nodeType: "requirements",
        fields: {},
        sourceType: "requirements_doc",
        rawContent: "raw",
        parserVersion: "v1",
        title: "Imported requirements",
        reviewContext: {
          briefScopeOptions: ["Self-service signup"],
        },
      },
      {
        items: [
          {
            id: "req-1",
            type: "FR",
            description: "Allow sign up via email",
            category: "",
            related_scope: "",
          },
        ],
      },
    );

    expect(result.unresolvedFields).toContain("items[0].category");
    expect(result.unresolvedFields).toContain("items[0].related_scope");
    expect(
      result.issues.some((issue) =>
        issue.message.includes("not linked to any brief scope item"),
      ),
    ).toBe(true);
  });
});
