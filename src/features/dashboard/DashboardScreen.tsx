"use client";

import { startTransition, useState, type MouseEvent as ReactMouseEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus } from "lucide-react";

import { ProjectService } from "@/services/ProjectService";
import type {
  DeliveryMode,
  ProjectDomain,
  StarterContentIntensity,
} from "@/lib/db";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ModeToggle } from "@/components/mode-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreateProjectDialog } from "@/features/dashboard/components/CreateProjectDialog";
import { ProjectFilters } from "@/features/dashboard/components/ProjectFilters";
import { ProjectGrid } from "@/features/dashboard/components/ProjectGrid";
import { StatsOverview } from "@/features/dashboard/components/StatsOverview";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { formatDateTime, type TemplateKey } from "@/features/dashboard/selectors";

type DeleteProjectState = {
  id: string;
  name: string;
} | null;

export function DashboardScreen() {
  const router = useRouter();
  const {
    recentProject,
    projectCards,
    stats,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    filterBy,
    setFilterBy,
  } = useDashboardData();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createDialogSession, setCreateDialogSession] = useState(0);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>("quick");
  const [selectedDomain, setSelectedDomain] =
    useState<ProjectDomain>("general");
  const [selectedStarterContentIntensity, setSelectedStarterContentIntensity] =
    useState<StarterContentIntensity>("none");
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("agile");

  const [deleteProject, setDeleteProject] = useState<DeleteProjectState>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  const openCreateDialog = () => {
    setCreateDialogSession((value) => value + 1);
    setIsCreateOpen(true);
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    const projectId = await ProjectService.createProject({
      name: newProjectName.trim(),
      description: newProjectDesc.trim(),
      templateKey: selectedTemplate,
      deliveryMode,
      domain: selectedDomain,
      starterContentIntensity: selectedStarterContentIntensity,
    });
    const destination = `/workspace/${projectId}`;

    setIsCreateOpen(false);
    setNewProjectName("");
    setNewProjectDesc("");
    setSelectedTemplate("quick");
    setSelectedDomain("general");
    setSelectedStarterContentIntensity("none");
    setDeliveryMode("agile");

    startTransition(() => {
      router.push(destination);
    });

    window.setTimeout(() => {
      if (window.location.pathname === "/") {
        window.location.assign(destination);
      }
    }, 300);
  };

  const requestDeleteProject = (
    id: string,
    name: string,
    event: ReactMouseEvent,
  ) => {
    event.stopPropagation();
    setDeleteProject({ id, name });
  };

  const confirmDeleteProject = async () => {
    if (!deleteProject) return;

    setIsDeletingProject(true);
    try {
      await ProjectService.deleteProject(deleteProject.id);
      setDeleteProject(null);
    } finally {
      setIsDeletingProject(false);
    }
  };

  return (
    <div className="workspace-shell min-h-screen" data-testid="dashboard-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header
          className="workspace-header mb-4 rounded-[16px] border border-border/70 px-5 py-4 sm:px-6"
          data-testid="dashboard-hero"
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="px-3 py-1 text-readable-xs">
                  Local-first workspace
                </Badge>
                <Badge variant="secondary" className="px-3 py-1 text-readable-xs">
                  Offline-ready
                </Badge>
              </div>

              <div className="space-y-1.5">
                <h1 className="font-serif text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-[2.6rem]">
                  Previo
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Turn project inputs into structured architecture, track what is
                  still missing, and resume the latest workspace without digging
                  through noise.
                </p>
              </div>

              <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                <div className="rounded-[14px] border border-border/70 bg-background/75 px-4 py-4">
                  <p className="text-readable-2xs uppercase tracking-[0.18em] text-muted-foreground">
                    Continue where you left off
                  </p>

                  {recentProject ? (
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-foreground">
                          {recentProject.name}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Updated {formatDateTime(recentProject.updated_at)}
                        </p>
                      </div>

                      <Button
                        data-testid="recent-project-continue"
                        onClick={() =>
                          router.push(`/workspace/${recentProject.id}`)
                        }
                      >
                        Continue workspace
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-muted-foreground">
                        No recent workspace yet. Start a new project to begin
                        documenting your flow.
                      </p>
                      <Button
                        onClick={openCreateDialog}
                        data-testid="dashboard-empty-new-project"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        New Project
                      </Button>
                    </div>
                  )}
                </div>

                <StatsOverview
                  totalProjects={stats.totalProjects}
                  totalNodes={stats.totalNodes}
                  completedNodes={stats.completedNodes}
                  quickProjects={stats.quickProjects}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 xl:flex-col xl:items-stretch">
              <ModeToggle />
              <Button
                className="px-5"
                onClick={openCreateDialog}
                data-testid="dashboard-new-project"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </div>
          </div>
        </header>

        <ProjectFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          filterBy={filterBy}
          onFilterChange={setFilterBy}
        />

        <section className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="px-3 py-1 text-readable-xs"
            >
              {projectCards.length} visible
            </Badge>
            {filterBy !== "all" && (
              <Badge
                variant="secondary"
                className="px-3 py-1 text-readable-xs"
              >
                Filter:{" "}
                {filterBy === "quick" ? "Quick Start" : "Full Architecture"}
              </Badge>
            )}
            {searchQuery.trim() && (
              <Badge
                variant="secondary"
                className="px-3 py-1 text-readable-xs"
              >
                Search: “{searchQuery.trim()}”
              </Badge>
            )}
          </div>

          <p className="text-sm leading-6 text-muted-foreground">
            Recent work, filters, and creation live in one tighter shell now.
          </p>
        </section>

        <main className="flex-1">
          <ProjectGrid
            projectCards={projectCards}
            onProjectClick={(id) => router.push(`/workspace/${id}`)}
            onDeleteRequest={requestDeleteProject}
            onResetFilters={() => {
              setSearchQuery("");
              setFilterBy("all");
              setSortBy("recent");
            }}
            onCreateProject={openCreateDialog}
            totalProjects={stats.totalProjects}
          />
        </main>
      </div>

      <CreateProjectDialog
        key={createDialogSession}
        isOpen={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setSelectedTemplate("quick");
            setSelectedDomain("general");
            setSelectedStarterContentIntensity("none");
          }
        }}
        projectName={newProjectName}
        onProjectNameChange={setNewProjectName}
        projectDesc={newProjectDesc}
        onProjectDescChange={setNewProjectDesc}
        selectedTemplate={selectedTemplate}
        onTemplateChange={setSelectedTemplate}
        selectedDomain={selectedDomain}
        onDomainChange={setSelectedDomain}
        selectedStarterContentIntensity={selectedStarterContentIntensity}
        onStarterContentIntensityChange={setSelectedStarterContentIntensity}
        deliveryMode={deliveryMode}
        onDeliveryModeChange={setDeliveryMode}
        onCreate={handleCreateProject}
      />

      <ConfirmDialog
        open={Boolean(deleteProject)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteProject(null);
          }
        }}
        title="Delete project"
        description={
          deleteProject
            ? `Delete “${deleteProject.name}”? All associated nodes, tasks, and generated content will be removed from this device.`
            : ""
        }
        confirmLabel="Delete project"
        cancelLabel="Cancel"
        variant="destructive"
        loading={isDeletingProject}
        onConfirm={confirmDeleteProject}
      />
    </div>
  );
}
