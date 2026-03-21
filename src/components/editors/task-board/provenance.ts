"use client";

import type { NodeContent, NodeData, TaskData } from "@/lib/db";

export interface TaskProvenance {
  title: string;
  sourceLabel: string;
  reason: string;
  relatedBriefScope?: string;
  sourceItemLabel?: string;
  upstreamPath?: string[];
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeValue(value: unknown) {
  return asString(value).toLowerCase();
}

function slugifyValue(value: unknown) {
  return asString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getStructuredFields(content?: NodeContent | null) {
  return (content?.structured_fields ?? {}) as Record<string, unknown>;
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

function resolveRequirementProvenance(
  task: TaskData,
  content: NodeContent | null,
): TaskProvenance {
  const fields = getStructuredFields(content);
  const items = Array.isArray(fields.items) ? fields.items : [];
  const requirements = items.filter((item) => {
    const requirement = item as Record<string, unknown>;
    return normalizeValue(requirement.type || "FR") === "fr";
  });

  const explicitMatch = requirements.find((item, index) => {
    const requirement = item as Record<string, unknown>;
    const displayId = buildRequirementDisplayId(index).toLowerCase();
    const internalId = normalizeValue(requirement.id);
    const sourceItemId = normalizeValue(task.source_item_id);
    return (
      sourceItemId === normalizeValue(`fr-${requirement.id}`) ||
      sourceItemId === normalizeValue(`fr-${index}`) ||
      sourceItemId.includes(internalId) ||
      sourceItemId.includes(displayId)
    );
  }) as Record<string, unknown> | undefined;

  const featureMatch =
    explicitMatch ??
    (requirements.find((item) => {
      const requirement = item as Record<string, unknown>;
      return (
        normalizeValue(requirement.category) === normalizeValue(task.feature_name) ||
        normalizeValue(requirement.related_scope) === normalizeValue(task.feature_name)
      );
    }) as Record<string, unknown> | undefined);

  const requirement =
    featureMatch ??
    (requirements[0] as Record<string, unknown> | undefined);

  if (!requirement) {
    return {
      title: "Generated from requirements",
      sourceLabel: "Requirements",
      reason: "Derived by requirement planning rule.",
    };
  }

  const requirementIndex = requirements.indexOf(requirement);
  const displayId = buildRequirementDisplayId(
    requirementIndex === -1 ? 0 : requirementIndex,
  );
  const relatedBriefScope = asString(requirement.related_scope);

  return {
    title: `Generated from Requirement ${displayId}`,
    sourceLabel: asString(requirement.description) || displayId,
    reason: "Derived by requirement planning rule.",
    relatedBriefScope: relatedBriefScope || undefined,
    sourceItemLabel: displayId,
    upstreamPath: [
      relatedBriefScope ? `Brief scope: ${relatedBriefScope}` : "",
      `Requirement: ${displayId}`,
    ].filter(Boolean),
  };
}

function resolveStoryProvenance(
  task: TaskData,
  content: NodeContent | null,
): TaskProvenance {
  const fields = getStructuredFields(content);
  const items = Array.isArray(fields.items) ? fields.items : [];
  const stories = items.filter(
    (item): item is Record<string, unknown> =>
      typeof item === "object" && item !== null,
  );

  const matchedStory =
    (stories.find((story, index) => {
      const sourceItemId = normalizeValue(task.source_item_id);
      const storyId = normalizeValue(story.id);
      const displayId = buildStoryDisplayId(index).toLowerCase();
      const goal = normalizeValue(story.goal);
      return (
        sourceItemId.includes(storyId) ||
        sourceItemId.includes(displayId) ||
        (goal.length > 0 && sourceItemId.includes(goal.slice(0, 24)))
      );
    }) as Record<string, unknown> | undefined) ??
    (stories[0] as Record<string, unknown> | undefined);

  if (!matchedStory) {
    return {
      title: "Generated from user stories",
      sourceLabel: "User Stories",
      reason: "Derived by story planning rule.",
    };
  }

  const index = stories.indexOf(matchedStory);
  const displayId = buildStoryDisplayId(index === -1 ? 0 : index);

  return {
    title: `Generated from User Story ${displayId}`,
    sourceLabel: asString(matchedStory.goal) || displayId,
    reason: "Derived by story planning rule.",
    sourceItemLabel: displayId,
    upstreamPath: [
      asString(matchedStory.related_requirement)
        ? `Requirement link: ${asString(matchedStory.related_requirement)}`
        : "",
      `User story: ${displayId}`,
    ].filter(Boolean),
  };
}

function resolveUseCaseProvenance(
  task: TaskData,
  content: NodeContent | null,
): TaskProvenance {
  const fields = getStructuredFields(content);
  const useCases = Array.isArray(fields.useCases) ? fields.useCases : [];
  const matchedUseCase =
    (useCases.find((useCase, index) => {
      const currentUseCase = useCase as Record<string, unknown>;
      const sourceItemId = normalizeValue(task.source_item_id);
      const useCaseId = normalizeValue(currentUseCase.id);
      const displayId = buildUseCaseDisplayId(index).toLowerCase();
      const name = normalizeValue(currentUseCase.name);
      return (
        sourceItemId.includes(useCaseId) ||
        sourceItemId.includes(displayId) ||
        (name.length > 0 && sourceItemId.includes(name.slice(0, 24)))
      );
    }) as Record<string, unknown> | undefined) ??
    (useCases[0] as Record<string, unknown> | undefined);

  if (!matchedUseCase) {
    return {
      title: "Generated from use cases",
      sourceLabel: "Use Cases",
      reason: "Derived by use-case implementation rule.",
    };
  }

  const index = useCases.indexOf(matchedUseCase);
  const displayId = buildUseCaseDisplayId(index === -1 ? 0 : index);

  return {
    title: `Generated from Use Case ${displayId}`,
    sourceLabel: asString(matchedUseCase.name) || displayId,
    reason: "Derived by use-case implementation rule.",
    sourceItemLabel: displayId,
    upstreamPath: [
      Array.isArray(matchedUseCase.related_user_stories) &&
      matchedUseCase.related_user_stories.length > 0
        ? `Story links: ${(matchedUseCase.related_user_stories as string[]).join(", ")}`
        : "",
      `Use case: ${displayId}`,
    ].filter(Boolean),
  };
}

function resolveFlowchartProvenance(
  task: TaskData,
  content: NodeContent | null,
): TaskProvenance {
  const fields = getStructuredFields(content);
  const flows = Array.isArray(fields.flows) ? fields.flows : [];
  const sourceItemId = normalizeValue(task.source_item_id);
  const orderMatch = sourceItemId.match(/^flowchart-step-(\d+)-/);
  const targetOrder = orderMatch ? Number(orderMatch[1]) : null;
  let currentOrder = 0;

  for (const flow of flows) {
    const currentFlow = flow as Record<string, unknown>;
    const steps = Array.isArray(currentFlow.steps) ? currentFlow.steps : [];
    for (const step of steps) {
      const currentStep = step as Record<string, unknown>;
      const stepLabel = asString(currentStep.label);
      const stepSlug = slugifyValue(stepLabel);
      if (
        (targetOrder !== null && currentOrder === targetOrder) ||
        (stepSlug && sourceItemId.includes(stepSlug))
      ) {
        return {
          title: "Generated from Flowchart Step",
          sourceLabel: stepLabel || "Flowchart step",
          sourceItemLabel: stepLabel || undefined,
          reason: "Derived by flowchart process rule.",
          upstreamPath: [
            asString(currentFlow.name) ? `Flow: ${asString(currentFlow.name)}` : "",
            asString(currentFlow.related_use_case)
              ? `Use case link: ${asString(currentFlow.related_use_case)}`
              : "",
          ].filter(Boolean),
        };
      }
      currentOrder += 1;
    }
  }

  return {
    title: "Generated from flowchart",
    sourceLabel: "Flowchart",
    reason: "Derived by flowchart process rule.",
  };
}

function resolveSequenceProvenance(
  task: TaskData,
  content: NodeContent | null,
): TaskProvenance {
  const fields = getStructuredFields(content);
  const participants = Array.isArray(fields.participants) ? fields.participants : [];
  const messages = Array.isArray(fields.messages) ? fields.messages : [];
  const relatedUseCase = asString(fields.related_use_case);
  const sourceItemId = normalizeValue(task.source_item_id);

  if (sourceItemId.startsWith("seq-service-")) {
    const matchedParticipant =
      (participants.find((participant) =>
        sourceItemId.includes(slugifyValue((participant as Record<string, unknown>).name)),
      ) as Record<string, unknown> | undefined) ??
      (participants[0] as Record<string, unknown> | undefined);

    if (matchedParticipant) {
      const name = asString(matchedParticipant.name);
      return {
        title: "Generated from Sequence Participant",
        sourceLabel: name || "Participant",
        sourceItemLabel: name || undefined,
        reason: "Derived by sequence service provisioning rule.",
        upstreamPath: [relatedUseCase ? `Use case link: ${relatedUseCase}` : ""].filter(Boolean),
      };
    }
  }

  const messageIndexMatch = sourceItemId.match(/^seq-(?:api|msg)-(\d+)-/);
  if (messageIndexMatch) {
    const messageIndex = Number(messageIndexMatch[1]);
    const matchedMessage =
      (messages[messageIndex] as Record<string, unknown> | undefined) ??
      (messages.find((message) =>
        sourceItemId.includes(slugifyValue((message as Record<string, unknown>).content)),
      ) as Record<string, unknown> | undefined);

    if (matchedMessage) {
      const contentLabel = asString(matchedMessage.content);
      return {
        title: "Generated from Sequence Message",
        sourceLabel: contentLabel || "Sequence message",
        sourceItemLabel: contentLabel || undefined,
        reason: sourceItemId.startsWith("seq-api-")
          ? "Derived by sequence API rule."
          : "Derived by sequence interaction rule.",
        upstreamPath: [
          `${asString(matchedMessage.from) || "Source"} -> ${asString(matchedMessage.to) || "Target"}`,
          relatedUseCase ? `Use case link: ${relatedUseCase}` : "",
        ].filter(Boolean),
      };
    }
  }

  if (sourceItemId.startsWith("seq-alt-")) {
    const matchedAlt =
      (messages.find((message) => {
        const currentMessage = message as Record<string, unknown>;
        return (
          normalizeValue(currentMessage.group) === "alt" &&
          sourceItemId.includes(slugifyValue(currentMessage.group_label))
        );
      }) as Record<string, unknown> | undefined) ??
      (messages.find(
        (message) => normalizeValue((message as Record<string, unknown>).group) === "alt",
      ) as Record<string, unknown> | undefined);

    if (matchedAlt) {
      const groupLabel = asString(matchedAlt.group_label) || "Alternative flow";
      return {
        title: "Generated from Sequence Alternative Flow",
        sourceLabel: groupLabel,
        sourceItemLabel: groupLabel,
        reason: "Derived by sequence alternative-flow rule.",
        upstreamPath: [relatedUseCase ? `Use case link: ${relatedUseCase}` : ""].filter(Boolean),
      };
    }
  }

  return {
    title: "Generated from sequence",
    sourceLabel: "Sequence",
    reason: "Derived by sequence planning rule.",
  };
}

function resolveErdProvenance(
  task: TaskData,
  content: NodeContent | null,
): TaskProvenance {
  const fields = getStructuredFields(content);
  const entities = Array.isArray(fields.entities) ? fields.entities : [];
  const relationships = Array.isArray(fields.relationships) ? fields.relationships : [];
  const sourceItemId = normalizeValue(task.source_item_id);

  if (
    sourceItemId.startsWith("erd-model-") ||
    sourceItemId.startsWith("erd-validation-") ||
    sourceItemId.startsWith("erd-seed-")
  ) {
    const matchedEntity =
      (entities.find((entity) =>
        sourceItemId.includes(slugifyValue((entity as Record<string, unknown>).name)),
      ) as Record<string, unknown> | undefined) ??
      (entities[0] as Record<string, unknown> | undefined);

    if (matchedEntity) {
      const entityName = asString(matchedEntity.name);
      const attributes = Array.isArray(matchedEntity.attributes)
        ? matchedEntity.attributes
        : [];
      return {
        title: "Generated from ERD Entity",
        sourceLabel: entityName || "Entity",
        sourceItemLabel: entityName || undefined,
        reason: "Derived by ERD entity planning rule.",
        upstreamPath: [
          attributes.length > 0 ? `${attributes.length} attribute(s)` : "",
        ].filter(Boolean),
      };
    }
  }

  if (sourceItemId.startsWith("erd-rel-") || sourceItemId.startsWith("erd-pivot-")) {
    const matchedRelationship =
      (relationships.find((relationship) => {
        const currentRelationship = relationship as Record<string, unknown>;
        const slug = slugifyValue(
          `${asString(currentRelationship.from)} ${asString(currentRelationship.to)}`,
        );
        return slug.length > 0 && sourceItemId.includes(slug);
      }) as Record<string, unknown> | undefined) ??
      (relationships[0] as Record<string, unknown> | undefined);

    if (matchedRelationship) {
      const from = asString(matchedRelationship.from);
      const to = asString(matchedRelationship.to);
      return {
        title: "Generated from ERD Relationship",
        sourceLabel: `${from} -> ${to}`.trim(),
        sourceItemLabel: `${from} -> ${to}`.trim(),
        reason: sourceItemId.startsWith("erd-pivot-")
          ? "Derived by ERD many-to-many junction rule."
          : "Derived by ERD relationship rule.",
        upstreamPath: [
          asString(matchedRelationship.type)
            ? `Relationship type: ${asString(matchedRelationship.type)}`
            : "",
        ].filter(Boolean),
      };
    }
  }

  return {
    title: "Generated from ERD",
    sourceLabel: "ERD",
    reason: "Derived by ERD planning rule.",
  };
}

function resolveDfdProvenance(
  task: TaskData,
  content: NodeContent | null,
): TaskProvenance {
  const fields = getStructuredFields(content);
  const nodes = Array.isArray(fields.nodes) ? fields.nodes : [];
  const sourceItemId = normalizeValue(task.source_item_id);

  const typeMatch = sourceItemId.match(/^dfd-(process|ext)-(\d+)-/);
  const targetType =
    typeMatch?.[1] === "process"
      ? "process"
      : typeMatch?.[1] === "ext"
        ? "entity"
        : null;
  const targetOrder = typeMatch ? Number(typeMatch[2]) : null;
  let currentOrder = 0;

  for (const node of nodes) {
    const currentNode = node as Record<string, unknown>;
    const nodeType = asString(currentNode.type).toLowerCase();
    if (targetType && nodeType !== targetType) continue;

    const nodeLabel = asString(currentNode.label);
    const nodeSlug = slugifyValue(nodeLabel);
    const matchesByOrder = targetOrder !== null && currentOrder === targetOrder;
    const matchesBySlug = nodeSlug.length > 0 && sourceItemId.includes(nodeSlug);

    if (matchesByOrder || matchesBySlug) {
      return {
        title:
          nodeType === "process"
            ? "Generated from DFD Process"
            : "Generated from DFD External Entity",
        sourceLabel: nodeLabel || "DFD node",
        sourceItemLabel: nodeLabel || undefined,
        reason:
          nodeType === "process"
            ? "Derived by DFD process implementation rule."
            : "Derived by DFD integration rule.",
        upstreamPath: [
          asString(currentNode.related_use_case)
            ? `Use case link: ${asString(currentNode.related_use_case)}`
            : "",
          asString(currentNode.related_erd_entity)
            ? `ERD link: ${asString(currentNode.related_erd_entity)}`
            : "",
        ].filter(Boolean),
      };
    }

    currentOrder += 1;
  }

  return {
    title: "Generated from DFD",
    sourceLabel: "DFD",
    reason: "Derived by DFD planning rule.",
  };
}

export function resolveTaskProvenance(params: {
  task: TaskData;
  nodes: NodeData[];
  contents: NodeContent[];
}): TaskProvenance | null {
  const { task, nodes, contents } = params;

  if (task.task_origin !== "generated" || !task.source_node_id) {
    return null;
  }

  const sourceNode = nodes.find((node) => node.id === task.source_node_id) ?? null;
  const sourceContent = contents.find((content) => content.node_id === task.source_node_id) ?? null;

  if (!sourceNode) {
    return null;
  }

  if (sourceNode.type === "requirements") {
    return resolveRequirementProvenance(task, sourceContent);
  }

  if (sourceNode.type === "user_stories") {
    return resolveStoryProvenance(task, sourceContent);
  }

  if (sourceNode.type === "use_cases") {
    return resolveUseCaseProvenance(task, sourceContent);
  }

  if (sourceNode.type === "flowchart") {
    return resolveFlowchartProvenance(task, sourceContent);
  }

  if (sourceNode.type === "sequence") {
    return resolveSequenceProvenance(task, sourceContent);
  }

  if (sourceNode.type === "erd") {
    return resolveErdProvenance(task, sourceContent);
  }

  if (sourceNode.type === "dfd") {
    return resolveDfdProvenance(task, sourceContent);
  }

  return {
    title: `Generated from ${sourceNode.label}`,
    sourceLabel: sourceNode.label,
    reason: `Derived by ${sourceNode.type.replace(/_/g, " ")} planning rule.`,
  };
}
