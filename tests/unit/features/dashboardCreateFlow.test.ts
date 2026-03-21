import { describe, expect, it } from "vitest";

import { CREATE_PROJECT_STEPS } from "@/features/dashboard/components/CreateProjectDialog";
import {
  PROJECT_DOMAIN_OPTIONS,
  STARTER_INTENSITY_OPTIONS,
  getDomainStarterSeed,
} from "@/lib/projectStarters";

describe("dashboard create flow model", () => {
  it("exposes the staged create flow copy", () => {
    expect(CREATE_PROJECT_STEPS.map((step) => step.label)).toEqual([
      "Basics",
      "Workflow",
      "Delivery",
      "Advanced",
    ]);
  });

  it("keeps domain metadata separate from workflow seeding", () => {
    expect(PROJECT_DOMAIN_OPTIONS.map((option) => option.value)).toEqual([
      "saas",
      "ecommerce",
      "mobile_web",
      "internal_tool",
      "marketplace",
      "content_platform",
    ]);
  });

  it("maps starter content intensity to existing seeded content bundles", () => {
    expect(getDomainStarterSeed("general", "none")).toBeUndefined();
    expect(getDomainStarterSeed("saas", "light")?.brief.background).toContain(
      "subscription-based",
    );
    expect(getDomainStarterSeed("marketplace", "rich")?.brief.background).toContain(
      "marketplace",
    );
    expect(STARTER_INTENSITY_OPTIONS.map((option) => option.value)).toEqual([
      "none",
      "light",
      "rich",
    ]);
  });
});
