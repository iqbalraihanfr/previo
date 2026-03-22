import type { NodeContent, NodeData } from "@/lib/db";
import { getCanonicalNodeFields } from "@/lib/canonicalContent";
import type {
  DFDFields,
  DFDNode,
  ERDFields,
  ERDEntity,
  Flow as FlowchartFlow,
  FlowchartFields,
  ProjectBriefFields,
  Message as SequenceMessage,
  RequirementFieldItem as RequirementItem,
  RequirementFields,
  SequenceFields,
  UseCaseFields,
  UseCaseItemData as UseCaseItem,
  UserStoryFieldItem as UserStoryItem,
  UserStoryFields,
} from "@/lib/canonical";
import type {
  CoverageMetric,
  SummaryContent,
  SummaryFraming,
} from "./types";

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function getNodeContentMap(
  nodes: NodeData[],
  contents: NodeContent[],
): Record<string, SummaryContent> {
  const byNodeId = new Map<string, SummaryContent>();

  nodes.forEach((projectNode) => {
    const content = contents.find((entry) => entry.node_id === projectNode.id);
    if (!content) return;

    byNodeId.set(projectNode.id, {
      ...content,
      structured_fields: getCanonicalNodeFields(projectNode.type, content),
    });
  });

  return Object.fromEntries(byNodeId.entries());
}

export function getNodeByType(
  nodes: NodeData[],
  type: NodeData["type"],
): NodeData | undefined {
  return nodes.find((entry) => entry.type === type);
}

function getNodeContentByType(
  nodes: NodeData[],
  contentMap: Record<string, SummaryContent>,
  type: NodeData["type"],
) {
  const matchedNode = getNodeByType(nodes, type);
  if (!matchedNode) return undefined;
  return contentMap[matchedNode.id];
}

export function getBriefFields(
  nodes: NodeData[],
  contentMap: Record<string, SummaryContent>,
): ProjectBriefFields {
  return getCanonicalNodeFields(
    "project_brief",
    getNodeContentByType(nodes, contentMap, "project_brief"),
  );
}

export function getRequirementFields(
  nodes: NodeData[],
  contentMap: Record<string, SummaryContent>,
): RequirementFields {
  return getCanonicalNodeFields(
    "requirements",
    getNodeContentByType(nodes, contentMap, "requirements"),
  );
}

export function getUserStoryFields(
  nodes: NodeData[],
  contentMap: Record<string, SummaryContent>,
): UserStoryFields {
  return getCanonicalNodeFields(
    "user_stories",
    getNodeContentByType(nodes, contentMap, "user_stories"),
  );
}

export function getUseCaseFields(
  nodes: NodeData[],
  contentMap: Record<string, SummaryContent>,
): UseCaseFields {
  return getCanonicalNodeFields(
    "use_cases",
    getNodeContentByType(nodes, contentMap, "use_cases"),
  );
}

export function getFlowchartFields(
  nodes: NodeData[],
  contentMap: Record<string, SummaryContent>,
): FlowchartFields {
  return getCanonicalNodeFields(
    "flowchart",
    getNodeContentByType(nodes, contentMap, "flowchart"),
  );
}

export function getSequenceFields(
  nodes: NodeData[],
  contentMap: Record<string, SummaryContent>,
): SequenceFields {
  return getCanonicalNodeFields(
    "sequence",
    getNodeContentByType(nodes, contentMap, "sequence"),
  );
}

export function getERDFields(
  nodes: NodeData[],
  contentMap: Record<string, SummaryContent>,
): ERDFields {
  return getCanonicalNodeFields("erd", getNodeContentByType(nodes, contentMap, "erd"));
}

export function getDFDFields(
  nodes: NodeData[],
  contentMap: Record<string, SummaryContent>,
): DFDFields {
  return getCanonicalNodeFields("dfd", getNodeContentByType(nodes, contentMap, "dfd"));
}

export function getRequirementItems(fields: RequirementFields): RequirementItem[] {
  return fields.items ?? [];
}

export function getUserStoryItems(fields: UserStoryFields): UserStoryItem[] {
  return fields.items ?? [];
}

export function getUseCaseItems(fields: UseCaseFields): UseCaseItem[] {
  return fields.useCases ?? [];
}

export function getFlowchartFlows(fields: FlowchartFields): FlowchartFlow[] {
  return fields.flows ?? [];
}

