"use client";

import type { NodeContent, NodeData, TaskData } from "@/lib/db";

export interface TaskProvenance {
  title: string;
  sourceLabel: string;
  reason: string;
  relatedBriefScope?: string;
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeValue(value: unknown) {
  return asString(value).toLowerCase();
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

  return {
    title: `Generated from ${sourceNode.label}`,
    sourceLabel: sourceNode.label,
    reason: `Derived by ${sourceNode.type.replace(/_/g, " ")} planning rule.`,
  };
}
