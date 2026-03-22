import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { type NodeContent } from "@/lib/db";
import {
  buildWorkspaceStats,
  getRecommendedNextNode,
  sortWorkspaceNodes,
} from "@/features/workspace/selectors";
import { ProjectRepository } from "@/repositories/ProjectRepository";
import { NodeContentRepository, NodeRepository } from "@/repositories/NodeRepository";
import { ValidationWarningRepository } from "@/repositories/MiscRepository";
import { SourceArtifactRepository } from "@/repositories/SourceArtifactRepository";

export function useWorkspaceData(projectId: string) {
  const project = useLiveQuery(
    () => ProjectRepository.findById(projectId),
    [projectId],
    null,
  );
  const dbNodes = useLiveQuery(
    () => NodeRepository.findAllByProjectId(projectId),
    [projectId],
    [],
  );
  const nodeIds = useMemo(() => dbNodes.map((n) => n.id), [dbNodes]);
  const dbContents = useLiveQuery(
    () =>
      nodeIds.length > 0
        ? NodeContentRepository.findAllByNodeIds(nodeIds)
        : Promise.resolve([] as NodeContent[]),
    [nodeIds],
    [],
  );
  const sourceArtifacts = useLiveQuery(
    () => SourceArtifactRepository.findAllByProjectId(projectId),
    [projectId],
    [],
  );
  const dbWarnings = useLiveQuery(
    () => ValidationWarningRepository.findAllByProjectId(projectId),
    [projectId],
    [],
  );

  const sortedNodes = useMemo(() => sortWorkspaceNodes(dbNodes), [dbNodes]);

  const recommendedNextNode = useMemo(
    () => getRecommendedNextNode(sortedNodes),
    [sortedNodes],
  );

  const stats = useMemo(
    () => buildWorkspaceStats(dbNodes, dbWarnings),
    [dbNodes, dbWarnings],
  );

  return {
    project,
    dbNodes,
    dbContents,
    sourceArtifacts,
    dbWarnings,
    sortedNodes,
    recommendedNextNode,
    ...stats,
  };
}
