"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import dynamic from "next/dynamic";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  type Node as FlowNode,
  type Edge as FlowEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  MiniMap,
  MarkerType,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";

import type { NodeData } from "@/lib/db";
import { ArchwayNode } from "@/components/ArchwayNode";
import { ArchwayEdge } from "@/components/ArchwayEdge";
import { Button } from "@/components/ui/button";
import { WorkspaceCommandDialog } from "@/components/layout/WorkspaceCommandDialog";
import { WorkspaceHelpDialog } from "@/components/layout/WorkspaceHelpDialog";
import { updateNodePosition } from "@/lib/workspaceEngine";
import { WorkspaceHeader } from "@/features/workspace/components/WorkspaceHeader";
import { WorkspaceOverlays } from "@/features/workspace/components/WorkspaceOverlays";
import { WorkspaceSidebar } from "@/features/workspace/components/WorkspaceSidebar";
import { ProjectNotesPanel } from "@/features/workspace/components/ProjectNotesPanel";
import { useExcalidrawControls } from "@/features/workspace/hooks/useExcalidrawControls";
import { useWorkspaceData } from "@/features/workspace/hooks/useWorkspaceData";
import { buildCommandNodes } from "@/features/workspace/selectors";
import { buildCanonicalFlowEdges } from "@/features/workspace/workflowGraph";
import type { WorkspaceNavigationIntent } from "@/features/workspace/navigationIntent";

const NodeEditorPanel = dynamic(
  () => import("@/components/editors/NodeEditorPanel").then((m) => m.NodeEditorPanel),
  { ssr: false },
);
const ValidationSummaryPanel = dynamic(
  () => import("@/components/editors/ValidationSummaryPanel").then((m) => m.ValidationSummaryPanel),
  { ssr: false },
);
const WorkspaceTraceabilityPanel = dynamic(
  () => import("@/components/layout/WorkspaceTraceabilityPanel").then((m) => m.WorkspaceTraceabilityPanel),
  { ssr: false },
);

const WORKSPACE_ONBOARDING_KEY = "archway-workspace-onboarding-dismissed";
const EDITOR_WIDTH_KEY = "archway-editor-width";

