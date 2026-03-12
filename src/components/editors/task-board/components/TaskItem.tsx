"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskData } from "@/lib/db";
import { PriorityFilter } from "../types";

// Helper functions (could be moved to a utils file)
function normalizePriority(priority: TaskData["priority"]) {
  return String(priority).toLowerCase() as PriorityFilter;
}

function priorityLabel(priority: string) {
  switch (priority.toLowerCase()) {
    case "must": return "Must";
    case "should": return "Should";
    case "could": return "Could";
    case "wont": return "Won't";
    default: return priority;
  }
}

function statusLabel(status: TaskData["status"]) {
  switch (status) {
    case "todo": return "To do";
    case "in_progress": return "In progress";
    case "done": return "Done";
    default: return status;
  }
}

function getPriorityBadgeClass(priority: string) {
  switch (priority.toLowerCase()) {
    case "must": return "metric-pill metric-pill--danger";
    case "should": return "metric-pill metric-pill--warning";
    case "could": return "metric-pill metric-pill--info";
    default: return "metric-pill";
  }
}

function getStatusBadgeClass(status: TaskData["status"]) {
  switch (status) {
    case "done": return "metric-pill metric-pill--success";
    case "in_progress": return "metric-pill metric-pill--warning";
    default: return "metric-pill metric-pill--info";
  }
}

interface TaskItemProps {
  task: TaskData;
  sourceNodeLabel: string;
  onUpdate: (id: string, updates: Partial<TaskData>) => void;
  onDelete: (id: string) => void;
}

export function TaskItem({ task, sourceNodeLabel, onUpdate, onDelete }: TaskItemProps) {
  return (
    <div className="group rounded-2xl border border-border/70 bg-background/50 px-5 py-5 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={getPriorityBadgeClass(task.priority)}>
                {priorityLabel(task.priority)}
              </span>
              <span className={getStatusBadgeClass(task.status)}>
                {statusLabel(task.status)}
              </span>
              <span className="rounded-full border border-border/50 bg-background/60 px-2.5 py-1 text-readable-2xs font-bold uppercase tracking-wider text-muted-foreground/80">
                {task.is_manual ? "Manual" : "Auto"}
              </span>
              <span className="rounded-full border border-border/50 bg-background/60 px-2.5 py-1 text-readable-2xs font-bold uppercase tracking-wider text-muted-foreground/80">
                Source: {sourceNodeLabel}
              </span>
            </div>

            <Input
              value={task.title}
              onChange={(e) => onUpdate(task.id, { title: e.target.value })}
              className="h-10 border-transparent bg-transparent hover:border-border/60 focus:bg-background px-0 py-0 text-base font-bold shadow-none transition-all focus:px-3 focus:py-2 focus:shadow-sm"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(task.id)}
            className="rounded-full text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
          <div className="space-y-2">
            <Label className="text-readable-xs font-bold uppercase tracking-[0.16em] text-muted-foreground/60">
              Description
            </Label>
            <Textarea
              value={task.description}
              onChange={(e) => onUpdate(task.id, { description: e.target.value })}
              className="min-h-[100px] resize-none text-sm leading-relaxed bg-background/30 border-border/50 focus:bg-background"
              placeholder="Detailed implementation notes..."
            />
          </div>

          <div className="space-y-2">
            <Label className="text-readable-xs font-bold uppercase tracking-[0.16em] text-muted-foreground/60">
              Priority
            </Label>
            <Select
              value={normalizePriority(task.priority)}
              onValueChange={(val) => onUpdate(task.id, { priority: val as TaskData["priority"] })}
            >
              <SelectTrigger className="h-10 text-sm bg-background/30 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="must">Must Have</SelectItem>
                <SelectItem value="should">Should Have</SelectItem>
                <SelectItem value="could">Could Have</SelectItem>
                <SelectItem value="wont">Won&apos;t Have</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-readable-xs font-bold uppercase tracking-[0.16em] text-muted-foreground/60">
              Status
            </Label>
            <Select
              value={task.status}
              onValueChange={(val) => onUpdate(task.id, { status: val as TaskData["status"] })}
            >
              <SelectTrigger className="h-10 text-sm bg-background/30 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
