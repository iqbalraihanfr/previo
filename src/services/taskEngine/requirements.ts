/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TaskData } from "@/lib/db";
import { compactTaskText, mapPriorityToTier, normalizeTaskPhrase } from "./utils";

export function generateRequirementTasks(
  nodeId: string,
  projectId: string,
  fields: Record<string, any>,
): Omit<TaskData, "id" | "created_at" | "updated_at">[] {
  const tasks: Omit<TaskData, "id" | "created_at" | "updated_at">[] = [];
  const items = (fields.items as any[]) || [];
  let order = 0;

  const featureGroups: Record<string, any[]> = {};
  items.forEach((item) => {
    if ((item.type || "FR") !== "FR") return;
    const cat = item.category || item.related_scope || "General";
    if (!featureGroups[cat]) featureGroups[cat] = [];
    featureGroups[cat].push(item);
  });

  Object.entries(featureGroups).forEach(([featureName, featureItems]) => {
    const topPriority = featureItems.reduce((prev, curr) => {
      const pMap: Record<string, number> = { Must: 0, Should: 1, Could: 2, Wont: 3 };
      return (pMap[curr.priority] ?? 1) < (pMap[prev.priority] ?? 1) ? curr : prev;
    }, featureItems[0]);

    const tier = mapPriorityToTier(topPriority.priority);
    const requirementCount = featureItems.length;
    const featureLabel = compactTaskText(featureName, 42);
    const featureSlug = normalizeTaskPhrase(featureName).replace(/\s+/g, "-") || "general";
    const dod = featureItems
      .map((i) => compactTaskText(String(i.description ?? "").trim(), 96))
      .filter(Boolean)
      .map((text) => ({ text, done: false }));

    tasks.push({
      project_id: projectId,
      source_node_id: nodeId,
      source_item_id: `feature-${featureSlug}`,
      title: `Deliver ${featureLabel}`,
      description: `Implement the ${featureLabel} area across ${requirementCount} functional requirement${requirementCount === 1 ? "" : "s"}.`,
      group_key: "Feature Delivery",
      feature_name: featureName,
      priority_tier: tier,
      dod_items: dod,
      priority: topPriority.priority || "Should",
      labels: ["feature"],
      status: "todo",
      is_manual: false,
      sort_order: order++,
    });

    featureItems.forEach((item, idx) => {
      const description = String(item.description ?? "").trim();
      if (description.length > 100) {
        const snippet = compactTaskText(description, 64);
        tasks.push({
          project_id: projectId,
          source_node_id: nodeId,
          source_item_id: `fr-${item.id || idx}`,
          title: `Split ${featureLabel} requirement: ${snippet}`,
          description,
          group_key: "Feature Delivery",
          feature_name: featureName,
          priority_tier: mapPriorityToTier(item.priority),
          priority: item.priority || "Should",
          labels: ["logic"],
          status: "todo",
          is_manual: false,
          sort_order: order++,
        });
      }
    });
  });

  const nfrs = items.filter(i => i.type === "NFR");
  nfrs.forEach((nfr, idx) => {
    const category = compactTaskText(String(nfr.category || "Quality"), 28);
    const metric = compactTaskText(String(nfr.metric || "target"), 28);
    const target = String(nfr.target || "N/A").trim();
    tasks.push({
      project_id: projectId,
      source_node_id: nodeId,
      source_item_id: `nfr-${nfr.id || idx}`,
      title: `Harden ${category}: ${metric}`,
      description: `${String(nfr.description || "").trim()}${target ? `\nTarget: ${target}` : ""}`.trim(),
      group_key: "Quality & Performance",
      feature_name: "Quality & Performance",
      priority_tier: mapPriorityToTier(nfr.priority),
      priority: nfr.priority || "Should",
      labels: ["quality"],
      status: "todo",
      is_manual: false,
      sort_order: order++,
    });
  });

  return tasks;
}
