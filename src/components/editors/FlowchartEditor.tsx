"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Info, GitBranch } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import {
  useFlowchartLogic,
  type FlowchartFields,
} from "./flowchart/hooks/useFlowchartLogic";
import { FlowStepItem } from "./flowchart/components/FlowStepItem";
import { FlowConnectionItem } from "./flowchart/components/FlowConnectionItem";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StructuredEditorProps } from "./editorTypes";

type UseCaseReference = { id?: string; name?: string };

function useUseCases(projectId?: string) {
  return (
    useLiveQuery(async () => {
      if (!projectId) return [] as UseCaseReference[];
      const node = await db.nodes
        .where({ project_id: projectId, type: "use_cases" })
        .first();
      if (!node) return [] as UseCaseReference[];
      const content = await db.nodeContents.where({ node_id: node.id }).first();
      return (content?.structured_fields?.useCases || []) as UseCaseReference[];
    }, [projectId]) ?? []
  );
}

type FlowchartEditorProps = StructuredEditorProps<FlowchartFields>;

export function FlowchartEditor({
  fields,
  onChange,
  projectId,
}: FlowchartEditorProps) {
  const useCases = useUseCases(projectId);
  const {
    flows,
    addFlow,
    updateFlow,
    removeFlow,
    addStep,
    updateStep,
    removeStep,
    addConnection,
    updateConnection,
    removeConnection,
  } = useFlowchartLogic(fields, onChange);

  // Backward compatibility migration handled in hook or here if needed
  // (The previous version had migration logic, keeping it simple here)

  return (
    <div className="flex flex-col gap-10 p-8 w-full workspace-scroll pb-24 h-full">
      {/* Header */}
      <div className="space-y-6" id="flowchart-overview">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-2xl font-black tracking-tighter uppercase italic opacity-20 text-amber-900/50">Algorithm Flow</h2>
          </div>
          <Button
            size="sm"
            variant="default"
            onClick={addFlow}
            className="h-11 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-amber-500/20 bg-amber-600 hover:bg-amber-700 hover:scale-[1.02] active:scale-95 transition-all text-white border-none"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Logic Flow
          </Button>
        </div>
      </div>

      {flows.length === 0 && (
        <div className="p-20 border-2 border-dashed border-border/40 rounded-[3rem] flex flex-col items-center justify-center gap-4 grayscale opacity-20">
          <GitBranch className="h-12 w-12" />
          <span className="text-sm font-black uppercase tracking-widest text-center max-w-[200px]">Define your first logical sequence</span>
        </div>
      )}

      <div className="space-y-12" id="flowchart-flows">
        {flows.map((flow, flowIdx) => (
          <div key={flow.id} className="relative group animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Flow Card */}
            <div className="p-8 bg-card/30 border border-border/40 rounded-[3rem] hover:bg-card/50 hover:border-border/60 transition-all duration-500 shadow-sm space-y-8">
              {/* Flow Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-4 flex-1 max-w-2xl">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black tracking-widest text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 uppercase">
                      FLOW ID-{String(flowIdx + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <Input
                    value={flow.name}
                    onChange={(e) => updateFlow(flow.id, { name: e.target.value })}
                    placeholder="Enter flow name (e.g. Authentication Procedure)..."
                    className="text-2xl font-black tracking-tight border-none bg-transparent p-0 h-auto focus-visible:ring-0 placeholder:opacity-20 translate-x-[-1px]"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-[1.5rem] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                  onClick={() => removeFlow(flow.id)}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>

              {/* Flow Meta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-background/40 rounded-[2rem] border border-border/20">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Business Trigger</Label>
                  <Input
                    value={flow.trigger}
                    onChange={(e) => updateFlow(flow.id, { trigger: e.target.value })}
                    placeholder="What starts this process?"
                    className="h-10 border-none bg-background/50 rounded-xl text-sm font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Related Use Case</Label>
                  <Select
                    value={flow.related_use_case || "none"}
                    onValueChange={(val) =>
                      updateFlow(flow.id, { related_use_case: val === "none" ? "" : (val ?? "") })
                    }
                  >
                    <SelectTrigger className="h-10 border-none bg-background/50 rounded-xl font-bold text-xs">
                      <SelectValue placeholder="Link to UC..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="italic opacity-50">Unlinked</SelectItem>
                      {useCases.map((uc, i: number) => (
                        <SelectItem
                          key={String(uc.id ?? `uc-${i + 1}`)}
                          value={String(uc.id ?? `uc-${i + 1}`)}
                          className="text-xs font-bold"
                        >
                          UC-{String(i + 1).padStart(3, "0")}: {uc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Steps & Connections Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-4">
                {/* Steps Column */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      <h4 className="text-[11px] font-black uppercase tracking-widest opacity-40 text-blue-900">Step Definitions</h4>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => addStep(flow.id)}
                      className="h-8 px-3 rounded-lg font-black uppercase tracking-widest text-[9px] hover:bg-blue-500/5 transition-all text-blue-600"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Step
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {flow.steps.map((step) => (
                      <FlowStepItem
                        key={step.id}
                        step={step}
                        onUpdate={(upd) => updateStep(flow.id, step.id, upd)}
                        onRemove={() => removeStep(flow.id, step.id)}
                      />
                    ))}
                    {flow.steps.length === 0 && (
                      <div className="p-8 border border-dashed border-border/40 rounded-2xl flex flex-col items-center justify-center gap-2 grayscale opacity-30 bg-muted/5">
                        <Info className="h-5 w-5" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Awaiting nodes</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Connections Column */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <h4 className="text-[11px] font-black uppercase tracking-widest opacity-40 text-emerald-900">Logic Pathways</h4>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => addConnection(flow.id)}
                      className="h-8 px-3 rounded-lg font-black uppercase tracking-widest text-[9px] hover:bg-emerald-500/5 transition-all text-emerald-600"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add connection
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {flow.connections.map((conn) => (
                      <FlowConnectionItem
                        key={conn.id}
                        connection={conn}
                        steps={flow.steps}
                        onUpdate={(upd) => updateConnection(flow.id, conn.id, upd)}
                        onRemove={() => removeConnection(flow.id, conn.id)}
                      />
                    ))}
                    {flow.connections.length === 0 && (
                      <div className="p-8 border border-dashed border-border/40 rounded-2xl flex flex-col items-center justify-center gap-2 grayscale opacity-30 bg-muted/5">
                        <GitBranch className="h-5 w-5" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Map the flow</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
