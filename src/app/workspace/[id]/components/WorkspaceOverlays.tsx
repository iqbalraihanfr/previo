import { AlertTriangle, CheckCircle2, ChevronLeft, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { NodeData } from "@/lib/db";

interface WorkspaceOverlaysProps {
  showOnboarding: boolean;
  recommendedNextNode: NodeData | null;
  dbWarningsLength: number;
  dbNodesLength: number;
  showValidationPanel: boolean;
  onDismissOnboarding: () => void;
  onShowHelp: () => void;
  onJumpNext: () => void;
  onToggleValidation: () => void;
}

export function WorkspaceOverlays({
  showOnboarding,
  recommendedNextNode,
  dbWarningsLength,
  dbNodesLength,
  showValidationPanel,
  onDismissOnboarding,
  onShowHelp,
  onJumpNext,
  onToggleValidation,
}: WorkspaceOverlaysProps) {
  return (
    <>
      {showOnboarding && (
        <div className="pointer-events-none absolute left-3 top-3 z-20 w-[min(460px,calc(100vw-1.5rem))] max-w-full md:left-4 md:top-4">
          <div className="onboarding-card pointer-events-auto rounded-2xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full px-2.5 py-1 text-readable-xs">
                    Getting started
                  </Badge>
                  {recommendedNextNode && (
                    <span className="metric-pill metric-pill--success">
                      Start with {recommendedNextNode.label}
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="text-base font-semibold">
                    Welcome to your architecture workspace
                  </h2>
                  <p className="mt-1 text-sm leading-7 text-muted-foreground">
                    Click a node to edit it, drag nodes to reorganize your flow,
                    and use <span className="font-medium text-foreground">Space + drag</span> to pan. You can use the Guided tab as the main source of truth, jump to the next unfinished node, and reopen help anytime from the header.
                  </p>
                </div>

                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <div className="rounded-xl border border-border/70 bg-background/70 px-3 py-3">
                    <p className="font-medium text-foreground">Open nodes</p>
                    <p className="mt-1 leading-6">
                      Click any node to open the editor panel.
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/70 px-3 py-3">
                    <p className="font-medium text-foreground">Navigate faster</p>
                    <p className="mt-1 leading-6">
                      Use Search / Jump, Next Node, Fit View, and Validation.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 rounded-full"
                onClick={onDismissOnboarding}
                aria-label="Dismiss onboarding"
              >
                <ChevronLeft className="h-4 w-4 rotate-45" />
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-readable-xs text-muted-foreground">
                You can reopen guidance anytime from the Help button.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={onShowHelp}
                >
                  Open Help
                </Button>
                <Button
                  size="sm"
                  className="rounded-full"
                  onClick={onDismissOnboarding}
                >
                  Got it
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Hotkeys */}
      <div className="pointer-events-none absolute right-4 top-4 z-20 hidden md:block">
        <div className="onboarding-card rounded-2xl px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 text-readable-xs text-muted-foreground">
            <span className="rounded-full border border-border/70 bg-background/70 px-2.5 py-1">
              ⌘K / Ctrl+K search
            </span>
            <span className="rounded-full border border-border/70 bg-background/70 px-2.5 py-1">
              N next node
            </span>
            <span className="rounded-full border border-border/70 bg-background/70 px-2.5 py-1">
              F fit view
            </span>
            <span className="rounded-full border border-border/70 bg-background/70 px-2.5 py-1">
              ? help
            </span>
          </div>
        </div>
      </div>

      {!showValidationPanel && dbWarningsLength > 0 && (
        <div className="pointer-events-none absolute bottom-5 left-15 z-20 hidden md:block">
          <button
            type="button"
            onClick={onToggleValidation}
            className="onboarding-card pointer-events-auto flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all hover:border-primary/40 hover:bg-primary/5 hover:ring-2 hover:ring-primary/10"
          >
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <p className="text-sm text-muted-foreground">
              You have{" "}
              <span className="font-medium text-foreground">
                {dbWarningsLength} validation issue(s)
              </span>
              . Click to review them.
            </p>
          </button>
        </div>
      )}

      {!showValidationPanel && dbWarningsLength === 0 && dbNodesLength > 0 && (
        <div className="pointer-events-none absolute bottom-5 left-15 z-20 hidden md:block">
          <div className="onboarding-card rounded-2xl px-4 py-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <p className="text-sm text-muted-foreground">
                Cross-node validation is clear right now.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Suggested Next Step */}
      <div className="pointer-events-none absolute bottom-4 right-4 z-20 hidden max-w-sm md:block">
        {recommendedNextNode ? (
          <div className="onboarding-card rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">Suggested next step</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Open{" "}
                  <span className="font-medium text-foreground">
                    {recommendedNextNode.label}
                  </span>{" "}
                  to keep your documentation flow moving.
                </p>
                <div className="pointer-events-auto pt-1">
                  <Button
                    size="sm"
                    className="rounded-full"
                    onClick={onJumpNext}
                  >
                    Open next node
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
