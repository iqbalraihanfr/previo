import type { NodeContent, NodeData } from "@/lib/db";
import type {
  CoverageMetric,
  DFDNode,
  ERDEntity,
  FlowchartFlow,
  RequirementItem,
  SequenceMessage,
  SummaryContent,
  SummaryStructuredFields,
  UseCaseItem,
  UserStoryItem,
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

export function getStructuredFields(
  content?: NodeContent,
): SummaryStructuredFields {
  if (!content || !isObject(content.structured_fields)) {
    return {} as SummaryStructuredFields;
  }

  return content.structured_fields as SummaryStructuredFields;
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
      structured_fields: getStructuredFields(content),
    } as SummaryContent);
  });

  return Object.fromEntries(byNodeId.entries());
}

export function getNodeByType(
  nodes: NodeData[],
  type: string,
): NodeData | undefined {
  return nodes.find((entry) => entry.type === type);
}

export function getFieldsByType(
  nodes: NodeData[],
  contentMap: Record<string, SummaryContent>,
  type: string,
): SummaryStructuredFields | null {
  const matchedNode = getNodeByType(nodes, type);
  if (!matchedNode) return null;
  return contentMap[matchedNode.id]?.structured_fields ?? null;
}

export function getRequirementItems(
  fields: SummaryStructuredFields | null,
): RequirementItem[] {
  const raw = fields?.items;
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is RequirementItem => isObject(item));
}

export function getUserStoryItems(
  fields: SummaryStructuredFields | null,
): UserStoryItem[] {
  const raw = fields?.items;
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is UserStoryItem => isObject(item));
}

export function getUseCaseItems(
  fields: SummaryStructuredFields | null,
): UseCaseItem[] {
  const raw = fields?.useCases;
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is UseCaseItem => isObject(item));
}

export function getFlowchartFlows(
  fields: SummaryStructuredFields | null,
): FlowchartFlow[] {
  const raw = fields?.flows;
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is FlowchartFlow => isObject(item));
}

export function getERDEntities(
  fields: SummaryStructuredFields | null,
): ERDEntity[] {
  const raw = fields?.entities;
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is ERDEntity => isObject(item));
}

export function getDFDNodes(fields: SummaryStructuredFields | null): DFDNode[] {
  const raw = fields?.nodes;
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is DFDNode => isObject(item));
}

export function getSequenceMessages(
  fields: SummaryStructuredFields | null,
): SequenceMessage[] {
  const raw = fields?.messages;
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is SequenceMessage => isObject(item));
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
  const requirementFields = getFieldsByType(
    allNodes,
    contentMap,
    "requirements",
  );
  const userStoryFields = getFieldsByType(allNodes, contentMap, "user_stories");
  const useCaseFields = getFieldsByType(allNodes, contentMap, "use_cases");
  const flowchartFields = getFieldsByType(allNodes, contentMap, "flowchart");
  const sequenceFields = getFieldsByType(allNodes, contentMap, "sequence");
  const erdFields = getFieldsByType(allNodes, contentMap, "erd");
  const dfdFields = getFieldsByType(allNodes, contentMap, "dfd");
  const briefFields = getFieldsByType(allNodes, contentMap, "project_brief");

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
      const linkedStories = [
        ...asStringArray(useCase.related_user_stories),
        ...asStringArray(useCase.related_stories),
      ];

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
    const relatedUseCase = normalizeId(sequenceFields?.related_use_case);
    const sequenceHasContent =
      sequenceMessages.length > 0 ||
      asStringArray(sequenceFields?.participants).length > 0;

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

  const briefTargetUsers = asStringArray(briefFields?.target_users).filter(
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

  const scopeInItems = asStringArray(briefFields?.scope_in).filter(
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
  const sequenceNode = getNodeByType(allNodes, "sequence");
  if (!sequenceNode) return [];

  const sequenceFields = contentMap[sequenceNode.id]?.structured_fields ?? {};
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
