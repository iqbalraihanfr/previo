export type NodeType =
  | "project_brief"
  | "requirements"
  | "user_stories"
  | "use_cases"
  | "flowchart"
  | "dfd"
  | "erd"
  | "sequence"
  | "task_board"
  | "summary";

export interface ProjectBriefFields {
  name?: string;
  background?: string;
  objectives?: string[];
  target_users?: string[];
  scope_in?: string[];
  scope_out?: string[];
  success_metrics?: { metric: string; target: string }[];
  constraints?: string[];
  tech_stack?: string[];
  references?: { name: string; url: string }[];
}

export type RequirementType = "FR" | "NFR";
export type RequirementPriority = "Must" | "Should" | "Could" | "Wont";

export interface RequirementFieldItem extends Record<string, unknown> {
  id: string;
  type?: RequirementType;
  description?: string;
  priority?: RequirementPriority;
  category?: string;
  related_scope?: string;
  metric?: string;
  target?: string;
}

export interface RequirementFields {
  items?: RequirementFieldItem[];
}

export interface UserStoryCriteria {
  given?: string;
  when?: string;
  then?: string;
}

export interface UserStoryFieldItem extends Record<string, unknown> {
  id: string;
  role?: string;
  goal?: string;
  benefit?: string;
  related_requirement?: string;
  acceptance_criteria?: Array<string | UserStoryCriteria>;
}

export interface UserStoryFields {
  items?: UserStoryFieldItem[];
}

export interface UseCaseFlowStep {
  actor: string;
  action: string;
}

export interface UseCaseAlternativeFlow {
  name: string;
  branch_from_step: string;
  steps: string;
}

export interface UseCaseItemData {
  id: string;
  name: string;
  primary_actor: string;
  secondary_actors: string[];
  description: string;
  preconditions: string[];
  postconditions: string[];
  main_flow: UseCaseFlowStep[];
  alternative_flows: UseCaseAlternativeFlow[];
  related_user_stories: string[];
  include_extend: string[];
}

export interface UseCaseFields {
  actors?: string[];
  useCases?: UseCaseItemData[];
}

export type FlowStepType = "start" | "process" | "decision" | "end";

export interface FlowStep {
  id: string;
  label: string;
  type: FlowStepType;
  yes_target?: string;
  no_target?: string;
}

export interface FlowConnection {
  id: string;
  from: string;
  to: string;
  label: string;
}

export interface Flow {
  id: string;
  name: string;
  related_use_case: string;
  trigger: string;
  steps: FlowStep[];
  connections: FlowConnection[];
}

export interface FlowchartFields {
  flows?: Flow[];
}

export interface Participant {
  name: string;
  type: "actor" | "component" | "service" | "database" | "external";
  order: number;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  type: "request" | "response" | "self";
  group: "none" | "alt" | "opt" | "loop";
  group_label?: string;
}

export interface SequenceFields {
  related_use_case?: string;
  participants?: Participant[];
  messages?: Message[];
}

export type ERDAttribute = {
  name?: string;
  type?: string;
  description?: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  isUnique?: boolean;
  isNullable?: boolean;
  isRequired?: boolean;
  isIndex?: boolean;
};

export type ERDEntity = {
  id?: string;
  name?: string;
  description?: string;
  attributes?: ERDAttribute[];
};

export type ERDRelationship = {
  id?: string;
  from?: string;
  to?: string;
  type?: "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many";
  label?: string;
  junction_table?: string;
};

export interface ERDFields {
  entities?: ERDEntity[];
  relationships?: ERDRelationship[];
  sql?: string;
}

export type DFDNodeType = "process" | "entity" | "datastore";

export interface DFDNode {
  id: string;
  label: string;
  type: DFDNodeType;
  related_use_case?: string;
  related_erd_entity?: string;
}

export interface DFDFlow {
  id: string;
  from: string;
  to: string;
  label: string;
}

export interface DFDFields {
  nodes?: DFDNode[];
  flows?: DFDFlow[];
}

export interface TaskBoardFields {
  notes?: string;
}

export interface SummaryFields {
  notes?: string;
}

export type CanonicalNodeFieldMap = {
  project_brief: ProjectBriefFields;
  requirements: RequirementFields;
  user_stories: UserStoryFields;
  use_cases: UseCaseFields;
  flowchart: FlowchartFields;
  dfd: DFDFields;
  erd: ERDFields;
  sequence: SequenceFields;
  task_board: TaskBoardFields;
  summary: SummaryFields;
};

export type CanonicalNodeFields =
  CanonicalNodeFieldMap[keyof CanonicalNodeFieldMap];

export const CONTENT_SCHEMA_VERSION = 1;
export const PROJECT_SCHEMA_VERSION = 1;
export const TASK_GENERATION_VERSION = 1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function emptyCanonicalFieldsForNodeType<T extends NodeType>(
  nodeType: T,
): CanonicalNodeFieldMap[T] {
  switch (nodeType) {
    case "project_brief":
      return {} as CanonicalNodeFieldMap[T];
    case "requirements":
      return { items: [] } as CanonicalNodeFieldMap[T];
    case "user_stories":
      return { items: [] } as CanonicalNodeFieldMap[T];
    case "use_cases":
      return { actors: [], useCases: [] } as CanonicalNodeFieldMap[T];
    case "flowchart":
      return { flows: [] } as CanonicalNodeFieldMap[T];
    case "dfd":
      return { nodes: [], flows: [] } as CanonicalNodeFieldMap[T];
    case "erd":
      return { entities: [], relationships: [] } as CanonicalNodeFieldMap[T];
    case "sequence":
      return { related_use_case: "", participants: [], messages: [] } as CanonicalNodeFieldMap[T];
    case "task_board":
    case "summary":
      return {} as CanonicalNodeFieldMap[T];
    default:
      return {} as CanonicalNodeFieldMap[T];
  }
}

export function coerceCanonicalFields<T extends NodeType>(
  nodeType: T,
  value: unknown,
): CanonicalNodeFieldMap[T] {
  if (!isRecord(value)) {
    return emptyCanonicalFieldsForNodeType(nodeType);
  }

  const base = emptyCanonicalFieldsForNodeType(nodeType);
  return {
    ...base,
    ...value,
  } as CanonicalNodeFieldMap[T];
}

export function getCanonicalNotes(fields: CanonicalNodeFields | null | undefined) {
  if (!fields || !isRecord(fields)) return "";
  return typeof fields.notes === "string" ? fields.notes : "";
}

export function getCanonicalSql(fields: CanonicalNodeFields | null | undefined) {
  if (!fields || !isRecord(fields)) return "";
  return typeof fields.sql === "string" ? fields.sql : "";
}
