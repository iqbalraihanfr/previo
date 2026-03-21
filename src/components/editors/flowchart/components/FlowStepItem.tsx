"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Play, Square, GitBranch, StopCircle } from "lucide-react";
import { FlowStep } from "../hooks/useFlowchartLogic";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface FlowStepItemProps {
  step: FlowStep;
  onUpdate: (updates: Partial<FlowStep>) => void;
  onRemove: () => void;
}

const STEP_CONFIG = {
  start: { icon: <Play className="h-4 w-4" />, label: "Start", color: "text-emerald-500 bg-emerald-500/10" },
  process: { icon: <Square className="h-4 w-4" />, label: "Process", color: "text-blue-500 bg-blue-500/10" },
  decision: { icon: <GitBranch className="h-4 w-4" />, label: "Decision", color: "text-amber-500 bg-amber-500/10" },
  end: { icon: <StopCircle className="h-4 w-4" />, label: "End", color: "text-rose-500 bg-rose-500/10" },
};

export function FlowStepItem({ step, onUpdate, onRemove }: FlowStepItemProps) {
  const config = STEP_CONFIG[step.type];

  return (
    <div className="group flex items-center gap-3 p-3 bg-card/40 border border-border/40 rounded-2xl hover:bg-background/80 hover:border-border/60 transition-all duration-300 animate-in slide-in-from-left-2">
      <div className="w-32">
        <Select
          value={step.type}
          onValueChange={(val) => onUpdate({ type: val as FlowStep["type"] })}
        >
          <SelectTrigger className="h-9 border-none bg-primary/5 rounded-xl font-bold uppercase tracking-widest text-[9px]">
            <div className="flex items-center gap-2">
              <span className={cn(config.color, "p-1 rounded-md")}>{config.icon}</span>
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STEP_CONFIG).map(([type, cfg]) => (
              <SelectItem key={type} value={type} className="text-[9px] font-black uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  {cfg.icon}
                  {cfg.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1">
        <Input
          value={step.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="Step description..."
          className="h-9 border-none bg-background/50 rounded-xl text-xs font-bold shadow-none hover:bg-background transition-all"
        />
      </div>

      {step.type === "decision" && (
        <div className="flex gap-2 animate-in fade-in zoom-in-95">
          <Input
            value={step.yes_target || ""}
            onChange={(e) => onUpdate({ yes_target: e.target.value })}
            placeholder="YES→"
            className="h-9 w-12 text-[8px] font-black uppercase bg-emerald-500/5 text-emerald-600 border border-emerald-500/10 rounded-xl px-2"
          />
          <Input
            value={step.no_target || ""}
            onChange={(e) => onUpdate({ no_target: e.target.value })}
            placeholder="NO→"
            className="h-9 w-12 text-[8px] font-black uppercase bg-rose-500/5 text-rose-600 border border-rose-500/10 rounded-xl px-2"
          />
        </div>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 opacity-0 group-hover:opacity-100 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
        onClick={onRemove}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
