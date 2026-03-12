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
    <div
      className={`rounded-2xl border px-4 py-3 transition-all hover:shadow-sm ${toneClass}`}
    >
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground/80">
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
    <div className="flex flex-col border-b border-border/60 bg-card/50 backdrop-blur-md">
      {/* Top Meta Bar */}
      <div className="flex h-13 items-center justify-between border-b border-border/40 px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center rounded-lg border border-border/50 bg-background/50 px-2.5 py-1 shadow-sm">
            <span className="text-readable-2xs font-bold tracking-wider uppercase text-muted-foreground/70">
              {getNodeTypeLabel(node.type)}
            </span>
          </div>
          <div className="h-4 w-px bg-border/40" />
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger className="h-7 w-auto min-w-[100px] border-none bg-transparent p-0 text-readable-xs font-semibold focus:ring-0">
              <span className={getStatusTone(status)}>
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent align="start" className="rounded-xl shadow-xl">
              <SelectItem value="Empty">Empty</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="mr-2 flex items-center gap-2">
            {isSaving ? (
              <span className="flex items-center gap-1.5 text-readable-2xs font-medium text-muted-foreground/60">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving
              </span>
            ) : lastSaved ? (
              <span className="flex items-center gap-1.5 text-readable-2xs font-medium text-emerald-600/80 dark:text-emerald-400/80">
                <Check className="h-3 w-3" />
                Saved
              </span>
            ) : null}
          </div>

          <div className="h-6 w-px bg-border/40 mx-1" />

          {onDeleteAction && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDeleteAction}
              className="h-8 w-8 rounded-lg text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive"
              title="Delete Node"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onCloseAction}
            className="h-8 w-8 rounded-lg text-muted-foreground/50 hover:bg-muted"
            title="Close Panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Title Hero Area */}
      <div className="px-6 py-6 transition-all">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {node.label}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground/70 max-w-[90%]">
          Design and document your <span className="font-medium text-foreground/80">{getNodeTypeLabel(node.type).toLowerCase()}</span>.
          Use the Guided tab as your primary source of truth.
        </p>
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
