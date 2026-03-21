"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowRight } from "lucide-react";
import { FlowConnection, FlowStep } from "../hooks/useFlowchartLogic";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FlowConnectionItemProps {
  connection: FlowConnection;
  steps: FlowStep[];
  onUpdate: (updates: Partial<FlowConnection>) => void;
  onRemove: () => void;
}

export function FlowConnectionItem({
  connection,
  steps,
  onUpdate,
  onRemove,
}: FlowConnectionItemProps) {
  return (
    <div className="group flex items-center gap-3 p-3 bg-primary/5 border border-primary/10 rounded-2xl animate-in fade-in slide-in-from-right-2">
      <div className="flex-1 grid grid-cols-[1fr,auto,1fr] items-center gap-3">
        <Select
          value={connection.from || undefined}
          onValueChange={(val) => onUpdate({ from: val ?? "" })}
        >
          <SelectTrigger className="h-8 border-none bg-background/50 rounded-lg text-[10px] font-bold">
            <SelectValue placeholder="From..." />
          </SelectTrigger>
          <SelectContent>
            {steps.map((s) => (
              <SelectItem key={s.id} value={s.id} className="text-[10px] font-bold">
                {s.label || "Untitled"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ArrowRight className="h-3 w-3 text-primary/30" />

        <Select
          value={connection.to || undefined}
          onValueChange={(val) => onUpdate({ to: val ?? "" })}
        >
          <SelectTrigger className="h-8 border-none bg-background/50 rounded-lg text-[10px] font-bold">
            <SelectValue placeholder="To..." />
          </SelectTrigger>
          <SelectContent>
            {steps.map((s) => (
              <SelectItem key={s.id} value={s.id} className="text-[10px] font-bold">
                {s.label || "Untitled"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-24">
        <Input
          value={connection.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="Condition..."
          className="h-8 border-none bg-background/50 rounded-lg text-[10px] font-medium"
        />
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-0 group-hover:opacity-100 rounded-lg text-muted-foreground hover:text-destructive transition-all"
        onClick={onRemove}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
