import { db, Project, NodeData, NodeContent, Edge, ValidationWarning, TaskData, Attachment } from "./db";
import { MERMAID_TEMPLATES } from "@/components/editors/panel/constants";

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

export async function createProject(params: {
  name: string;
  description: string;
  templateKey: string;
}): Promise<string> {
  const { name, description, templateKey } = params;
  const projectId = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.transaction(
    "rw",
    [db.projects, db.nodes, db.nodeContents, db.edges],
    async () => {
      // 1. Create project
      await db.projects.add({
        id: projectId,
        name,
        description,
        template_type: templateKey,
        created_at: now,
        updated_at: now,
      });

      const template = PROJECT_TEMPLATES[templateKey] || PROJECT_TEMPLATES.blank;
      const nodeMap = new Map<string, string>();
      const nodeArray: { id: string; type: string }[] = [];

      // 2. Add nodes
      for (const nodeTpl of template.nodes) {
        const nodeId = crypto.randomUUID();
        nodeMap.set(nodeTpl.type, nodeId);
        nodeArray.push({ id: nodeId, type: nodeTpl.type });

        await db.nodes.add({
          id: nodeId,
          project_id: projectId,
          type: nodeTpl.type,
          label: nodeTpl.label,
          status: "Empty",
          position_x: nodeTpl.x || 0,
          position_y: nodeTpl.y || 0,
          sort_order: template.nodes.indexOf(nodeTpl),
          updated_at: now,
        });

        // Initialize content
        await db.nodeContents.add({
          id: crypto.randomUUID(),
          node_id: nodeId,
          structured_fields: {},
          mermaid_auto: MERMAID_TEMPLATES[nodeTpl.type] || "",
          mermaid_manual: "",
          updated_at: now,
        });
      }

      // 3. Add edges
      for (const edgeTpl of template.edges) {
        const sourceId = nodeMap.get(edgeTpl.from);
        const targetId = nodeMap.get(edgeTpl.to);

        if (sourceId && targetId) {
          await db.edges.add({
            id: crypto.randomUUID(),
            project_id: projectId,
            source_node_id: sourceId,
            target_node_id: targetId,
          });
        }
      }
    },
  );

  return projectId;
}

export async function deleteProject(projectId: string): Promise<void> {
  await db.transaction(
    "rw",
    [
      db.projects,
      db.nodes,
      db.nodeContents,
      db.edges,
      db.validationWarnings,
      db.tasks,
      db.attachments,
    ],
    async () => {
      // 1. Find nodes to delete related data
      const projectNodes = await db.nodes
        .where({ project_id: projectId })
        .toArray();
      const nodeIds = projectNodes.map((n) => n.id);

      // 2. Delete related data
      await db.projects.delete(projectId);
      await db.nodes.where({ project_id: projectId }).delete();
      await db.edges.where({ project_id: projectId }).delete();
      await db.validationWarnings.where({ project_id: projectId }).delete();
      await db.tasks.where({ project_id: projectId }).delete();

      if (nodeIds.length > 0) {
        await db.nodeContents.where("node_id").anyOf(nodeIds).delete();
        await db.attachments.where("node_id").anyOf(nodeIds).delete();
      }
    },
  );
}
