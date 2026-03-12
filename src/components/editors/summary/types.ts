import type {
  NodeContent,
  NodeData,
  TaskData,
  ValidationWarning,
} from "@/lib/db";

export type RequirementPriority = "Must" | "Should" | "Could" | "Wont";
export type RequirementType = "FR" | "NFR";

export type RequirementItem = {
  id?: string;
  type?: RequirementType;
  priority?: RequirementPriority | string;
  description?: string;
  related_scope?: string;
};

export type UserStoryAcceptanceCriteria =
  | string
  | {
      given?: string;
      when?: string;
      then?: string;
    };

export type UserStoryItem = {
  id?: string;
  role?: string;
  goal?: string;
  benefit?: string;
  related_requirement?: string;
  acceptance_criteria?: UserStoryAcceptanceCriteria[];
  priority?: string;
};

export type UseCaseMainFlowStep = {
  actor?: string;
  action?: string;
};

export type UseCaseAlternativeFlow = {
  name?: string;
  branch_from_step?: string;
  steps?: string;
};

export type UseCaseIncludeExtend = {
  type?: "include" | "extend";
  target_uc?: string;
};

export type UseCaseItem = {
  id?: string;
  name?: string;
  primary_actor?: string;
  secondary_actors?: string[];
  description?: string;
  preconditions?: string[];
  postconditions?: string[];
  main_flow?: UseCaseMainFlowStep[];
  alternative_flows?: UseCaseAlternativeFlow[];
  related_user_stories?: string[];
  related_stories?: string[];
  include_extend?: UseCaseIncludeExtend[];
};

export type FlowchartStep = {
  id?: string;
  label?: string;
  type?: "start" | "process" | "decision" | "end";
  yes_target?: string;
  no_target?: string;
};

export type FlowchartConnection = {
  id?: string;
  from?: string;
  to?: string;
  label?: string;
};

export type FlowchartFlow = {
  id?: string;
  name?: string;
  related_use_case?: string;
  trigger?: string;
  steps?: FlowchartStep[];
  connections?: FlowchartConnection[];
};

export type SequenceParticipant =
  | string
  | { name?: string; type?: string; order?: number };

export type SequenceMessage = {
  id?: string;
  from?: string;
  to?: string;
  content?: string;
  type?: "request" | "response" | "self";
  group?: "none" | "alt" | "opt" | "loop";
  group_label?: string;
};

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

export type DFDNode = {
  id?: string;
  label?: string;
  type?: "process" | "entity" | "datastore";
  related_use_case?: string;
  related_uc?: string;
  related_erd_entity?: string;
};

export type DFDFlow = {
  id?: string;
  from?: string;
  to?: string;
  label?: string;
};

export type SuccessMetric = {
  metric?: string;
  target?: string;
};

export type ReferencePair = {
  name?: string;
  url?: string;
};

export type SummaryStructuredFields = {
  notes?: string;
  sql?: string;
  items?: RequirementItem[] | UserStoryItem[];
  useCases?: UseCaseItem[];
  actors?: string[];
  entities?: ERDEntity[];
  relationships?: ERDRelationship[];
  flows?: FlowchartFlow[];
  steps?: FlowchartStep[];
  connections?: FlowchartConnection[];
  participants?: SequenceParticipant[];
  messages?: SequenceMessage[];
  nodes?: DFDNode[];
  scope_in?: string[];
  scope_out?: string[];
  target_users?: string[];
  objectives?: string[];
  constraints?: string[];
  tech_stack?: string[];
  success_metrics?: SuccessMetric[];
  references?: ReferencePair[];
  name?: string;
  background?: string;
} & Record<string, unknown>;

export type SummaryContent = Omit<NodeContent, "structured_fields"> & {
  structured_fields: SummaryStructuredFields;
};

export type CoverageMetric = {
  label: string;
  covered: number;
  total: number;
  description?: string;
};

export type ProjectSnapshot = {
  allProjectNodes: NodeData[];
  displayNodes: NodeData[];
  contents: Record<string, SummaryContent>;
  tasks: TaskData[];
  warnings: ValidationWarning[];
};
