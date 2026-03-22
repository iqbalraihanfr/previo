import type {
  ERDFields,
  ProjectBriefFields,
  RequirementFields,
  UseCaseFields,
  UserStoryFields,
} from "@/lib/canonical";
import { getCanonicalNodeFields } from "@/lib/canonicalContent";
import type { RequirementItem, StoryItem, UseCaseDraft } from "@/lib/sourceArtifacts";
import { NodeContentRepository, NodeRepository } from "@/repositories/NodeRepository";

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

async function getNodeContentByType(
  projectId: string,
  type: "project_brief" | "requirements" | "user_stories" | "use_cases" | "erd",
) {
  const node = await NodeRepository.findByProjectAndType(projectId, type);
  if (!node) return null;
  const content = await NodeContentRepository.findByNodeId(node.id);
  return content ?? null;
}

export function deriveUseCaseDrafts(params: {
  briefFields?: ProjectBriefFields;
  requirementFields?: RequirementFields;
  storyFields?: UserStoryFields;
}) {
  const {
    briefFields,
    requirementFields,
    storyFields,
  } = params;
  const targetUsers = briefFields?.target_users ?? [];
  const stories = (storyFields?.items ?? []) as StoryItem[];
  const requirements = (requirementFields?.items ?? []) as RequirementItem[];

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
  briefFields?: ProjectBriefFields;
  useCaseFields?: UseCaseFields;
  erdFields?: ERDFields;
}) {
  const {
    briefFields,
    useCaseFields,
    erdFields,
  } = params;
  const targetUsers = briefFields?.target_users ?? [];
  const useCases = useCaseFields?.useCases ?? [];
  const entities = erdFields?.entities ?? [];

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
    briefFields: getCanonicalNodeFields("project_brief", briefContent ?? undefined),
    requirementFields: getCanonicalNodeFields(
      "requirements",
      requirementContent ?? undefined,
    ),
    storyFields: getCanonicalNodeFields("user_stories", storyContent ?? undefined),
  });
}

export async function generateDFDFromProject(projectId: string) {
  const [briefContent, useCaseContent, erdContent] = await Promise.all([
    getNodeContentByType(projectId, "project_brief"),
    getNodeContentByType(projectId, "use_cases"),
    getNodeContentByType(projectId, "erd"),
  ]);

  return deriveDFDModel({
    briefFields: getCanonicalNodeFields("project_brief", briefContent ?? undefined),
    useCaseFields: getCanonicalNodeFields("use_cases", useCaseContent ?? undefined),
    erdFields: getCanonicalNodeFields("erd", erdContent ?? undefined),
  });
}
