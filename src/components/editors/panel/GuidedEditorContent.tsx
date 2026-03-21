import { ProjectBriefEditor } from "@/components/editors/ProjectBriefEditor";
import { RequirementEditor } from "@/components/editors/RequirementEditor";
import { UserStoryEditor } from "@/components/editors/UserStoryEditor";
import { UseCaseEditor } from "@/components/editors/UseCaseEditor";
import { ERDEditor } from "@/components/editors/ERDEditor";
import { SequenceEditor } from "@/components/editors/SequenceEditor";
import { FlowchartEditor } from "@/components/editors/FlowchartEditor";
import { DFDEditor } from "@/components/editors/DFDEditor";
import type { ProjectBriefFields } from "@/components/editors/ProjectBriefEditor";
import type { RequirementFields } from "@/components/editors/requirement/hooks/useRequirementLogic";
import type { UserStoryFields } from "@/components/editors/userstory/hooks/useUserStoryLogic";
import type { UseCaseFields } from "@/components/editors/usecase/hooks/useUseCaseLogic";
import type { ERDFields } from "@/components/editors/erd/hooks/useERDLogic";
import type { SequenceFields } from "@/components/editors/sequence/hooks/useSequenceLogic";
import type { FlowchartFields } from "@/components/editors/flowchart/hooks/useFlowchartLogic";
import type { DFDFields } from "@/components/editors/dfd/hooks/useDFDLogic";

export function GuidedEditorContent({
  type,
  fields,
  projectId,
  onChange,
}: {
  type: string;
  fields: Record<string, unknown>;
  projectId: string;
  onChange: (fields: Record<string, unknown>) => void;
}) {
  switch (type) {
    case "project_brief":
      return (
        <ProjectBriefEditor
          fields={fields as ProjectBriefFields}
          onChange={(f) => onChange(f as Record<string, unknown>)}
          projectId={projectId}
        />
      );
    case "requirements":
      return (
        <RequirementEditor
          fields={fields as RequirementFields}
          onChange={(f) => onChange(f as Record<string, unknown>)}
          projectId={projectId}
        />
      );
    case "user_stories":
      return (
        <UserStoryEditor
          fields={fields as UserStoryFields}
          onChange={(f) => onChange(f as Record<string, unknown>)}
          projectId={projectId}
        />
      );
    case "use_cases":
      return (
        <UseCaseEditor
          fields={fields as UseCaseFields}
          onChange={(f) => onChange(f as Record<string, unknown>)}
          projectId={projectId}
        />
      );
    case "erd":
      return (
        <ERDEditor
          fields={fields as ERDFields}
          onChange={(f) => onChange(f as Record<string, unknown>)}
          projectId={projectId}
        />
      );
    case "sequence":
      return (
        <SequenceEditor
          fields={fields as SequenceFields}
          onChange={(f) => onChange(f as Record<string, unknown>)}
          projectId={projectId}
        />
      );
    case "flowchart":
      return (
        <FlowchartEditor
          fields={fields as FlowchartFields}
          onChange={(f) => onChange(f as Record<string, unknown>)}
          projectId={projectId}
        />
      );
    case "dfd":
      return (
        <DFDEditor
          fields={fields as DFDFields}
          onChange={(f) => onChange(f as Record<string, unknown>)}
          projectId={projectId}
        />
      );
    default:
      return null;
  }
}
