import type {
  NodeContent,
  NodeData,
  ReadinessSnapshot,
  ValidationWarning,
} from "@/lib/db";
import {
  type ProjectBriefFields,
  type RequirementFieldItem,
  type RequirementFields,
} from "@/lib/canonical";
import { getCanonicalNodeFields } from "@/lib/canonicalContent";

export type ReadinessIssueCategory =
  | "blocking"
  | "coverage_gap"
  | "quality_warning";

export interface ReadinessIssue {
  id: string;
  category: ReadinessIssueCategory;
  title: string;
  message: string;
  sourceNodeId: string;
  targetNodeType?: string;
  sectionId?: string;
  itemLabel?: string;
  resolutionHint?: string;
}

export interface ReadinessModel {
  status: "not_ready" | "needs_review" | "ready_for_planning";
  statusLabel: string;
  statusSummary: string;
  blockers: ReadinessIssue[];
  coverageGaps: ReadinessIssue[];
  qualityWarnings: ReadinessIssue[];
  nextActions: string[];
}

export const READINESS_GENERATION_VERSION = 1;

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asStringList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => asString(item))
    .filter(Boolean);
}

function getNodeByType(nodes: NodeData[], type: string) {
  return nodes.find((node) => node.type === type) ?? null;
}

function getContentByNodeId(contents: NodeContent[], nodeId?: string | null) {
  if (!nodeId) return undefined;
  return contents.find((content) => content.node_id === nodeId);
}

