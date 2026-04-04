"use client";

import { startTransition, useState, type MouseEvent as ReactMouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { ProjectService } from "@/services/ProjectService";
import type {
  DeliveryMode,
  ProjectDomain,
  StarterContentIntensity,
} from "@/lib/db";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ModeToggle } from "@/components/mode-toggle";
import { AIConfigurationNotice } from "@/components/ai/AIConfigurationNotice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreateProjectDialog } from "@/features/dashboard/components/CreateProjectDialog";
import { ProjectFilters } from "@/features/dashboard/components/ProjectFilters";
import { ProjectGrid } from "@/features/dashboard/components/ProjectGrid";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { type TemplateKey } from "@/features/dashboard/selectors";

type DeleteProjectState = {
  id: string;
  name: string;
} | null;

export function DashboardScreen() {
  const router = useRouter();
  const {
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

  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [deleteProject, setDeleteProject] = useState<DeleteProjectState>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const hasProjects = stats.totalProjects > 0;

  const openCreateDialog = () => {
    setCreateDialogSession((value) => value + 1);
    setIsCreateOpen(true);
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || isCreatingProject) return;

    setIsCreatingProject(true);
    try {
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
    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      setIsCreatingProject(false);
    }
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
          className="mb-6 flex items-center justify-between"
          data-testid="dashboard-hero"
        >
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-xl font-semibold tracking-tight text-foreground">
              Previo
            </h1>
            {hasProjects && (
              <span className="text-sm text-muted-foreground">
                {stats.totalProjects} project{stats.totalProjects !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <ModeToggle />
            <Button
              onClick={openCreateDialog}
              data-testid="dashboard-new-project"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        </header>

        {hasProjects && (
          <>
            <ProjectFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
              filterBy={filterBy}
              onFilterChange={setFilterBy}
            />

            <div className="mb-3">
              <AIConfigurationNotice />
            </div>

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
          </>
        )}

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
            showEmptyPrimaryAction={false}
          />
        </main>

        {!hasProjects && (
          <div className="mt-4">
            <AIConfigurationNotice variant="subtle" />
          </div>
        )}
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
        isCreating={isCreatingProject}
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
