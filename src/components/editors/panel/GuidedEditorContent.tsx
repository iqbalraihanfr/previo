import { ProjectBriefEditor } from "@/components/editors/ProjectBriefEditor";
import { RequirementEditor } from "@/components/editors/RequirementEditor";
import { UserStoryEditor } from "@/components/editors/UserStoryEditor";
import { UseCaseEditor } from "@/components/editors/UseCaseEditor";
import { ERDEditor } from "@/components/editors/ERDEditor";
import { SequenceEditor } from "@/components/editors/SequenceEditor";
import { FlowchartEditor } from "@/components/editors/FlowchartEditor";
import { DFDEditor } from "@/components/editors/DFDEditor";

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
          fields={fields}
          onChange={(f) => onChange(f as Record<string, unknown>)}
          projectId={projectId}
        />
      );
    case "requirements":
      return (
        <RequirementEditor
          fields={fields}
          onChange={(f) => onChange(f as Record<string, unknown>)}
          projectId={projectId}
        />
      );
    case "user_stories":
      return (
        <UserStoryEditor
          fields={fields}
          onChange={(f) => onChange(f as Record<string, unknown>)}
          projectId={projectId}
        />
      );
    case "use_cases":
      return (
        <UseCaseEditor
          fields={fields}
          onChange={(f) => onChange(f as Record<string, unknown>)}
          projectId={projectId}
        />
      );
    case "erd":
      return (
        <ERDEditor
          fields={fields}
          onChange={(f) => onChange(f as Record<string, unknown>)}
          projectId={projectId}
        />
      );
    case "sequence":
      return (
        <SequenceEditor
          fields={fields}
          onChange={(f) => onChange(f as Record<string, unknown>)}
          projectId={projectId}
        />
      );
    case "flowchart":
      return (
        <FlowchartEditor
          fields={fields}
          onChange={(f) => onChange(f as Record<string, unknown>)}
          projectId={projectId}
        />
      );
    case "dfd":
      return (
        <DFDEditor
          fields={fields}
          onChange={(f) => onChange(f as Record<string, unknown>)}
          projectId={projectId}
        />
      );
    default:
      return null;
  }
}
