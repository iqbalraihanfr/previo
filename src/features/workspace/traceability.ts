import type { NodeContent, NodeData, SourceArtifact } from "@/lib/db";
import {
  GENERATION_STATUS_LABELS,
  OVERRIDE_STATUS_LABELS,
  SOURCE_TYPE_LABELS,
} from "@/lib/sourceArtifacts";

type TraceabilitySectionRow = {
  sourceNodeId?: string;
  targetNodeId?: string;
  sourceItemId?: string;
  sourceLabel: string;
  relationLabel: string;
  targetLabels: string[];
  evidenceLabel: string;
  status: "linked" | "missing" | "unresolved";
  navigationTarget: {
    nodeId: string;
    label: string;
  };
};

type TraceabilitySection = {
  id: string;
  title: string;
  description: string;
  rows: TraceabilitySectionRow[];
};

type TraceabilityArtifactCard = {
  id: string;
  nodeLabel: string;
  nodeType: string;
  title: string;
  sourceTypeLabel: string;
  parserVersion: string;
  syncedAt: string | null;
  generationLabel: string;
  overrideLabel: string;
  hasArtifactRecord: boolean;
};

type TraceabilitySummary = {
  imported: number;
  generated: number;
  manual: number;
  overridden: number;
};

export type WorkspaceTraceabilityModel = {
  sections: TraceabilitySection[];
  artifactCards: TraceabilityArtifactCard[];
  summary: TraceabilitySummary;
  linkedRowCount: number;
  artifactCount: number;
};