function WorkspaceCanvas({ projectId }: { projectId: string }) {
  const reactFlow = useReactFlow();
  const {
    project,
    dbNodes,
    dbContents,
    sourceArtifacts,
    dbWarnings,
    sortedNodes,
    recommendedNextNode,
    doneCount,
    validationTone,
  } = useWorkspaceData(projectId);

  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges] = useEdgesState<FlowEdge>([]);

  const [selectedNodeData, setSelectedNodeData] = useState<NodeData | null>(
    null,
  );
  const [showValidationPanel, setShowValidationPanel] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(WORKSPACE_ONBOARDING_KEY) !== "true";
  });
  const [editorCollapsed, setEditorCollapsed] = useState(false);
  const [editorWidth, setEditorWidth] = useState(() => {
    if (typeof window === "undefined") return 640;
    const savedWidth = window.localStorage.getItem(EDITOR_WIDTH_KEY);
    return savedWidth ? parseInt(savedWidth, 10) : 640;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showCommandDialog, setShowCommandDialog] = useState(false);
  const [showProjectNotes, setShowProjectNotes] = useState(false);
  const [showTraceabilityPanel, setShowTraceabilityPanel] = useState(false);
  const [navigationIntent, setNavigationIntent] =
    useState<WorkspaceNavigationIntent | null>(null);
  const [showDesktopFlowChrome, setShowDesktopFlowChrome] = useState(false);

  const flowWrapperRef = useRef<HTMLDivElement | null>(null);
  const excalidrawControls = useExcalidrawControls();

  const saveWidth = useCallback((width: number) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(EDITOR_WIDTH_KEY, width.toString());
  }, []);

  const handleMouseDown = useCallback((event: ReactMouseEvent) => {
    event.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - event.clientX;
      if (newWidth >= 320 && newWidth <= window.innerWidth * 0.8) {
        setEditorWidth(newWidth);
      }
    },
    [isResizing],
  );

  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      saveWidth(editorWidth);
    }
  }, [editorWidth, isResizing, saveWidth]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp, isResizing]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const syncViewport = () => setShowDesktopFlowChrome(mediaQuery.matches);

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => {
      mediaQuery.removeEventListener("change", syncViewport);
    };
  }, []);

  const focusNodeInCanvas = useCallback(
    (node: NodeData) => {
      reactFlow.setCenter(node.position_x + 150, node.position_y + 60, {
        zoom: 0.8,
        duration: 350,
      });
    },
    [reactFlow],
  );

  const handleOpenNode = useCallback(
    (node: NodeData, intent?: WorkspaceNavigationIntent | null) => {
      setShowProjectNotes(false);
      setShowTraceabilityPanel(false);
      setNavigationIntent(intent ?? null);
      setSelectedNodeData(node);
      setEditorCollapsed(false);
      focusNodeInCanvas(node);
    },
    [focusNodeInCanvas],
  );

  const nodeTypes = useMemo(
    () => ({
      project_brief: ArchwayNode,
      requirements: ArchwayNode,
      user_stories: ArchwayNode,
      use_cases: ArchwayNode,
      flowchart: ArchwayNode,
      dfd: ArchwayNode,
      erd: ArchwayNode,
      sequence: ArchwayNode,
      task_board: ArchwayNode,
      summary: ArchwayNode,
    }),
    [],
  );

  const edgeTypes = useMemo(
    () => ({
      archway: ArchwayEdge,
    }),
    [],
  );

  const helpChecklist = useMemo(
    () => [
      {
        id: "open-node",
        label: "Open a node and start editing from the Guided tab.",
        done:
          selectedNodeData !== null ||
          dbNodes.some((node) => node.status !== "Empty"),
      },
      {
        id: "complete-brief",
        label: "Complete the Project Brief so downstream nodes have context.",
        done: dbNodes.some(
          (node) => node.type === "project_brief" && node.status === "Done",
        ),
      },
      {
        id: "review-validation",
        label: "Review validation at least once while building the flow.",
        done: showValidationPanel || dbWarnings.length === 0,
      },
      {
        id: "move-to-execution",
        label: "Reach Task Board or Summary as the workspace matures.",
        done: dbNodes.some(
          (node) =>
            (node.type === "task_board" || node.type === "summary") &&
            node.status !== "Empty",
        ),
      },
    ],
    [dbNodes, dbWarnings.length, selectedNodeData, showValidationPanel],
  );

  const commandNodes = useMemo(
    () => buildCommandNodes({ sortedNodes, recommendedNextNode }),
    [recommendedNextNode, sortedNodes],
  );

  useEffect(() => {
    if (dbNodes.length === 0) {
      setNodes([]);
      return;
    }

    const flowNodes: FlowNode[] = dbNodes.map((node) => {
      const nodeWarnings = dbWarnings.filter(
        (warning) => warning.source_node_id === node.id,
      );

      return {
        id: node.id,
        type: node.type,
        position: { x: node.position_x, y: node.position_y },
        data: {
          ...node,
          isNext: node.id === recommendedNextNode?.id,
          warnings: nodeWarnings,
        } as unknown as Record<string, unknown>,
      };
    });

    setNodes(flowNodes);
  }, [dbNodes, dbWarnings, recommendedNextNode, setNodes]);

  useEffect(() => {
    if (!project || nodes.length === 0) {
      setEdges([]);
      return;
    }

    setEdges(
      buildCanonicalFlowEdges({
        projectId: project.id,
        templateType: project.template_type,
        dbNodes,
        dbWarnings,
        nodes,
      }),
    );
  }, [dbNodes, dbWarnings, nodes, project, setEdges]);

  const dismissOnboarding = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(WORKSPACE_ONBOARDING_KEY, "true");
    }
    setShowOnboarding(false);
  }, []);

  const handleJumpToNode = useCallback(
    (nodeId: string) => {
      const targetNode = dbNodes.find((node) => node.id === nodeId);
      if (!targetNode) return;
      handleOpenNode(targetNode, null);
    },
    [dbNodes, handleOpenNode],
  );

  const handleJumpToRecommendedNode = useCallback(() => {
    if (!recommendedNextNode) return;
    handleOpenNode(recommendedNextNode);
  }, [handleOpenNode, recommendedNextNode]);

  const handleToggleProjectNotes = useCallback(() => {
    setSelectedNodeData(null);
    setEditorCollapsed(false);
    setShowTraceabilityPanel(false);
    setShowProjectNotes((value) => !value);
  }, []);

  const handleToggleTraceability = useCallback(() => {
    setSelectedNodeData(null);
    setEditorCollapsed(false);
    setShowProjectNotes(false);
    setShowTraceabilityPanel((value) => !value);
  }, []);

  const handleFitView = useCallback(() => {
    reactFlow.fitView({ padding: 0.2, duration: 300 });
  }, [reactFlow]);

  const onNodeDragStop = useCallback(
    async (_event: ReactMouseEvent, _node: FlowNode, draggedNodes: FlowNode[]) => {
      await Promise.all(
        draggedNodes.map((n) => updateNodePosition(n.id, n.position.x, n.position.y)),
      );
    },
    [],
  );

  const onNodeClick = useCallback(
    (_event: ReactMouseEvent, node: FlowNode) => {
      handleOpenNode(node.data as unknown as NodeData);
    },
    [handleOpenNode],
  );

  const handleEditorClose = useCallback(() => {
    setSelectedNodeData(null);
    setEditorCollapsed(false);
  }, []);

  const handleNavigateWithIntent = useCallback(
    (intent: WorkspaceNavigationIntent) => {
      const targetNode = dbNodes.find((node) => node.id === intent.nodeId);
      if (!targetNode) return;
      handleOpenNode(targetNode, intent);
    },
    [dbNodes, handleOpenNode],
  );

  const handleCanvasKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isEditable =
        target?.isContentEditable ||
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select";

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setShowCommandDialog(true);
        return;
      }

      if (isEditable) return;

      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        handleFitView();
        return;
      }

      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        handleJumpToRecommendedNode();
        return;
      }

      if (event.key === "/") {
        event.preventDefault();
        setShowCommandDialog(true);
        return;
      }

      if (event.key === "?") {
        event.preventDefault();
        setShowHelpDialog(true);
      }
    },
    [handleFitView, handleJumpToRecommendedNode],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleCanvasKeyDown);
    return () => window.removeEventListener("keydown", handleCanvasKeyDown);
  }, [handleCanvasKeyDown]);

  const handleCanvasWrapperKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" && !selectedNodeData && recommendedNextNode) {
        event.preventDefault();
        handleJumpToRecommendedNode();
      }
    },
    [handleJumpToRecommendedNode, recommendedNextNode, selectedNodeData],
  );

  if (!project) {
    return <div className="p-8">Loading project workspace...</div>;
  }

  return (
    <div
      className="workspace-shell h-screen w-full overflow-hidden"
      data-testid="workspace-screen"
    >
      <div className="flex h-full flex-col overflow-hidden">
        <WorkspaceHeader
          project={project}
          dbNodes={dbNodes}
          dbContents={dbContents}
          doneCount={doneCount}
          recommendedNextNode={recommendedNextNode}
          onJumpNext={handleJumpToRecommendedNode}
          onShowCommand={() => setShowCommandDialog(true)}
          onShowHelp={() => setShowHelpDialog(true)}
        />

        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          <WorkspaceSidebar
            validationTone={validationTone}
            showValidationPanel={showValidationPanel}
            showProjectNotes={showProjectNotes}
            showTraceabilityPanel={showTraceabilityPanel}
            onFitView={handleFitView}
            onToggleValidation={() => setShowValidationPanel((v) => !v)}
            onToggleProjectNotes={handleToggleProjectNotes}
            onToggleTraceability={handleToggleTraceability}
            onShowHelp={() => setShowHelpDialog(true)}
          />

          {showValidationPanel && (
            <div className="absolute bottom-3 left-3 top-3 z-30 w-[min(420px,calc(100vw-1.5rem))] max-w-full md:left-4 md:w-100">
              <ValidationSummaryPanel
                nodes={dbNodes}
                contents={dbContents}
                warnings={dbWarnings}
                onCloseAction={() => setShowValidationPanel(false)}
                onNodeNavigateAction={handleNavigateWithIntent}
              />
            </div>
          )}

          <WorkspaceOverlays
            showOnboarding={showOnboarding}
            recommendedNextNode={!selectedNodeData ? recommendedNextNode : null}
            dbWarningsLength={dbWarnings.length}
            showValidationPanel={showValidationPanel}
            onDismissOnboarding={dismissOnboarding}
            onShowHelp={() => setShowHelpDialog(true)}
            onJumpNext={handleJumpToRecommendedNode}
            onToggleValidation={() => setShowValidationPanel((value) => !value)}
          />

          <div
            ref={flowWrapperRef}
            className="relative min-w-0 flex-1"
            tabIndex={0}
            onKeyDown={handleCanvasWrapperKeyDown}
            data-testid="workspace-canvas"
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onNodeDragStop={onNodeDragStop}
              onNodeClick={onNodeClick}
              onPaneClick={handleEditorClose}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              defaultEdgeOptions={{
                type: "archway",
                animated: true,
                markerEnd: {
                  type: MarkerType.Arrow,
                  width: 20,
                  height: 20,
                  color: "#94a3b8",
                  strokeWidth: 2,
                },
              }}
              {...excalidrawControls}
              fitViewOptions={{ padding: 0.2, duration: 300 }}
              proOptions={{ hideAttribution: true }}
              fitView
              className="bg-dot-pattern"
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={24}
                size={1}
                color="var(--workspace-grid)"
              />
              {showDesktopFlowChrome && <Controls position="bottom-left" />}
              {showDesktopFlowChrome && (
                <MiniMap
                  position="bottom-right"
                  nodeColor="#52B788"
                  maskColor="rgba(0,0,0,0.55)"
                />
              )}
            </ReactFlow>
          </div>

          {selectedNodeData && !editorCollapsed && (
            <div
              data-testid="workspace-editor-panel-shell"
              className={`workspace-panel relative z-20 h-full shrink-0 border-l border-border/70 ${
                isResizing ? "pointer-events-none select-none" : ""
              }`}
              style={{
                width:
                  typeof window !== "undefined" && window.innerWidth >= 768
                    ? `${editorWidth}px`
                    : "100%",
                maxWidth: "80vw",
                minWidth: "320px",
              }}
            >
              <div
                className="group absolute bottom-0 left-0 top-0 z-50 hidden w-1.5 cursor-col-resize transition-colors hover:bg-primary/40 md:block"
                onMouseDown={handleMouseDown}
              >
                <div className="absolute left-1/2 top-1/2 h-8 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-border/60 transition-colors group-hover:bg-primary/60" />
              </div>

              <div className="absolute left-0 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full bg-background shadow-sm"
                  onClick={() => setEditorCollapsed(true)}
                  aria-label="Collapse editor panel"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <NodeEditorPanel
                key={selectedNodeData.id}
                node={selectedNodeData}
                navigationIntent={navigationIntent}
                onCloseAction={handleEditorClose}
              />
            </div>
          )}

          {showProjectNotes && !selectedNodeData && (
            <div
              data-testid="workspace-project-notes-shell"
              className="workspace-panel relative z-20 h-full shrink-0 border-l border-border/70"
              style={{
                width:
                  typeof window !== "undefined" && window.innerWidth >= 768
                    ? `${editorWidth}px`
                    : "100%",
                maxWidth: "80vw",
                minWidth: "320px",
              }}
            >
              <div className="absolute left-0 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full bg-background shadow-sm"
                  onClick={() => setShowProjectNotes(false)}
                  aria-label="Close project notes panel"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <ProjectNotesPanel
                project={project}
                onCloseAction={() => setShowProjectNotes(false)}
              />
            </div>
          )}

          {showTraceabilityPanel && !selectedNodeData && !showProjectNotes && (
            <div
              data-testid="workspace-traceability-shell"
              className="workspace-panel relative z-20 h-full shrink-0 border-l border-border/70"
              style={{
                width:
                  typeof window !== "undefined" && window.innerWidth >= 768
                    ? `${editorWidth}px`
                    : "100%",
                maxWidth: "80vw",
                minWidth: "320px",
              }}
            >
              <div className="absolute left-0 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full bg-background shadow-sm"
                  onClick={() => setShowTraceabilityPanel(false)}
                  aria-label="Close traceability panel"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <WorkspaceTraceabilityPanel
                project={project}
                nodes={dbNodes}
                contents={dbContents}
                sourceArtifacts={sourceArtifacts}
                onCloseAction={() => setShowTraceabilityPanel(false)}
                onNodeNavigateAction={handleNavigateWithIntent}
              />
            </div>
          )}

          {selectedNodeData && editorCollapsed && (
            <div className="absolute right-0 top-0 z-20 flex h-full items-center">
              <div className="absolute right-3 top-1/2 z-30 -translate-y-1/2">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full bg-background shadow-sm"
                  onClick={() => setEditorCollapsed(false)}
                  aria-label="Expand editor panel"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {dbWarnings.length > 0 && (
            <div className="absolute right-4 top-4 z-20 md:hidden">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full bg-background/90"
                onClick={() => setShowValidationPanel(true)}
              >
                <Info className="mr-2 h-4 w-4" />
                Issues
              </Button>
            </div>
          )}
        </div>
      </div>

      <WorkspaceCommandDialog
        open={showCommandDialog}
        onOpenChange={setShowCommandDialog}
        nodes={commandNodes}
        validationCount={dbWarnings.length}
        onNodeSelect={handleJumpToNode}
        onNextNode={handleJumpToRecommendedNode}
        onFitView={handleFitView}
        onShowValidation={() => setShowValidationPanel(true)}
      />

      <WorkspaceHelpDialog
        open={showHelpDialog}
        onOpenChange={setShowHelpDialog}
        checklist={helpChecklist}
      />
    </div>
  );
}

export function WorkspaceScreen({ projectId }: { projectId: string }) {
  return (
    <ReactFlowProvider>
      <WorkspaceCanvas projectId={projectId} />
    </ReactFlowProvider>
  );
}
