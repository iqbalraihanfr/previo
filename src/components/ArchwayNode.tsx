// src/components/ArchwayNode.tsx
import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { NodeData, ValidationWarning } from "@/lib/db";
import { cn } from "@/lib/utils";

type NodeVisualData = NodeData & {
  isNext?: boolean;
  warnings?: ValidationWarning[];
};

const TYPE_ABBR: Record<string, string> = {
  project_brief: "BRIEF",
  requirements: "REQ",
  user_stories: "STORIES",
  use_cases: "USE CASES",
  flowchart: "FLOW",
  dfd: "DFD",
  erd: "ERD",
  sequence: "SEQ",
  task_board: "TASKS",
  summary: "SUMMARY",
};

const ACCENT_COLOR: Record<string, string> = {
  project_brief: "bg-[var(--node-brief)]",
  requirements: "bg-[var(--node-requirements)]",
  user_stories: "bg-[var(--node-stories)]",
  use_cases: "bg-[var(--node-use-cases)]",
  flowchart: "bg-[var(--node-flowchart)]",
  dfd: "bg-[var(--node-dfd)]",
  erd: "bg-[var(--node-erd)]",
  sequence: "bg-[var(--node-sequence)]",
  task_board: "bg-[var(--node-task-board)]",
  summary: "bg-[var(--node-summary)]",
};

function StatusDot({ status }: { status: string }) {
  const color =
    status === "Done"
      ? "bg-primary"
      : status === "In Progress"
        ? "bg-yellow-500"
        : "bg-muted-foreground/30";
  return <span className={cn("h-2 w-2 shrink-0 rounded-full", color)} />;
}

export const ArchwayNode = memo(
  ({
    data,
    selected,
  }: {
    data: Record<string, unknown>;
    selected: boolean;
  }) => {
    const nodeData = data as unknown as NodeVisualData;
    const hasWarnings = (nodeData.warnings?.length ?? 0) > 0;

    return (
      <>
        <Handle
          type="target"
          id="left"
          position={Position.Left}
          className="h-3 w-3 rounded-full border-2 border-card bg-primary -left-1.5! top-1/2! z-10"
        />
        <Handle
          type="target"
          id="top"
          position={Position.Top}
          className="h-3 w-3 rounded-full border-2 border-card bg-primary -top-1.5! z-10"
        />

        <div
          data-testid={`workspace-node-${nodeData.type}`}
          data-node-id={nodeData.id}
          data-node-type={nodeData.type}
          data-node-status={nodeData.status}
          className={cn(
            "relative flex min-w-[180px] max-w-[220px] items-center gap-2 overflow-hidden rounded-[8px] border border-border/70 bg-card py-2.5 pl-2 pr-3 shadow-sm transition-all duration-150",
            selected
              ? "ring-2 ring-primary/40 shadow-md"
              : "ring-1 ring-border/40 hover:-translate-y-px hover:shadow-md",
            nodeData.isNext ? "ring-2 ring-primary/60" : "",
          )}
        >
          {/* Left accent border */}
          <div
            className={cn(
              "h-full w-1 shrink-0 self-stretch rounded-full",
              ACCENT_COLOR[nodeData.type] ?? "bg-muted-foreground/30",
            )}
            style={{ minHeight: "24px" }}
          />

          {/* Content */}
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">
              {TYPE_ABBR[nodeData.type] ?? nodeData.type}
            </p>
            <p className="truncate text-sm font-semibold leading-tight text-foreground">
              {nodeData.label}
            </p>
          </div>

          {/* Right indicators */}
          <div className="flex shrink-0 items-center gap-1">
            {hasWarnings && (
              <span
                className="h-1.5 w-1.5 rounded-full bg-destructive"
                title={`${nodeData.warnings?.length} issue(s)`}
              />
            )}
            {nodeData.isNext && (
              <span className="text-[10px] text-primary" title="Recommended next">
                ✦
              </span>
            )}
            <StatusDot status={nodeData.status} />
          </div>
        </div>

        <Handle
          type="source"
          id="right"
          position={Position.Right}
          className="h-3 w-3 rounded-full border-2 border-card bg-primary -right-1.5! top-1/2! z-10"
        />
        <Handle
          type="source"
          id="bottom"
          position={Position.Bottom}
          className="h-3 w-3 rounded-full border-2 border-card bg-primary -bottom-1.5! z-10"
        />
      </>
    );
  },
);

ArchwayNode.displayName = "ArchwayNode";
