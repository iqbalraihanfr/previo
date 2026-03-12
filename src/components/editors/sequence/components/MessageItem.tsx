"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2, MessageSquare, ArrowRight, Layers } from "lucide-react";
import { Message } from "../hooks/useSequenceLogic";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface MessageItemProps {
  message: Message;
  participants: string[];
  onUpdate: (updates: Partial<Message>) => void;
  onRemove: () => void;
  index: number;
}

const MESSAGE_TYPES = ["request", "response", "self"] as const;
const GROUP_TYPES = ["none", "alt", "opt", "loop"] as const;

export function MessageItem({
  message,
  participants,
  onUpdate,
  onRemove,
  index,
}: MessageItemProps) {
  const isGrouped = message.group && message.group !== "none";

  return (
    <div className="group relative p-6 bg-card/40 border border-border/40 rounded-[2rem] hover:bg-background/80 hover:border-border/60 transition-all duration-300 animate-in fade-in zoom-in-95 shadow-sm">
      <div className="flex flex-col gap-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-primary p-1.5 bg-primary/10 rounded-lg">STEP {index + 1}</span>
            {isGrouped && (
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 px-2 py-0.5 bg-amber-500/10 rounded-full border border-amber-500/20">
                {message.group}
              </span>
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

        {/* Interaction row */}
        <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-4">
          <Select
            value={message.from}
            onValueChange={(val) => onUpdate({ from: val })}
          >
            <SelectTrigger className="h-10 border-none bg-background/50 rounded-xl font-bold text-xs">
              <SelectValue placeholder="FROM..." />
            </SelectTrigger>
            <SelectContent>
              {participants.map((p) => (
                <SelectItem key={p} value={p} className="text-xs font-bold">
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ArrowRight className="h-4 w-4 text-muted-foreground/30" />

          <Select
            value={message.to}
            onValueChange={(val) => onUpdate({ to: val })}
          >
            <SelectTrigger className="h-10 border-none bg-background/50 rounded-xl font-bold text-xs">
              <SelectValue placeholder="TO..." />
            </SelectTrigger>
            <SelectContent>
              {participants.map((p) => (
                <SelectItem key={p} value={p} className="text-xs font-bold">
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action Content */}
        <div className="space-y-4">
          <div className="space-y-1.5 px-1">
            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Message Detail</Label>
            <Input
              value={message.content}
              onChange={(e) => onUpdate({ content: e.target.value })}
              placeholder="e.g. GET /api/v1/users, returns access_token..."
              className="h-10 bg-primary/5 border-none rounded-xl text-sm font-medium shadow-none hover:bg-primary/10 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 px-1">
              <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Message Type</Label>
              <div className="flex gap-2">
                {MESSAGE_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => onUpdate({ type: t })}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                      message.type === t
                        ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                        : "bg-background/50 text-muted-foreground/60 border-border/40 hover:bg-background"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 px-1">
              <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Logic Grouping</Label>
              <Select
                value={message.group || "none"}
                onValueChange={(val) => onUpdate({ group: val as any })}
              >
                <SelectTrigger className="h-9 border-none bg-muted/30 rounded-xl text-[10px] font-black uppercase tracking-widest">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-[10px] font-black uppercase tracking-widest">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isGrouped && (
            <div className="px-1 animate-in slide-in-from-bottom-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Condition Label</Label>
              <Input
                value={message.group_label || ""}
                onChange={(e) => onUpdate({ group_label: e.target.value })}
                placeholder="e.g. If user is authenticated, while results are available..."
                className="h-9 bg-amber-500/5 border border-amber-500/10 rounded-xl text-xs font-medium italic"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
