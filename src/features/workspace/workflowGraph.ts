import {
  MarkerType,
  type Edge as FlowEdge,
  type Node as FlowNode,
} from "@xyflow/react";

import type { NodeData, ValidationWarning } from "@/lib/db";
import { getWorkflowDefinition } from "@/features/dashboard/projectTemplates";

export function buildCanonicalFlowEdges(params: {
  projectId: string;
  templateType: "quick" | "full";
  dbNodes: NodeData[];
  dbWarnings: ValidationWarning[];
  nodes: FlowNode[];
}): FlowEdge[] {
  const { projectId, templateType, dbNodes, dbWarnings, nodes } = params;
  const template = getWorkflowDefinition(templateType);

  return template.edges.flatMap((edge) => {
    const sourceNodeData = dbNodes.find((node) => node.type === edge.from);
    const targetNodeData = dbNodes.find((node) => node.type === edge.to);

    if (!sourceNodeData || !targetNodeData) {
      return [];
    }

    let sourceHandle = "right";
    let targetHandle = "left";

    const sourceNode = nodes.find((node) => node.id === sourceNodeData.id);
    const targetNode = nodes.find((node) => node.id === targetNodeData.id);

    if (sourceNode?.position && targetNode?.position) {
      const dx = targetNode.position.x - sourceNode.position.x;
      const dy = targetNode.position.y - sourceNode.position.y;

      if (dy > 80 || dx < -50) {
        sourceHandle = "bottom";
        targetHandle = "top";
      }
    }

    const relevantWarnings = dbWarnings.filter(
      (warning) =>
        warning.source_node_id === sourceNodeData.id &&
        warning.target_node_type === targetNodeData.type,
    );

    const markerColor =
      sourceNodeData.status === "Done"
        ? "#22c55e"
        : sourceNodeData.status === "In Progress"
          ? "#f59e0b"
          : "#94a3b8";

    return [
      {
        id: `${projectId}:${edge.from}->${edge.to}`,
        source: sourceNodeData.id,
        target: targetNodeData.id,
        sourceHandle,
        targetHandle,
        type: "archway",
        animated: true,
        label: edge.label,
        data: {
          sourceStatus: sourceNodeData.status,
          sourceType: sourceNodeData.type,
          targetType: targetNodeData.type,
          warnings: relevantWarnings,
          kind: edge.kind,
        },
        markerEnd: {
          type: MarkerType.Arrow,
          width: 20,
          height: 20,
          color: markerColor,
          strokeWidth: 2,
        },
      } satisfies FlowEdge,
    ];
  });
}
