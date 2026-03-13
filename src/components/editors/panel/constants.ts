import type { NodeData } from "@/lib/db";

export const MERMAID_TEMPLATES: Record<string, string> = {
  flowchart: `flowchart TD
    A[Start] --> B[Process]
    B --> C{Decision?}
    C -- Yes --> D[Action]
    C -- No --> E[Other Action]
    D --> F[End]
    E --> F`,
  erd: `erDiagram
    USERS ||--|{ ORDERS : places
    ORDERS ||--|{ ORDER_ITEMS : contains
    PRODUCTS ||--o{ ORDER_ITEMS : included_in

    USERS {
        string id PK
        string name
        string email
    }`,
  sequence: `sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    participant Database

    User->>Frontend: Action
    Frontend->>Backend: API Request
    Backend->>Database: Query
    Database-->>Backend: Result
    Backend-->>Frontend: Response
    Frontend-->>User: Display`,
  use_case: `graph TD
    subgraph System
        UC1((Use Case 1))
        UC2((Use Case 2))
    end
    Actor1[Actor] --> UC1
    Actor1 --> UC2`,
  dfd: `graph LR
    EE1[External Entity] -->|data flow| P1((Process))
    P1 -->|output| DS1[(Data Store)]
    DS1 -->|read| P2((Process 2))
    P2 -->|result| EE2[External Entity 2]`,
};

export const DIAGRAM_NODES = ["flowchart", "erd", "dfd", "use_case", "sequence"];

export const GUIDED_NODE_TYPES = [
  "project_brief",
  "requirements",
  "user_stories",
  "use_cases",
  "erd",
  "sequence",
  "flowchart",
  "dfd",
];

export type EditorTab = "content" | "meta";

export function getNodeTypeLabel(type: string) {
  switch (type) {
    case "project_brief":
      return "Project Brief";
    case "requirements":
      return "Requirements";
    case "user_stories":
      return "User Stories";
    case "use_cases":
      return "Use Cases";
    case "flowchart":
      return "Flowchart";
    case "dfd":
      return "DFD";
    case "erd":
      return "ERD";
    case "sequence":
      return "Sequence";
    case "task_board":
      return "Task Board";
    case "summary":
      return "Summary";
    default:
      return "Notes";
  }
}

export function getStatusTone(status: NodeData["status"]) {
  if (status === "Done") {
    return "metric-pill metric-pill--success";
  }

  if (status === "In Progress") {
    return "metric-pill metric-pill--warning";
  }

  return "metric-pill metric-pill--info";
}
