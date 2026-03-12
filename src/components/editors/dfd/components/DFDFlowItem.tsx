"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2, ArrowRight, AlertTriangle } from "lucide-react";
import { DFDFlow, DFDNode } from "../hooks/useDFDLogic";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DFDFlowItemProps {
  flow: DFDFlow;
  nodes: DFDNode[];
  error: string | null;
  onUpdate: (updates: Partial<DFDFlow>) => void;
  onRemove: () => void;
}

export function DFDFlowItem({
  flow,
  nodes,
  error,
  onUpdate,
  onRemove,
}: DFDFlowItemProps) {
  return (
    <div className="group relative p-6 bg-card/40 border border-border/40 rounded-[2rem] hover:bg-background/80 hover:border-border/60 transition-all duration-300 animate-in fade-in zoom-in-95 shadow-sm">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest px-2 py-0.5 bg-muted/20 rounded-lg">Data Flow</span>
            {error && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 animate-pulse">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span className="text-[9px] font-black uppercase tracking-widest">Logic Violation</span>
              </div>
            )}
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

        <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-4 px-1">
          <Select
            value={flow.from}
            onValueChange={(val) => onUpdate({ from: val || "" })}
          >
            <SelectTrigger className="h-10 border-none bg-background/50 rounded-xl font-bold text-xs">
              <SelectValue placeholder="Origin..." />
            </SelectTrigger>
            <SelectContent>
              {nodes.map((node) => (
                <SelectItem key={node.id} value={node.id} className="text-xs font-bold">
                  <span className="opacity-40 uppercase mr-1">{node.type[0]}</span> {node.label || "Untitled"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ArrowRight className={cn("h-4 w-4 transition-colors", error ? "text-destructive" : "text-muted-foreground/30")} />

          <Select
            value={flow.to}
            onValueChange={(val) => onUpdate({ to: val || "" })}
          >
            <SelectTrigger className="h-10 border-none bg-background/50 rounded-xl font-bold text-xs">
              <SelectValue placeholder="Destination..." />
            </SelectTrigger>
            <SelectContent>
              {nodes.map((node) => (
                <SelectItem key={node.id} value={node.id} className="text-xs font-bold">
                  <span className="opacity-40 uppercase mr-1">{node.type[0]}</span> {node.label || "Untitled"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 px-1">
          <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Data Elements Transferred</Label>
          <Input
            value={flow.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="e.g. user_id, auth_token, transaction_data..."
            className="h-10 bg-primary/5 border-none rounded-xl text-sm font-medium shadow-none hover:bg-primary/10 transition-all"
          />
        </div>

        {error && (
          <p className="px-2 text-[10px] font-bold text-destructive/70 italic animate-in slide-in-from-top-1">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
