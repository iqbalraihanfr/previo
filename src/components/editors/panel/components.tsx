import { Loader2, Check, X, Trash2 } from "lucide-react";
import type { NodeData } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getNodeTypeLabel, getStatusTone } from "./constants";

export function SectionHint({
  title,
  description,
  tone = "default",
}: {
  title: string;
  description: string;
  tone?: "default" | "primary" | "muted";
}) {
  const toneClass =
    tone === "primary"
      ? "border-primary/20 bg-primary/8"
      : tone === "muted"
        ? "border-border/70 bg-muted/25"
        : "border-border/70 bg-background/60";

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClass}`}>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

export function TabBadge({
  label,
  tone,
}: {
  label: string;
  tone: "primary" | "muted";
}) {
  return (
    <span
      className={
        tone === "primary"
          ? "rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"
          : "rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
      }
    >
      {label}
    </span>
  );
}

export function EditorPanelHeader({
  node,
  isSaving,
  lastSaved,
  status,
  onStatusChange,
  onCloseAction,
  onDeleteAction,
}: {
  node: NodeData;
  isSaving: boolean;
  lastSaved: Date | null;
  status: NodeData["status"];
  onStatusChange: (status: string | null) => void;
  onCloseAction: () => void;
  onDeleteAction?: () => void;
}) {
  return (
    <>
      <div className="border-b border-border/70 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-readable-xs font-medium text-muted-foreground">
                {getNodeTypeLabel(node.type)}
              </span>
              <span className={getStatusTone(status)}>{status}</span>
            </div>

            <div>
              <h2 className="text-xl font-semibold leading-tight text-foreground">
                {node.label}
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Use the Guided tab as the main source of truth for this node.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden min-w-23 justify-end sm:flex">
              {isSaving ? (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </span>
              ) : lastSaved ? (
                <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                  <Check className="h-3.5 w-3.5" />
                  Saved
                </span>
              ) : null}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onCloseAction}
              className="rounded-full hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="border-b border-border/70 bg-muted/10 px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Label className="text-readable-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Status
            </Label>
            <Select value={status} onValueChange={onStatusChange}>
              <SelectTrigger className="h-9 w-47.5 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Empty">Empty</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {onDeleteAction && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeleteAction}
              className="self-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive lg:self-auto"
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete node
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

export function GuidedOverview({
  hasGuidedEditor,
  isDiagram,
  isErd,
}: {
  hasGuidedEditor: boolean;
  isDiagram: boolean;
  isErd: boolean;
}) {
  return (
    <div className="space-y-3 px-5 pt-4">
      {hasGuidedEditor && (
        <SectionHint
          title="Recommended workflow"
          description="Start in Guided. The fields here drive validation, generated tasks, export output, and diagram generation."
          tone="primary"
        />
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <SectionHint
          title="Guided"
          description="Primary structured input. Best place to document the node clearly and consistently."
          tone="default"
        />
        {isDiagram && (
          <SectionHint
            title="Diagram"
            description="Generated from Guided fields. Use manual editing only when you need a custom override."
            tone="muted"
          />
        )}
        {isErd && (
          <SectionHint
            title="SQL Notes"
            description="Reference-only notes. Helpful for paste-in schemas, but not parsed back into Guided fields."
            tone="muted"
          />
        )}
      </div>
    </div>
  );
}
