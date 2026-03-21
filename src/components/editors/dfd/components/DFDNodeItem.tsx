"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2, Settings, Database, ExternalLink } from "lucide-react";
import { DFDNode } from "../hooks/useDFDLogic";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DFDNodeItemProps {
  node: DFDNode;
  useCases: Array<{ id?: string; name?: string }>;
  erdEntities: Array<{ id?: string; name?: string }>;
  onUpdate: (updates: Partial<DFDNode>) => void;
  onRemove: () => void;
}

const TYPE_CONFIG = {
  process: { icon: <Settings className="h-4 w-4" />, label: "Process", color: "text-blue-500 bg-blue-500/10" },
  entity: { icon: <ExternalLink className="h-4 w-4" />, label: "Ext Entity", color: "text-indigo-500 bg-indigo-500/10" },
  datastore: { icon: <Database className="h-4 w-4" />, label: "Data Store", color: "text-emerald-500 bg-emerald-500/10" },
};

export function DFDNodeItem({
  node,
  useCases,
  erdEntities,
  onUpdate,
  onRemove,
}: DFDNodeItemProps) {
  const config = TYPE_CONFIG[node.type];

  return (
    <div className="group relative p-6 bg-card/40 border border-border/40 rounded-[2rem] hover:bg-background/80 hover:border-border/60 transition-all duration-300 animate-in fade-in slide-in-from-left-4 shadow-sm">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", config.color)}>
            {config.icon}
            {config.label}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 opacity-0 group-hover:opacity-100 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Label / Name</Label>
            <Input
              value={node.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="e.g. Process Payment, User Database..."
              className="h-11 bg-background/50 border-none rounded-xl text-sm font-bold shadow-none hover:bg-background transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {node.type === "process" && (
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Business Context (UC)</Label>
                <Select
                  value={node.related_use_case || "none"}
                  onValueChange={(val) => onUpdate({ related_use_case: val || "" })}
                >
                  <SelectTrigger className="h-10 border-none bg-primary/5 rounded-xl font-bold text-xs">
                    <SelectValue placeholder="Link UC..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs font-bold text-muted-foreground italic">No Link</SelectItem>
                    {useCases.map((uc, i) => (
                      <SelectItem key={uc.id} value={uc.id} className="text-xs font-bold">
                        UC-{String(i + 1).padStart(3, "0")}: {uc.name || "Untitled"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {node.type === "datastore" && (
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Database Map (ERD)</Label>
                <Select
                  value={node.related_erd_entity || "none"}
                  onValueChange={(val) => onUpdate({ related_erd_entity: val || "" })}
                >
                  <SelectTrigger className="h-10 border-none bg-emerald-500/5 rounded-xl font-bold text-xs text-emerald-600">
                    <SelectValue placeholder="Link Entity..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs font-bold text-muted-foreground italic">No Link</SelectItem>
                    {erdEntities.map((entity) => (
                      <SelectItem key={entity.id} value={entity.name} className="text-xs font-bold">
                        {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