export function getERDEntities(fields: ERDFields): ERDEntity[] {
  return fields.entities ?? [];
}

export function getDFDNodes(fields: DFDFields): DFDNode[] {
  return fields.nodes ?? [];
}

export function getSequenceMessages(fields: SequenceFields): SequenceMessage[] {
  return fields.messages ?? [];
}

export function normalizeId(value: unknown): string {
  return asString(value).trim().toLowerCase();
}

export function buildSequentialDisplayId(prefix: string, index: number): string {
  return `${prefix}-${String(index + 1).padStart(3, "0")}`.toLowerCase();
}

export function computeCoverage(
  allNodes: NodeData[],
  contentMap: Record<string, SummaryContent>,
): CoverageMetric[] {
  const requirementFields = getRequirementFields(allNodes, contentMap);
  const userStoryFields = getUserStoryFields(allNodes, contentMap);
  const useCaseFields = getUseCaseFields(allNodes, contentMap);
  const flowchartFields = getFlowchartFields(allNodes, contentMap);
  const sequenceFields = getSequenceFields(allNodes, contentMap);
  const erdFields = getERDFields(allNodes, contentMap);
  const dfdFields = getDFDFields(allNodes, contentMap);
  const briefFields = getBriefFields(allNodes, contentMap);

  const requirementItems = getRequirementItems(requirementFields);
  const userStories = getUserStoryItems(userStoryFields);
  const useCases = getUseCaseItems(useCaseFields);
  const flowchartFlows = getFlowchartFlows(flowchartFields);
  const sequenceMessages = getSequenceMessages(sequenceFields);
  const erdEntities = getERDEntities(erdFields);
  const dfdNodes = getDFDNodes(dfdFields);

  const metrics: CoverageMetric[] = [];

  const frItems = requirementItems.filter(
    (item) =>
      (item.type ?? "FR") === "FR" &&
      asString(item.description).trim().length > 0,
  );

  if (frItems.length > 0 || userStories.length > 0) {
    const mappedRequirements = new Set(
      userStories
        .map((story) => normalizeId(story.related_requirement))
        .filter(Boolean),
    );

    const covered = frItems.filter((fr, index) => {
      const internalId = normalizeId(fr.id);
      const displayId = buildSequentialDisplayId("FR", index);
      return (
        mappedRequirements.has(internalId) || mappedRequirements.has(displayId)
      );
    }).length;

    metrics.push({
      label: "FRs with User Stories",
      covered,
      total: frItems.length,
      description:
        "Functional requirements traced into at least one user story.",
    });
  }

  if (userStories.length > 0 || useCases.length > 0) {
    const relatedStoryIds = new Set<string>();

    useCases.forEach((useCase) => {
      const linkedStories = asStringArray(useCase.related_user_stories);

      linkedStories
        .map((storyId) => normalizeId(storyId))
        .filter(Boolean)
        .forEach((storyId) => relatedStoryIds.add(storyId));
    });

    const covered = userStories.filter((story) => {
      const storyId = normalizeId(story.id);
      return storyId.length > 0 && relatedStoryIds.has(storyId);
    }).length;

    metrics.push({
      label: "User Stories with Use Cases",
      covered,
      total: userStories.length,
      description: "User stories connected to downstream use cases.",
    });
  }

  if (useCases.length > 0 || flowchartFlows.length > 0) {
    const flowLinkedUseCases = new Set(
      flowchartFlows
        .map((flow) => normalizeId(flow.related_use_case))
        .filter(Boolean),
    );

    const covered = useCases.filter((useCase) => {
      const useCaseId = normalizeId(useCase.id);
      return useCaseId.length > 0 && flowLinkedUseCases.has(useCaseId);
    }).length;

    metrics.push({
      label: "Use Cases with Flowcharts",
      covered,
      total: useCases.length,
      description: "Use cases represented as procedural flows.",
    });
  }

  if (useCases.length > 0 || sequenceMessages.length > 0) {
    const relatedUseCase = normalizeId(sequenceFields.related_use_case);
    const sequenceHasContent =
      sequenceMessages.length > 0 || (sequenceFields.participants ?? []).length > 0;

    const covered = useCases.filter((useCase) => {
      const useCaseId = normalizeId(useCase.id);
      return (
        sequenceHasContent &&
        useCaseId.length > 0 &&
        useCaseId === relatedUseCase
      );
    }).length;

    metrics.push({
      label: "Use Cases with Sequence Coverage",
      covered,
      total: useCases.length,
      description: "Use cases backed by sequence interactions.",
    });
  }

  if (erdEntities.length > 0 || dfdNodes.length > 0) {
    const dataStoreNames = new Set(
      dfdNodes
        .filter((dfdNode) => dfdNode.type === "datastore")
        .map(
          (dfdNode) =>
            asString(dfdNode.related_erd_entity) || asString(dfdNode.label),
        )
        .map((label) => label.trim().toLowerCase())
        .filter(Boolean),
    );

    const covered = erdEntities.filter((entity) =>
      dataStoreNames.has(asString(entity.name).trim().toLowerCase()),
    ).length;

    metrics.push({
      label: "ERD Entities in DFD",
      covered,
      total: erdEntities.length,
      description: "Data stores aligned with the ERD model.",
    });
  }

  const briefTargetUsers = (briefFields.target_users ?? []).filter(
    (user) => user.trim().length > 0,
  );

  if (briefTargetUsers.length > 0 || userStories.length > 0) {
    const storyRoles = new Set(
      userStories
        .map((story) => asString(story.role).trim().toLowerCase())
        .filter(Boolean),
    );

    const covered = briefTargetUsers.filter((user) =>
      storyRoles.has(user.trim().toLowerCase()),
    ).length;

    metrics.push({
      label: "Target Users with Stories",
      covered,
      total: briefTargetUsers.length,
      description: "Target users represented in user story roles.",
    });
  }

  const scopeInItems = (briefFields.scope_in ?? []).filter(
    (scopeItem) => scopeItem.trim().length > 0,
  );

  if (scopeInItems.length > 0 || frItems.length > 0) {
    const linkedScopes = new Set(
      frItems
        .map((item) => asString(item.related_scope).trim().toLowerCase())
        .filter(Boolean),
    );

    const covered = scopeInItems.filter((scopeItem) =>
      linkedScopes.has(scopeItem.trim().toLowerCase()),
    ).length;

    metrics.push({
      label: "Scope In with FR Coverage",
      covered,
      total: scopeInItems.length,
      description: "Scope items mapped into functional requirements.",
    });
  }

  return metrics.filter((metric) => metric.total > 0);
}

