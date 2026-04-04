"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/db";
import { formatDateTime } from "@/features/dashboard/selectors";

interface RecentProjectHeroProps {
  project: Project;
  doneCount: number;
  totalCount: number;
  progressPercent: number;
  onOpen: () => void;
}

export function RecentProjectHero({
  project,
  doneCount,
  totalCount,
  progressPercent,
  onOpen,
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
