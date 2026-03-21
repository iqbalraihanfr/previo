import { db, NodeData, NodeContent, TaskData, type DeliveryMode } from "@/lib/db";
import { MERMAID_TEMPLATES } from "@/components/editors/panel/constants";
import type { ProjectBriefFields } from "@/components/editors/ProjectBriefEditor";
import type { ContentTemplate } from "@/lib/contentTemplates";
import { PROJECT_TEMPLATES } from "@/features/dashboard/projectTemplates";
import { generateTasksFromNode } from "@/services/taskEngine";
import { ProjectRepository } from "@/repositories/ProjectRepository";
import { NodeRepository, NodeContentRepository } from "@/repositories/NodeRepository";
import { EdgeRepository } from "@/repositories/EdgeRepository";
import { TaskRepository } from "@/repositories/TaskRepository";
import { ValidationWarningRepository, AttachmentRepository } from "@/repositories/MiscRepository";

/** Node types that the task engine can generate tasks from */
const TASK_GENERATING_TYPES = new Set([
  "erd",
  "flowchart",
  "sequence",
  "dfd",
  "use_cases",
  "user_stories",
]);

export class ProjectService {
  static async createProject(params: {
    name: string;
    description: string;
    templateKey: string;
    deliveryMode?: DeliveryMode;
    initialBriefContent?: ProjectBriefFields;
    contentTemplate?: ContentTemplate;
  }): Promise<string> {
    const {
      name,
      description,
      templateKey,
      deliveryMode = "agile",
      initialBriefContent,
      contentTemplate,
    } = params;
    const projectId = crypto.randomUUID();
    const now = new Date().toISOString();

    const seededNodes: { node: NodeData; content: NodeContent }[] = [];

    await db.transaction(
      "rw",
      [db.projects, db.nodes, db.nodeContents, db.edges],
      async () => {
        // 1. Create project
        await ProjectRepository.create({
          id: projectId,
          name,
          description,
          template_type: templateKey as "quick" | "full" | "blank",
          delivery_mode: deliveryMode,
          created_at: now,
          updated_at: now,
        });

        const template = PROJECT_TEMPLATES[templateKey] || PROJECT_TEMPLATES.blank;
        const nodeMap = new Map<string, string>();

        // 2. Add nodes
        for (const nodeTpl of template.nodes) {
          const nodeId = crypto.randomUUID();
          nodeMap.set(nodeTpl.type, nodeId);

          let structuredFields: Record<string, unknown> = {};
          let mermaidManual = "";
          let hasContent = false;

          if (contentTemplate) {
            if (nodeTpl.type === "project_brief") {
              structuredFields = { ...contentTemplate.brief, name };
              hasContent = Object.keys(contentTemplate.brief).length > 0;
            } else if (nodeTpl.type === "requirements" && contentTemplate.requirements) {
              structuredFields = contentTemplate.requirements;
              hasContent = true;
            } else if (nodeTpl.type === "erd" && contentTemplate.erd) {
              structuredFields = contentTemplate.erd;
              hasContent = true;
            } else if (nodeTpl.type === "flowchart" && contentTemplate.mermaid?.flowchart) {
              mermaidManual = contentTemplate.mermaid.flowchart;
              hasContent = true;
            } else if (nodeTpl.type === "sequence" && contentTemplate.mermaid?.sequence) {
              mermaidManual = contentTemplate.mermaid.sequence;
              hasContent = true;
            } else if (nodeTpl.type === "dfd" && contentTemplate.mermaid?.dfd) {
              mermaidManual = contentTemplate.mermaid.dfd;
              hasContent = true;
            }
          } else if (nodeTpl.type === "project_brief" && initialBriefContent) {
            structuredFields = { ...initialBriefContent, name };
            hasContent = true;
          }

          const nodeStatus: NodeData["status"] = hasContent ? "In Progress" : "Empty";

          await NodeRepository.create({
            id: nodeId,
            project_id: projectId,
            type: nodeTpl.type,
            label: nodeTpl.label,
            status: nodeStatus,
            position_x: nodeTpl.x || 0,
            position_y: nodeTpl.y || 0,
            sort_order: template.nodes.indexOf(nodeTpl),
            generation_status: "none",
            override_status: "none",
            updated_at: now,
          });

          const nodeContent: NodeContent = {
            id: crypto.randomUUID(),
            node_id: nodeId,
            structured_fields: structuredFields,
            mermaid_auto: MERMAID_TEMPLATES[nodeTpl.type] || "",
            mermaid_manual: mermaidManual,
            updated_at: now,
          };

          await NodeContentRepository.create(nodeContent);

          if (hasContent && TASK_GENERATING_TYPES.has(nodeTpl.type) && Object.keys(structuredFields).length > 0) {
            const nodeData: NodeData = {
              id: nodeId,
              project_id: projectId,
              type: nodeTpl.type,
              label: nodeTpl.label,
              status: nodeStatus,
              position_x: nodeTpl.x || 0,
              position_y: nodeTpl.y || 0,
              sort_order: template.nodes.indexOf(nodeTpl),
              generation_status: "none",
              override_status: "none",
              updated_at: now,
            };
            seededNodes.push({ node: nodeData, content: nodeContent });
          }
        }

        // 3. Add edges
        for (const edgeTpl of template.edges) {
          const sourceId = nodeMap.get(edgeTpl.from);
          const targetId = nodeMap.get(edgeTpl.to);

          if (sourceId && targetId) {
            await EdgeRepository.create({
              id: crypto.randomUUID(),
              project_id: projectId,
              source_node_id: sourceId,
              target_node_id: targetId,
            });
          }
        }
      },
    );

    if (seededNodes.length > 0) {
      const allGeneratedTasks: TaskData[] = [];

      for (const { node, content } of seededNodes) {
        const rawTasks = generateTasksFromNode(node, content, projectId);
        const tasks: TaskData[] = rawTasks.map((t) => ({
          ...t,
          task_origin: "generated",
          id: crypto.randomUUID(),
          created_at: now,
          updated_at: now,
        }));
        allGeneratedTasks.push(...tasks);
      }

      if (allGeneratedTasks.length > 0) {
        await db.transaction("rw", [db.tasks], async () => {
          await TaskRepository.bulkCreate(allGeneratedTasks);
        });
      }
    }

    return projectId;
  }

  static async deleteProject(projectId: string): Promise<void> {
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
        db.sourceArtifacts,
      ],
      async () => {
        const projectNodes = await NodeRepository.findAllByProjectId(projectId);
        const nodeIds = projectNodes.map((n) => n.id);

        await ProjectRepository.delete(projectId);
        await NodeRepository.deleteByProjectId(projectId);
        await EdgeRepository.deleteByProjectId(projectId);
        await ValidationWarningRepository.deleteByProjectId(projectId);
        await TaskRepository.deleteByProjectId(projectId);
        await db.sourceArtifacts.where({ project_id: projectId }).delete();

        if (nodeIds.length > 0) {
          await NodeContentRepository.deleteByNodeIds(nodeIds);
          await AttachmentRepository.deleteByNodeIds(nodeIds);
        }
      },
    );
  }
}
