/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TaskData } from "@/lib/db";

export function generateUseCasesTasks(
  nodeId: string,
  projectId: string,
  fields: Record<string, any>,
): Omit<TaskData, "id" | "created_at" | "updated_at">[] {
  const tasks: Omit<TaskData, "id" | "created_at" | "updated_at">[] = [];
  const useCases = (fields.useCases as any[]) || [];
  let order = 0;

  useCases.forEach((uc: any, index: number) => {
    if (!uc.name) return;

    const actors = [
      uc.primary_actor,
      ...((uc.secondary_actors as string[]) || []),
    ].filter(Boolean);

    tasks.push({
      project_id: projectId,
      source_node_id: nodeId,
      source_item_id: `use-case-${index}-${uc.name.toLowerCase().replace(/\s+/g, "-")}`,
      title: `Implement Use Case: ${uc.name}`,
      description: `Use Case implementation logic. Actors involved: ${actors.length > 0 ? actors.join(", ") : "System"}`,
      group_key: "Implementation",
      priority: "Must",
      labels: ["feature", "use-case"],
      status: "todo",
      is_manual: false,
      sort_order: order++,
    });
  });

  return tasks;
}
