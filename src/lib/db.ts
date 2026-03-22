import Dexie, { type EntityTable } from "dexie";
import type { CanonicalNodeFields, NodeType } from "@/lib/canonical";
import {
  CONTENT_SCHEMA_VERSION,
  PROJECT_SCHEMA_VERSION,
} from "@/lib/canonical";

export type DeliveryMode = "agile" | "waterfall" | "hybrid";
export type ProjectDomain =
  | "general"
  | "saas"
  | "ecommerce"
  | "mobile_web"
  | "internal_tool"
  | "marketplace"
  | "content_platform";
export type StarterContentIntensity = "none" | "light" | "rich";
export type SourceType =
  | "brief_doc"
  | "meeting_text"
  | "requirements_doc"
  | "jira_csv"
  | "linear_csv"
  | "dbml"
  | "sql_schema"
  | "mermaid"
  | "plantuml"
  | "manual_structured";
export type GenerationStatus = "none" | "imported" | "generated";
export type OverrideStatus = "none" | "manual_override";
export type TaskOrigin = "generated" | "manual" | "imported_backlog";

export interface Project {
  id: string;
  name: string;
  description: string;
  template_type: "quick" | "full";
  schema_version?: number;
  delivery_mode: DeliveryMode;
  domain?: ProjectDomain;
  starter_content_intensity?: StarterContentIntensity;
  project_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface NodeData {
  id: string;
  project_id: string;
  type: NodeType;
  label: string;
  status: "Empty" | "In Progress" | "Done";
  position_x: number;
  position_y: number;
  sort_order: number;
  source_type?: SourceType;
  source_artifact_id?: string;
  imported_at?: string;
  parser_version?: string;
  generation_status?: GenerationStatus;
  override_status?: OverrideStatus;
  updated_at: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export type StructuredFields = {
  [key: string]: any;
} & CanonicalNodeFields;

export interface NodeContent {
  id: string;
  node_id: string;
  structured_fields: StructuredFields;
  content_schema_version?: number;
  reviewed_at?: string;
  mermaid_auto: string;
  mermaid_manual?: string;
  updated_at: string;
}

export interface EdgeData {
  id: string;
  project_id: string;
  source_node_id: string;
  target_node_id: string;
}

export interface TaskData {
  id: string;
  project_id: string;
  source_node_id: string | null;
  source_item_id?: string;
  source_node_type?: NodeType | null;
  source_item_label?: string;
  title: string;
  description: string;
  group_key: string; // Internal implementation group (e.g. "Database", "API")
  feature_name?: string; // High-level feature (e.g. "Authentication", "Billing")
  priority_tier?: "P0" | "P1" | "P2" | "P3";
  dod_items?: { text: string; done: boolean }[]; // Interactive Definition of Done
  priority:
    | "Must"
    | "Should"
    | "Could"
    | "Wont"
    | "must"
    | "should"
    | "could"
    | "wont";
  labels: string[]; // JSON stringified array in DB, parsed in app
  status: "todo" | "in_progress" | "done";
  is_manual: boolean;
  task_origin?: TaskOrigin;
  generation_rule?: string;
  generation_version?: number;
  upstream_refs?: string[];
  external_source?: "jira" | "linear";
  external_task_id?: string;
  external_status?: string;
  matched_generated_task_id?: string;
  match_to_generated?: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ValidationWarning {
  id: string;
  project_id: string;
  source_node_id: string;
  target_node_type?: string;
  severity: "error" | "warning" | "info";
  message: string;
  rule_id?: string;
}

export interface Attachment {
  id: string;
  node_id: string;
  filename: string;
  mime_type: string;
  size: number;
  data: Blob;
  created_at: string;
}

export interface SourceArtifact {
  id: string;
  project_id: string;
  node_id: string;
  target_node_type?: NodeType;
  source_type: SourceType;
  import_status?: "pending" | "accepted" | "generated";
  title: string;
  raw_content: string;
  normalized_data: Record<string, unknown>;
  parser_version: string;
  content_schema_version?: number;
  created_at: string;
  updated_at: string;
}

export interface ReadinessSnapshot {
  id: string;
  project_id: string;
  status: "not_ready" | "needs_review" | "ready_for_planning";
  status_label: string;
  status_summary: string;
  blockers_count: number;
  coverage_gaps_count: number;
  quality_warnings_count: number;
  next_actions: string[];
  computed_at: string;
  generation_version: number;
}

const db = new Dexie("archway") as Dexie & {
  projects: EntityTable<Project, "id">;
  nodes: EntityTable<NodeData, "id">;
  nodeContents: EntityTable<NodeContent, "id">;
  edges: EntityTable<EdgeData, "id">;
  tasks: EntityTable<TaskData, "id">;
  attachments: EntityTable<Attachment, "id">;
  validationWarnings: EntityTable<ValidationWarning, "id">;
  sourceArtifacts: EntityTable<SourceArtifact, "id">;
  readinessSnapshots: EntityTable<ReadinessSnapshot, "id">;
};

// Schema declaration for version 1
db.version(1).stores({
  projects: "id, name, created_at, updated_at", // Primary key and indexed props
  nodes: "id, project_id, type, status, sort_order",
  nodeContents: "id, node_id",
  edges: "id, project_id, source_node_id, target_node_id",
  tasks: "id, project_id, source_node_id, group_key, is_manual, sort_order",
});

// Schema declaration for version 2
db.version(2).stores({
  projects: "id, name, created_at, updated_at",
  nodes: "id, project_id, type, status, sort_order",
  nodeContents: "id, node_id",
  edges: "id, project_id, source_node_id, target_node_id",
  tasks: "id, project_id, source_node_id, group_key, is_manual, sort_order",
  attachments: "id, node_id, filename, mime_type, created_at",
});

// Schema declaration for version 3 (Structured Input Overhaul)
db.version(3).stores({
  projects: "id, name, created_at, updated_at",
  nodes: "id, project_id, type, status, sort_order",
  nodeContents: "id, node_id",
  edges: "id, project_id, source_node_id, target_node_id",
  tasks:
    "id, project_id, source_node_id, source_item_id, status, group_key, is_manual, sort_order",
  attachments: "id, node_id, filename, mime_type, created_at",
  validationWarnings:
    "id, project_id, source_node_id, target_node_type, severity, rule_id",
});

// Schema declaration for version 4 (Persist selected project template)
db.version(4)
  .stores({
    projects: "id, name, template_type, created_at, updated_at",
    nodes: "id, project_id, type, status, sort_order",
    nodeContents: "id, node_id",
    edges: "id, project_id, source_node_id, target_node_id",
    tasks:
      "id, project_id, source_node_id, source_item_id, status, group_key, is_manual, sort_order",
    attachments: "id, node_id, filename, mime_type, created_at",
    validationWarnings:
      "id, project_id, source_node_id, target_node_type, severity, rule_id",
  })
  .upgrade(async (tx) => {
    await tx
      .table("projects")
      .toCollection()
      .modify((project: Project) => {
        if (!project.template_type) {
          project.template_type = "quick";
        }
      });
  });

// Schema declaration for version 5 (Feature-based tasks)
db.version(5).stores({
  projects: "id, name, template_type, created_at, updated_at",
  nodes: "id, project_id, type, status, sort_order",
  nodeContents: "id, node_id",
  edges: "id, project_id, source_node_id, target_node_id",
  tasks:
    "id, project_id, source_node_id, source_item_id, status, feature_name, priority_tier, group_key, is_manual, sort_order",
  attachments: "id, node_id, filename, mime_type, created_at",
  validationWarnings:
    "id, project_id, source_node_id, target_node_type, severity, rule_id",
});

// Schema declaration for version 6 (Source artifacts + delivery mode)
db.version(6)
  .stores({
    projects: "id, name, template_type, delivery_mode, created_at, updated_at",
    nodes:
      "id, project_id, type, status, sort_order, source_type, generation_status, override_status, imported_at",
    nodeContents: "id, node_id",
    edges: "id, project_id, source_node_id, target_node_id",
    tasks:
      "id, project_id, source_node_id, source_item_id, status, feature_name, priority_tier, group_key, is_manual, task_origin, external_source, external_task_id, match_to_generated, sort_order",
    attachments: "id, node_id, filename, mime_type, created_at",
    validationWarnings:
      "id, project_id, source_node_id, target_node_type, severity, rule_id",
    sourceArtifacts:
      "id, project_id, node_id, source_type, parser_version, created_at, updated_at",
  })
  .upgrade(async (tx) => {
    await tx
      .table("projects")
      .toCollection()
      .modify((project: Project) => {
        if (!project.delivery_mode) {
          project.delivery_mode = "agile";
        }
      });

    await tx
      .table("nodes")
      .toCollection()
      .modify((node: NodeData) => {
        if (!node.generation_status) {
          node.generation_status = "none";
        }
        if (!node.override_status) {
          node.override_status = "none";
        }
      });

    await tx
      .table("tasks")
      .toCollection()
      .modify((task: TaskData) => {
        if (!task.task_origin) {
          task.task_origin = task.is_manual ? "manual" : "generated";
        }
      });
  });

// Schema declaration for version 7 (Canonical workflows + project notes)
db.version(7)
  .stores({
    projects:
      "id, name, template_type, delivery_mode, created_at, updated_at",
    nodes:
      "id, project_id, type, status, sort_order, source_type, generation_status, override_status, imported_at",
    nodeContents: "id, node_id",
    edges: "id, project_id, source_node_id, target_node_id",
    tasks:
      "id, project_id, source_node_id, source_item_id, status, feature_name, priority_tier, group_key, is_manual, task_origin, external_source, external_task_id, match_to_generated, sort_order",
    attachments: "id, node_id, filename, mime_type, created_at",
    validationWarnings:
      "id, project_id, source_node_id, target_node_type, severity, rule_id",
    sourceArtifacts:
      "id, project_id, node_id, source_type, parser_version, created_at, updated_at",
  })
  .upgrade(async (tx) => {
    await tx
      .table("projects")
      .toCollection()
      .modify((project: Project) => {
        if (project.template_type !== "quick" && project.template_type !== "full") {
          project.template_type = "quick";
        }
        if (typeof project.project_notes !== "string") {
          project.project_notes = "";
        }
      });

    const customNodes = await tx
      .table("nodes")
      .where("type")
      .equals("custom")
      .toArray();

    const customNodeIds = customNodes.map((node) => node.id);

    if (customNodeIds.length > 0) {
      await tx.table("nodeContents").where("node_id").anyOf(customNodeIds).delete();
      await tx.table("tasks").where("source_node_id").anyOf(customNodeIds).delete();
      await tx.table("attachments").where("node_id").anyOf(customNodeIds).delete();
      await tx
        .table("validationWarnings")
        .where("source_node_id")
        .anyOf(customNodeIds)
        .delete();
      await tx
        .table("sourceArtifacts")
        .where("node_id")
        .anyOf(customNodeIds)
        .delete();
      await tx.table("nodes").where("id").anyOf(customNodeIds).delete();
    }

    await tx.table("edges").clear();
  });

// Schema declaration for version 8 (Domain metadata + starter intensity)
db.version(8)
  .stores({
    projects:
      "id, name, template_type, delivery_mode, domain, starter_content_intensity, created_at, updated_at",
    nodes:
      "id, project_id, type, status, sort_order, source_type, generation_status, override_status, imported_at",
    nodeContents: "id, node_id",
    edges: "id, project_id, source_node_id, target_node_id",
    tasks:
      "id, project_id, source_node_id, source_item_id, status, feature_name, priority_tier, group_key, is_manual, task_origin, external_source, external_task_id, match_to_generated, sort_order",
    attachments: "id, node_id, filename, mime_type, created_at",
    validationWarnings:
      "id, project_id, source_node_id, target_node_type, severity, rule_id",
    sourceArtifacts:
      "id, project_id, node_id, source_type, parser_version, created_at, updated_at",
  })
  .upgrade(async (tx) => {
    await tx
      .table("projects")
      .toCollection()
      .modify((project: Project) => {
        if (!project.domain) {
          project.domain = "general";
        }
        if (!project.starter_content_intensity) {
          project.starter_content_intensity = "none";
        }
      });
  });

// Schema declaration for version 9 (Boundary split + provenance persistence)
db.version(9)
  .stores({
    projects:
      "id, name, template_type, schema_version, delivery_mode, domain, starter_content_intensity, created_at, updated_at",
    nodes:
      "id, project_id, type, status, sort_order, source_type, generation_status, override_status, imported_at",
    nodeContents:
      "id, node_id, content_schema_version, reviewed_at, updated_at",
    edges: "id, project_id, source_node_id, target_node_id",
    tasks:
      "id, project_id, source_node_id, source_node_type, source_item_id, task_origin, generation_rule, generation_version, status, feature_name, priority_tier, group_key, is_manual, external_source, external_task_id, match_to_generated, sort_order",
    attachments: "id, node_id, filename, mime_type, created_at",
    validationWarnings:
      "id, project_id, source_node_id, target_node_type, severity, rule_id",
    sourceArtifacts:
      "id, project_id, node_id, target_node_type, source_type, import_status, parser_version, content_schema_version, created_at, updated_at",
    readinessSnapshots:
      "id, project_id, status, computed_at, generation_version",
  })
  .upgrade(async (tx) => {
    await tx
      .table("projects")
      .toCollection()
      .modify((project: Project) => {
        if (!project.schema_version) {
          project.schema_version = PROJECT_SCHEMA_VERSION;
        }
      });

    await tx
      .table("nodeContents")
      .toCollection()
      .modify((content: NodeContent) => {
        if (!content.content_schema_version) {
          content.content_schema_version = CONTENT_SCHEMA_VERSION;
        }
      });

    await tx
      .table("sourceArtifacts")
      .toCollection()
      .modify((artifact: SourceArtifact) => {
        if (!artifact.import_status) {
          artifact.import_status = "accepted";
        }
        if (!artifact.content_schema_version) {
          artifact.content_schema_version = CONTENT_SCHEMA_VERSION;
        }
      });

    const nodes = await tx.table("nodes").toArray() as NodeData[];
    const nodeTypeById = new Map(nodes.map((node) => [node.id, node.type]));

    await tx
      .table("sourceArtifacts")
      .toCollection()
      .modify((artifact: SourceArtifact) => {
        artifact.target_node_type =
          artifact.target_node_type ?? nodeTypeById.get(artifact.node_id);
      });

    await tx
      .table("tasks")
      .toCollection()
      .modify((task: TaskData) => {
        if (!task.task_origin) {
          task.task_origin = task.is_manual ? "manual" : "generated";
        }
        if (!task.source_node_type && task.source_node_id) {
          task.source_node_type = nodeTypeById.get(task.source_node_id) ?? null;
        }
        if (!task.generation_rule && task.task_origin === "generated") {
          task.generation_rule = "legacy-task-engine";
        }
        if (!task.generation_version) {
          task.generation_version = 1;
        }
        if (!Array.isArray(task.upstream_refs)) {
          task.upstream_refs = [];
        }
      });

    await tx.table("readinessSnapshots").clear();
    await tx.table("edges").clear();
  });

export { db };
