import type { Attachment, GenerationStatus, SourceType } from "@/lib/db";
import type { NodeCapability } from "@/lib/nodeCapabilities";

export type EditorShellMode = "entry" | "review" | "editing" | "meta";

export interface EditorSectionLink {
  id: string;
  label: string;
}

function hasMeaningfulValue(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number" || typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.some((item) => hasMeaningfulValue(item));
  if (typeof value === "object") {
    return Object.values(value).some((entry) => hasMeaningfulValue(entry));
  }
  return false;
}

export function hasCanonicalStructuredData(fields: Record<string, unknown>) {
  return Object.entries(fields).some(([key, value]) => {
    if (key === "notes" || key === "sql") return false;
    return hasMeaningfulValue(value);
  });
}

export function hasReferenceContent(params: {
  attachments: Attachment[];
  freeText: string;
  sqlSchema: string;
}) {
  const { attachments, freeText, sqlSchema } = params;
  return (
    attachments.length > 0 ||
    freeText.trim().length > 0 ||
    sqlSchema.trim().length > 0
  );
}

export function hasEntryData(params: {
  fields: Record<string, unknown>;
  sourceType?: SourceType;
  generationStatus?: GenerationStatus;
}) {
  const { fields, sourceType, generationStatus = "none" } = params;
  if (hasCanonicalStructuredData(fields)) return true;
  if (sourceType) return true;
  return generationStatus !== "none";
}

export function getInitialEditorShellMode(params: {
  capability: NodeCapability;
  fields: Record<string, unknown>;
  sourceType?: SourceType;
  generationStatus?: GenerationStatus;
}) {
  const { capability, fields, sourceType, generationStatus } = params;

  if (capability.manualEntryMode === "none") {
    return "review" as const;
  }

  if (!hasEntryData({ fields, sourceType, generationStatus })) {
    return "entry" as const;
  }

  return "review" as const;
}

export function buildStructuredPreviewRows(fields: Record<string, unknown>) {
  return Object.entries(fields)
    .filter(([key]) => key !== "notes" && key !== "sql")
    .filter(([, value]) => hasMeaningfulValue(value))
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        const firstItem = value[0];
        const sample =
          typeof firstItem === "string"
            ? firstItem
            : firstItem && typeof firstItem === "object"
              ? String(
                  (firstItem as Record<string, unknown>).name ??
                    (firstItem as Record<string, unknown>).title ??
                    (firstItem as Record<string, unknown>).label ??
                    (firstItem as Record<string, unknown>).primary_actor ??
                    "",
                )
              : "";
        return {
          label: key.replace(/_/g, " "),
          value:
            sample.trim().length > 0
              ? `${sample}${value.length > 1 ? ` +${value.length - 1} more` : ""}`
              : `${value.length} item(s)`,
        };
      }

      if (typeof value === "object") {
        return {
          label: key.replace(/_/g, " "),
          value: `${Object.keys(value as Record<string, unknown>).length} field(s)`,
        };
      }

      const text = String(value);
      return {
        label: key.replace(/_/g, " "),
        value: text.length > 96 ? `${text.slice(0, 96)}...` : text,
      };
    })
    .slice(0, 8);
}

export function getEditorSectionLinks(nodeType: string): EditorSectionLink[] {
  switch (nodeType) {
    case "project_brief":
      return [
        { id: "project-brief-context", label: "Context" },
        { id: "project-brief-boundaries", label: "Boundaries" },
        { id: "project-brief-tech", label: "Tech" },
        { id: "project-brief-refs", label: "References" },
      ];
    case "requirements":
      return [
        { id: "requirements-overview", label: "Overview" },
        { id: "requirements-validation", label: "Validation" },
        { id: "requirements-items", label: "Items" },
      ];
    case "use_cases":
      return [
        { id: "use-cases-actors", label: "Actors" },
        { id: "use-cases-protocols", label: "Protocols" },
      ];
    case "erd":
      return [
        { id: "erd-entities", label: "Entities" },
        { id: "erd-relationships", label: "Relationships" },
      ];
    default:
      return [];
  }
}

export function getEntryStateCopy(params: {
  nodeLabel: string;
  capability: NodeCapability;
  importableSourceLabels: string[];
}) {
  const { nodeLabel, capability, importableSourceLabels } = params;
  const importSummary =
    importableSourceLabels.length > 0
      ? `Supported source: ${importableSourceLabels.join(", ")}.`
      : "No external source import is available for this node.";

  switch (capability.classification) {
    case "capture_first":
      return {
        eyebrow: "Capture-first workspace",
        title: `Start shaping ${nodeLabel}`,
        description:
          "Capture the first structured version of this node, then refine it as the project evolves.",
        importSummary,
      };
    case "import_first":
      return {
        eyebrow: "Import-first workspace",
        title: `Bring existing ${nodeLabel} into Previo`,
        description:
          "Use an existing artifact as the canonical source, then edit only the structured fields you still need.",
        importSummary,
      };
    case "derived_assisted":
      return {
        eyebrow: "Derived-assisted workspace",
        title: `Generate or import ${nodeLabel}`,
        description:
          "This node works best when generated from upstream context. Review and refine after the first draft exists.",
        importSummary,
      };
    default:
      return {
        eyebrow: "Structured workspace",
        title: nodeLabel,
        description:
          "Review the normalized structure and keep supporting notes in the reference area.",
        importSummary,
      };
  }
}
