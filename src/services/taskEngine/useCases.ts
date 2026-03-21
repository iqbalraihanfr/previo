/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TaskData } from "@/lib/db";
import { compactTaskText, normalizeTaskPhrase } from "./utils";

export function generateUseCasesTasks(
  nodeId: string,
  projectId: string,
  fields: Record<string, any>,
): Omit<TaskData, "id" | "created_at" | "updated_at">[] {
  const tasks: Omit<TaskData, "id" | "created_at" | "updated_at">[] = [];
  const useCases = (fields.useCases as any[]) || [];
  let order = 0;

  useCases.forEach((uc: any, index: number) => {
    const name = String(uc.name ?? "").trim();
    if (!name) return;

    const actors = [
      String(uc.primary_actor ?? "").trim(),
      ...((uc.secondary_actors as string[]) || []).map((actor) => String(actor ?? "").trim()),
    ].filter(Boolean);
    const useCaseSlug = normalizeTaskPhrase(name).replace(/\s+/g, "-") || `use-case-${index}`;

    tasks.push({
      project_id: projectId,
      source_node_id: nodeId,
      source_item_id: `use-case-${index}-${useCaseSlug}`,
      title: `Build use case flow: ${compactTaskText(name, 48)}`,
      description: `Use case implementation logic. Actors involved: ${actors.length > 0 ? actors.join(", ") : "System"}.`,
      group_key: "Feature Delivery",
      priority: "Must",
      labels: ["feature", "use-case"],
      status: "todo",
      is_manual: false,
      sort_order: order++,
    });
  });

  return tasks;
}
