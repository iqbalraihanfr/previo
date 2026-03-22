import { useLiveQuery } from 'dexie-react-hooks';
import { getCanonicalNodeFields } from "./canonicalContent";
import type { ProjectBriefFields, RequirementFields } from "./canonical";
import { NodeContentRepository, NodeRepository } from "@/repositories/NodeRepository";

/**
 * Fetches the Brief node's structured_fields for a given project.
 * Used by downstream editors (Requirements, User Stories, Use Cases, etc.)
 * to populate cross-reference dropdowns.
 */
export function useBriefFields(projectId?: string) {
  const result = useLiveQuery(async () => {
    if (!projectId) return null;
    const briefNode = await NodeRepository.findByProjectAndType(projectId, "project_brief");
    if (!briefNode) return null;
    const content = await NodeContentRepository.findByNodeId(briefNode.id);
    return getCanonicalNodeFields("project_brief", content);
  }, [projectId]);

  return (result ?? null) as ProjectBriefFields | null;
}

/**
 * Fetches the Requirements node's structured_fields for a given project.
 * Used by User Stories editor for FR dropdown.
 */
export function useRequirementsFields(projectId?: string) {
  const result = useLiveQuery(async () => {
    if (!projectId) return null;
    const reqNode = await NodeRepository.findByProjectAndType(projectId, "requirements");
    if (!reqNode) return null;
    const content = await NodeContentRepository.findByNodeId(reqNode.id);
    return getCanonicalNodeFields("requirements", content);
  }, [projectId]);

  return (result ?? null) as RequirementFields | null;
}
