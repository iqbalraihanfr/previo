"use client";

import React from "react";

interface StatsOverviewProps {
  totalProjects: number;
  totalNodes: number;
  completedNodes: number;
  quickProjects: number;
  subdued?: boolean;
}

export function StatsOverview({
  totalProjects,
  totalNodes,
  completedNodes,
  quickProjects,
  subdued = false,
}: StatsOverviewProps) {
  const cardClass = subdued
    ? "rounded-[12px] border border-border/60 bg-background/58 px-4 py-3"
    : "rounded-[12px] border border-border/70 bg-background/72 px-4 py-4";
  const valueClass = subdued ? "mt-1.5 text-xl font-semibold" : "mt-2 text-2xl font-bold";

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">
      <div className={cardClass}>
        <p className="text-readable-2xs uppercase tracking-[0.18em] text-muted-foreground">
          Projects
        </p>
        <p className={valueClass}>{totalProjects}</p>
      </div>
      <div className={cardClass}>
        <p className="text-readable-2xs uppercase tracking-[0.18em] text-muted-foreground">
          Nodes
        </p>
        <p className={valueClass}>{totalNodes}</p>
      </div>
      <div className={cardClass}>
        <p className="text-readable-2xs uppercase tracking-[0.18em] text-muted-foreground">
          Completed
        </p>
        <p className={valueClass}>{completedNodes}</p>
      </div>
      <div className={cardClass}>
        <p className="text-readable-2xs uppercase tracking-[0.18em] text-muted-foreground">
          Quick setups
        </p>
        <p className={valueClass}>{quickProjects}</p>
      </div>
    </div>
  );
}
