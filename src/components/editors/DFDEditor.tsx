"use client";

import { Button } from "@/components/ui/button";
import { Plus, Info, Settings, User, Database } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useDFDLogic, type DFDFields } from "./dfd/hooks/useDFDLogic";
import { DFDNodeItem } from "./dfd/components/DFDNodeItem";
import { DFDFlowItem } from "./dfd/components/DFDFlowItem";
import type { StructuredEditorProps } from "./editorTypes";

function useUseCases(projectId?: string) {
  return useLiveQuery(
    async () => {
      if (!projectId) return [];
      const node = await db.nodes
        .where({ project_id: projectId, type: "use_cases" })
        .first();
      if (!node) return [];
      const content = await db.nodeContents.where({ node_id: node.id }).first();
      return content?.structured_fields?.useCases || [];
    },
    [projectId],
    [],
  );
}

function useERDEntities(projectId?: string) {
  return useLiveQuery(
    async () => {
      if (!projectId) return [];
      const node = await db.nodes
        .where({ project_id: projectId, type: "erd" })
        .first();
      if (!node) return [];
      const content = await db.nodeContents.where({ node_id: node.id }).first();
      return content?.structured_fields?.entities || [];
    },
    [projectId],
    [],
  );
}

type DFDEditorProps = StructuredEditorProps<DFDFields>;

export function DFDEditor({
  fields,
  onChange,
  projectId,
}: DFDEditorProps) {
  const useCases = useUseCases(projectId);
  const erdEntities = useERDEntities(projectId);
  
  const {
    nodes,
    flows,
    addNode,
    updateNode,
    removeNode,
    addFlow,
    updateFlow,
    removeFlow,
    validateFlow,
  } = useDFDLogic(fields, onChange);

  return (
    <div className="flex flex-col gap-10 p-8 w-full workspace-scroll pb-24 h-full">
      {/* Header */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
          <h2 className="text-2xl font-black tracking-tighter uppercase italic opacity-20 text-indigo-900">Data Flow Map</h2>
        </div>
      </div>

      {/* Components Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="space-y-1">
            <h3 className="text-sm font-black uppercase tracking-widest">Architectural Components</h3>
            <p className="text-[10px] text-muted-foreground font-medium italic">Processes, External Entities, and Data Stores</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => addNode("process")}
              className="h-10 px-4 rounded-xl font-black uppercase tracking-widest text-[9px] border-blue-500/20 hover:bg-blue-500/5 transition-all"
            >
              <Settings className="h-4 w-4 mr-2 text-blue-500" />
              Process
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => addNode("entity")}
              className="h-10 px-4 rounded-xl font-black uppercase tracking-widest text-[9px] border-indigo-500/20 hover:bg-indigo-500/5 transition-all"
            >
              <User className="h-4 w-4 mr-2 text-indigo-500" />
              Entity
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => addNode("datastore")}
              className="h-10 px-4 rounded-xl font-black uppercase tracking-widest text-[9px] border-emerald-500/20 hover:bg-emerald-500/5 transition-all"
            >
              <Database className="h-4 w-4 mr-2 text-emerald-500" />
              Data
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {nodes.map((node) => (
            <DFDNodeItem
              key={node.id}
              node={node}
              useCases={useCases}
              erdEntities={erdEntities}
              onUpdate={(upd) => updateNode(node.id, upd)}
              onRemove={() => removeNode(node.id)}
            />
          ))}
          {nodes.length === 0 && (
            <div className="p-12 border-2 border-dashed border-border/40 rounded-[2rem] flex flex-col items-center justify-center gap-3 grayscale opacity-30">
              <Info className="h-8 w-8" />
              <span className="text-xs font-black uppercase tracking-widest">No Components Defined</span>
            </div>
          )}
        </div>
      </div>

      {/* Flows Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="space-y-1">
            <h3 className="text-sm font-black uppercase tracking-widest">Data Streams</h3>
            <p className="text-[10px] text-muted-foreground font-medium italic">Map how data moves across the system</p>
          </div>
          <Button
            size="sm"
            variant="default"
            onClick={addFlow}
            className="h-11 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            Connect Logic
          </Button>
        </div>

        <div className="space-y-4">
          {flows.map((flow) => (
            <DFDFlowItem
              key={flow.id}
              flow={flow}
              nodes={nodes}
              error={validateFlow(flow)}
              onUpdate={(upd) => updateFlow(flow.id, upd)}
              onRemove={() => removeFlow(flow.id)}
            />
          ))}
          {flows.length === 0 && (
            <div className="p-20 border-2 border-dashed border-border/40 rounded-[3rem] flex flex-col items-center justify-center gap-4 grayscale opacity-20">
              <Plus className="h-12 w-12" />
              <span className="text-sm font-black uppercase tracking-widest">Awaiting Connectivity</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
