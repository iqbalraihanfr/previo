export interface ProjectTemplate {
  label: string;
  description: string;
  nodes: { type: string; label: string; x?: number; y?: number }[];
  edges: { from: string; to: string }[];
}

export const PROJECT_TEMPLATES: Record<string, ProjectTemplate> = {
  quick: {
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
      { from: "project_brief", to: "requirements" },
      { from: "requirements", to: "erd" },
      { from: "requirements", to: "task_board" },
      { from: "erd", to: "task_board" },
      { from: "task_board", to: "summary" },
    ],
  },
  full: {
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
      { from: "project_brief", to: "requirements" },
      { from: "requirements", to: "user_stories" },
      { from: "user_stories", to: "use_cases" },
      { from: "use_cases", to: "flowchart" },
      { from: "use_cases", to: "dfd" },
      { from: "erd", to: "sequence" },
      { from: "sequence", to: "task_board" },
      { from: "task_board", to: "summary" },
    ],
  },
  blank: {
    label: "Blank Canvas",
    description: "Start empty and build your own flow.",
    nodes: [],
    edges: [],
  },
};
