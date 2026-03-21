import type { NodeContent, NodeData, ValidationWarning } from "@/lib/db";

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
}

export interface ReadinessModel {
  statusLabel: string;
  blockers: ReadinessIssue[];
  coverageGaps: ReadinessIssue[];
  qualityWarnings: ReadinessIssue[];
}

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

function getFieldsByNodeId(contents: NodeContent[], nodeId?: string | null) {
  if (!nodeId) return {} as Record<string, unknown>;
  return (contents.find((content) => content.node_id === nodeId)?.structured_fields ??
    {}) as Record<string, unknown>;
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
  const briefFields = getFieldsByNodeId(contents, briefNode?.id);
  const requirementFields = getFieldsByNodeId(contents, requirementsNode?.id);
  const scopeIn = asStringList(briefFields.scope_in);
  const targetUsers = asStringList(briefFields.target_users);
  const objectives = asStringList(briefFields.objectives);
  const requirementItems = Array.isArray(requirementFields.items)
    ? requirementFields.items
    : [];
  const frItems = requirementItems.filter((item) => {
    const requirement = item as Record<string, unknown>;
    return asString(requirement.type || "FR").toUpperCase() === "FR";
  }) as Record<string, unknown>[];

  if (briefNode) {
    if (!asString(briefFields.name)) {
      blockers.push({
        id: "brief-name",
        category: "blocking",
        title: "Brief name missing",
        message: "The imported brief still needs a project name before handoff.",
        sourceNodeId: briefNode.id,
      });
    }
    if (!asString(briefFields.background)) {
      blockers.push({
        id: "brief-background",
        category: "blocking",
        title: "Brief context missing",
        message: "The brief still needs background/context before implementation review.",
        sourceNodeId: briefNode.id,
      });
    }
    if (targetUsers.length === 0) {
      blockers.push({
        id: "brief-target-users",
        category: "blocking",
        title: "Target users missing",
        message: "Add at least one target user to make downstream traceability meaningful.",
        sourceNodeId: briefNode.id,
      });
    }
    if (scopeIn.length === 0) {
      blockers.push({
        id: "brief-scope-in",
        category: "blocking",
        title: "Scope is still empty",
        message: "At least one scope item is required before requirement mapping is reliable.",
        sourceNodeId: briefNode.id,
      });
    }
    if (objectives.length === 0) {
      blockers.push({
        id: "brief-objectives",
        category: "blocking",
        title: "Objectives missing",
        message: "Add at least one objective so the brief can anchor implementation goals.",
        sourceNodeId: briefNode.id,
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

  const statusLabel =
    blockers.length > 0
      ? "Blocked"
      : coverageGaps.length > 0
        ? "Needs coverage work"
        : qualityWarnings.length > 0
          ? "Ready with warnings"
          : "Ready for implementation";

  return {
    statusLabel,
    blockers,
    coverageGaps,
    qualityWarnings,
  };
}
