/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NodeData, NodeContent, TaskData } from "@/lib/db";
import {
  TASK_GENERATION_VERSION,
  type RequirementFields,
  type UserStoryFields,
  type UseCaseFields,
  type FlowchartFields,
  type SequenceFields,
  type ERDFields,
  type DFDFields,
} from "@/lib/canonical";
import { generateUserStoriesTasks } from "./userStories";
import { generateERDTasks } from "./erd";
import { generateFlowchartTasks } from "./flowchart";
import { generateSequenceTasks } from "./sequence";
import { generateDFDTasks } from "./dfd";
import { generateUseCasesTasks } from "./useCases";
import { generateRequirementTasks } from "./requirements";
import { dedupeGeneratedTasks } from "./utils";

export { detectDuplicateTasks } from "./utils";

function getSourceItemLabel(nodeType: NodeData["type"], fields: Record<string, any>, sourceItemId?: string) {
  if (!sourceItemId) return undefined;

  if (nodeType === "requirements") {
    const requirementFields = fields as RequirementFields;
    const item = requirementFields.items?.find(
      (current) =>
        `fr-${current.id}` === sourceItemId ||
        `nfr-${current.id}` === sourceItemId,
    );
    if (item) {
      return item.description || item.category || item.id;
    }

    if (sourceItemId.startsWith("feature-")) {
      return sourceItemId.replace("feature-", "").replace(/-/g, " ");
    }
  }

  if (nodeType === "user_stories") {
    const storyFields = fields as UserStoryFields;
    const item = storyFields.items?.find((current) =>
      sourceItemId.includes(String(current.id ?? "")),
    );
    if (item) {
      return item.goal || item.role || item.id;
    }
  }

  if (nodeType === "use_cases") {
    const useCaseFields = fields as UseCaseFields;
    const item = useCaseFields.useCases?.find((current) =>
      sourceItemId.includes(String(current.id ?? "")) ||
      sourceItemId.includes(String(current.name ?? "").toLowerCase().replace(/\s+/g, "-")),
    );
    return item?.name;
  }

  if (nodeType === "flowchart") {
    const flowchartFields = fields as FlowchartFields;
    for (const flow of flowchartFields.flows ?? []) {
      const step = flow.steps.find((current) =>
        sourceItemId.includes(String(current.id ?? "")),
      );
      if (step) return step.label || flow.name;
    }
  }

  if (nodeType === "sequence") {
    const sequenceFields = fields as SequenceFields;
    const message = sequenceFields.messages?.find((current) =>
      sourceItemId.includes(String(current.id ?? "")),
    );
    return message?.content;
  }

  if (nodeType === "erd") {
    const erdFields = fields as ERDFields;
    const entity = erdFields.entities?.find((current) =>
      sourceItemId.includes(String(current.id ?? "")) ||
      sourceItemId.includes(String(current.name ?? "").toLowerCase().replace(/\s+/g, "-")),
    );
    if (entity) return entity.name;
    const relationship = erdFields.relationships?.find((current) =>
      sourceItemId.includes(String(current.id ?? "")),
    );
    if (relationship) {
      return [relationship.from, relationship.to].filter(Boolean).join(" -> ");
    }
  }

  if (nodeType === "dfd") {
    const dfdFields = fields as DFDFields;
    const item = dfdFields.nodes?.find((current) =>
      sourceItemId.includes(String(current.id ?? "")),
    );
    return item?.label;
  }

  return undefined;
}

