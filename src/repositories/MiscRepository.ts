import { db, type Attachment, type ValidationWarning } from "@/lib/db";

export class AttachmentRepository {
  static async deleteByNodeIds(nodeIds: string[]): Promise<number> {
    return db.attachments.where("node_id").anyOf(nodeIds).delete();
  }
}

export class ValidationWarningRepository {
  static async deleteByProjectId(projectId: string): Promise<number> {
    return db.validationWarnings.where({ project_id: projectId }).delete();
  }
}
