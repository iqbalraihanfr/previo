/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TaskData } from "@/lib/db";
import { compactTaskText, normalizeTaskPhrase } from "./utils";

export function generateSequenceTasks(
  nodeId: string,
  projectId: string,
  fields: Record<string, any>,
): Omit<TaskData, "id" | "created_at" | "updated_at">[] {
  const tasks: Omit<TaskData, "id" | "created_at" | "updated_at">[] = [];
  const participants = (fields.participants as any[]) || [];
  const messages = (fields.messages as any[]) || [];
  let order = 0;
  const seenServices = new Set<string>();
  const seenAltGroups = new Set<string>();

  participants.forEach((p: any) => {
    const name = String(typeof p === "string" ? p : p?.name || "").trim();
    const type = typeof p === "string" ? "component" : String(p?.type || "component").trim();

    if (type === "service" && name && !seenServices.has(name)) {
      seenServices.add(name);
      const serviceSlug = normalizeTaskPhrase(name).replace(/\s+/g, "-") || name.toLowerCase();
      tasks.push({
        project_id: projectId,
        source_node_id: nodeId,
        source_item_id: `seq-service-${serviceSlug}`,
        title: `Provision ${compactTaskText(name, 40)} service`,
        description: `Initialize and configure the ${name} service module.`,
        group_key: "Backend Platform",
        feature_name: "API & Infrastructure",
        priority_tier: "P0",
        priority: "Must",
        labels: ["backend"],
        status: "todo",
        is_manual: false,
        sort_order: order++,
      });
    }
  });

  messages.forEach((msg: any, msgIdx: number) => {
    const content = String(msg.content || "").trim();
    if (!content) return;

    const httpMatch = content.match(/^(GET|POST|PUT|PATCH|DELETE)\s+(.+)/i);
    if (httpMatch || /\/api\//.test(content)) {
      const method = httpMatch ? httpMatch[1].toUpperCase() : "API";
      const endpoint = httpMatch ? httpMatch[2] : content;
      const endpointSlug = normalizeTaskPhrase(content).replace(/\s+/g, "-").slice(0, 48) || `api-${msgIdx}`;
      tasks.push({
        project_id: projectId,
        source_node_id: nodeId,
        source_item_id: `seq-api-${msgIdx}-${endpointSlug}`,
        title: `Implement ${method} ${compactTaskText(endpoint, 52)}`,
        description: `API endpoint: ${content} (${String(msg.from || "source").trim()} → ${String(msg.to || "target").trim()})`,
        group_key: "API",
        feature_name: "API & Infrastructure",
        priority_tier: "P0",
        priority: "Must",
        labels: ["backend"],
        status: "todo",
        is_manual: false,
        sort_order: order++,
      });
    } else {
      tasks.push({
        project_id: projectId,
        source_node_id: nodeId,
        source_item_id: `seq-msg-${msgIdx}-${normalizeTaskPhrase(content).replace(/\s+/g, "-").slice(0, 48) || "message"}`,
        title: `Wire ${compactTaskText(content, 52)}`,
        description: `Integration: ${String(msg.from || "source").trim()} → ${String(msg.to || "target").trim()}: ${content}`,
        group_key: "Integration",
        feature_name: "API & Infrastructure",
        priority_tier: "P1",
        priority: "Should",
        labels: ["backend"],
        status: "todo",
        is_manual: false,
        sort_order: order++,
      });
    }

    // Alt/opt/loop group → error handling task
    const group = msg.group || "none";
    const groupLabel = msg.group_label || group;
    if (group === "alt" && groupLabel && !seenAltGroups.has(groupLabel)) {
      seenAltGroups.add(groupLabel);
      const labelSlug = normalizeTaskPhrase(groupLabel).replace(/\s+/g, "-") || "alt";
      tasks.push({
        project_id: projectId,
        source_node_id: nodeId,
        source_item_id: `seq-alt-${labelSlug}`,
        title: `Cover ${compactTaskText(groupLabel, 40)} edge case`,
        description: `Error handling for alternative flow: ${groupLabel}`,
        group_key: "Quality & Performance",
        feature_name: "Quality & Performance",
        priority_tier: "P1",
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