export function extractAPIEndpoints(
  contentMap: Record<string, SummaryContent>,
  allNodes: NodeData[],
): string[] {
  const sequenceFields = getSequenceFields(allNodes, contentMap);
  const messages = getSequenceMessages(sequenceFields);

  const endpoints = new Set<string>();

  messages.forEach((message) => {
    const content = asString(message.content).trim();
    if (!content) return;

    const httpMatch = content.match(/^(GET|POST|PUT|PATCH|DELETE)\s+(.+)/i);

    if (httpMatch) {
      endpoints.add(`${httpMatch[1].toUpperCase()} ${httpMatch[2].trim()}`);
      return;
    }

    if (/\/api\//i.test(content)) {
      endpoints.add(content);
    }
  });

  return Array.from(endpoints.values());
}

export function formatMermaidError(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Invalid Mermaid syntax.";
}

function compactSentence(value: string, maxLength = 96): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

function formatCountLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function listPreview(values: string[], maxItems = 3): string {
  const trimmed = values.map((value) => value.trim()).filter(Boolean);
  if (trimmed.length === 0) return "";
  if (trimmed.length <= maxItems) return trimmed.join(", ");
  return `${trimmed.slice(0, maxItems).join(", ")} and ${trimmed.length - maxItems} more`;
}

