export interface ProjectTemplate {
  label: string;
  description: string;
  nodes: { type: string; label: string; x?: number; y?: number }[];
  edges: CanonicalWorkflowEdge[];
}

export type WorkflowTemplateKey = "quick" | "full";

export interface CanonicalWorkflowEdge {
  from: string;
  to: string;
  label: string;
  kind:
    | "defines_scope"
    | "traces_to"
    | "covers"
    | "derives_data_flow"
    | "drives_schema"
    | "generates_tasks"
    | "summarizes";
}

export interface WorkflowDefinition extends ProjectTemplate {
  key: WorkflowTemplateKey;
}

export const PROJECT_TEMPLATES: Record<WorkflowTemplateKey, WorkflowDefinition> = {
  quick: {
    key: "quick",
    label: "Quick Start",
    description: "Brief → Requirements → ERD → Task Board → Summary.",
    nodes: [
      { type: "project_brief", label: "Project Brief", x: 0, y: 0 },
      { type: "requirements", label: "Requirements", x: 350, y: 0 },
      { type: "erd", label: "ERD", x: 700, y: 0 },
      { type: "task_board", label: "Task Board", x: 1050, y: 0 },
      { type: "summary", label: "Summary", x: 1400, y: 0 },
    ],
    edges: [
      {
        from: "project_brief",
        to: "requirements",
        label: "defines scope",
        kind: "defines_scope",
      },
      {
        from: "requirements",
        to: "erd",
        label: "drives schema",
        kind: "drives_schema",
      },
      {
        from: "requirements",
        to: "task_board",
        label: "becomes tasks",
        kind: "generates_tasks",
      },
      {
        from: "erd",
        to: "task_board",
        label: "generates work",
        kind: "generates_tasks",
      },
      {
        from: "task_board",
        to: "summary",
        label: "summarizes",
        kind: "summarizes",
      },
    ],
  },
  full: {
    key: "full",
    label: "Full Architecture",
    description: "Complete architecture workflow.",
    nodes: [
      { type: "project_brief", label: "Project Brief", x: 0, y: 0 },
      { type: "requirements", label: "Requirements", x: 300, y: 0 },
      { type: "user_stories", label: "User Stories", x: 600, y: 0 },
      { type: "use_cases", label: "Use Case", x: 0, y: 150 },
      { type: "flowchart", label: "Flowchart", x: 300, y: 150 },
      { type: "dfd", label: "DFD", x: 0, y: 300 },
      { type: "erd", label: "ERD", x: 300, y: 300 },
      { type: "sequence", label: "Sequence", x: 600, y: 300 },
      { type: "task_board", label: "Task Board", x: 0, y: 450 },
      { type: "summary", label: "Summary", x: 300, y: 450 },
    ],
    edges: [
      {
        from: "project_brief",
        to: "requirements",
        label: "defines scope",
        kind: "defines_scope",
      },
      {
        from: "requirements",
        to: "user_stories",
        label: "traces to",
        kind: "traces_to",
      },
      {
        from: "requirements",
        to: "erd",
        label: "drives schema",
        kind: "drives_schema",
      },
      {
        from: "user_stories",
        to: "use_cases",
        label: "covers flows",
        kind: "covers",
      },
      {
        from: "use_cases",
        to: "flowchart",
        label: "logic flow",
        kind: "covers",
      },
      {
        from: "use_cases",
        to: "sequence",
        label: "interaction flow",
        kind: "covers",
      },
      {
        from: "use_cases",
        to: "dfd",
        label: "derives data flow",
        kind: "derives_data_flow",
      },
      {
        from: "erd",
        to: "dfd",
        label: "aligns stores",
        kind: "drives_schema",
      },
      {
        from: "flowchart",
        to: "task_board",
        label: "execution steps",
        kind: "generates_tasks",
      },
      {
        from: "sequence",
        to: "task_board",
        label: "defines APIs",
        kind: "generates_tasks",
      },
      {
        from: "erd",
        to: "task_board",
        label: "database work",
        kind: "generates_tasks",
      },
      {
        from: "task_board",
        to: "summary",
        label: "summarizes",
        kind: "summarizes",
      },
    ],
  },
};

export function getWorkflowDefinition(templateType: "quick" | "full") {
  return PROJECT_TEMPLATES[templateType] ?? PROJECT_TEMPLATES.quick;
}
