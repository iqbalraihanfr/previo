import { describe, expect, it } from "vitest";

import { getNodeCapability, NODE_CAPABILITIES } from "@/lib/nodeCapabilities";

describe("node capabilities", () => {
  it("defines import-first and derived behavior for core nodes", () => {
    expect(NODE_CAPABILITIES.project_brief).toMatchObject({
      classification: "capture_first",
      manualEntryMode: "primary",
      supportsManualStructured: true,
      isDerived: false,
    });

    expect(NODE_CAPABILITIES.task_board).toMatchObject({
      classification: "derived_primary",
      manualEntryMode: "primary",
      supportsGenerate: true,
      isDerived: true,
    });

    expect(NODE_CAPABILITIES.summary).toMatchObject({
      classification: "derived_only",
      manualEntryMode: "none",
      supportsManualStructured: false,
      isDerived: true,
    });
  });

  it("separates manual entry policy by node maturity", () => {
    expect(NODE_CAPABILITIES.requirements.manualEntryMode).toBe("secondary");
    expect(NODE_CAPABILITIES.erd.manualEntryMode).toBe("secondary");
    expect(NODE_CAPABILITIES.use_cases.manualEntryMode).toBe("review_only");
    expect(NODE_CAPABILITIES.dfd.manualEntryMode).toBe("review_only");
  });

  it("falls back to a safe manual-structured capability for unknown nodes", () => {
    expect(getNodeCapability("unknown_node")).toEqual({
      classification: "capture_first",
      supportedImports: ["manual_structured"],
      supportsGenerate: false,
      manualEntryMode: "primary",
      supportsManualStructured: true,
      isDerived: false,
    });
  });

  it("does not expose legacy custom nodes in the canonical runtime map", () => {
    expect("custom" in NODE_CAPABILITIES).toBe(false);
  });
});
