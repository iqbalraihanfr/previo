import { db } from "./db";

/**
 * Workspace Engine handles node and edge operations within a project workspace.
 * These functions encapsulate DB transactions and logic for maintaining consistency.
 */

export async function addNode(params: {
  projectId: string;
  type: string;
  label: string;
  x: number;
  y: number;
  sortOrder: number;
}) {
  const { projectId, type, label, x, y, sortOrder } = params;
  const nodeId = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.transaction("rw", [db.nodes, db.nodeContents], async () => {
    await db.nodes.add({
      id: nodeId,
      project_id: projectId,
      type,
      label,
      status: "Empty",
      position_x: x,
      position_y: y,
      sort_order: sortOrder,
      updated_at: now,
    });

    await db.nodeContents.add({
      id: crypto.randomUUID(),
      node_id: nodeId,
      structured_fields: {},
      mermaid_auto: "",
      mermaid_manual: "",
      updated_at: now,
    });
  });

  return nodeId;
}

export async function deleteNode(nodeId: string) {
  await db.transaction(
    "rw",
    [db.nodes, db.nodeContents, db.tasks, db.attachments, db.edges, db.validationWarnings],
    async () => {
      // 1. Delete node
      await db.nodes.delete(nodeId);

      // 2. Delete related content
      await db.nodeContents.where({ node_id: nodeId }).delete();

      // 3. Delete related tasks
      await db.tasks.where({ source_node_id: nodeId }).delete();

      // 4. Delete related attachments
      await db.attachments.where({ node_id: nodeId }).delete();

      // 5. Delete related edges (where this node is source or target)
      await db.edges.where("source_node_id").equals(nodeId).delete();
      await db.edges.where("target_node_id").equals(nodeId).delete();
      
      // 6. Delete validation warnings for this node
      await db.validationWarnings.where({ source_node_id: nodeId }).delete();
    }
  );
}

export async function updateNodePosition(nodeId: string, x: number, y: number) {
  await db.nodes.update(nodeId, {
    position_x: x,
    position_y: y,
    updated_at: new Date().toISOString(),
  });
}

export async function connectNodes(params: {
  projectId: string;
  source: string;
  target: string;
}) {
  const { projectId, source, target } = params;
  await db.edges.add({
    id: crypto.randomUUID(),
    project_id: projectId,
    source_node_id: source,
    target_node_id: target,
  });
}
