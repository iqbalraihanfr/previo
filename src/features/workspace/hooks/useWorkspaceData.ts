import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
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
  const dbEdges = useLiveQuery(
    () => db.edges.where({ project_id: projectId }).toArray(),
    [projectId],
    [],
  );
  const dbContents = useLiveQuery(() => db.nodeContents.toArray(), [], []);
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
    dbEdges,
    dbContents,
    dbWarnings,
    sortedNodes,
    recommendedNextNode,
    ...stats,
  };
}
