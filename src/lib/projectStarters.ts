import type { ProjectBriefFields } from "@/components/editors/ProjectBriefEditor";
import {
  getContentTemplate,
  type ContentTemplate,
  type RequirementItem,
} from "@/lib/contentTemplates";
import type { ProjectDomain, StarterContentIntensity } from "@/lib/db";

export type ProjectDomainOption = {
  value: ProjectDomain;
  label: string;
  description: string;
};

export type StarterIntensityOption = {
  value: StarterContentIntensity;
  label: string;
  description: string;
};

export const PROJECT_DOMAIN_OPTIONS: ProjectDomainOption[] = [
  {
    value: "saas",
    label: "SaaS",
    description: "Subscription product with multi-role workflows and billing.",
  },
  {
    value: "ecommerce",
    label: "Ecommerce",
    description: "Storefront, catalog, cart, checkout, and operations.",
  },
  {
    value: "mobile_web",
    label: "Mobile Web",
    description: "Mobile-first browser experience with responsive journeys.",
  },
  {
    value: "internal_tool",
    label: "Internal Tool",
    description: "Operations dashboard or workflow system for internal teams.",
  },
  {
    value: "marketplace",
    label: "Marketplace",
    description: "Buyer-seller platform with listings, orders, and trust flows.",
  },
  {
    value: "content_platform",
    label: "Content Platform",
    description: "Publishing, discovery, subscription, or creator-led products.",
  },
];

export const STARTER_INTENSITY_OPTIONS: StarterIntensityOption[] = [
  {
    value: "none",
    label: "None",
    description: "Start with an empty canonical workflow and import your own sources.",
  },
  {
    value: "light",
    label: "Light",
    description: "Seed the project brief with context and starter terminology only.",
  },
  {
    value: "rich",
    label: "Rich",
    description: "Pre-fill the brief and, when available, requirements, schema, and diagrams.",
  },
];

const BASE_DOMAIN_COPY: Record<
  Exclude<ProjectDomain, "general">,
  {
    brief: Omit<ProjectBriefFields, "name">;
    requirements?: { items: RequirementItem[] };
    erd?: ContentTemplate["erd"];
    mermaid?: ContentTemplate["mermaid"];
  }
> = {
  saas: getContentTemplate("saas"),
  ecommerce: getContentTemplate("ecommerce"),
  internal_tool: getContentTemplate("internal_tool"),
  mobile_web: {
    brief: {
      background:
        "Build a mobile-first web experience that prioritizes speed, clarity, and conversion on smaller screens.",
      objectives: [
        "Keep core journeys comfortably usable on sub-400px screens",
        "Optimize loading and perceived performance for unreliable mobile networks",
        "Make conversion-critical paths feel short and obvious on touch devices",
      ],
      target_users: ["Mobile Visitor", "Returning User", "Content Manager"],
      scope_in: [
        "Responsive mobile-first layout system",
        "Fast landing and conversion flows",
        "Touch-friendly navigation and forms",
      ],
      scope_out: [
        "Native mobile app parity",
        "Tablet-specific complex layouts for v1",
      ],
      success_metrics: [
        { metric: "Mobile Lighthouse performance", target: "> 85" },
        { metric: "Mobile conversion completion", target: "> 55%" },
      ],
      constraints: [
        "Must work well on mid-range Android devices",
        "Images and scripts must stay optimized for slower networks",
      ],
      tech_stack: ["Next.js", "TypeScript", "Tailwind CSS"],
    },
  },
  marketplace: {
    brief: {
      background:
        "Create a marketplace where supply and demand can meet with enough trust, visibility, and operational control to support transactions.",
      objectives: [
        "Enable listing discovery and buyer conversion with minimal friction",
        "Give sellers clear tooling to manage listings and orders",
        "Reduce transactional ambiguity with statuses, messaging, and trust signals",
      ],
      target_users: ["Buyer", "Seller", "Marketplace Admin"],
      scope_in: [
        "Listings and search",
        "Seller onboarding",
        "Order lifecycle and notifications",
        "Admin moderation controls",
      ],
      scope_out: [
        "Advanced fraud tooling",
        "Cross-border tax automation",
      ],
      success_metrics: [
        { metric: "Listing-to-order conversion", target: "> 8%" },
        { metric: "Seller onboarding completion", target: "> 70%" },
      ],
      constraints: [
        "Trust and dispute flows must be explicit",
        "Search and listing quality directly affect adoption",
      ],
      tech_stack: ["Next.js", "PostgreSQL", "Tailwind CSS"],
    },
  },
  content_platform: {
    brief: {
      background:
        "Build a content platform that helps teams or creators publish, organize, and distribute content with strong discoverability.",
      objectives: [
        "Shorten publishing workflows for editors or creators",
        "Improve discovery of relevant content for end users",
        "Support subscriptions, gated content, or editorial operations when needed",
      ],
      target_users: ["Reader", "Editor", "Publisher Admin"],
      scope_in: [
        "Content publishing workflow",
        "Taxonomy and search",
        "Reader-facing discovery surfaces",
        "Editorial dashboard",
      ],
      scope_out: [
        "Community moderation at scale",
        "Advanced recommendation engine",
      ],
      success_metrics: [
        { metric: "Publishing lead time", target: "< 15 minutes" },
        { metric: "Reader engagement", target: "> 4 minutes/session" },
      ],
      constraints: [
        "Content quality and consistency must stay high",
        "SEO and metadata hygiene are required from day one",
      ],
      tech_stack: ["Next.js", "PostgreSQL", "Tailwind CSS", "MDX / CMS"],
    },
  },
};

export function getDomainStarterSeed(
  domain: ProjectDomain | undefined,
  intensity: StarterContentIntensity,
): ContentTemplate | undefined {
  if (intensity === "none") {
    return undefined;
  }

  if (!domain || domain === "general") {
    return intensity === "light"
      ? {
          key: "blank",
          label: "Neutral starter",
          description: "General-purpose starter brief with no domain assumptions.",
          emoji: "🧭",
          brief: {
            background:
              "Define the product problem, audience, and delivery constraints before detailing architecture decisions.",
            objectives: [
              "Clarify what the product must achieve",
              "Align scope, constraints, and success metrics early",
            ],
            target_users: [],
            scope_in: [],
            scope_out: [],
            success_metrics: [],
            constraints: [],
            tech_stack: [],
          },
        }
      : undefined;
  }

  const starter = BASE_DOMAIN_COPY[domain];

  if (intensity === "light") {
    return {
      key: "blank",
      label: `${domain} light starter`,
      description: "Domain-context starter brief.",
      emoji: "🧩",
      brief: starter.brief,
    };
  }

  return {
    key: "blank",
    label: `${domain} rich starter`,
    description: "Domain-context starter with broader seeded artifacts.",
    emoji: "🧩",
    brief: starter.brief,
    requirements: starter.requirements,
    erd: starter.erd,
    mermaid: starter.mermaid,
  };
}
