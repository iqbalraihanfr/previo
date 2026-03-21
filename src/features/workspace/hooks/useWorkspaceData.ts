import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type NodeContent } from "@/lib/db";
import {
  buildWorkspaceStats,
  getRecommendedNextNode,
  sortWorkspaceNodes,
} from "@/features/workspace/selectors";

export function useWorkspaceData(projectId: string) {
  const project = useLiveQuery(
    () => db.projects.get(projectId),
    [projectId],
    null,
  );
  const dbNodes = useLiveQuery(
    () => db.nodes.where({ project_id: projectId }).toArray(),
    [projectId],
    [],
  );
  const nodeIds = useMemo(() => dbNodes.map((n) => n.id), [dbNodes]);
  const dbContents = useLiveQuery(
    () =>
      nodeIds.length > 0
        ? db.nodeContents.where("node_id").anyOf(nodeIds).toArray()
        : Promise.resolve([] as NodeContent[]),
    [nodeIds],
    [],
  );
  const sourceArtifacts = useLiveQuery(
    () => db.sourceArtifacts.where({ project_id: projectId }).toArray(),
    [projectId],
    [],
  );
  const dbWarnings = useLiveQuery(
    () => db.validationWarnings.where({ project_id: projectId }).toArray(),
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