export function buildSummaryFraming({
  deliveryModeLabel,
  nodesDone,
  totalTasks,
  tasksDone,
  warningCount,
  isProjectReady,
  incompleteNodeCount,
  errorWarnings,
  warnWarnings,
  coverage,
  deliveryPlanTitles,
  sprintProposalTitles,
  apiEndpoints,
  importedNodes,
  generatedNodes,
  manualNodes,
  overriddenNodes,
  readinessStatusLabel,
  readinessStatusSummary,
  topBlockers,
  topTaskSources,
}: {
  deliveryModeLabel: string;
  nodesDone: number;
  totalTasks: number;
  tasksDone: number;
  warningCount: number;
  isProjectReady: boolean;
  incompleteNodeCount: number;
  errorWarnings: number;
  warnWarnings: number;
  coverage: CoverageMetric[];
  deliveryPlanTitles: string[];
  sprintProposalTitles: string[];
  apiEndpoints: string[];
  importedNodes: number;
  generatedNodes: number;
  manualNodes: number;
  overriddenNodes: number;
  readinessStatusLabel: string;
  readinessStatusSummary: string;
  topBlockers: string[];
  topTaskSources: string[];
}): SummaryFraming {
  const executedCoverage = coverage.filter((metric) => metric.total > 0);
  const fullyTraced = executedCoverage.filter(
    (metric) => metric.covered >= metric.total,
  ).length;
  const coverageCount = executedCoverage.length;
  const coverageSummary =
    coverageCount > 0
      ? `${fullyTraced}/${coverageCount} trace checks are complete`
      : "No cross-artifact trace checks are available yet";

  const executiveSnapshot = [
    `${readinessStatusLabel}: ${readinessStatusSummary}`,
    `${deliveryModeLabel} delivery is tracking ${formatCountLabel(nodesDone, "node")} done and ${formatCountLabel(tasksDone, "task")} complete out of ${totalTasks}.`,
    `${coverageSummary}.`,
    warningCount > 0
      ? `${formatCountLabel(warningCount, "warning")} remain across the workspace.`
      : "No warnings remain across the workspace.",
  ];

  const readinessGaps: string[] = [];
  if (!isProjectReady) {
    if (incompleteNodeCount > 0) {
      readinessGaps.push(
        `${formatCountLabel(incompleteNodeCount, "specification node")} still need completion.`,
      );
    }
    if (errorWarnings > 0) {
      readinessGaps.push(
        `${formatCountLabel(errorWarnings, "validation error")} must be resolved before handoff.`,
      );
    }
    if (warnWarnings > 0) {
      readinessGaps.push(
        `${formatCountLabel(warnWarnings, "warning")} should be reviewed for quality risks.`,
      );
    }
    coverage
      .filter((metric) => metric.total > 0 && metric.covered < metric.total)
      .slice(0, 2)
      .forEach((metric) => {
        readinessGaps.push(`${metric.label}: ${metric.covered}/${metric.total} traced.`);
      });
  }

  if (readinessGaps.length === 0) {
    readinessGaps.push("No blocking gaps detected.");
  }

  const recommendedNextActions: string[] = [];
  if (errorWarnings > 0) {
    recommendedNextActions.push("Resolve the current validation errors first.");
  }
  if (incompleteNodeCount > 0) {
    recommendedNextActions.push("Finish the remaining specification nodes.");
  }
  if (deliveryPlanTitles.length > 0) {
    recommendedNextActions.push(`Start with ${deliveryPlanTitles[0]}.`);
  }
  if (!isProjectReady && sprintProposalTitles.length > 0) {
    recommendedNextActions.push(`Review ${sprintProposalTitles[0]} for the next implementation slice.`);
  }
  if (recommendedNextActions.length === 0) {
    recommendedNextActions.push("Export the summary or hand off to implementation.");
  }

  const traceabilityHighlights = [
    apiEndpoints.length > 0
      ? `API coverage includes ${listPreview(apiEndpoints)}.`
      : "No API endpoints have been detected yet.",
    `Provenance is ${formatCountLabel(importedNodes, "imported node")}, ${formatCountLabel(generatedNodes, "generated node")}, and ${formatCountLabel(manualNodes, "manual node")} with ${formatCountLabel(overriddenNodes, "manual override")} logged.`,
  ];

  const implementationProvenance =
    topTaskSources.length > 0
      ? topTaskSources
      : ["Task provenance has not been established yet."];

  return {
    executiveSnapshot: executiveSnapshot.map((line) => compactSentence(line)),
    readinessGaps: readinessGaps.map((line) => compactSentence(line)),
    topBlockers: topBlockers.map((line) => compactSentence(line)),
    recommendedNextActions: recommendedNextActions.map((line) => compactSentence(line)),
    traceabilityHighlights: traceabilityHighlights.map((line) => compactSentence(line)),
    implementationProvenance: implementationProvenance.map((line) =>
      compactSentence(line),
    ),
  };
}
