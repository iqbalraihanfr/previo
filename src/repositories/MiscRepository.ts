import { db, type Attachment, type ValidationWarning } from "@/lib/db";

export class AttachmentRepository {
  static async findAllByNodeId(nodeId: string): Promise<Attachment[]> {
    return db.attachments.where({ node_id: nodeId }).toArray();
  }

  static async create(attachment: Attachment): Promise<string> {
    return db.attachments.add(attachment);
  }

  static async delete(id: string): Promise<void> {
    await db.attachments.delete(id);
  }

  static async deleteByNodeIds(nodeIds: string[]): Promise<number> {
    return db.attachments.where("node_id").anyOf(nodeIds).delete();
  }
}

export class ValidationWarningRepository {
  static async findAllByProjectId(
    projectId: string,
  ): Promise<ValidationWarning[]> {
    return db.validationWarnings.where({ project_id: projectId }).toArray();
  }

  static async deleteByProjectId(projectId: string): Promise<number> {
    return db.validationWarnings.where({ project_id: projectId }).delete();
  }

  static async deleteBySourceNodeId(sourceNodeId: string): Promise<number> {
    return db.validationWarnings.where({ source_node_id: sourceNodeId }).delete();
  }

  static async replaceForProject(
    projectId: string,
    warnings: Omit<ValidationWarning, "id">[],
  ): Promise<void> {
    await db.transaction("rw", db.validationWarnings, async () => {
      await db.validationWarnings.where({ project_id: projectId }).delete();

      if (warnings.length === 0) return;

      await db.validationWarnings.bulkAdd(
        warnings.map((warning) => ({
          ...warning,
          id: crypto.randomUUID(),
        })),
      );
    });
  }
}
