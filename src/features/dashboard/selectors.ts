import type { Project, NodeData } from "@/lib/db";

import type { FilterOption, SortOption } from "./components/ProjectFilters";

export type TemplateKey = "quick" | "full";

export type ProgressMeta = {
  percent: number;
  label: string;
  toneClass: string;
};

export type ProjectCardViewModel = {
  project: Project;
  projectNodes: NodeData[];
  doneCount: number;
  totalCount: number;
  templateType: TemplateKey;
  templateLabel: string;
  progress: ProgressMeta;
};

export type DashboardStats = {
  totalProjects: number;
  totalNodes: number;
  completedNodes: number;
  quickProjects: number;
};

export function getProgressMeta(
  doneCount: number,
  totalCount: number,
): ProgressMeta {
  const safeTotal = Math.max(totalCount, 1);
  const percent = Math.round((doneCount / safeTotal) * 100);

  if (percent >= 100) {
    return {
      percent,
      label: "Completed",
      toneClass: "metric-pill metric-pill--success",
    };
  }

  if (percent >= 40) {
    return {
      percent,
      label: "In progress",
      toneClass: "metric-pill metric-pill--info",
    };
  }

  return {
    percent,
    label: totalCount === 0 ? "Not started" : "Early stage",
    toneClass: "metric-pill metric-pill--warning",
  };
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function getProjectTemplate(project: Project): TemplateKey {
  return (project.template_type as TemplateKey) ?? "quick";
}

export function getRecentProject(projects: Project[]) {
  if (projects.length === 0) return null;

  return [...projects].sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  )[0];
}

export function buildProjectCards(params: {
  projects: Project[];
  allNodes: NodeData[];
  searchQuery: string;
  sortBy: SortOption;
  filterBy: FilterOption;
}): ProjectCardViewModel[] {
  const { projects, allNodes, searchQuery, sortBy, filterBy } = params;
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const mapped = projects.map((project) => {
    const projectNodes = allNodes.filter((node) => node.project_id === project.id);
    const doneCount = projectNodes.filter((node) => node.status === "Done").length;
    const totalCount = projectNodes.length;
    const templateType = getProjectTemplate(project);
    const templateLabel =
      templateType === "quick" ? "Quick Start" : "Full Architecture";
    const progress = getProgressMeta(doneCount, totalCount);

    return {
      project,
      projectNodes,
      doneCount,
      totalCount,
      templateType,
      templateLabel,
      progress,
    };
  });

  const filtered = mapped.filter((item) => {
    const matchesSearch =
      normalizedQuery.length === 0 ||
      item.project.name.toLowerCase().includes(normalizedQuery) ||
      item.project.description.toLowerCase().includes(normalizedQuery);

    const matchesFilter =
      filterBy === "all" ? true : item.templateType === filterBy;

    return matchesSearch && matchesFilter;
  });

  filtered.sort((a, b) => {
    if (sortBy === "name") {
      return a.project.name.localeCompare(b.project.name);
    }

    if (sortBy === "oldest") {
      return (
        new Date(a.project.updated_at).getTime() -
        new Date(b.project.updated_at).getTime()
      );
    }

    return (
      new Date(b.project.updated_at).getTime() -
      new Date(a.project.updated_at).getTime()
    );
  });

  return filtered;
}

export function buildDashboardStats(
  projects: Project[],
  allNodes: NodeData[],
): DashboardStats {
  const totalProjects = projects.length;
  const totalNodes = allNodes.length;
  const completedNodes = allNodes.filter((node) => node.status === "Done").length;
  const quickProjects = projects.filter(
    (project) => getProjectTemplate(project) === "quick",
  ).length;

  return {
    totalProjects,
    totalNodes,
    completedNodes,
    quickProjects,
  };
}
