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

  static async bulkPut(tasks: TaskData[]): Promise<string> {
    return db.tasks.bulkPut(tasks);
  }

  static async update(id: string, changes: Partial<TaskData>): Promise<number> {
    return db.tasks.update(id, changes);
  }

  static async delete(id: string): Promise<void> {
    return db.tasks.delete(id);
  }

  static async bulkDelete(ids: string[]): Promise<void> {
    await db.tasks.bulkDelete(ids);
  }

  static async findBySourceNodeId(nodeId: string): Promise<TaskData[]> {
    return db.tasks.where({ source_node_id: nodeId }).toArray();
  }

  static async replaceGeneratedTasksForProject(
    projectId: string,
    tasks: TaskData[],
  ): Promise<void> {
    const existing = await db.tasks.where({ project_id: projectId }).toArray();
    const generatedIds = existing
      .filter((task) => task.task_origin === "generated")
      .map((task) => task.id);
    if (generatedIds.length > 0) {
      await db.tasks.bulkDelete(generatedIds);
    }
    if (tasks.length > 0) {
      await db.tasks.bulkAdd(tasks);
    }
  }

  static async deleteByProjectId(projectId: string): Promise<number> {
    return db.tasks.where({ project_id: projectId }).delete();
  }
}
