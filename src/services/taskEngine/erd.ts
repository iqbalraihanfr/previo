/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TaskData } from "@/lib/db";
import { compactTaskText, normalizeTaskPhrase } from "./utils";

export function generateERDTasks(
  nodeId: string,
  projectId: string,
  fields: Record<string, any>,
): Omit<TaskData, "id" | "created_at" | "updated_at">[] {
  const tasks: Omit<TaskData, "id" | "created_at" | "updated_at">[] = [];
  const entities = (fields.entities as any[]) || [];
  const rels = (fields.relationships as any[]) || [];
  let order = 0;

  entities.forEach((entity: any) => {
    const name = String(entity.name ?? "").trim();
    if (!name) return;
    const entitySlug = normalizeTaskPhrase(name).replace(/\s+/g, "-") || name.toLowerCase();
    const attributeCount = Array.isArray(entity.attributes) ? entity.attributes.length : 0;

    tasks.push({
      project_id: projectId,
      source_node_id: nodeId,
      source_item_id: `erd-model-${entitySlug}`,
      title: `Create data model for ${compactTaskText(name, 44)}`,
      description: `Database schema implementation for ${name} entity.`,
      group_key: "Database Schema",
      feature_name: "Database Schema",
      priority_tier: "P0",
      priority: "Must",
      labels: ["database"],
      status: "todo",
      is_manual: false,
      sort_order: order++,
    });

    if (attributeCount >= 5) {
      tasks.push({
        project_id: projectId,
        source_node_id: nodeId,
        source_item_id: `erd-validation-${entitySlug}`,
        title: `Validate ${compactTaskText(name, 44)} inputs`,
        description: `${name} has ${attributeCount} attributes - add input validation rules.`,
        group_key: "Database Schema",
        feature_name: "Database Schema",
        priority_tier: "P1",
        priority: "Should",
        labels: ["database"],
        status: "todo",
        is_manual: false,
        sort_order: order++,
      });
    }

    tasks.push({
      project_id: projectId,
      source_node_id: nodeId,
      source_item_id: `erd-seed-${entitySlug}`,
      title: `Seed ${compactTaskText(name, 44)} records`,
      description: `Generate sample/seed data for ${name} entity.`,
      group_key: "Database Schema",
      feature_name: "Quality & Performance",
      priority_tier: "P2",
      priority: "Could",
      labels: ["database"],
      status: "todo",
      is_manual: false,
      sort_order: order++,
    });
  });

  // Relationship tasks
  rels.forEach((rel: any) => {
    const from = String(rel.from ?? "").trim();
    const to = String(rel.to ?? "").trim();
    if (!from || !to) return;
    const relationshipSlug = normalizeTaskPhrase(`${from} ${to}`).replace(/\s+/g, "-") || `${from}-${to}`;
    tasks.push({
      project_id: projectId,
      source_node_id: nodeId,
      source_item_id: `erd-rel-${relationshipSlug}`,
      title: `Link ${compactTaskText(from, 30)} and ${compactTaskText(to, 30)}`,
      description: `Configure ${rel.type || "one-to-many"} relationship between ${from} and ${to}.`,
      group_key: "Database Schema",
      feature_name: "Database Schema",
      priority_tier: "P0",
      priority: "Must",
      labels: ["database"],
      status: "todo",
      is_manual: false,
      sort_order: order++,
    });

    // N:M pivot table task
    if (rel.type === "many-to-many") {
      const junction = String(rel.junction_table || `${from}_${to}`).trim();
      tasks.push({
        project_id: projectId,
        source_node_id: nodeId,
        source_item_id: `erd-pivot-${relationshipSlug}`,
        title: `Add join table for ${compactTaskText(junction, 44)}`,
        description: `N:M junction table for ${from} ↔ ${to}.`,
        group_key: "Database Schema",
        feature_name: "Database Schema",
        priority_tier: "P0",
        priority: "Must",
        labels: ["database"],
        status: "todo",
        is_manual: false,
        sort_order: order++,
      });
    }
  });

  return tasks;
}
