/* eslint-disable @typescript-eslint/no-explicit-any */

export interface LocalValidationIssue {
  field: string;
  message: string;
}

export function validateNode(
  nodeType: string,
  fields: any,
): LocalValidationIssue[] {
  const issues: LocalValidationIssue[] = [];

  if (!fields) return issues;

  if (nodeType === "project_brief") {
    if (!fields.name)
      issues.push({ field: "name", message: "Project Name is missing." });
    if (!fields.background)
      issues.push({
        field: "background",
        message: "Background / Why is missing.",
      });
    if (!fields.objectives || fields.objectives.length === 0)
      issues.push({
        field: "objectives",
        message: "At least one objective is required.",
      });
    if (!fields.target_users || fields.target_users.length === 0)
      issues.push({
        field: "target_users",
        message: "At least one target user is required.",
      });
    if (!fields.scope_in || fields.scope_in.length === 0)
      issues.push({
        field: "scope_in",
        message: "At least one Scope In item is required.",
      });
    if (!fields.scope_out || fields.scope_out.length === 0)
      issues.push({
        field: "scope_out",
        message: "At least one Scope Out item is required.",
      });
    if (!fields.success_metrics || fields.success_metrics.length === 0)
      issues.push({
        field: "success_metrics",
        message: "At least one success metric is required.",
      });
  }

  if (nodeType === "requirements") {
    const items = fields.items || [];
    const frs = items.filter((i: any) => (i.type || "FR") === "FR");
    const nfrs = items.filter((i: any) => i.type === "NFR");
    if (frs.length < 3)
      issues.push({
        field: "items",
        message: `Min 3 Functional Requirements required (currently ${frs.length}).`,
      });
    if (nfrs.length < 1)
      issues.push({
        field: "items",
        message: "At least 1 Non-Functional Requirement is required.",
      });
    if (!items.some((i: any) => i.priority === "Must"))
      issues.push({
        field: "items",
        message: 'At least 1 requirement must have "Must" priority.',
      });
  }

  if (nodeType === "user_stories") {
    if (!fields.items || fields.items.length === 0)
      issues.push({ field: "items", message: "No user stories defined." });
    else {
      fields.items.forEach((st: any, i: number) => {
        if (!st.role || !st.goal)
          issues.push({
            field: `items[${i}]`,
            message: `Story #${i + 1} is missing role or goal.`,
          });
      });
    }
  }

  if (nodeType === "erd") {
    if (!fields.entities || fields.entities.length === 0)
      issues.push({ field: "entities", message: "No entities defined." });
  }

  return issues;
}
