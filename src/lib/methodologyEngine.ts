import type { DeliveryMode, NodeData, TaskData } from "@/lib/db";

export interface DeliveryPlanGroup {
  id: string;
  title: string;
  description: string;
  tasks: TaskData[];
}

export interface SprintProposal {
  id: string;
  title: string;
  description: string;
  tasks: TaskData[];
}

function normalizeText(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function inferWaterfallPhase(task: TaskData, sourceLabel: string) {
  const source = normalizeText(sourceLabel);
  const title = normalizeText(task.title);
  const description = normalizeText(task.description);
  const group = normalizeText(task.group_key);

  if (
    source.includes("brief") ||
    source.includes("requirement") ||
    title.includes("discover") ||
    title.includes("scope")
  ) {
    return "discovery";
  }

  if (
    source.includes("erd") ||
    source.includes("sequence") ||
    source.includes("flowchart") ||
    source.includes("dfd") ||
    title.includes("design") ||
    group.includes("database")
  ) {
    return "design";
  }

  if (
    title.includes("test") ||
    title.includes("validate") ||
    description.includes("acceptance") ||
    group.includes("qa")
  ) {
    return "qa";
  }

  if (
    title.includes("deploy") ||
    title.includes("release") ||
    title.includes("handoff")
  ) {
    return "release";
  }

  return "implementation";
}

function waterfallLabel(phase: string) {
  switch (phase) {
    case "discovery":
      return {
        title: "Discovery",
        description: "Clarify scope, assumptions, and implementation inputs.",
      };
    case "design":
      return {
        title: "Design",
        description: "Prepare structural and behavioral design decisions.",
      };
    case "qa":
      return {
        title: "QA",
        description: "Validate quality, coverage, and release confidence.",
      };
    case "release":
      return {
        title: "Release",
        description: "Package and hand off final deliverables.",
      };
    default:
      return {
        title: "Implementation",
        description: "Build the working system from validated inputs.",
      };
  }
}

const WATERFALL_PHASE_ORDER = [
  "discovery",
  "design",
  "implementation",
  "qa",
  "release",
] as const;

function sortTasksForPlanning(tasks: TaskData[]) {
  const priorityWeight: Record<string, number> = {
    p0: 0,
    p1: 1,
    p2: 2,
    p3: 3,
    must: 0,
    should: 1,
    could: 2,
    wont: 3,
  };

  return [...tasks].sort((a, b) => {
    const aKey = normalizeText(a.priority_tier) || normalizeText(a.priority);
    const bKey = normalizeText(b.priority_tier) || normalizeText(b.priority);
    const byPriority =
      (priorityWeight[aKey] ?? 99) - (priorityWeight[bKey] ?? 99);

    if (byPriority !== 0) return byPriority;
    return a.sort_order - b.sort_order;
  });
}

export function buildDeliveryPlan(params: {
  deliveryMode: DeliveryMode;
  tasks: TaskData[];
  nodes: NodeData[];
}): DeliveryPlanGroup[] {
  const { deliveryMode, tasks, nodes } = params;
  const sourceLabels = new Map(nodes.map((node) => [node.id, node.label]));
  const sortedTasks = sortTasksForPlanning(tasks);

  if (deliveryMode === "agile") {
    const groups = new Map<string, TaskData[]>();

    sortedTasks.forEach((task) => {
      const key = task.feature_name || task.group_key || "General Backlog";
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)?.push(task);
    });

    return Array.from(groups.entries()).map(([key, groupTasks]) => ({
      id: `agile-${key}`,
      title: key,
      description: "Backlog grouped by feature or outcome area.",
      tasks: groupTasks,
    }));
  }

  if (deliveryMode === "waterfall") {
    const groups = new Map<string, TaskData[]>();

    sortedTasks.forEach((task) => {
      const sourceLabel = task.source_node_id
        ? sourceLabels.get(task.source_node_id) ?? ""
        : "";
      const phase = inferWaterfallPhase(task, sourceLabel);
      if (!groups.has(phase)) {
        groups.set(phase, []);
      }
      groups.get(phase)?.push(task);
    });

    return WATERFALL_PHASE_ORDER.filter((phase) => groups.has(phase)).map(
      (phase) => {
        const label = waterfallLabel(phase);
        return {
          id: `waterfall-${phase}`,
          title: label.title,
          description: label.description,
          tasks: groups.get(phase) ?? [],
        };
      },
    );
  }

  const groups = new Map<string, TaskData[]>();

  sortedTasks.forEach((task) => {
    const key = task.feature_name || task.group_key || "General Milestone";
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)?.push(task);
  });

  return Array.from(groups.entries()).map(([key, groupTasks]) => ({
    id: `hybrid-${key}`,
    title: key,
    description: "Milestone bundle with iterative execution inside the milestone.",
    tasks: groupTasks,
  }));
}

export function buildAgileSprintProposal(tasks: TaskData[]): SprintProposal[] {
  const backlog = sortTasksForPlanning(
    tasks.filter((task) => task.status !== "done"),
  );
  const chunkSize = 6;
  const proposals: SprintProposal[] = [];

  for (let index = 0; index < backlog.length; index += chunkSize) {
    const slice = backlog.slice(index, index + chunkSize);
    proposals.push({
      id: `sprint-${index / chunkSize + 1}`,
      title: `Sprint ${index / chunkSize + 1}`,
      description: "Suggested sprint slice based on priority and current backlog order.",
      tasks: slice,
    });
  }

  return proposals;
}
