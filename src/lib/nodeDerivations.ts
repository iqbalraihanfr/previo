import { db, type NodeContent } from "@/lib/db";
import type { RequirementItem, StoryItem, UseCaseDraft } from "@/lib/sourceArtifacts";

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

async function getNodeContentByType(projectId: string, type: string) {
  const node = await db.nodes.where({ project_id: projectId, type }).first();
  if (!node) return null;
  const content = await db.nodeContents.where({ node_id: node.id }).first();
  return content ?? null;
}

function getStructuredFields(content: NodeContent | null) {
  return ((content?.structured_fields ?? {}) as Record<string, unknown>) || {};
}

export function deriveUseCaseDrafts(params: {
  briefFields?: Record<string, unknown>;
  requirementFields?: Record<string, unknown>;
  storyFields?: Record<string, unknown>;
}) {
  const {
    briefFields = {},
    requirementFields = {},
    storyFields = {},
  } = params;
  const targetUsers = Array.isArray(briefFields.target_users)
    ? (briefFields.target_users as string[])
    : [];
  const stories = Array.isArray(storyFields.items)
    ? (storyFields.items as StoryItem[])
    : [];
  const requirements = Array.isArray(requirementFields.items)
    ? (requirementFields.items as RequirementItem[])
    : [];

  const actors = uniqueStrings([
    ...targetUsers,
    ...stories.map((story) => story.role ?? ""),
  ]);

  const useCases: UseCaseDraft[] = stories.map((story, index) => {
    const linkedRequirement = requirements.find(
      (item) => item.id === story.related_requirement,
    );
    const flowAction = story.goal?.trim() || linkedRequirement?.description?.trim() || "Complete the workflow";

    return {
      id: story.id || crypto.randomUUID(),
      name: story.goal?.trim() || `Use Case ${index + 1}`,
      primary_actor: story.role?.trim() || targetUsers[0] || "User",
      secondary_actors: [],
      description: story.benefit?.trim() || linkedRequirement?.description?.trim() || "",
      preconditions: linkedRequirement?.description
        ? [`Requirement available: ${linkedRequirement.description}`]
        : [],
      postconditions: story.benefit?.trim()
        ? [`Outcome achieved: ${story.benefit.trim()}`]
        : [],
      main_flow: [
        {
          actor: story.role?.trim() || "User",
          action: flowAction,
        },
      ],
      alternative_flows: [],
      related_user_stories: story.id ? [story.id] : [],
      include_extend: [],
    };
  });

  return {
    actors,
    useCases,
  };
}

export function deriveDFDModel(params: {
  briefFields?: Record<string, unknown>;
  useCaseFields?: Record<string, unknown>;
  erdFields?: Record<string, unknown>;
}) {
  const {
    briefFields = {},
    useCaseFields = {},
    erdFields = {},
  } = params;
  const targetUsers = Array.isArray(briefFields.target_users)
    ? (briefFields.target_users as string[])
    : [];
  const useCases = Array.isArray(useCaseFields.useCases)
    ? (useCaseFields.useCases as Array<Record<string, unknown>>)
    : [];
  const entities = Array.isArray(erdFields.entities)
    ? (erdFields.entities as Array<Record<string, unknown>>)
    : [];

  const nodes = [
    ...targetUsers.map((user) => ({
      id: crypto.randomUUID(),
      label: user,
      type: "entity" as const,
      related_use_case: "",
      related_erd_entity: "",
    })),
    ...useCases.map((useCase) => ({
      id: crypto.randomUUID(),
      label: String(useCase.name ?? "Process"),
      type: "process" as const,
      related_use_case: String(useCase.id ?? ""),
      related_erd_entity: "",
    })),
    ...entities.map((entity) => ({
      id: crypto.randomUUID(),
      label: String(entity.name ?? "DATA_STORE"),
      type: "datastore" as const,
      related_use_case: "",
      related_erd_entity: String(entity.name ?? ""),
    })),
  ];

  const firstProcess = nodes.find((node) => node.type === "process");
  const flows = [
    ...nodes
      .filter((node) => node.type === "entity" && firstProcess)
      .map((node) => ({
        id: crypto.randomUUID(),
        from: node.id,
        to: firstProcess?.id ?? "",
        label: "request",
      })),
    ...nodes
      .filter((node) => node.type === "datastore" && firstProcess)
      .map((node) => ({
        id: crypto.randomUUID(),
        from: firstProcess?.id ?? "",
        to: node.id,
        label: "read/write",
      })),
  ].filter((flow) => flow.from && flow.to);

  return {
    nodes,
    flows,
  };
}

export async function generateUseCaseDrafts(projectId: string) {
  const [briefContent, requirementContent, storyContent] = await Promise.all([
    getNodeContentByType(projectId, "project_brief"),
    getNodeContentByType(projectId, "requirements"),
    getNodeContentByType(projectId, "user_stories"),
  ]);

  return deriveUseCaseDrafts({
    briefFields: getStructuredFields(briefContent),
    requirementFields: getStructuredFields(requirementContent),
    storyFields: getStructuredFields(storyContent),
  });
}

export async function generateDFDFromProject(projectId: string) {
  const [briefContent, useCaseContent, erdContent] = await Promise.all([
    getNodeContentByType(projectId, "project_brief"),
    getNodeContentByType(projectId, "use_cases"),
    getNodeContentByType(projectId, "erd"),
  ]);

  return deriveDFDModel({
    briefFields: getStructuredFields(briefContent),
    useCaseFields: getStructuredFields(useCaseContent),
    erdFields: getStructuredFields(erdContent),
  });
}
