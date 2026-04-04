"use client";

import { useState } from "react";
import { Loader2, Check, X, Trash2, ChevronDown } from "lucide-react";
import type { NodeData } from "@/lib/db";
import { Button } from "@/components/ui/button";
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
    <div
      className="flex h-12 shrink-0 items-center gap-2 border-b border-border/60 bg-card/50 px-4 backdrop-blur-md"
      data-testid="editor-panel-header"
    >
      {/* Type badge */}
      <div className="flex items-center rounded-md border border-border/50 bg-background/50 px-2 py-0.5">
        <span className="text-readable-2xs font-bold uppercase tracking-wider text-muted-foreground/70">
          {getNodeTypeLabel(node.type)}
        </span>
      </div>

      {/* Node name */}
      <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
        {node.label}
      </h2>

      {/* Status inline */}
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger
          className="h-7 w-auto min-w-[90px] border-none bg-transparent p-0 text-readable-xs font-semibold focus:ring-0"
          data-testid="editor-status-trigger"
        >
          <span className={getStatusTone(status)}>
            <SelectValue />
          </span>
        </SelectTrigger>
        <SelectContent align="end" className="rounded-xl shadow-xl">
          <SelectItem value="Empty">Empty</SelectItem>
          <SelectItem value="In Progress">In Progress</SelectItem>
          <SelectItem value="Done">Done</SelectItem>
        </SelectContent>
      </Select>

      {/* Save indicator */}
      <div className="flex items-center">
        {isSaving ? (
          <span className="flex items-center gap-1 text-readable-2xs text-muted-foreground/60">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving
          </span>
        ) : lastSaved ? (
          <span className="flex items-center gap-1 text-readable-2xs text-emerald-600/80 dark:text-emerald-400/80">
            <Check className="h-3 w-3" />
            Saved
          </span>
        ) : null}
      </div>

      {/* Actions */}
      {onDeleteAction && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDeleteAction}
          className="h-7 w-7 rounded-md text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive"
          title="Delete Node"
          data-testid="editor-delete-node"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon"
        onClick={onCloseAction}
        className="h-7 w-7 rounded-md text-muted-foreground/50 hover:bg-muted"
        title="Close Panel"
        data-testid="editor-close-panel"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="px-5 pt-3">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-muted-foreground/60 transition-colors hover:bg-muted/40 hover:text-muted-foreground"
      >
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
        <span>Tab guide</span>
      </button>

      {isOpen && (
        <div className="mt-2 space-y-2">
          {hasGuidedEditor && (
            <SectionHint
              title="Recommended workflow"
              description="Start in Guided. The fields here drive validation, generated tasks, export output, and diagram generation."
              tone="primary"
            />
          )}
          <div className="grid gap-2 md:grid-cols-3">
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
      )}
    </div>
  );
}
