import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Command,
  Download,
  GitBranch,
  HelpCircle,
  Maximize,
  NotebookPen,
  PanelRight,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/mode-toggle";
import { AIConfigurationNotice } from "@/components/ai/AIConfigurationNotice";

import type { Project, NodeData, NodeContent } from "@/lib/db";
import { exportProjectToMarkdown, exportProjectToPDF } from "@/lib/exportEngine";
import { DELIVERY_MODE_LABELS } from "@/lib/sourceArtifacts";

import {
  type ValidationTone,
  getMetricPillClass,
  formatRelativeProjectState,
} from "@/features/workspace/utils";

interface WorkspaceHeaderProps {
  project: Project;
  dbNodes: NodeData[];
  dbContents: NodeContent[];
  showTraceabilityPanel: boolean;
  doneCount: number;
  progressPercent: number;
  recommendedNextNode: NodeData | null;
  selectedNodeData: NodeData | null;
  editorCollapsed: boolean;
  validationTone: ValidationTone;
  showProjectNotes: boolean;
  onJumpNext: () => void;
  onShowCommand: () => void;
  onFitView: () => void;
  onShowHelp: () => void;
  onToggleTraceability: () => void;
  onToggleValidation: () => void;
  onToggleProjectNotes: () => void;
  onToggleEditor: () => void;
}

export function WorkspaceHeader({
  project,
  dbNodes,
  dbContents,
  showTraceabilityPanel,
  doneCount,
  progressPercent,
  recommendedNextNode,
  selectedNodeData,
  editorCollapsed,
  validationTone,
  showProjectNotes,
  onJumpNext,
  onShowCommand,
  onFitView,
  onShowHelp,
  onToggleTraceability,
  onToggleValidation,
  onToggleProjectNotes,
  onToggleEditor,
}: WorkspaceHeaderProps) {
  const router = useRouter();
  const projectProgressMeta = formatRelativeProjectState(doneCount, dbNodes.length);

  return (
    <header
      className="workspace-header z-20 border-b border-border/70 px-4 py-3 sm:px-5"
      data-testid="workspace-header"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full"
            onClick={() => router.push("/")}
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-semibold sm:text-xl">
                {project.name}
              </h1>
              <span className={getMetricPillClass(projectProgressMeta.tone)}>
                {projectProgressMeta.label}
              </span>
              <span className="metric-pill metric-pill--info">
                {DELIVERY_MODE_LABELS[project.delivery_mode]}
              </span>
              {recommendedNextNode && (
                <span className="metric-pill metric-pill--success">
                  Next: {recommendedNextNode.label}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm leading-6 text-muted-foreground">
              <span>
                {doneCount}/{dbNodes.length} nodes completed
              </span>
              <span>•</span>
              <span>{progressPercent}% progress</span>
              {recommendedNextNode && (
                <>
                  <span>•</span>
                  <span>
                    Continue with{" "}
                    <span className="font-medium text-foreground">
                      {recommendedNextNode.label}
                    </span>
                  </span>
                </>
              )}
            </div>

            <div className="w-full max-w-sm">
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-full"
            onClick={onJumpNext}
            disabled={!recommendedNextNode}
            data-testid="workspace-next-node"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Next Node
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-full"
            onClick={onShowCommand}
            data-testid="workspace-command-dialog"
          >
            <Command className="mr-2 h-4 w-4" />
            Search / Jump
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-full"
            onClick={onFitView}
            data-testid="workspace-fit-view"
          >
            <Maximize className="mr-2 h-4 w-4" />
            Fit View
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-full"
            onClick={onShowHelp}
            data-testid="workspace-help"
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            Help
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-full"
            onClick={onToggleValidation}
            data-testid="workspace-validation"
          >
            {validationTone === "danger" ? (
              <AlertTriangle className="mr-2 h-4 w-4 text-destructive" />
            ) : validationTone === "warning" ? (
              <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
            )}
            Validation
          </Button>

          <Button
            variant={showTraceabilityPanel ? "default" : "outline"}
            size="sm"
            className="h-9 rounded-full"
            onClick={onToggleTraceability}
            data-testid="workspace-traceability"
          >
            <GitBranch className="mr-2 h-4 w-4" />
            Traceability
          </Button>

          <Button
            variant={showProjectNotes ? "default" : "outline"}
            size="sm"
            className="h-9 rounded-full"
            onClick={onToggleProjectNotes}
            data-testid="workspace-project-notes"
          >
            <NotebookPen className="mr-2 h-4 w-4" />
            Project Notes
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-full"
                  data-testid="workspace-export-trigger"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => exportProjectToMarkdown(project, dbNodes, dbContents)}
                data-testid="workspace-export-markdown"
              >
                Export Markdown
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportProjectToPDF(project, dbNodes, dbContents)}
                data-testid="workspace-export-pdf"
              >
                Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {selectedNodeData && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-full"
              onClick={onToggleEditor}
            >
              <PanelRight className="mr-2 h-4 w-4" />
              {editorCollapsed ? "Show Panel" : "Hide Panel"}
            </Button>
          )}

          <ModeToggle />
        </div>
      </div>

      <div className="mt-3">
        <AIConfigurationNotice variant="compact" />
      </div>
    </header>
  );
}
