import { db, type NodeData, type NodeContent } from "@/lib/db";

export class NodeRepository {
  static async findAllByProjectId(projectId: string): Promise<NodeData[]> {
    return db.nodes.where({ project_id: projectId }).sortBy("sort_order");
  }

  static async findById(id: string): Promise<NodeData | undefined> {
    return db.nodes.get(id);
  }

  static async create(node: NodeData): Promise<string> {
    return db.nodes.add(node);
  }

  static async update(id: string, changes: Partial<NodeData>): Promise<number> {
    return db.nodes.update(id, changes);
  }

  static async deleteByProjectId(projectId: string): Promise<number> {
    return db.nodes.where({ project_id: projectId }).delete();
  }
}

export class NodeContentRepository {
  static async findByNodeId(nodeId: string): Promise<NodeContent | undefined> {
    return db.nodeContents.where({ node_id: nodeId }).first();
  }

  static async create(content: NodeContent): Promise<string> {
    return db.nodeContents.add(content);
  }

  static async update(id: string, changes: Partial<NodeContent>): Promise<number> {
    return db.nodeContents.update(id, changes);
  }

  static async deleteByNodeIds(nodeIds: string[]): Promise<number> {
    return db.nodeContents.where("node_id").anyOf(nodeIds).delete();
  }
}
