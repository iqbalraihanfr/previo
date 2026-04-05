"use client";

import React from "react";
import { ArrowRight, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { Project } from "@/lib/db";
import { formatDateTime } from "@/features/dashboard/selectors";

interface RecentProjectHeroProps {
  project: Project;
  doneCount: number;
  totalCount: number;
  progressPercent: number;
  onOpen: () => void;
  onDelete: (event: React.MouseEvent) => void;
}

export function RecentProjectHero({
  project,
  doneCount,
  totalCount,
  progressPercent,
  onOpen,
  onDelete,
}: RecentProjectHeroProps) {
  return (
    <div
      className="mb-4 cursor-pointer rounded-[16px] border border-primary/20 bg-primary/5 px-5 py-4 transition-all hover:border-primary/35 hover:bg-primary/8"
      onClick={onOpen}
      data-testid="recent-project-hero"
    >
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="text-readable-2xs font-semibold uppercase tracking-[0.18em] text-primary/70">
          Last opened · {formatDateTime(project.updated_at)}
        </p>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-primary/50 hover:text-primary"
                  aria-label={`Options for ${project.name}`}
                  data-testid="recent-project-options"
                  onClick={(e) => e.stopPropagation()}
                />
              }
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={4}>
              <DropdownMenuItem
                variant="destructive"
                onClick={(e) => {
                  onDelete(e as unknown as React.MouseEvent);
                }}
                data-testid="recent-project-delete"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size="sm"
            className="shrink-0 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            data-testid="recent-project-continue"
          >
            Open
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <h2 className="truncate text-lg font-semibold text-foreground">
        {project.name}
      </h2>

      <div className="mt-2 flex items-center gap-3">
        <p className="text-sm text-muted-foreground">
          {doneCount}/{totalCount} nodes
        </p>
        <div className="flex-1">
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <p className="text-sm font-medium text-foreground">
          {progressPercent}%
        </p>
      </div>
    </div>
  );
}
