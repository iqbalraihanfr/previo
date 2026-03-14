/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TaskData } from "@/lib/db";

export function generateDFDTasks(
  nodeId: string,
  projectId: string,
  fields: Record<string, any>,
): Omit<TaskData, "id" | "created_at" | "updated_at">[] {
  const tasks: Omit<TaskData, "id" | "created_at" | "updated_at">[] = [];
  const dfdNodes = fields.nodes || [];
  let order = 0;

  dfdNodes.forEach((n: any) => {
    if (!n.label) return;

    if (n.type === "process") {
      tasks.push({
        project_id: projectId,
        source_node_id: nodeId,
        source_item_id: `dfd-process-${order}-${n.label.toLowerCase().replace(/\s+/g, "-")}`,
        title: `Implement ${n.label} logic`,
        description: `Data Flow process implementation: ${n.label}`,
        group_key: "Backend",
        priority: "Must",
        labels: ["backend"],
        status: "todo",
        is_manual: false,
        sort_order: order++,
      });
    } else if (n.type === "entity") {
      // External system integration task
      tasks.push({
        project_id: projectId,
        source_node_id: nodeId,
        source_item_id: `dfd-ext-${order}-${n.label.toLowerCase().replace(/\s+/g, "-")}`,
        title: `Integrate with ${n.label}`,
        description: `External system integration: ${n.label}`,
        group_key: "Backend",
        priority: "Should",
        labels: ["backend"],
        status: "todo",
        is_manual: false,
        sort_order: order++,
      });
    }
  });

  return tasks;
}