function getUpstreamRefs(nodeType: NodeData["type"], fields: Record<string, any>, sourceItemId?: string) {
  if (!sourceItemId) return [];

  if (nodeType === "requirements") {
    const requirementFields = fields as RequirementFields;
    const item = requirementFields.items?.find(
      (current) =>
        `fr-${current.id}` === sourceItemId ||
        `nfr-${current.id}` === sourceItemId,
    );
    return item?.related_scope ? [`brief-scope:${item.related_scope}`] : [];
  }

  if (nodeType === "user_stories") {
    const storyFields = fields as UserStoryFields;
    const item = storyFields.items?.find((current) =>
      sourceItemId.includes(String(current.id ?? "")),
    );
    return item?.related_requirement ? [`requirement:${item.related_requirement}`] : [];
  }

  if (nodeType === "use_cases") {
    const useCaseFields = fields as UseCaseFields;
    const item = useCaseFields.useCases?.find((current) =>
      sourceItemId.includes(String(current.id ?? "")) ||
      sourceItemId.includes(String(current.name ?? "").toLowerCase().replace(/\s+/g, "-")),
    );
    return item?.related_user_stories?.map((storyId) => `user-story:${storyId}`) ?? [];
  }

  if (nodeType === "flowchart") {
    const flowchartFields = fields as FlowchartFields;
    const flow = flowchartFields.flows?.find((current) =>
      current.steps.some((step) => sourceItemId.includes(String(step.id ?? ""))),
    );
    return flow?.related_use_case ? [`use-case:${flow.related_use_case}`] : [];
  }

  if (nodeType === "sequence") {
    const sequenceFields = fields as SequenceFields;
    return sequenceFields.related_use_case ? [`use-case:${sequenceFields.related_use_case}`] : [];
  }

  if (nodeType === "dfd") {
    const dfdFields = fields as DFDFields;
    const item = dfdFields.nodes?.find((current) =>
      sourceItemId.includes(String(current.id ?? "")),
    );
    const refs = [];
    if (item?.related_use_case) refs.push(`use-case:${item.related_use_case}`);
    if (item?.related_erd_entity) refs.push(`erd-entity:${item.related_erd_entity}`);
    return refs;
  }

  return [];
}

function enrichGeneratedTasks(
  node: NodeData,
  fields: Record<string, any>,
  tasks: Omit<TaskData, "id" | "created_at" | "updated_at">[],
): Omit<TaskData, "id" | "created_at" | "updated_at">[] {
  return tasks.map((task) => ({
    ...task,
    task_origin: "generated",
    source_node_type: node.type,
    source_item_label: getSourceItemLabel(node.type, fields, task.source_item_id),
    generation_rule: `${node.type}-task-engine`,
    generation_version: TASK_GENERATION_VERSION,
    upstream_refs: getUpstreamRefs(node.type, fields, task.source_item_id),
  }));
}

/**
 * Parses node contents deterministically from structured_fields
 * Returns an array of tasks with unique source_item_id properties to enable state-merging.
 */
export function generateTasksFromNode(
  node: NodeData,
  content: NodeContent | null,
  projectId: string,
): Omit<TaskData, "id" | "created_at" | "updated_at">[] {
  if (!content || !content.structured_fields) return [];

  const fields = content.structured_fields as Record<string, any>;

  switch (node.type) {
    case "requirements":
      return enrichGeneratedTasks(node, fields, dedupeGeneratedTasks(generateRequirementTasks(node.id, projectId, fields)));
    case "user_stories":
      return enrichGeneratedTasks(node, fields, dedupeGeneratedTasks(generateUserStoriesTasks(node.id, projectId, fields)));
    case "erd":
      return enrichGeneratedTasks(node, fields, dedupeGeneratedTasks(generateERDTasks(node.id, projectId, fields)));
    case "flowchart":
      return enrichGeneratedTasks(node, fields, dedupeGeneratedTasks(generateFlowchartTasks(node.id, projectId, fields)));
    case "sequence":
      return enrichGeneratedTasks(node, fields, dedupeGeneratedTasks(generateSequenceTasks(node.id, projectId, fields)));
    case "dfd":
      return enrichGeneratedTasks(node, fields, dedupeGeneratedTasks(generateDFDTasks(node.id, projectId, fields)));
    case "use_cases":
      return enrichGeneratedTasks(node, fields, dedupeGeneratedTasks(generateUseCasesTasks(node.id, projectId, fields)));
    default:
      return [];
  }
}
