import { db, type ReadinessSnapshot } from "@/lib/db";

export class ReadinessSnapshotRepository {
  static async findByProjectId(projectId: string): Promise<ReadinessSnapshot | undefined> {
    return db.readinessSnapshots.where({ project_id: projectId }).first();
  }

  static async upsert(snapshot: ReadinessSnapshot): Promise<string> {
    await db.readinessSnapshots.put(snapshot);
    return snapshot.id;
  }

  static async deleteByProjectId(projectId: string): Promise<number> {
    return db.readinessSnapshots.where({ project_id: projectId }).delete();
  }
}
