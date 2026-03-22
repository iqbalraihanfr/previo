import type {
  DeliveryMode,
  GenerationStatus,
  OverrideStatus,
  SourceArtifact,
  SourceType,
} from "@/lib/db";
import { CONTENT_SCHEMA_VERSION, type ProjectBriefFields } from "@/lib/canonical";

export const SOURCE_ARTIFACT_PARSER_VERSION = "v2";

export type BriefInput = ProjectBriefFields;

export type RequirementItem = {
  id: string;
  type: "FR" | "NFR";
  description: string;
  priority: "Must" | "Should" | "Could" | "Wont";
  category: string;
  related_scope?: string;
  metric?: string;
  target?: string;
};

export type StoryItem = {
  id: string;
  role: string;
  goal: string;
  benefit: string;
  related_requirement?: string;
  acceptance_criteria: Array<
    | string
    | {
        given?: string;
        when?: string;
        then?: string;
      }
  >;
};

export type UseCaseDraft = {
  id: string;
  name: string;
  primary_actor: string;
  secondary_actors: string[];
  description: string;
  preconditions: string[];
  postconditions: string[];
  main_flow: Array<{ actor?: string; action?: string }>;
  alternative_flows: Array<{
    name?: string;
    branch_from_step?: string;
    steps?: string;
  }>;
  related_user_stories: string[];
  include_extend: Array<{
    type?: "include" | "extend";
    target_uc?: string;
  }>;
};

export type DiagramSource = {
  syntax: string;
  format: "mermaid" | "plantuml";
};

export type SchemaSource = {
  syntax: string;
  format: "dbml" | "sql_schema";
};

export type BacklogItem = {
  title: string;
  description: string;
  priority: "must" | "should" | "could" | "wont";
  status: "todo" | "in_progress" | "done";
  external_source: "jira" | "linear";
  external_task_id?: string;
  external_status?: string;
  normalized_title: string;
};

export type SourceArtifactInput = Omit<SourceArtifact, "id" | "created_at" | "updated_at">;

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  brief_doc: "Brief document",
  meeting_text: "Meeting transcript",
  requirements_doc: "Requirements doc",
  jira_csv: "Jira CSV",
  linear_csv: "Linear CSV",
  dbml: "DBML schema",
  sql_schema: "SQL schema",
  mermaid: "Mermaid",
  plantuml: "PlantUML",
  manual_structured: "Structured manual",
};

export const DELIVERY_MODE_LABELS: Record<DeliveryMode, string> = {
  agile: "Agile",
  waterfall: "Waterfall",
  hybrid: "Hybrid",
};

export const GENERATION_STATUS_LABELS: Record<GenerationStatus, string> = {
  none: "Structured manual",
  imported: "Imported source",
  generated: "Generated draft",
};

export const OVERRIDE_STATUS_LABELS: Record<OverrideStatus, string> = {
  none: "Synced",
  manual_override: "Manual override",
};

export function createEmptyArtifactInput(
  params: Pick<SourceArtifactInput, "project_id" | "node_id" | "source_type">,
): SourceArtifactInput {
  return {
    ...params,
    target_node_type: undefined,
    import_status: "pending",
    title: SOURCE_TYPE_LABELS[params.source_type],
    raw_content: "",
    normalized_data: {},
    parser_version: SOURCE_ARTIFACT_PARSER_VERSION,
    content_schema_version: CONTENT_SCHEMA_VERSION,
  };
}
