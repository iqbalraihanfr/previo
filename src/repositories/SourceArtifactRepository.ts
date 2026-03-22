import { db, type SourceArtifact } from "@/lib/db";

export class SourceArtifactRepository {
  static async findAllByProjectId(projectId: string): Promise<SourceArtifact[]> {
    return db.sourceArtifacts.where({ project_id: projectId }).toArray();
  }

  static async create(artifact: SourceArtifact): Promise<string> {
    return db.sourceArtifacts.add(artifact);
  }

  static async deleteByProjectId(projectId: string): Promise<number> {
    return db.sourceArtifacts.where({ project_id: projectId }).delete();
  }

  static async deleteByNodeIds(nodeIds: string[]): Promise<number> {
    return db.sourceArtifacts.where("node_id").anyOf(nodeIds).delete();
  }
}

