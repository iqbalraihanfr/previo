import { db, type NodeData, type NodeContent } from "@/lib/db";

export class NodeRepository {
  static async findAll(): Promise<NodeData[]> {
    return db.nodes.toArray();
  }

  static async findAllByProjectId(projectId: string): Promise<NodeData[]> {
    return db.nodes.where({ project_id: projectId }).sortBy("sort_order");
  }

  static async findByProjectAndType(
    projectId: string,
    type: NodeData["type"],
  ): Promise<NodeData | undefined> {
    return db.nodes.where({ project_id: projectId, type }).first();
  }

  static async findById(id: string): Promise<NodeData | undefined> {
    return db.nodes.get(id);
  }

  static async create(node: NodeData): Promise<string> {
    return db.nodes.add(node);
  }

  static async bulkCreate(nodes: NodeData[]): Promise<string> {
    return db.nodes.bulkAdd(nodes);
  }

  static async update(id: string, changes: Partial<NodeData>): Promise<number> {
    return db.nodes.update(id, changes);
  }

  static async delete(id: string): Promise<void> {
    await db.nodes.delete(id);
  }

  static async deleteByProjectId(projectId: string): Promise<number> {
    return db.nodes.where({ project_id: projectId }).delete();
  }
}

export class NodeContentRepository {
  static async findAllByNodeIds(nodeIds: string[]): Promise<NodeContent[]> {
    if (nodeIds.length === 0) return [];
    return db.nodeContents.where("node_id").anyOf(nodeIds).toArray();
  }

  static async findByNodeId(nodeId: string): Promise<NodeContent | undefined> {
    return db.nodeContents.where({ node_id: nodeId }).first();
  }

  static async findByProjectAndType(
    projectId: string,
    type: NodeData["type"],
  ): Promise<NodeContent | undefined> {
    const node = await NodeRepository.findByProjectAndType(projectId, type);
    if (!node) return undefined;
    return NodeContentRepository.findByNodeId(node.id);
  }

  static async create(content: NodeContent): Promise<string> {
    return db.nodeContents.add(content);
  }

  static async bulkCreate(contents: NodeContent[]): Promise<string> {
    return db.nodeContents.bulkAdd(contents);
  }

  static async update(id: string, changes: Partial<NodeContent>): Promise<number> {
    return db.nodeContents.update(id, changes);
  }

  static async deleteByNodeId(nodeId: string): Promise<number> {
    return db.nodeContents.where({ node_id: nodeId }).delete();
  }

  static async deleteByNodeIds(nodeIds: string[]): Promise<number> {
    return db.nodeContents.where("node_id").anyOf(nodeIds).delete();
  }
}
