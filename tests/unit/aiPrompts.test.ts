import { describe, expect, test } from "vitest";
import {
  ASSIST_SYSTEM_PROMPT,
  IMPORT_DOCUMENT_SYSTEM_PROMPT,
  PARSE_SQL_SYSTEM_PROMPT,
  buildAssistPrompt,
  isAssistSection,
} from "../../src/lib/ai/prompts";

describe("AI prompt builders", () => {
  test("recognizes valid assist sections", () => {
    expect(isAssistSection("objectives")).toBe(true);
    expect(isAssistSection("unknown")).toBe(false);
  });

  test("buildAssistPrompt includes task, context, and requirements", () => {
    const prompt = buildAssistPrompt("scope_in", {
      name: "Archway",
      background: "Offline-first architecture workspace",
      objectives: ["Speed up project planning"],
      target_users: ["Solo developer"],
      scope_in: ["Project brief editor"],
    });

    expect(prompt).toContain("Task:");
    expect(prompt).toContain("Project: Archway");
    expect(prompt).toContain("Existing Scope Items:");
    expect(prompt).toContain("Do not repeat existing scope items.");
  });

  test("shared system prompts keep strict JSON contracts", () => {
    expect(ASSIST_SYSTEM_PROMPT).toContain("Return ONLY valid JSON");
    expect(IMPORT_DOCUMENT_SYSTEM_PROMPT).toContain('"success_metrics"');
    expect(PARSE_SQL_SYSTEM_PROMPT).toContain('"relationships"');
  });
});
