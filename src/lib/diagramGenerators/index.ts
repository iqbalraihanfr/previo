/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateUseCaseMermaid } from "./useCase";
import { generateERDMermaid } from "./erd";
import { generateSequenceMermaid } from "./sequence";
import { generateFlowchartMermaid } from "./flowchart";
import { generateDFDMermaid } from "./dfd";

export function generateMermaid(
  nodeType: string,
  fields: Record<string, any>,
): string {
  try {
    switch (nodeType) {
      case "use_cases":
        return generateUseCaseMermaid(fields);
      case "erd":
        return generateERDMermaid(fields);
      case "sequence":
        return generateSequenceMermaid(fields);
      case "flowchart":
        return generateFlowchartMermaid(fields);
      case "dfd":
        return generateDFDMermaid(fields);
      case "project_brief":
        return "mindmap\n  root((Project))\n    Background\n    Scope\n    Metrics";
      case "requirements":
        return "mindmap\n  root((Requirements))\n    Functional\n    NonFunctional";
      case "user_stories":
        return "mindmap\n  root((User Stories))";
      default:
        return "";
    }
  } catch (e) {
    console.error("Failed to generate mermaid for", nodeType, e);
    return "";
  }
}
