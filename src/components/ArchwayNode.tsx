import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { NodeData, ValidationWarning } from "@/lib/db";
import { NodeLivePreview } from "./NodeLivePreview";
import {
  AlertTriangle,
  Database,
  FileText,
  FolderKanban,
  GitBranch,
  ListChecks,
  ListTodo,
  Network,
  ScrollText,
  Sparkles,
  StickyNote,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NodeVisualData = NodeData & {
  isNext?: boolean;
  warnings?: ValidationWarning[];
};

const TYPE_LABELS: Record<string, string> = {
  project_brief: "Project Brief",
  requirements: "Requirements",
  user_stories: "User Stories",
  use_cases: "Use Cases",
  flowchart: "Flowchart",
  dfd: "DFD",
  erd: "ERD",
  sequence: "Sequence",
  task_board: "Task Board",
  summary: "Summary",
  custom: "Notes",
};

export const ArchwayNode = memo(
  ({
    data,
    selected,
  }: {
    data: Record<string, unknown>;
    selected: boolean;
  }) => {
    const nodeData = data as unknown as NodeVisualData;
    const warningCount = nodeData.warnings?.length || 0;

    const getTypeIcon = (type: string) => {
      switch (type) {
        case "erd":
          return <Database className="h-5 w-5" />;
        case "requirements":
          return <ListChecks className="h-5 w-5" />;
        case "user_stories":
          return <Users className="h-5 w-5" />;
        case "use_cases":
          return <GitBranch className="h-5 w-5" />;
        case "flowchart":
          return <Network className="h-5 w-5" />;
        case "dfd":
          return <ScrollText className="h-5 w-5" />;
        case "sequence":
          return <Sparkles className="h-5 w-5" />;
        case "task_board":
          return <FolderKanban className="h-5 w-5" />;
        case "summary":
          return <ListTodo className="h-5 w-5" />;
        case "custom":
          return <StickyNote className="h-5 w-5" />;
        default:
          return <FileText className="h-5 w-5" />;
      }
    };

    const getHeaderColor = (type: string) => {
      switch (type) {
        case "project_brief":
          return "bg-[var(--node-brief)]";
        case "requirements":
          return "bg-[var(--node-requirements)]";
        case "user_stories":
          return "bg-[var(--node-stories)]";
        case "use_cases":
          return "bg-[var(--node-use-cases)]";
        case "flowchart":
          return "bg-[var(--node-flowchart)]";
        case "dfd":
          return "bg-[var(--node-dfd)]";
        case "erd":
          return "bg-[var(--node-erd)]";
        case "sequence":
          return "bg-[var(--node-sequence)]";
        case "task_board":
          return "bg-[var(--node-task-board)]";
        case "summary":
          return "bg-[var(--node-summary)]";
        default:
          return "bg-[var(--node-custom)]";
      }
    };

    const getNodeMeta = (type: string) => {
      switch (type) {
        case "project_brief":
          return "Project context";
        case "requirements":
          return "System rules";
        case "user_stories":
          return "User goals";
        case "use_cases":
          return "Actor flows";
        case "flowchart":
          return "Process map";
        case "dfd":
          return "Data movement";
        case "erd":
          return "Data model";
        case "sequence":
          return "Interaction flow";
        case "task_board":
          return "Execution plan";
        case "summary":
          return "Delivery review";
        default:
          return "Working notes";
      }
    };

    return (
      <>
        <Handle
          type="target"
          id="left"
          position={Position.Left}
          className="w-4 h-4 rounded-full border-2 border-card bg-primary -left-2! top-7! z-10"
        />
        <Handle
          type="target"
          id="top"
          position={Position.Top}
          className="w-4 h-4 rounded-full border-2 border-card bg-primary -top-2! z-10"
        />

        <div
          className={cn(
            "flex min-w-[320px] max-w-[340px] flex-col overflow-hidden rounded-[12px] border border-border/70 bg-card shadow-[0_4px_20px_rgba(46,50,48,0.06)] transition-all duration-200",
            selected
              ? "scale-[1.01] ring-2 ring-primary/30 shadow-[0_4px_20px_rgba(46,50,48,0.08)]"
              : "ring-1 ring-border/55 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(46,50,48,0.07)]",
            nodeData.isNext ? "focus-guidance focus-guidance-ring" : "",
          )}
        >
          <div
            className={cn(
              "flex items-start justify-between gap-3 px-4 py-3 text-foreground",
              getHeaderColor(nodeData.type),
            )}
          >
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-foreground/8 text-foreground">
                  {getTypeIcon(nodeData.type)}
                </div>
                <div className="min-w-0">
                  <p className="text-readable-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">
                    {TYPE_LABELS[nodeData.type] || "Node"}
                  </p>
                  <h3 className="truncate font-serif text-lg font-semibold leading-tight">
                    {nodeData.label}
                  </h3>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-foreground/8 px-2.5 py-1 text-readable-xs font-medium text-foreground/72">
                  {getNodeMeta(nodeData.type)}
                </span>
                {nodeData.isNext && (
                  <span className="rounded-full bg-primary px-2.5 py-1 text-readable-xs font-semibold uppercase tracking-[0.12em] text-primary-foreground">
                    Start here
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              {warningCount > 0 && (
                <div
                  className="flex items-center gap-1 rounded-full bg-destructive/12 px-2.5 py-1 text-readable-xs font-semibold text-destructive"
                  title={`${warningCount} issues found`}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>
                    {warningCount} issue{warningCount > 1 ? "s" : ""}
                  </span>
                </div>
              )}

              <div className="rounded-full bg-foreground/8 p-1.5 text-foreground/55">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M5 3l14 9-14 9V3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="border-t border-border/70 bg-card px-4 py-3 text-card-foreground">
            <NodeLivePreview
              nodeId={nodeData.id}
              nodeType={nodeData.type}
              projectId={nodeData.project_id}
            />
          </div>
        </div>

        <Handle
          type="source"
          id="right"
          position={Position.Right}
          className="w-4 h-4 rounded-full border-2 border-card bg-primary -right-2! top-7! z-10"
        />
        <Handle
          type="source"
          id="bottom"
          position={Position.Bottom}
          className="w-4 h-4 rounded-full border-2 border-card bg-primary -bottom-2! z-10"
        />
      </>
    );
  },
);

ArchwayNode.displayName = "ArchwayNode";
