import type { SourceType } from "@/lib/db";

export type NodeClassification =
  | "capture_first"
  | "import_first"
  | "derived_assisted"
  | "derived_primary"
  | "derived_only";

export type ManualEntryMode =
  | "primary"
  | "secondary"
  | "review_only"
  | "none";

export interface NodeCapability {
  classification: NodeClassification;
  supportedImports: SourceType[];
  supportsGenerate: boolean;
  manualEntryMode: ManualEntryMode;
  supportsManualStructured: boolean;
  isDerived: boolean;
}

export const NODE_CAPABILITIES: Record<string, NodeCapability> = {
  project_brief: {
    classification: "capture_first",
    supportedImports: ["brief_doc", "meeting_text", "manual_structured"],
    supportsGenerate: false,
    manualEntryMode: "primary",
    supportsManualStructured: true,
    isDerived: false,
  },
  requirements: {
    classification: "import_first",
    supportedImports: ["requirements_doc", "manual_structured"],
    supportsGenerate: false,
    manualEntryMode: "secondary",
    supportsManualStructured: true,
    isDerived: false,
  },
  user_stories: {
    classification: "import_first",
    supportedImports: ["jira_csv", "linear_csv", "manual_structured"],
    supportsGenerate: false,
    manualEntryMode: "secondary",
    supportsManualStructured: true,
    isDerived: false,
  },
  use_cases: {
    classification: "derived_assisted",
    supportedImports: ["requirements_doc", "manual_structured"],
    supportsGenerate: true,
    manualEntryMode: "review_only",
    supportsManualStructured: true,
    isDerived: true,
  },
  flowchart: {
    classification: "import_first",
    supportedImports: ["mermaid", "manual_structured"],
    supportsGenerate: false,
    manualEntryMode: "secondary",
    supportsManualStructured: true,
    isDerived: false,
  },
  dfd: {
    classification: "derived_assisted",
    supportedImports: ["mermaid", "manual_structured"],
    supportsGenerate: true,
    manualEntryMode: "review_only",
    supportsManualStructured: true,
    isDerived: true,
  },
  erd: {
    classification: "import_first",
    supportedImports: ["dbml", "sql_schema", "manual_structured"],
    supportsGenerate: false,
    manualEntryMode: "secondary",
    supportsManualStructured: true,
    isDerived: false,
  },
  sequence: {
    classification: "import_first",
    supportedImports: ["mermaid", "manual_structured"],
    supportsGenerate: false,
    manualEntryMode: "secondary",
    supportsManualStructured: true,
    isDerived: false,
  },
  task_board: {
    classification: "derived_primary",
    supportedImports: ["jira_csv", "linear_csv"],
    supportsGenerate: true,
    manualEntryMode: "primary",
    supportsManualStructured: true,
    isDerived: true,
  },
  summary: {
    classification: "derived_only",
    supportedImports: [],
    supportsGenerate: true,
    manualEntryMode: "none",
    supportsManualStructured: false,
    isDerived: true,
  },
  custom: {
    classification: "capture_first",
    supportedImports: ["manual_structured"],
    supportsGenerate: false,
    manualEntryMode: "primary",
    supportsManualStructured: true,
    isDerived: false,
  },
};

export function getNodeCapability(nodeType: string): NodeCapability {
  return (
    NODE_CAPABILITIES[nodeType] ?? {
      classification: "capture_first",
      supportedImports: ["manual_structured"],
      supportsGenerate: false,
      manualEntryMode: "primary",
      supportsManualStructured: true,
      isDerived: false,
    }
  );
}
