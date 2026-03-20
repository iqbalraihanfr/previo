import { describe, expect, test } from "vitest";
import {
  normalizeStringArray,
  parseModelObject,
  parseModelStringArray,
} from "../../src/lib/ai/json";

describe("AI JSON parsing helpers", () => {
  test("parses a fenced JSON array and normalizes duplicates", () => {
    const raw = '```json\n["  Next.js 15  ", "PostgreSQL", "Next.js 15"]\n```';

    expect(parseModelStringArray(raw)).toEqual(["Next.js 15", "PostgreSQL"]);
  });

  test("extracts a JSON array from mixed model output", () => {
    const raw = 'Here are the suggestions:\n["Admin", "Operator", "Customer"]';

    expect(parseModelStringArray(raw)).toEqual([
      "Admin",
      "Operator",
      "Customer",
    ]);
  });

  test("parses a JSON object wrapped in prose", () => {
    const raw =
      'Result:\n{"name":"Archway","background":"Planning tool","objectives":["Clarify scope"]}';

    expect(parseModelObject<{ name: string; background: string }>(raw)).toMatchObject({
      name: "Archway",
      background: "Planning tool",
    });
  });

  test("normalizeStringArray trims, drops blanks, and preserves order", () => {
    expect(normalizeStringArray(["  Alpha  ", "", "Beta", "Alpha"])).toEqual([
      "Alpha",
      "Beta",
    ]);
  });

  test("throws when the response shape is wrong", () => {
    expect(() => parseModelStringArray('{"not":"an array"}')).toThrow(
      /array of strings/i
    );
  });
});
