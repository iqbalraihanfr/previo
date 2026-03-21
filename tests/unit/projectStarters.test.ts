import { describe, expect, it } from "vitest";

import { getDomainStarterSeed } from "@/lib/projectStarters";

describe("project starters", () => {
  it("returns no starter seed for none intensity", () => {
    expect(getDomainStarterSeed("saas", "none")).toBeUndefined();
  });

  it("returns a neutral brief for general light starters", () => {
    const starter = getDomainStarterSeed("general", "light");

    expect(starter?.brief.background).toContain("Define the product problem");
    expect(starter?.requirements).toBeUndefined();
  });

  it("returns brief-only starter for light domain seeds", () => {
    const starter = getDomainStarterSeed("ecommerce", "light");

    expect(starter?.brief.target_users).toContain("Customer / Buyer");
    expect(starter?.requirements).toBeUndefined();
    expect(starter?.erd).toBeUndefined();
  });

  it("returns richer seeded artifacts for rich domains when available", () => {
    const starter = getDomainStarterSeed("saas", "rich");

    expect(starter?.requirements?.items.length).toBeGreaterThan(0);
    expect(starter?.erd?.entities.length).toBeGreaterThan(0);
    expect(starter?.mermaid?.flowchart).toContain("flowchart TD");
  });
});
