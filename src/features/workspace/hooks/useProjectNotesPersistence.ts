import { ProjectRepository } from "@/repositories/ProjectRepository";

export async function persistProjectNotes(projectId: string, value: string) {
  await ProjectRepository.update(projectId, {
    project_notes: value,
    updated_at: new Date().toISOString(),
  });
}
