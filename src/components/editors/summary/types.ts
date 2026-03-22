import type {
  NodeContent,
  NodeData,
  Project,
  ReadinessSnapshot,
  TaskData,
  ValidationWarning,
} from "@/lib/db";
import type {
  CanonicalNodeFields,
} from "@/lib/canonical";

export type SummaryStructuredFields = CanonicalNodeFields;
export type {
  DFDNode,
  ERDEntity,
  Flow as FlowchartFlow,
  Message as SequenceMessage,
  Participant as SequenceParticipant,
  RequirementFieldItem as RequirementItem,
  UseCaseItemData as UseCaseItem,
  UserStoryFieldItem as UserStoryItem,
} from "@/lib/canonical";

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

export type ERDRelationship = {
  id?: string;
  from?: string;
  to?: string;
  type?: "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many";
  label?: string;
  junction_table?: string;
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

export type SummaryContent = Omit<NodeContent, "structured_fields"> & {
  structured_fields: CanonicalNodeFields;
};

export type CoverageMetric = {
  label: string;
  covered: number;
  total: number;
  description?: string;
};

export type ProjectSnapshot = {
  project: Project | null;
  allProjectNodes: NodeData[];
  displayNodes: NodeData[];
  contents: Record<string, SummaryContent>;
  tasks: TaskData[];
  warnings: ValidationWarning[];
  readinessSnapshot: ReadinessSnapshot | null;
};

export type SummaryFraming = {
  executiveSnapshot: string[];
  readinessGaps: string[];
  topBlockers: string[];
  recommendedNextActions: string[];
  traceabilityHighlights: string[];
  implementationProvenance: string[];
};
