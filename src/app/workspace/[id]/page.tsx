"use client";

import { useEffect, useCallback, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ReactFlow, 
  ReactFlowProvider, 
  Background, 
  Controls, 
  Node as FlowNode, 
  Edge as FlowEdge, 
  useNodesState, 
  useEdgesState,
  Connection,
  addEdge,
  BackgroundVariant,
  MiniMap,
  SelectionMode,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, NodeData } from '@/lib/db';
import { ArchwayNode } from '@/components/ArchwayNode';
import { ArchwayEdge } from '@/components/ArchwayEdge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Download, Plus, Trash2 } from 'lucide-react';
import { NodeEditorPanel } from '@/components/NodeEditorPanel';
import { ValidationSummaryPanel } from '@/components/ValidationSummaryPanel';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { exportProjectToMarkdown, exportProjectToPDF } from '@/lib/exportEngine';
import { ModeToggle } from '@/components/mode-toggle';

function WorkspaceContent({ projectId }: { projectId: string }) {
  const router = useRouter();
  
  const project = useLiveQuery(() => db.projects.get(projectId), [projectId]);
  const dbNodes = useLiveQuery(() => db.nodes.where({ project_id: projectId }).toArray(), [projectId]);
  const dbEdges = useLiveQuery(() => db.edges.where({ project_id: projectId }).toArray(), [projectId]);
  const dbContents = useLiveQuery(() => db.nodeContents.toArray(), []);
  const dbWarnings = useLiveQuery(() => db.validationWarnings.where({ project_id: projectId }).toArray(), [projectId]);

  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);
  
  const [selectedNodeData, setSelectedNodeData] = useState<NodeData | null>(null);
  const [showValidationPanel, setShowValidationPanel] = useState(false);

  const nodeTypes = useMemo(() => ({
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
    custom: ArchwayNode
  }), []);

  const edgeTypes = useMemo(() => ({
    archway: ArchwayEdge,
  }), []);

  // Sync DB nodes to React Flow nodes
  useEffect(() => {
    if (dbNodes) {
      // Determine the recommended next node for soft guidance
      const STANDARD_NODE_ORDER = [
        'project_brief', 'requirements', 'user_stories', 'use_case', 
        'flowchart', 'dfd', 'erd', 'sequence', 'task_board', 'summary'
      ];
      const sortedNodes = [...dbNodes].sort((a, b) => {
        return STANDARD_NODE_ORDER.indexOf(a.type) - STANDARD_NODE_ORDER.indexOf(b.type);
      });
      const nextNode = sortedNodes.find(n => n.status !== 'Done');
      const recommendedNextNodeId = nextNode ? nextNode.id : null;

      const flowNodes: FlowNode[] = dbNodes.map((n) => {
        const nodeWarnings = dbWarnings?.filter(w => w.source_node_id === n.id) || [];
        return {
          id: n.id,
          type: n.type,
          position: { x: n.position_x, y: n.position_y },
          data: {
            ...n,
            isNext: n.id === recommendedNextNodeId,
            warnings: nodeWarnings
          } as unknown as Record<string, unknown>,
        };
      });
      setNodes(flowNodes);
    }
  }, [dbNodes, dbWarnings, setNodes]);

  // Dynamically route edges based on real-time node positions
  useEffect(() => {
    if (dbEdges && nodes.length > 0) {
      const flowEdges: FlowEdge[] = dbEdges.map((e) => {
        let sourceHandle = 'right';
        let targetHandle = 'left';

        const sourceNode = nodes.find(n => n.id === e.source_node_id);
        const targetNode = nodes.find(n => n.id === e.target_node_id);

        if (sourceNode?.position && targetNode?.position) {
          const dx = targetNode.position.x - sourceNode.position.x;
          const dy = targetNode.position.y - sourceNode.position.y;
          
          // Switch handles to bottom->top if target is significantly below,
          // or if target wraps around to the left side
          if (dy > 80 || dx < -50) {
            sourceHandle = 'bottom';
            targetHandle = 'top';
          }
        }

        return {
          id: e.id,
          source: e.source_node_id,
          target: e.target_node_id,
          sourceHandle,
          targetHandle,
          type: 'archway',
          animated: true,
          markerEnd: {
            type: MarkerType.Arrow,
            width: 20,
            height: 20,
            color: '#94a3b8',
            strokeWidth: 2
          }
        };
      });
      setEdges(flowEdges);
    }
  }, [dbEdges, nodes, setEdges]);

  const onNodeDragStop = useCallback(
    async (event: React.MouseEvent, node: FlowNode) => {
      await db.nodes.update(node.id, {
        position_x: node.position.x,
        position_y: node.position.y
      });
    },
    []
  );

  const onConnect = useCallback(
    async (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
      if (params.source && params.target) {
        await db.edges.add({
          id: crypto.randomUUID(),
          project_id: projectId,
          source_node_id: params.source,
          target_node_id: params.target
        });
      }
    },
    [setEdges, projectId],
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: FlowNode) => {
    setSelectedNodeData(node.data as unknown as NodeData);
  }, []);

  const handleEditorClose = useCallback(() => {
    setSelectedNodeData(null);
  }, []);

  const handleAddNode = async (type: string, baseLabel: string) => {
    const newId = crypto.randomUUID();
    let x = Math.random() * 500;
    let y = Math.random() * 500 + 100;
    
    // Attempt to position right of the last normal node
    const normalNodes = dbNodes?.filter(n => n.type !== 'summary' && n.type !== 'task_board') || [];
    if (normalNodes.length > 0) {
      const last = normalNodes[normalNodes.length - 1];
      x = last.position_x + 350;
      y = last.position_y;
    }

    await db.nodes.add({
      id: newId,
      project_id: projectId,
      type,
      label: baseLabel,
      status: 'Empty',
      position_x: x,
      position_y: y,
      sort_order: (dbNodes?.length || 0) + 1,
      updated_at: new Date().toISOString()
    });
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!confirm('Are you sure you want to delete this node and all its contents?')) return;
    
    await db.nodes.delete(nodeId);
    
    // Cascade delete contents and tasks
    const contents = await db.nodeContents.where({ node_id: nodeId }).toArray();
    await db.nodeContents.bulkDelete(contents.map(c => c.id));
    
    const tasks = await db.tasks.where({ source_node_id: nodeId }).toArray();
    await db.tasks.bulkDelete(tasks.map(t => t.id));
    
    if (selectedNodeData?.id === nodeId) {
      setSelectedNodeData(null);
    }
  };

  if (!project) return <div className="p-8">Loading project workspace...</div>;

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-background">
      {/* Header Pipeline */}
      <header className="h-14 border-b bg-card flex items-center px-4 justify-between shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="font-semibold">{project.name}</div>
          <div className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground">{dbNodes?.filter(n => n.status === 'Done').length || 0} / {dbNodes?.length || 0} Nodes Done</div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={dbWarnings && dbWarnings.length > 0 ? "destructive" : "outline"} 
            size="sm" 
            className="h-8 text-xs"
            onClick={() => setShowValidationPanel(!showValidationPanel)}
          >
            Warnings {dbWarnings?.length ? `(${dbWarnings.length})` : ''}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
              <Plus className="h-4 w-4 mr-2" /> Add Node
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(() => {
                const existingTypes = new Set(dbNodes?.map(n => n.type) || []);
                const addableNodes: { type: string; label: string }[] = [
                  { type: 'project_brief', label: 'Project Brief' },
                  { type: 'requirements', label: 'Requirements' },
                  { type: 'user_stories', label: 'User Stories' },
                  { type: 'use_cases', label: 'Use Cases' },
                  { type: 'flowchart', label: 'Flowchart' },
                  { type: 'dfd', label: 'DFD' },
                  { type: 'erd', label: 'ERD' },
                  { type: 'sequence', label: 'Sequence Diagram' },
                  { type: 'task_board', label: 'Task Board' },
                  { type: 'summary', label: 'Summary' },
                ];
                const available = addableNodes.filter(n => !existingTypes.has(n.type));
                return (
                  <>
                    <DropdownMenuItem onClick={() => handleAddNode('custom', 'Custom Notes')}>Blank Notes</DropdownMenuItem>
                    {available.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Add Missing Node</div>
                        {available.map(n => (
                          <DropdownMenuItem key={n.type} onClick={() => handleAddNode(n.type, n.label)}>{n.label}</DropdownMenuItem>
                        ))}
                      </>
                    )}
                  </>
                );
              })()}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
              <Download className="h-4 w-4 mr-2" /> Export Project
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportProjectToMarkdown(project, dbNodes || [], dbContents || [])}>
                Export Markdown
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportProjectToPDF(project, dbNodes || [], dbContents || [])}>
                Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
            <ModeToggle />
          </div>
        </header>
      
      {/* Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStop={onNodeDragStop}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={{ 
              type: 'archway', 
              animated: true,
              markerEnd: {
                type: MarkerType.Arrow,
                width: 20,
                height: 20,
                color: '#94a3b8',
                strokeWidth: 2
              }
            }}
            onNodeClick={onNodeClick}
            
            // Trackpad / mouse navigation
            panOnScroll={true}           // Two-finger pan (like Excalidraw)
            panOnDrag={[1, 2]}           // Middle/Right click-and-drag to pan (Default spacebar works too)
            selectionOnDrag={true}       // Left click-and-drag builds a selection box
            selectionMode={SelectionMode.Partial} // Box selection selects on touch
            panActivationKeyCode="Space" // Hold spacebar to pan
            zoomOnScroll={false}         // Disable scroll-to-zoom (conflicts with pan)
            zoomOnPinch={true}           // Pinch-to-zoom on trackpad
            zoomOnDoubleClick={false}    // Disable double-click zoom (accidental triggers)
            
            // Zoom limits
            minZoom={0.1}
            maxZoom={2}
            
            // Smooth animations
            fitViewOptions={{ padding: 0.2, duration: 300 }}
            
            // Controls
            proOptions={{ hideAttribution: true }}

            fitView
            className="bg-dot-pattern"
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#333" />
            <Controls position="bottom-left" />
            <MiniMap 
              position="bottom-right"
              nodeColor="#52B788"
              maskColor="rgba(0,0,0,0.7)"
            />
          </ReactFlow>
        </div>
        
        {/* Right Editor Panel */}
        {selectedNodeData && (
          <NodeEditorPanel 
            node={selectedNodeData} 
            onClose={handleEditorClose}
            onDelete={() => handleDeleteNode(selectedNodeData.id)}
          />
        )}

        {/* Validation Summary Panel */}
        {showValidationPanel && (
          <ValidationSummaryPanel
            projectId={projectId}
            warnings={dbWarnings || []}
            onClose={() => setShowValidationPanel(false)}
            onNodeNavigate={(nodeId: string) => {
              const node = dbNodes?.find(n => n.id === nodeId);
              if (node) setSelectedNodeData(node);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  const params = useParams<{ id: string }>();

  if (!params?.id) return null;

  return (
    <ReactFlowProvider>
      <WorkspaceContent projectId={params.id} />
    </ReactFlowProvider>
  );
}