export function buildProjectReadinessModel(params: {
  nodes: NodeData[];
  contents: NodeContent[];
  warnings: ValidationWarning[];
}): ReadinessModel {
  const { nodes, contents, warnings } = params;
  const blockers: ReadinessIssue[] = [];
  const coverageGaps: ReadinessIssue[] = [];
  const qualityWarnings: ReadinessIssue[] = [];

  const briefNode = getNodeByType(nodes, "project_brief");
  const requirementsNode = getNodeByType(nodes, "requirements");
  const briefFields: ProjectBriefFields = getCanonicalNodeFields(
    "project_brief",
    getContentByNodeId(contents, briefNode?.id),
  );
  const requirementFields: RequirementFields = getCanonicalNodeFields(
    "requirements",
    getContentByNodeId(contents, requirementsNode?.id),
  );
  const scopeIn = asStringList(briefFields.scope_in);
  const targetUsers = asStringList(briefFields.target_users);
  const objectives = asStringList(briefFields.objectives);
  const requirementItems = requirementFields.items ?? [];
  const frItems = requirementItems.filter((item) => {
    return asString(item.type || "FR").toUpperCase() === "FR";
  }) as RequirementFieldItem[];

  if (briefNode) {
    if (!asString(briefFields.name)) {
      blockers.push({
        id: "brief-name",
        category: "blocking",
        title: "Brief name missing",
        message: "The imported brief still needs a project name before handoff.",
        sourceNodeId: briefNode.id,
        sectionId: "project-brief-context",
        itemLabel: "Project name",
        resolutionHint:
          "Add a clear project title so the brief can anchor every downstream node.",
      });
    }
    if (!asString(briefFields.background)) {
      blockers.push({
        id: "brief-background",
        category: "blocking",
        title: "Brief context missing",
        message: "The brief still needs background/context before implementation review.",
        sourceNodeId: briefNode.id,
        sectionId: "project-brief-context",
        itemLabel: "Background",
        resolutionHint:
          "Capture the client context before deriving downstream planning artifacts.",
      });
    }
    if (targetUsers.length === 0) {
      blockers.push({
        id: "brief-target-users",
        category: "blocking",
        title: "Target users missing",
        message: "Add at least one target user to make downstream traceability meaningful.",
        sourceNodeId: briefNode.id,
        sectionId: "project-brief-strategic-context",
        itemLabel: "Target users",
        resolutionHint:
          "Define who will use the product so stories and use cases stay grounded.",
      });
    }
    if (scopeIn.length === 0) {
      blockers.push({
        id: "brief-scope-in",
        category: "blocking",
        title: "Scope is still empty",
        message: "At least one scope item is required before requirement mapping is reliable.",
        sourceNodeId: briefNode.id,
        sectionId: "project-brief-boundaries",
        itemLabel: "Scope in",
        resolutionHint:
          "Add the client-approved scope before linking requirements.",
      });
    }
    if (objectives.length === 0) {
      blockers.push({
        id: "brief-objectives",
        category: "blocking",
        title: "Objectives missing",
        message: "Add at least one objective so the brief can anchor implementation goals.",
        sourceNodeId: briefNode.id,
        sectionId: "project-brief-strategic-context",
        itemLabel: "Objectives",
        resolutionHint:
          "Record what success looks like before moving into planning.",
      });
    }
  }

  if (requirementsNode) {
    if (frItems.length === 0) {
      blockers.push({
        id: "requirements-fr",
        category: "blocking",
        title: "No functional requirements",
        message: "At least one functional requirement is required to generate an implementation plan.",
        sourceNodeId: requirementsNode.id,
        sectionId: "requirements-items",
        itemLabel: "Functional requirements",
        resolutionHint: "Add or import at least one FR before generating tasks.",
      });
    }

    if (scopeIn.length > 0) {
      const missingScopeLinks = frItems.filter(
        (item) => !asString(item.related_scope),
      );
      if (missingScopeLinks.length > 0) {
        coverageGaps.push({
          id: "requirements-missing-scope-links",
          category: "coverage_gap",
          title: "Requirements are not linked to brief scope",
          message: `${missingScopeLinks.length} functional requirement(s) still need a related scope.`,
          sourceNodeId: requirementsNode.id,
          targetNodeType: "project_brief",
          sectionId: "requirements-items",
          itemLabel: `${missingScopeLinks.length} FR item(s)`,
          resolutionHint:
            "Map each functional requirement to a brief scope item to keep traceability intact.",
        });
      }
    }
  }

  warnings.forEach((warning) => {
    const issue: ReadinessIssue = {
      id: warning.id,
      category:
        warning.severity === "error"
          ? "blocking"
          : warning.severity === "warning"
            ? "coverage_gap"
            : "quality_warning",
      title: warning.message,
      message: warning.message,
      sourceNodeId: warning.source_node_id,
      targetNodeType: warning.target_node_type,
    };

    if (issue.category === "blocking") {
      blockers.push(issue);
    } else if (issue.category === "coverage_gap") {
      coverageGaps.push(issue);
    } else {
      qualityWarnings.push(issue);
    }
  });

  const status =
    blockers.length > 0
      ? "not_ready"
      : coverageGaps.length > 0 || qualityWarnings.length > 0
        ? "needs_review"
        : "ready_for_planning";
  const statusLabel =
    status === "not_ready"
      ? "Not ready"
      : status === "needs_review"
        ? "Needs review"
        : "Ready for planning";
  const statusSummary =
    status === "not_ready"
      ? "Blocking issues still prevent reliable implementation planning."
      : status === "needs_review"
        ? "Core data exists, but traceability and quality checks still need review."
        : "Core planning artifacts are aligned enough to move into implementation planning.";
  const nextActions: string[] = [];
  if (blockers.length > 0) {
    nextActions.push(
      "Resolve project brief blockers before generating or grooming tasks.",
    );
  }
  if (coverageGaps.length > 0) {
    nextActions.push(
      "Close the remaining traceability gaps between brief, requirements, and downstream artifacts.",
    );
  }
  if (qualityWarnings.length > 0) {
    nextActions.push(
      "Review quality warnings after blockers and coverage gaps are closed.",
    );
  }
  if (nextActions.length === 0) {
    nextActions.push(
      "The workspace is ready for planning and implementation handoff.",
    );
  }

  return {
    status,
    statusLabel,
    statusSummary,
    blockers,
    coverageGaps,
    qualityWarnings,
    nextActions,
  };
}

export function buildReadinessSnapshot(params: {
  projectId: string;
  readiness: ReadinessModel;
  computedAt?: string;
}): ReadinessSnapshot {
  const computedAt = params.computedAt ?? new Date().toISOString();

  return {
    id: params.projectId,
    project_id: params.projectId,
    status: params.readiness.status,
    status_label: params.readiness.statusLabel,
    status_summary: params.readiness.statusSummary,
    blockers_count: params.readiness.blockers.length,
    coverage_gaps_count: params.readiness.coverageGaps.length,
    quality_warnings_count: params.readiness.qualityWarnings.length,
    next_actions: params.readiness.nextActions,
    computed_at: computedAt,
    generation_version: READINESS_GENERATION_VERSION,
  };
}
