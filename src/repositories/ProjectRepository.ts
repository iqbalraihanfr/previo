import { db, type Project } from "@/lib/db";

export class ProjectRepository {
  static async findAll(): Promise<Project[]> {
    return db.projects.toArray();
  }

  static async findById(id: string): Promise<Project | undefined> {
    return db.projects.get(id);
  }

  static async create(project: Project): Promise<string> {
    return db.projects.add(project);
  }

  static async update(id: string, changes: Partial<Project>): Promise<number> {
    return db.projects.update(id, changes);
  }

  static async delete(id: string): Promise<void> {
    return db.projects.delete(id);
  }
}