function normalizeValue(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getStructuredFields(content?: NodeContent | null) {
  return (content?.structured_fields ?? {}) as Record<string, unknown>;
}

function getContentByType(contents: NodeContent[], nodes: NodeData[], type: string) {
  const node = nodes.find((entry) => entry.type === type);
  if (!node) return null;

  return {
    node,
    content: contents.find((entry) => entry.node_id === node.id) ?? null,
  };
}

function buildRequirementDisplayId(index: number) {
  return `FR-${String(index + 1).padStart(3, "0")}`;
}

function buildStoryDisplayId(index: number) {
  return `US-${String(index + 1).padStart(3, "0")}`;
}

function buildUseCaseDisplayId(index: number) {
  return `UC-${String(index + 1).padStart(3, "0")}`;
}

function pickLatestArtifact(
  node: NodeData,
  artifacts: SourceArtifact[],
): SourceArtifact | null {
  const nodeArtifacts = artifacts
    .filter((artifact) => artifact.node_id === node.id)
    .sort(
      (left, right) =>
        new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime(),
    );

  const explicitArtifact = node.source_artifact_id
    ? nodeArtifacts.find((artifact) => artifact.id === node.source_artifact_id)
    : null;

  return explicitArtifact ?? nodeArtifacts[0] ?? null;
}

function getRequirementItems(fields: Record<string, unknown>) {
  const items = Array.isArray(fields.items) ? fields.items : [];

  return items
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .filter((item) => (asString(item.type) || "FR").toUpperCase() === "FR");
}

function getStoryItems(fields: Record<string, unknown>) {
  const items = Array.isArray(fields.items) ? fields.items : [];

  return items.filter(
    (item): item is Record<string, unknown> => typeof item === "object" && item !== null,
  );
}

function getUseCaseItems(fields: Record<string, unknown>) {
  const items = Array.isArray(fields.useCases) ? fields.useCases : [];

  return items.filter(
    (item): item is Record<string, unknown> => typeof item === "object" && item !== null,
  );
}

function getEntityItems(fields: Record<string, unknown>) {
  const items = Array.isArray(fields.entities) ? fields.entities : [];

  return items.filter(
    (item): item is Record<string, unknown> => typeof item === "object" && item !== null,
  );
}

function getDfdNodes(fields: Record<string, unknown>) {
  const nodes = Array.isArray(fields.nodes) ? fields.nodes : [];

  return nodes.filter(
    (item): item is Record<string, unknown> => typeof item === "object" && item !== null,
  );
}

function buildRelationSection(params: {
  id: string;
  title: string;
  description: string;
  rows: TraceabilitySectionRow[];
}): TraceabilitySection {
  return params;
}

export function buildWorkspaceTraceabilityModel(params: {
  nodes: NodeData[];
  contents: NodeContent[];
  sourceArtifacts: SourceArtifact[];
}): WorkspaceTraceabilityModel {
  const { nodes, contents, sourceArtifacts } = params;
  const briefEntry = getContentByType(contents, nodes, "project_brief");
  const requirementEntry = getContentByType(contents, nodes, "requirements");
  const storyEntry = getContentByType(contents, nodes, "user_stories");
  const useCaseEntry = getContentByType(contents, nodes, "use_cases");
  const flowchartEntry = getContentByType(contents, nodes, "flowchart");
  const sequenceEntry = getContentByType(contents, nodes, "sequence");
  const erdEntry = getContentByType(contents, nodes, "erd");
  const dfdEntry = getContentByType(contents, nodes, "dfd");

  const briefFields = getStructuredFields(briefEntry?.content);
  const requirementFields = getStructuredFields(requirementEntry?.content);
  const storyFields = getStructuredFields(storyEntry?.content);
  const useCaseFields = getStructuredFields(useCaseEntry?.content);
  const flowchartFields = getStructuredFields(flowchartEntry?.content);
  const sequenceFields = getStructuredFields(sequenceEntry?.content);
  const erdFields = getStructuredFields(erdEntry?.content);
  const dfdFields = getStructuredFields(dfdEntry?.content);

  const requirementItems = getRequirementItems(requirementFields);
  const storyItems = getStoryItems(storyFields);
  const useCaseItems = getUseCaseItems(useCaseFields);
  const entityItems = getEntityItems(erdFields);
  const dfdNodes = getDfdNodes(dfdFields);

  const briefScopeItems = Array.isArray(briefFields.scope_in)
    ? briefFields.scope_in.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0,
      )
    : [];

  const briefRequirementsRows = briefScopeItems.map((scope) => {
    const matches = requirementItems
      .map((item, index) => ({
        item,
        displayId: buildRequirementDisplayId(index),
      }))
      .filter(
        ({ item }) =>
          normalizeValue(item.related_scope) === normalizeValue(scope),
      );

    const hasUnresolvedRequirements = requirementItems.some(
      (item) => !normalizeValue(item.related_scope),
    );
    const status: TraceabilitySectionRow["status"] =
      matches.length > 0 ? "linked" : hasUnresolvedRequirements ? "unresolved" : "missing";

    return {
      sourceNodeId: briefEntry?.node.id,
      targetNodeId: requirementEntry?.node.id,
      sourceItemId: scope,
      sourceLabel: scope,
      relationLabel: "related_scope",
      targetLabels: matches.map(
        ({ item, displayId }) =>
          `${displayId}${asString(item.description) ? ` - ${asString(item.description)}` : ""}`,
      ),
      evidenceLabel:
        status === "linked"
          ? "Linked by requirement scope"
          : status === "unresolved"
            ? "Some requirements still have no related scope."
            : "No matching requirement yet",
      status,
      navigationTarget: matches.length > 0 && requirementEntry?.node
        ? { nodeId: requirementEntry.node.id, label: requirementEntry.node.label }
        : {
            nodeId: briefEntry?.node.id ?? "",
            label: briefEntry?.node.label ?? "Project Brief",
          },
    };
  });

  const requirementStoryRows = requirementItems.map((item, index) => {
    const displayId = buildRequirementDisplayId(index);
    const matches = storyItems
      .map((story, storyIndex) => ({
        story,
        displayId: buildStoryDisplayId(storyIndex),
      }))
      .filter(({ story }) => {
        const relatedRequirement = normalizeValue(story.related_requirement);
        return (
          relatedRequirement === normalizeValue(item.id) ||
          relatedRequirement === normalizeValue(displayId)
        );
      });

    const hasUnresolvedStories = storyItems.some(
      (story) => !normalizeValue(story.related_requirement),
    );
    const status: TraceabilitySectionRow["status"] =
      matches.length > 0 ? "linked" : hasUnresolvedStories ? "unresolved" : "missing";

    return {
      sourceNodeId: requirementEntry?.node.id,
      targetNodeId: storyEntry?.node.id,
      sourceItemId: displayId,
      sourceLabel: `${displayId}${asString(item.description) ? ` - ${asString(item.description)}` : ""}`,
      relationLabel: "related_requirement",
      targetLabels: matches.map(
        ({ story, displayId: storyDisplayId }) =>
          `${storyDisplayId}${asString(story.goal) ? ` - ${asString(story.goal)}` : ""}`,
      ),
      evidenceLabel:
        status === "linked"
          ? "Linked by story requirement"
          : status === "unresolved"
            ? "Some stories still have no related requirement."
            : "No linked story yet",
      status,
      navigationTarget: matches.length > 0 && storyEntry?.node
        ? { nodeId: storyEntry.node.id, label: storyEntry.node.label }
        : {
            nodeId: requirementEntry?.node.id ?? "",
            label: requirementEntry?.node.label ?? "Requirements",
          },
    };
  });

  const storyUseCaseRows = storyItems.map((story, index) => {
    const displayId = buildStoryDisplayId(index);
    const matches = useCaseItems
      .map((useCase, useCaseIndex) => ({
        useCase,
        displayId: buildUseCaseDisplayId(useCaseIndex),
      }))
      .filter(({ useCase }) => {
        const relatedUserStories = [
          ...(Array.isArray(useCase.related_user_stories)
            ? useCase.related_user_stories
            : []),
          ...(Array.isArray(useCase.related_stories)
            ? useCase.related_stories
            : []),
        ];

        return relatedUserStories.some(
          (relatedStory) =>
            normalizeValue(relatedStory) === normalizeValue(story.id) ||
            normalizeValue(relatedStory) === normalizeValue(displayId),
        );
      });

    const hasUnresolvedUseCases = useCaseItems.some((useCase) => {
      const relatedStories = [
        ...(Array.isArray(useCase.related_user_stories)
          ? useCase.related_user_stories
          : []),
        ...(Array.isArray(useCase.related_stories)
          ? useCase.related_stories
          : []),
      ];
      return relatedStories.length === 0;
    });
    const status: TraceabilitySectionRow["status"] =
      matches.length > 0 ? "linked" : hasUnresolvedUseCases ? "unresolved" : "missing";

    return {
      sourceNodeId: storyEntry?.node.id,
      targetNodeId: useCaseEntry?.node.id,
      sourceItemId: displayId,
      sourceLabel: `${displayId}${asString(story.role) ? ` - ${asString(story.role)}` : ""}`,
      relationLabel: "related_user_stories",
      targetLabels: matches.map(
        ({ useCase, displayId: useCaseDisplayId }) =>
          `${useCaseDisplayId}${asString(useCase.name) ? ` - ${asString(useCase.name)}` : ""}`,
      ),
      evidenceLabel:
        status === "linked"
          ? "Linked by use case story map"
          : status === "unresolved"
            ? "Some use cases still have no related stories."
            : "No linked use case yet",
      status,
      navigationTarget: matches.length > 0 && useCaseEntry?.node
        ? { nodeId: useCaseEntry.node.id, label: useCaseEntry.node.label }
        : {
            nodeId: storyEntry?.node.id ?? "",
            label: storyEntry?.node.label ?? "User Stories",
          },
    };
  });

  const useCaseFlowchartRows = useCaseItems.map((useCase, index) => {
    const displayId = buildUseCaseDisplayId(index);
    const hasFlowchartLink = Array.isArray(flowchartFields.flows)
      ? flowchartFields.flows.some(
          (flow) =>
            typeof flow === "object" &&
            flow !== null &&
            normalizeValue((flow as Record<string, unknown>).related_use_case) ===
              normalizeValue(useCase.id),
        )
      : false;

    const hasSequenceLink = normalizeValue(sequenceFields.related_use_case) === normalizeValue(useCase.id);

    const hasUnresolvedDiagramLinks =
      (Array.isArray(flowchartFields.flows)
        ? flowchartFields.flows.some(
            (flow) =>
              typeof flow === "object" &&
              flow !== null &&
              !normalizeValue((flow as Record<string, unknown>).related_use_case),
          )
        : false) ||
      (sequenceEntry?.content
        ? !normalizeValue(sequenceFields.related_use_case)
        : false);
    const status: TraceabilitySectionRow["status"] =
      hasFlowchartLink || hasSequenceLink
        ? "linked"
        : hasUnresolvedDiagramLinks
          ? "unresolved"
          : "missing";

    return {
      sourceNodeId: useCaseEntry?.node.id,
      targetNodeId: flowchartEntry?.node.id ?? sequenceEntry?.node.id,
      sourceItemId: displayId,
      sourceLabel: `${displayId}${asString(useCase.name) ? ` - ${asString(useCase.name)}` : ""}`,
      relationLabel: "diagram coverage",
      targetLabels: [
        ...(hasFlowchartLink && flowchartEntry?.node ? [flowchartEntry.node.label] : []),
        ...(hasSequenceLink && sequenceEntry?.node ? [sequenceEntry.node.label] : []),
      ],
      evidenceLabel:
        status === "linked"
          ? "Linked through diagram structured fields"
          : status === "unresolved"
            ? "Diagram nodes exist but related use case identifiers are missing."
            : "No linked diagram yet",
      status,
      navigationTarget:
        (hasFlowchartLink && flowchartEntry?.node
          ? { nodeId: flowchartEntry.node.id, label: flowchartEntry.node.label }
          : hasSequenceLink && sequenceEntry?.node
            ? { nodeId: sequenceEntry.node.id, label: sequenceEntry.node.label }
            : {
                nodeId: useCaseEntry?.node.id ?? "",
                label: useCaseEntry?.node.label ?? "Use Cases",
              }),
    };
  });

  const erdDfdRows = entityItems.map((entity, index) => {
    const entityName = asString(entity.name) || `Entity ${index + 1}`;
    const dfdMatches = dfdNodes.filter((dfdNode) => {
      if ((asString(dfdNode.type) || "").toLowerCase() !== "datastore") {
        return false;
      }

      const relatedEntity = normalizeValue(dfdNode.related_erd_entity);
      const label = normalizeValue(dfdNode.label);
      return relatedEntity === normalizeValue(entityName) || label === normalizeValue(entityName);
    });

    const hasUnresolvedStores = dfdNodes.some((dfdNode) => {
      const nodeType = (asString(dfdNode.type) || "").toLowerCase();
      return nodeType === "datastore" && !normalizeValue(dfdNode.related_erd_entity);
    });
    const status: TraceabilitySectionRow["status"] =
      dfdMatches.length > 0 ? "linked" : hasUnresolvedStores ? "unresolved" : "missing";

    return {
      sourceNodeId: erdEntry?.node.id,
      targetNodeId: dfdEntry?.node.id,
      sourceItemId: entityName,
      sourceLabel: entityName,
      relationLabel: "related_erd_entity",
      targetLabels: dfdMatches.map((dfdNode) => asString(dfdNode.label) || "Data store"),
      evidenceLabel:
        status === "linked"
          ? "Linked by datastore mapping"
          : status === "unresolved"
            ? "Some DFD datastores still have no ERD link."
            : "No matching DFD datastore yet",
      status,
      navigationTarget: dfdMatches.length > 0 && dfdEntry?.node
        ? { nodeId: dfdEntry.node.id, label: dfdEntry.node.label }
        : {
            nodeId: erdEntry?.node.id ?? "",
            label: erdEntry?.node.label ?? "ERD",
          },
    };
  });

  const sections = [
    buildRelationSection({
      id: "brief-requirements",
      title: "Brief to requirements",
      description: "Scope items are traced into functional requirements through structured fields.",
      rows: briefRequirementsRows,
    }),
    buildRelationSection({
      id: "requirements-stories",
      title: "Requirements to user stories",
      description: "Functional requirements stay linked to story records by explicit requirement ids.",
      rows: requirementStoryRows,
    }),
    buildRelationSection({
      id: "stories-use-cases",
      title: "User stories to use cases",
      description: "Stories roll forward into use cases via the stored related story identifiers.",
      rows: storyUseCaseRows,
    }),
    buildRelationSection({
      id: "use-cases-diagrams",
      title: "Use cases to diagrams",
      description: "Use cases remain connected to flowchart and sequence nodes through diagram fields.",
      rows: useCaseFlowchartRows,
    }),
    buildRelationSection({
      id: "erd-dfd",
      title: "ERD to DFD",
      description: "Entity names are mirrored into DFD datastores for a read-only structural check.",
      rows: erdDfdRows,
    }),
  ];

  const artifactCards = nodes
    .filter(
      (node) =>
        Boolean(node.source_type) ||
        Boolean(node.source_artifact_id) ||
        node.generation_status !== "none" ||
        node.override_status !== "none" ||
        Boolean(node.imported_at),
    )
    .map((node) => {
      const artifact = pickLatestArtifact(node, sourceArtifacts);
      const sourceType = artifact?.source_type ?? node.source_type;

      return {
        id: node.id,
        nodeLabel: node.label,
        nodeType: node.type,
        title: artifact?.title ?? "Canonical structured state",
        sourceTypeLabel: sourceType ? SOURCE_TYPE_LABELS[sourceType] : "Canonical node",
        parserVersion: artifact?.parser_version ?? node.parser_version ?? "n/a",
        syncedAt: node.imported_at ?? artifact?.updated_at ?? artifact?.created_at ?? null,
        generationLabel: GENERATION_STATUS_LABELS[node.generation_status ?? "none"],
        overrideLabel: OVERRIDE_STATUS_LABELS[node.override_status ?? "none"],
        hasArtifactRecord: Boolean(artifact),
      };
    })
    .sort((left, right) => {
      const leftNode = nodes.find((node) => node.id === left.id);
      const rightNode = nodes.find((node) => node.id === right.id);

      return (leftNode?.sort_order ?? 0) - (rightNode?.sort_order ?? 0);
    });

  const summary = nodes.reduce<TraceabilitySummary>(
    (accumulator, node) => {
      if (node.generation_status === "imported") {
        accumulator.imported += 1;
      } else if (node.generation_status === "generated") {
        accumulator.generated += 1;
      } else {
        accumulator.manual += 1;
      }

      if (node.override_status === "manual_override") {
        accumulator.overridden += 1;
      }

      return accumulator;
    },
    {
      imported: 0,
      generated: 0,
      manual: 0,
      overridden: 0,
    },
  );

  return {
    sections,
    artifactCards,
    summary,
    linkedRowCount: sections.reduce(
      (count, section) =>
        count + section.rows.filter((row) => row.targetLabels.length > 0).length,
      0,
    ),
    artifactCount: artifactCards.length,
  };
}
