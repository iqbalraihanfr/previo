// src/features/workspace/components/WorkspaceHeader.tsx
"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Command, Sparkles, MoreHorizontal, Download, MonitorCog, Sun, Moon, Keyboard } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Project, NodeData, NodeContent } from "@/lib/db";
import { exportProjectToMarkdown, exportProjectToPDF } from "@/lib/exportEngine";

interface WorkspaceHeaderProps {
  project: Project;
  dbNodes: NodeData[];
  dbContents: NodeContent[];
  doneCount: number;
  recommendedNextNode: NodeData | null;
  onJumpNext: () => void;
  onShowCommand: () => void;
  onShowHelp: () => void;
}

function ProgressPill({ doneCount, total }: { doneCount: number; total: number }) {
  const allDone = doneCount === total && total > 0;
  const hasProgress = doneCount > 0;
  return (
    <span
      className={
        allDone
          ? "rounded-full bg-primary/15 px-2.5 py-0.5 text-readable-xs font-semibold text-primary"
          : hasProgress
            ? "rounded-full bg-yellow-500/15 px-2.5 py-0.5 text-readable-xs font-semibold text-yellow-600 dark:text-yellow-400"
            : "rounded-full bg-muted px-2.5 py-0.5 text-readable-xs font-medium text-muted-foreground"
      }
    >
      {doneCount}/{total}
    </span>
  );
}

export function WorkspaceHeader({
  project,
  dbNodes,
  dbContents,
  doneCount,
  recommendedNextNode,
  onJumpNext,
  onShowCommand,
  onShowHelp,
}: WorkspaceHeaderProps) {
  const router = useRouter();
  const { setTheme } = useTheme();

  return (
    <header
      className="workspace-header z-20 flex h-12 items-center justify-between border-b border-border/70 px-3 sm:px-4"
      data-testid="workspace-header"
    >
      {/* Left: back + project name + progress */}
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-full"
          onClick={() => router.push("/")}
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <span className="truncate text-sm font-semibold text-foreground sm:text-base">
          {project.name}
        </span>

        <ProgressPill doneCount={doneCount} total={dbNodes.length} />
      </div>

      {/* Right: 3 actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-full text-xs"
          onClick={onJumpNext}
          disabled={!recommendedNextNode}
          data-testid="workspace-next-node"
        >
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          Next
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-full text-xs"
          onClick={onShowCommand}
          data-testid="workspace-command-dialog"
        >
          <Command className="mr-1.5 h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search</span>
          <span className="sm:hidden">⌘K</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                data-testid="workspace-more-actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Export</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => exportProjectToMarkdown(project, dbNodes, dbContents)}
              data-testid="workspace-export-markdown"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Markdown
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => exportProjectToPDF(project, dbNodes, dbContents)}
              data-testid="workspace-export-pdf"
            >
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onShowHelp} data-testid="workspace-help">
              <Keyboard className="mr-2 h-4 w-4" />
              Help & shortcuts
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <MonitorCog className="mr-2 h-4 w-4" />
                Theme
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="mr-2 h-4 w-4" />Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="mr-2 h-4 w-4" />Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <MonitorCog className="mr-2 h-4 w-4" />System
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
