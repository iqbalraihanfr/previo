import {
  db,
  NodeData,
  NodeContent,
  TaskData,
  type DeliveryMode,
  type ProjectDomain,
  type StarterContentIntensity,
} from "@/lib/db";
import {
  PROJECT_SCHEMA_VERSION,
  type CanonicalNodeFieldMap,
  type NodeType,
} from "@/lib/canonical";
import { createNodeContentRecord } from "@/lib/canonicalContent";
import { MERMAID_TEMPLATES } from "@/components/editors/panel/constants";
import type { ProjectBriefFields } from "@/components/editors/ProjectBriefEditor";
import type { ContentTemplate } from "@/lib/contentTemplates";
import { getDomainStarterSeed } from "@/lib/projectStarters";
import {
  getWorkflowDefinition,
  type WorkflowTemplateKey,
} from "@/features/dashboard/projectTemplates";
import { generateTasksFromNode } from "@/services/taskEngine";
import { ProjectRepository } from "@/repositories/ProjectRepository";
import { NodeRepository, NodeContentRepository } from "@/repositories/NodeRepository";
import { EdgeRepository } from "@/repositories/EdgeRepository";
import { TaskRepository } from "@/repositories/TaskRepository";
import { ValidationWarningRepository, AttachmentRepository } from "@/repositories/MiscRepository";
import { SourceArtifactRepository } from "@/repositories/SourceArtifactRepository";
import { ReadinessSnapshotRepository } from "@/repositories/ReadinessRepository";
import { buildProjectReadinessModel, buildReadinessSnapshot } from "@/lib/readiness";

/** Node types that the task engine can generate tasks from */
const TASK_GENERATING_TYPES = new Set([
  "requirements",
  "user_stories",
  "erd",
  "flowchart",
  "sequence",
  "dfd",
  "use_cases",
]);

export class ProjectService {
  static async createProject(params: {
    name: string;
    description: string;
    templateKey: WorkflowTemplateKey;
    deliveryMode?: DeliveryMode;
    domain?: ProjectDomain;
    starterContentIntensity?: StarterContentIntensity;
    initialBriefContent?: ProjectBriefFields;
    contentTemplate?: ContentTemplate;
  }): Promise<string> {
    const {
      name,
      description,
      templateKey,
      deliveryMode = "agile",
      domain = "general",
      starterContentIntensity = "none",
      initialBriefContent,
      contentTemplate,
    } = params;
    const projectId = crypto.randomUUID();
    const now = new Date().toISOString();
    const starterSeed =
      contentTemplate ??
      getDomainStarterSeed(domain, starterContentIntensity);

    const seededNodes: { node: NodeData; content: NodeContent }[] = [];

    const template = getWorkflowDefinition(templateKey);

    const allNodes: NodeData[] = [];
    const allContents: NodeContent[] = [];

    for (let i = 0; i < template.nodes.length; i++) {
      const nodeTpl = template.nodes[i];
      const nodeId = crypto.randomUUID();

      let structuredFields: Record<string, unknown> = {};
      let mermaidManual = "";
      let hasContent = false;

      if (starterSeed) {
        if (nodeTpl.type === "project_brief") {
          structuredFields = { ...starterSeed.brief, name };
          hasContent = Object.keys(starterSeed.brief).length > 0;
        } else if (nodeTpl.type === "requirements" && starterSeed.requirements) {
          structuredFields = starterSeed.requirements;
          hasContent = true;
        } else if (nodeTpl.type === "erd" && starterSeed.erd) {
          structuredFields = starterSeed.erd;
          hasContent = true;
        } else if (nodeTpl.type === "flowchart" && starterSeed.mermaid?.flowchart) {
          mermaidManual = starterSeed.mermaid.flowchart;
          hasContent = true;
        } else if (nodeTpl.type === "sequence" && starterSeed.mermaid?.sequence) {
          mermaidManual = starterSeed.mermaid.sequence;
          hasContent = true;
        } else if (nodeTpl.type === "dfd" && starterSeed.mermaid?.dfd) {
          mermaidManual = starterSeed.mermaid.dfd;
          hasContent = true;
        }
      } else if (nodeTpl.type === "project_brief" && initialBriefContent) {
        structuredFields = { ...initialBriefContent, name };
        hasContent = true;
      }

      const nodeStatus: NodeData["status"] = hasContent ? "In Progress" : "Empty";

      const nodeData: NodeData = {
        id: nodeId,
        project_id: projectId,
        type: nodeTpl.type as NodeType,
        label: nodeTpl.label,
        status: nodeStatus,
        position_x: nodeTpl.x || 0,
        position_y: nodeTpl.y || 0,
        sort_order: i,
        generation_status: "none",
        override_status: "none",
        updated_at: now,
      };
      allNodes.push(nodeData);

      const nodeContent: NodeContent = {
        ...createNodeContentRecord({
          id: crypto.randomUUID(),
          nodeId,
          nodeType: nodeTpl.type as NodeType,
          structuredFields: structuredFields as CanonicalNodeFieldMap[NodeType],
          mermaidAuto: MERMAID_TEMPLATES[nodeTpl.type] || "",
          mermaidManual,
          updatedAt: now,
        }),
      };
      allContents.push(nodeContent);

      if (hasContent && TASK_GENERATING_TYPES.has(nodeTpl.type) && Object.keys(structuredFields).length > 0) {
        seededNodes.push({ node: nodeData, content: nodeContent });
      }
    }

    await db.transaction(
      "rw",
      [db.projects, db.nodes, db.nodeContents],
      async () => {
        await ProjectRepository.create({
          id: projectId,
          name,
          description,
          template_type: templateKey,
          schema_version: PROJECT_SCHEMA_VERSION,
          delivery_mode: deliveryMode,
          domain,
          starter_content_intensity: starterContentIntensity,
          project_notes: "",
          created_at: now,
          updated_at: now,
        });
        await db.nodes.bulkAdd(allNodes);
        await db.nodeContents.bulkAdd(allContents);
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

    const readiness = buildProjectReadinessModel({
      nodes: allNodes,
      contents: allContents,
      warnings: [],
    });
    await ReadinessSnapshotRepository.upsert(
      buildReadinessSnapshot({
        projectId,
        readiness,
        computedAt: now,
      }),
    );

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
        db.readinessSnapshots,
      ],
      async () => {
        const projectNodes = await NodeRepository.findAllByProjectId(projectId);
        const nodeIds = projectNodes.map((n) => n.id);

        await ProjectRepository.delete(projectId);
        await NodeRepository.deleteByProjectId(projectId);
        await EdgeRepository.deleteByProjectId(projectId);
        await ValidationWarningRepository.deleteByProjectId(projectId);
        await TaskRepository.deleteByProjectId(projectId);
        await SourceArtifactRepository.deleteByProjectId(projectId);
        await ReadinessSnapshotRepository.deleteByProjectId(projectId);

        if (nodeIds.length > 0) {
          await NodeContentRepository.deleteByNodeIds(nodeIds);
          await AttachmentRepository.deleteByNodeIds(nodeIds);
          await SourceArtifactRepository.deleteByNodeIds(nodeIds);
        }
      },
    );
  }
}
