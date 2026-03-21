/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TaskData } from "@/lib/db";
import { compactTaskText, normalizeTaskPhrase } from "./utils";

export function generateDFDTasks(
  nodeId: string,
  projectId: string,
  fields: Record<string, any>,
): Omit<TaskData, "id" | "created_at" | "updated_at">[] {
  const tasks: Omit<TaskData, "id" | "created_at" | "updated_at">[] = [];
  const dfdNodes = fields.nodes || [];
  let order = 0;

  dfdNodes.forEach((n: any) => {
    const label = String(n.label ?? "").trim();
    if (!label) return;
    const nodeSlug = normalizeTaskPhrase(label).replace(/\s+/g, "-") || `node-${order}`;

    if (n.type === "process") {
      tasks.push({
        project_id: projectId,
        source_node_id: nodeId,
        source_item_id: `dfd-process-${order}-${nodeSlug}`,
        title: `Implement ${compactTaskText(label, 44)} process`,
        description: `Data Flow process implementation: ${label}`,
        group_key: "Backend Platform",
        priority: "Must",
        labels: ["backend"],
        status: "todo",
        is_manual: false,
        sort_order: order++,
      });
    } else if (n.type === "entity") {
      tasks.push({
        project_id: projectId,
        source_node_id: nodeId,
        source_item_id: `dfd-ext-${order}-${nodeSlug}`,
        title: `Integrate with ${compactTaskText(label, 44)}`,
        description: `External system integration: ${label}`,
        group_key: "Integration",
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
