"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Hash, Layers, ListChecks, Target, Zap } from "lucide-react";
import { FR_CATEGORIES, NFR_CATEGORIES } from "../constants";
import type { RequirementFieldItem, RequirementType } from "../hooks/useRequirementLogic";

interface RequirementItemProps {
  item: RequirementFieldItem;
  type: RequirementType;
  displayId: string;
  scopeInItems: string[];
  onUpdate: (updates: Partial<RequirementFieldItem>) => void;
  onRemove: () => void;
}

export function RequirementItem({
  item,
  type,
  displayId,
  scopeInItems,
  onUpdate,
  onRemove,
}: RequirementItemProps) {
  const categories = type === "FR" ? FR_CATEGORIES : NFR_CATEGORIES;
  const isCustomCategory = item.category && !categories.includes(item.category);

  return (
    <div className="group relative bg-card/40 backdrop-blur-md border border-border/60 rounded-[2.5rem] p-8 transition-all hover:bg-card/60 hover:shadow-2xl hover:shadow-primary/5">
      {/* Absolute ID Badge */}
      <div className="absolute -left-3 top-8 -rotate-12">
        <span className="bg-primary px-4 py-1.5 rounded-full text-[10px] font-black tracking-tighter text-primary-foreground shadow-lg shadow-primary/20">
          {displayId}
        </span>
      </div>

      {/* Header Actions */}
      <div className="flex justify-end mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-8">
        {/* Description Segment */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground/60">
            <ListChecks className="h-3.5 w-3.5" />
            <Label className="text-[10px] font-bold uppercase tracking-widest">Requirement Definition</Label>
          </div>
          <div className="relative">
            <Textarea
              value={item.description || ""}
              onChange={(e) => onUpdate({ description: e.target.value.slice(0, 300) })}
              placeholder="State the requirement clearly and concisely..."
              className="min-h-[100px] bg-background/50 border-border/40 rounded-2xl hover:bg-background transition-all resize-none py-4 text-sm leading-relaxed"
              maxLength={300}
            />
            <div className="absolute bottom-3 right-4">
              <span className="text-[9px] font-bold text-muted-foreground/30 tabular-nums">
                {(item.description || "").length}/300
              </span>
            </div>
          </div>
        </div>

        {/* Configuration Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground/60">
              <Layers className="h-3.5 w-3.5" />
              <Label className="text-[10px] font-bold uppercase tracking-widest">Classification</Label>
            </div>
            <div className="space-y-3">
              <Select
                value={
                  isCustomCategory
                    ? "__custom__"
                    : typeof item.category === "string"
                      ? item.category
                      : ""
                }
                onValueChange={(val) => {
                  if (val !== "__custom__") onUpdate({ category: val ?? "" });
                }}
              >
                <SelectTrigger className="h-12 bg-background/50 border-border/40 rounded-2xl hover:bg-background transition-all">
                  <SelectValue placeholder="Select classification..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/40 shadow-xl max-h-[300px]">
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="rounded-xl">
                      {cat}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__" className="rounded-xl italic">Custom category...</SelectItem>
                </SelectContent>
              </Select>
              {isCustomCategory && (
                <div className="relative animate-in slide-in-from-top-2 duration-300">
                  <Input
                    value={item.category || ""}
                    onChange={(e) => onUpdate({ category: e.target.value })}
                    placeholder="Enter custom classification..."
                    className="h-10 bg-background/70 border-primary/20 rounded-xl px-4 text-xs italic"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-8 w-8 rounded-lg hover:bg-muted"
                    onClick={() => onUpdate({ category: categories[0] })}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground/40" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Priority Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground/60">
              <Target className="h-3.5 w-3.5" />
              <Label className="text-[10px] font-bold uppercase tracking-widest">Priority (MoSCoW)</Label>
            </div>
            <Select
              value={typeof item.priority === "string" ? item.priority : "Should"}
              onValueChange={(val) =>
                onUpdate({ priority: (val ?? "Should") as RequirementFieldItem["priority"] })
              }
            >
              <SelectTrigger className="h-12 bg-background/50 border-border/40 rounded-2xl hover:bg-background transition-all">
                <SelectValue placeholder="Set priority level..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border/40 shadow-xl">
                <SelectItem value="Must" className="rounded-xl font-bold text-emerald-600 dark:text-emerald-400">Must Have</SelectItem>
                <SelectItem value="Should" className="rounded-xl font-medium text-sky-600 dark:text-sky-400">Should Have</SelectItem>
                <SelectItem value="Could" className="rounded-xl text-amber-600 dark:text-amber-400">Could Have</SelectItem>
                <SelectItem value="Wont" className="rounded-xl text-muted-foreground italic">Won&apos;t Have (This time)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Conditional Sections */}
        {type === "FR" && scopeInItems.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-border/40">
            <div className="flex items-center gap-2 text-muted-foreground/60">
              <Hash className="h-3.5 w-3.5" />
              <Label className="text-[10px] font-bold uppercase tracking-widest">Traceability (Scope Link)</Label>
            </div>
            <Select
              value={typeof item.related_scope === "string" ? item.related_scope : ""}
              onValueChange={(val) =>
                onUpdate({ related_scope: val === "__none__" ? "" : (val ?? "") })
              }
            >
              <SelectTrigger className="h-12 bg-background/50 border-border/40 rounded-2xl hover:bg-background transition-all">
                <SelectValue placeholder="Map to a system scope item..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border/40 shadow-xl">
                <SelectItem value="__none__" className="rounded-xl italic opacity-50">No direct scope link</SelectItem>
                {scopeInItems.map((scope, idx) => (
                  <SelectItem key={idx} value={scope} className="rounded-xl">
                    {scope}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {type === "NFR" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/40">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground/60">
                <Zap className="h-3.5 w-3.5" />
                <Label className="text-[10px] font-bold uppercase tracking-widest">Measure / Metric</Label>
              </div>
              <Input
                value={item.metric || ""}
                onChange={(e) => onUpdate({ metric: e.target.value })}
                placeholder="e.g. Latency, Uptime..."
                className="h-12 bg-background/50 border-border/40 rounded-2xl hover:bg-background transition-all"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground/60">
                <Target className="h-3.5 w-3.5" />
                <Label className="text-[10px] font-bold uppercase tracking-widest">Target Value</Label>
              </div>
              <Input
                value={item.target || ""}
                onChange={(e) => onUpdate({ target: e.target.value })}
                placeholder="e.g. < 200ms, 99.9%..."
                className="h-12 bg-background/50 border-border/40 rounded-2xl hover:bg-background transition-all"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
