"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, Users, Target, ShieldCheck, Link2 } from "lucide-react";
import { AcceptanceCriteriaSection } from "./AcceptanceCriteriaSection";
import type { RequirementFieldItem } from "../../requirement/hooks/useRequirementLogic";
import type { UserStoryFieldItem } from "../hooks/useUserStoryLogic";

interface UserStoryItemProps {
  item: UserStoryFieldItem;
  index: number;
  targetUsers: string[];
  frItems: RequirementFieldItem[];
  autoPriority: string | null;
  onUpdate: (updates: Partial<UserStoryFieldItem>) => void;
  onRemove: () => void;
  onAddCriteria: () => void;
  onUpdateCriteria: (idx: number, key: "given" | "when" | "then", val: string) => void;
  onRemoveCriteria: (idx: number) => void;
}

export function UserStoryItem({
  item,
  index,
  targetUsers,
  frItems,
  autoPriority,
  onUpdate,
  onRemove,
  onAddCriteria,
  onUpdateCriteria,
  onRemoveCriteria,
}: UserStoryItemProps) {
  const displayId = `US-${String(index + 1).padStart(3, "0")}`;

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
        <div className="flex items-center gap-2">
          {autoPriority && (
            <span className="px-3 py-1 bg-muted/50 rounded-full text-[9px] font-bold uppercase tracking-widest text-muted-foreground border border-border/40">
              Auto-Priority: {autoPriority}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-10">
        {/* Core Narrative */}
        <div className="grid gap-8">
          {/* Persona */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground/60">
              <Users className="h-3.5 w-3.5" />
              <Label className="text-[10px] font-bold uppercase tracking-widest">Target Persona</Label>
            </div>
            {targetUsers.length > 0 ? (
              <Select
                value={typeof item.role === "string" ? item.role : ""}
                onValueChange={(val) => onUpdate({ role: val === "__none__" ? "" : (val ?? "") })}
              >
                <SelectTrigger className="h-12 bg-background/50 border-border/40 rounded-2xl hover:bg-background transition-all">
                  <SelectValue placeholder="Identify the user role..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/40 shadow-xl">
                  <SelectItem value="__none__" className="rounded-xl">None selected</SelectItem>
                  {targetUsers.map((user, idx) => (
                    <SelectItem key={idx} value={user} className="rounded-xl">
                      {user}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={item.role || ""}
                onChange={(e) => onUpdate({ role: e.target.value })}
                placeholder="e.g. System Administrator..."
                className="h-12 bg-background/50 border-border/40 rounded-2xl hover:bg-background transition-all"
              />
            )}
          </div>

          {/* Goal & Benefit */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground/60">
                <Target className="h-3.5 w-3.5" />
                <Label className="text-[10px] font-bold uppercase tracking-widest">The &quot;What&quot; (Goal)</Label>
              </div>
              <Input
                value={item.goal || ""}
                onChange={(e) => onUpdate({ goal: e.target.value })}
                placeholder="I want to..."
                className="h-12 bg-background/50 border-border/40 rounded-2xl hover:bg-background transition-all"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground/60">
                <ShieldCheck className="h-3.5 w-3.5" />
                <Label className="text-[10px] font-bold uppercase tracking-widest">The &quot;Why&quot; (Value)</Label>
              </div>
              <Input
                value={item.benefit || ""}
                onChange={(e) => onUpdate({ benefit: e.target.value })}
                placeholder="So that..."
                className="h-12 bg-background/50 border-border/40 rounded-2xl hover:bg-background transition-all"
              />
            </div>
          </div>

          {/* Traceability */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground/60">
              <Link2 className="h-3.5 w-3.5" />
              <Label className="text-[10px] font-bold uppercase tracking-widest">Requirement Link</Label>
            </div>
            {frItems.length > 0 ? (
              <Select
                value={
                  typeof item.related_requirement === "string"
                    ? item.related_requirement
                    : ""
                }
                onValueChange={(val) =>
                  onUpdate({
                    related_requirement: val === "__none__" ? "" : (val ?? ""),
                  })
                }
              >
                <SelectTrigger className="h-12 bg-background/50 border-border/40 rounded-2xl hover:bg-background transition-all">
                  <SelectValue placeholder="Link to functional requirement..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/40 shadow-xl max-w-[400px]">
                  <SelectItem value="__none__" className="rounded-xl italic opacity-50 text-xs">Unlinked</SelectItem>
                  {frItems.map((fr, idx: number) => {
                    const frId = `FR-${String(idx + 1).padStart(3, "0")}`;
                    return (
                      <SelectItem key={fr.id} value={fr.id} className="rounded-xl py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-black text-primary">{frId}</span>
                          <span className="text-xs truncate max-w-[320px]">{fr.description || "No description"}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            ) : (
              <div className="p-4 border border-dashed border-border/60 rounded-2xl bg-muted/5 text-center">
                <p className="text-[10px] font-medium text-muted-foreground italic">
                  No Functional Requirements available for linking
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Acceptance Criteria */}
        <div className="space-y-6 pt-6 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-xs font-bold tracking-tight">Acceptance Criteria</h4>
              <p className="text-[9px] uppercase font-black tracking-[0.2em] text-muted-foreground/40">Verification Protocol</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={onAddCriteria}
              className="h-8 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-primary/5 hover:text-primary border-primary/20 transition-all px-4"
            >
              <Plus className="h-3 w-3 mr-2" /> Add Criteria
            </Button>
          </div>

          <AcceptanceCriteriaSection
            criteria={item.acceptance_criteria || []}
            onUpdate={onUpdateCriteria}
            onRemove={onRemoveCriteria}
          />
        </div>
      </div>
    </div>
  );
}
