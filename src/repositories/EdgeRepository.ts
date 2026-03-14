import { db, type EdgeData } from "@/lib/db";

export class EdgeRepository {
  static async findAllByProjectId(projectId: string): Promise<EdgeData[]> {
    return db.edges.where({ project_id: projectId }).toArray();
  }

  static async create(edge: EdgeData): Promise<string> {
    return db.edges.add(edge);
  }

  static async deleteByProjectId(projectId: string): Promise<number> {
    return db.edges.where({ project_id: projectId }).delete();
  }
}
