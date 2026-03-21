"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, User, Cpu, Server, Database, Globe } from "lucide-react";
import { Participant } from "../hooks/useSequenceLogic";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ParticipantItemProps {
  participant: Participant;
  onUpdate: (updates: Partial<Participant>) => void;
  onRemove: () => void;
  index: number;
}

const TYPE_ICONS = {
  actor: <User className="h-4 w-4" />,
  component: <Cpu className="h-4 w-4" />,
  service: <Server className="h-4 w-4" />,
  database: <Database className="h-4 w-4" />,
  external: <Globe className="h-4 w-4" />,
};

export function ParticipantItem({
  participant,
  onUpdate,
  onRemove,
  index,
}: ParticipantItemProps) {
  return (
    <div className="group flex items-center gap-4 p-4 bg-card/40 border border-border/40 rounded-2xl hover:bg-background/80 hover:border-border/60 transition-all duration-300 animate-in slide-in-from-left-2">
      <span className="text-[10px] font-black text-muted-foreground/20 w-4">{index + 1}</span>
      
      <div className="w-40">
        <Select
          value={participant.type}
          onValueChange={(val) => onUpdate({ type: val as Participant["type"] })}
        >
          <SelectTrigger className="h-10 border-none bg-primary/5 rounded-xl font-bold uppercase tracking-widest text-[10px]">
            <div className="flex items-center gap-2">
              <span className="opacity-40">{TYPE_ICONS[participant.type as keyof typeof TYPE_ICONS]}</span>
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TYPE_ICONS).map(([type, icon]) => (
              <SelectItem key={type} value={type} className="text-[10px] font-black uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  {icon}
                  {type}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1">
        <Input
          value={participant.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="System or Actor name..."
          className="h-10 border-none bg-background/50 rounded-xl text-sm font-bold shadow-none hover:bg-background transition-all"
        />
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 opacity-0 group-hover:opacity-100 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
        onClick={onRemove}
      >
        <Trash2 className="h-5 w-5" />
      </Button>
    </div>
  );
}
