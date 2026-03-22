"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import type {
  FilterOption,
  SortOption,
} from "@/features/dashboard/components/ProjectFilters";
import {
  buildDashboardStats,
  buildProjectCards,
  getRecentProject,
} from "@/features/dashboard/selectors";
import { ProjectRepository } from "@/repositories/ProjectRepository";
import { NodeRepository } from "@/repositories/NodeRepository";

export function useDashboardData() {
  const liveProjects = useLiveQuery(() => ProjectRepository.findAll());
  const liveAllNodes = useLiveQuery(() => NodeRepository.findAll());

  const projects = useMemo(() => liveProjects ?? [], [liveProjects]);
  const allNodes = useMemo(() => liveAllNodes ?? [], [liveAllNodes]);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");

  const recentProject = useMemo(() => getRecentProject(projects), [projects]);

  const projectCards = useMemo(
    () =>
      buildProjectCards({
        projects,
        allNodes,
        searchQuery,
        sortBy,
        filterBy,
      }),
    [allNodes, filterBy, projects, searchQuery, sortBy],
  );

  const stats = useMemo(
    () => buildDashboardStats(projects, allNodes),
    [allNodes, projects],
  );

  return {
    projects,
    recentProject,
    projectCards,
    stats,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    filterBy,
    setFilterBy,
  };
}
