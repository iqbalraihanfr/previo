"use client";

import {
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  HelpCircle,
  Maximize,
  NotebookPen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ValidationTone } from "@/features/workspace/utils";

interface WorkspaceSidebarProps {
  validationTone: ValidationTone;
  showValidationPanel: boolean;
  showProjectNotes: boolean;
  showTraceabilityPanel: boolean;
  onFitView: () => void;
  onToggleValidation: () => void;
  onToggleProjectNotes: () => void;
  onToggleTraceability: () => void;
  onShowHelp: () => void;
}

function SidebarIcon({
  children,
  active,
  danger,
  onClick,
  label,
  testId,
}: {
  children: React.ReactNode;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
  label: string;
  testId?: string;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        aria-label={label}
        data-testid={testId}
        onClick={onClick}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
          active
            ? "bg-primary/15 text-primary"
            : danger
              ? "text-destructive hover:bg-destructive/10"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        {children}
      </button>
      {/* Tooltip */}
      <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-md ring-1 ring-border/50 transition-opacity delay-150 group-hover:opacity-100">
        {label}
      </div>
    </div>
  );
}

export function WorkspaceSidebar({
  validationTone,
  showValidationPanel,
  showProjectNotes,
  showTraceabilityPanel,
  onFitView,
  onToggleValidation,
  onToggleProjectNotes,
  onToggleTraceability,
  onShowHelp,
}: WorkspaceSidebarProps) {
  const ValidationIcon =
    validationTone === "danger" || validationTone === "warning"
      ? AlertTriangle
      : CheckCircle2;

  return (
    <div
      className="flex w-9 shrink-0 flex-col items-center gap-1 border-r border-border/70 bg-card/50 py-2"
      data-testid="workspace-sidebar"
    >
      <SidebarIcon
        label="Fit canvas to view (F)"
        onClick={onFitView}
        testId="workspace-fit-view"
      >
        <Maximize className="h-4 w-4" />
      </SidebarIcon>

      <SidebarIcon
        label="Validation"
        active={showValidationPanel}
        danger={validationTone === "danger"}
        onClick={onToggleValidation}
        testId="workspace-validation"
      >
        <ValidationIcon className="h-4 w-4" />
      </SidebarIcon>

      <SidebarIcon
        label="Project notes"
        active={showProjectNotes}
        onClick={onToggleProjectNotes}
        testId="workspace-project-notes"
      >
        <NotebookPen className="h-4 w-4" />
      </SidebarIcon>

      <SidebarIcon
        label="Traceability"
        active={showTraceabilityPanel}
        onClick={onToggleTraceability}
        testId="workspace-traceability"
      >
        <GitBranch className="h-4 w-4" />
      </SidebarIcon>

      {/* Spacer */}
      <div className="flex-1" />

      <SidebarIcon
        label="Help & shortcuts (?)"
        onClick={onShowHelp}
        testId="workspace-help"
      >
        <HelpCircle className="h-4 w-4" />
      </SidebarIcon>
    </div>
  );
}
