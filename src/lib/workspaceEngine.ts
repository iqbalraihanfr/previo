import { db } from "./db";
import { type NodeType } from "./canonical";
import { createNodeContentRecord } from "./canonicalContent";
import { AttachmentRepository, ValidationWarningRepository } from "@/repositories/MiscRepository";
import { EdgeRepository } from "@/repositories/EdgeRepository";
import { NodeContentRepository, NodeRepository } from "@/repositories/NodeRepository";
import { TaskRepository } from "@/repositories/TaskRepository";

/**
 * Workspace Engine handles node and edge operations within a project workspace.
 * These functions encapsulate DB transactions and logic for maintaining consistency.
 */

export async function addNode(params: {
  projectId: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  sortOrder: number;
}) {
  const { projectId, type, label, x, y, sortOrder } = params;
  const nodeId = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.transaction("rw", [db.nodes, db.nodeContents], async () => {
    await NodeRepository.create({
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

    await NodeContentRepository.create(
      createNodeContentRecord({
        id: crypto.randomUUID(),
        nodeId,
        nodeType: type,
        updatedAt: now,
      }),
    );
  });

  return nodeId;
}

export async function deleteNode(nodeId: string) {
  await db.transaction(
    "rw",
    [db.nodes, db.nodeContents, db.tasks, db.attachments, db.edges, db.validationWarnings],
    async () => {
      await NodeRepository.delete(nodeId);
      await NodeContentRepository.deleteByNodeId(nodeId);
      const tasks = await TaskRepository.findBySourceNodeId(nodeId);
      if (tasks.length > 0) {
        await TaskRepository.bulkDelete(tasks.map((task) => task.id));
      }
      await AttachmentRepository.deleteByNodeIds([nodeId]);
      await EdgeRepository.deleteByNodeId(nodeId);
      await ValidationWarningRepository.deleteBySourceNodeId(nodeId);
    }
  );
}

export async function updateNodePosition(nodeId: string, x: number, y: number) {
  await NodeRepository.update(nodeId, {
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
  void params;
  // Canonical workflow edges are derived from template definitions.
}
