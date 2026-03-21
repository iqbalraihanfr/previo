/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TaskData } from "@/lib/db";
import { compactTaskText, mapPriorityToTier, normalizeTaskPhrase } from "./utils";

export function generateUserStoriesTasks(
  nodeId: string,
  projectId: string,
  fields: Record<string, any>,
): Omit<TaskData, "id" | "created_at" | "updated_at">[] {
  const tasks: Omit<TaskData, "id" | "created_at" | "updated_at">[] = [];
  const items = (fields.items as any[]) || [];
  let order = 0;

  items.forEach((item: any, index: number) => {
    const goal = String(item.goal ?? "").trim();
    if (!goal) return;
    const role = String(item.role ?? "user").trim() || "user";
    const storySlug = normalizeTaskPhrase(`${role} ${goal}`).replace(/\s+/g, "-") || `story-${index}`;

    tasks.push({
      project_id: projectId,
      source_node_id: nodeId,
      source_item_id: `story-${storySlug}-impl`,
      title: `Implement ${compactTaskText(goal, 48)}`,
      description: `As a ${role}, I want to ${goal} so that ${String(item.benefit || "it works").trim()}`,
      group_key: "Feature Delivery",
      feature_name: item.category || "General",
      priority_tier: mapPriorityToTier(item.priority),
      priority: item.priority || "Should",
      labels: ["feature"],
      status: "todo",
      is_manual: false,
      sort_order: order++,
    });

    const criteria = item.acceptance_criteria || [];
    criteria.forEach((ac: any, acIdx: number) => {
      const isStructured = typeof ac === "object" && ac !== null;
      const given = isStructured ? ac.given || "" : ac || "";
      const when = isStructured ? ac.when || "" : "";
      const then = isStructured ? ac.then || "" : "";
      if (!given && !when && !then) return;
      const testHeadline = [given, when, then]
        .filter(Boolean)
        .map((part: string) => compactTaskText(String(part), 24))
        .join(" / ");

      tasks.push({
        project_id: projectId,
        source_node_id: nodeId,
        source_item_id: `story-${storySlug}-ac-${acIdx}`,
        title: `Verify ${compactTaskText(goal, 40)}${testHeadline ? `: ${testHeadline}` : ""}`,
        description: `Acceptance test for ${role} story "${goal}" (criterion ${acIdx + 1}).`,
        group_key: "Feature Validation",
        feature_name: "Quality & Performance",
        priority_tier: mapPriorityToTier(item.priority),
        priority: item.priority || "Should",
        labels: ["testing"],
        status: "todo",
        is_manual: false,
        sort_order: order++,
      });
    });
  });

  return tasks;
}
