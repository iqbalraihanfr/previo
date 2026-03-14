import { db, type TaskData } from "@/lib/db";

export class TaskRepository {
  static async findAllByProjectId(projectId: string): Promise<TaskData[]> {
    return db.tasks.where({ project_id: projectId }).sortBy("sort_order");
  }

  static async create(task: TaskData): Promise<string> {
    return db.tasks.add(task);
  }

  static async bulkCreate(tasks: TaskData[]): Promise<string> {
    return db.tasks.bulkAdd(tasks);
  }

  static async deleteByProjectId(projectId: string): Promise<number> {
    return db.tasks.where({ project_id: projectId }).delete();
  }
}
