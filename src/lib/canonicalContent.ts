import {
  CONTENT_SCHEMA_VERSION,
  coerceCanonicalFields,
  emptyCanonicalFieldsForNodeType,
  type CanonicalNodeFieldMap,
  type NodeType,
} from "@/lib/canonical";
import type { NodeContent, NodeData } from "@/lib/db";

export function createNodeContentRecord<T extends NodeType>(params: {
  id: string;
  nodeId: string;
  nodeType: T;
  mermaidAuto?: string;
  mermaidManual?: string;
  structuredFields?: CanonicalNodeFieldMap[T];
  updatedAt: string;
  reviewedAt?: string;
}): NodeContent {
  return {
    id: params.id,
    node_id: params.nodeId,
    structured_fields:
      params.structuredFields ?? emptyCanonicalFieldsForNodeType(params.nodeType),
    content_schema_version: CONTENT_SCHEMA_VERSION,
    reviewed_at: params.reviewedAt,
    mermaid_auto: params.mermaidAuto ?? "",
    mermaid_manual: params.mermaidManual ?? "",
    updated_at: params.updatedAt,
  };
}

export function getCanonicalNodeFields<T extends NodeType>(
  nodeType: T,
  content: Pick<NodeContent, "structured_fields"> | null | undefined,
): CanonicalNodeFieldMap[T] {
  return coerceCanonicalFields(nodeType, content?.structured_fields);
}

export function getCanonicalFieldsForNode(
  node: Pick<NodeData, "type">,
  content: Pick<NodeContent, "structured_fields"> | null | undefined,
) {
  return coerceCanonicalFields(node.type, content?.structured_fields);
}
