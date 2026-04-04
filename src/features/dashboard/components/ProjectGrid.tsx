"use client";

import React from "react";
import { Folders, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatDateTime,
  type ProjectCardViewModel,
} from "@/features/dashboard/selectors";
import { ProjectRow } from "./ProjectRow";

interface ProjectGridProps {
  projectCards: ProjectCardViewModel[];
  excludeProjectId?: string;
  onProjectClick: (id: string) => void;
  onDeleteRequest: (id: string, name: string, event: React.MouseEvent) => void;
  onResetFilters: () => void;
  onCreateProject: () => void;
  totalProjects: number;
  showEmptyPrimaryAction?: boolean;
}

export function ProjectGrid({
  projectCards,
  excludeProjectId,
  onProjectClick,
  onDeleteRequest,
  onResetFilters,
  onCreateProject,
  totalProjects,
  showEmptyPrimaryAction = true,
}: ProjectGridProps) {
  const visibleCards = excludeProjectId
    ? projectCards.filter((c) => c.project.id !== excludeProjectId)
    : projectCards;

  if (visibleCards.length === 0 && totalProjects === 0) {
    return (
      <div className="workspace-panel flex min-h-80 flex-col items-center justify-center rounded-[2rem] border border-dashed border-border/80 px-6 py-10 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Folders className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-semibold">No projects yet</h2>
        <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
          Create your first workspace to get started.
        </p>
        {showEmptyPrimaryAction && (
          <div className="mt-6">
            <Button onClick={onCreateProject}>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (visibleCards.length === 0) {
    return (
      <div className="workspace-panel flex min-h-40 flex-col items-center justify-center rounded-[2rem] border border-dashed border-border/80 px-6 py-8 text-center">
        <Search className="mb-3 h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No matching projects</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={onResetFilters}>
          Reset filters
        </Button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-2"
      data-testid="project-grid"
    >
      {visibleCards.map((item) => (
        <ProjectRow
          key={item.project.id}
          project={item.project}
          doneCount={item.doneCount}
          totalCount={item.totalCount}
          progress={item.progress}
          onClick={() => onProjectClick(item.project.id)}
          onDelete={(event) =>
            onDeleteRequest(item.project.id, item.project.name, event)
          }
          formatDateTime={formatDateTime}
        />
      ))}
    </div>
  );
}
