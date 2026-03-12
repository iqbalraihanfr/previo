"use client";

import { Search, Plus, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  GroupingMode,
  StatusFilter,
  PriorityFilter,
  SourceFilter,
} from "../types";

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide transition-all",
        active
          ? "border-primary bg-primary/10 text-primary shadow-sm"
          : "border-border/70 bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

interface TaskBoardFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  grouping: GroupingMode;
  onGroupingChange: (mode: GroupingMode) => void;
  statusFilter: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  priorityFilter: PriorityFilter;
  onPriorityChange: (priority: PriorityFilter) => void;
  sourceFilter: SourceFilter;
  onSourceChange: (source: SourceFilter) => void;
  sourceOptions: { id: string; label: string }[];
  onAddTask: () => void;
  onExport: (format: string) => void;
}

export function TaskBoardFilters({
  searchQuery,
  onSearchChange,
  grouping,
  onGroupingChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  sourceFilter,
  onSourceChange,
  sourceOptions,
  onAddTask,
  onExport,
}: TaskBoardFiltersProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80" />
          <Input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search tasks, groups, or labels..."
            className="h-11 rounded-2xl pl-10 text-sm bg-background/50 border-border/60"
          />
        </div>

        <Select
          value={grouping}
          onValueChange={(value) => onGroupingChange(value as GroupingMode)}
        >
          <SelectTrigger className="h-11 min-w-[190px] rounded-2xl text-sm bg-background/50 border-border/60">
            <SelectValue placeholder="Group by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="layer">Architecture Layer</SelectItem>
            <SelectItem value="source">Source Node</SelectItem>
            <SelectItem value="story">User Story</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="flat">Flat List</SelectItem>
          </SelectContent>
        </Select>

        <Button
          size="default"
          variant="outline"
          onClick={onAddTask}
          className="h-11 px-6 rounded-2xl border-border/60 bg-background/50 hover:bg-background transition-colors"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                size="default"
                variant="outline"
                className="h-11 px-6 rounded-2xl border-border/60 bg-background/50 hover:bg-background"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="rounded-xl p-1 shadow-lg">
            <DropdownMenuItem onClick={() => onExport("md")}>Markdown Checklist</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("csv")}>CSV (Spreadsheet)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("linear")}>CSV (Linear Import)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("json")}>JSON File</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-2xl border border-border/60 bg-background/40 p-4 shadow-sm backdrop-blur-sm">
        <div className="mb-4 flex items-center gap-2 text-readable-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
          <Filter className="h-3.5 w-3.5" />
          Filters
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div>
            <p className="mb-2 text-readable-xs font-bold text-foreground/80 uppercase tracking-wider">Status</p>
            <div className="flex flex-wrap gap-2">
              {(["all", "todo", "in_progress", "done"] as StatusFilter[]).map((f) => (
                <FilterChip key={f} active={statusFilter === f} onClick={() => onStatusChange(f)}>
                  {f === "all" ? "All" : f === "in_progress" ? "In Progress" : f === "todo" ? "To Do" : "Done"}
                </FilterChip>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-readable-xs font-bold text-foreground/80 uppercase tracking-wider">Priority</p>
            <div className="flex flex-wrap gap-2">
              {(["all", "must", "should", "could", "wont"] as PriorityFilter[]).map((f) => (
                <FilterChip key={f} active={priorityFilter === f} onClick={() => onPriorityChange(f)}>
                  {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                </FilterChip>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-2 block text-readable-xs font-bold text-foreground/80 uppercase tracking-wider">Source</Label>
            <Select value={sourceFilter} onValueChange={(value) => onSourceChange(value as SourceFilter)}>
              <SelectTrigger className="h-10 rounded-xl text-sm bg-background/50 border-border/60">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="manual">Manual Tasks</SelectItem>
                {sourceOptions.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
