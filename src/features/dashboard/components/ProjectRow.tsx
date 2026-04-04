"use client";

import React from "react";
import { ArrowRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/db";
import type { ProgressMeta } from "@/features/dashboard/selectors";
import { cn } from "@/lib/utils";

interface ProjectRowProps {
  project: Project;
  doneCount: number;
  totalCount: number;
  progress: ProgressMeta;
  onClick: () => void;
  onDelete: (event: React.MouseEvent) => void;
  formatDateTime: (value: string) => string;
}

function accentColor(toneClass: string): string {
  if (toneClass.includes("success")) return "bg-primary";
  if (toneClass.includes("warning")) return "bg-yellow-500";
  return "bg-muted-foreground/30";
}

export function ProjectRow({
  project,
  doneCount,
  totalCount,
  progress,
  onClick,
  onDelete,
  formatDateTime,
}: ProjectRowProps) {
  return (
    <div
      data-testid={`project-card-${project.id}`}
      data-project-name={project.name}
      className="group flex cursor-pointer items-center gap-3 rounded-[12px] border border-border/70 bg-card/95 px-4 py-3 transition-all hover:border-primary/20 hover:bg-card"
      onClick={onClick}
    >
      {/* Left accent */}
      <div
        className={cn(
          "h-8 w-1 shrink-0 rounded-full",
          accentColor(progress.toneClass),
        )}
      />

      {/* Name + meta */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {project.name}
        </p>
        <p className="text-readable-xs text-muted-foreground">
          {doneCount}/{totalCount} nodes · {formatDateTime(project.updated_at)}
        </p>
      </div>

      {/* Progress */}
      <div className="hidden w-24 sm:block">
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
          onClick={onDelete}
          aria-label={`Delete ${project.name}`}
          data-testid={`delete-project-${project.id}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          data-testid={`continue-project-${project.id}`}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          aria-label={`Open ${project.name}`}
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
