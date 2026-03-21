"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Milestone, GitPullRequest, Link2 } from "lucide-react";
import { ListSection } from "./ListSection";
import type { UserStoryFieldItem } from "../../userstory/hooks/useUserStoryLogic";
import type {
  UseCaseAlternativeFlow,
  UseCaseFlowStep,
  UseCaseItemData,
} from "../hooks/useUseCaseLogic";

interface UseCaseItemProps {
  useCase: UseCaseItemData;
  index: number;
  actors: string[];
  userStories: UserStoryFieldItem[];
  onUpdate: (updates: Partial<UseCaseItemData>) => void;
  onRemove: () => void;
}

export function UseCaseItem({
  useCase: uc,
  index,
  actors,
  userStories,
  onUpdate,
  onRemove,
}: UseCaseItemProps) {
  const getUcDisplayId = (idx: number) =>
    `UC-${String(idx + 1).padStart(3, "0")}`;
  const getUsDisplayId = (idx: number) =>
    `US-${String(idx + 1).padStart(3, "0")}`;

  return (
    <div className="group relative flex flex-col gap-8 p-8 border border-border/60 rounded-[2.5rem] bg-card/20 backdrop-blur-md shadow-sm hover:shadow-md transition-all hover:bg-card/30">
      {/* Absolute Badge for Display ID */}
      <div className="absolute -top-3 left-8 flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/25 border border-primary-foreground/20">
        <Milestone className="h-3.5 w-3.5" />
        {getUcDisplayId(index)}
      </div>

      <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-2xl"
          onClick={onRemove}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Primary Info Segment */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-bold tracking-tight px-1">
              Title <span className="text-destructive/60">*</span>
            </Label>
            <Input
              value={uc.name || ""}
              onChange={(e) => onUpdate({ name: e.target.value.slice(0, 100) })}
              placeholder="Verb + Object (e.g. Authenticate User)"
              className="h-11 text-base font-medium rounded-2xl border-border/60 bg-background/50 focus-visible:ring-primary/20"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">
              Operational Scope <span className="text-destructive/60">*</span>
            </Label>
            <Textarea
              value={uc.description || ""}
              onChange={(e) => onUpdate({ description: e.target.value.slice(0, 200) })}
              placeholder="Describe the high-level intent and scope of this interaction..."
              className="min-h-[100px] text-sm leading-relaxed rounded-2xl border-border/60 bg-background/50 focus-visible:ring-primary/20 resize-none"
              maxLength={200}
            />
          </div>
        </div>

        <div className="flex flex-col gap-6 p-6 rounded-3xl bg-muted/20 border border-border/40">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                Primary Actor
              </Label>
              <select
                value={uc.primary_actor || ""}
                onChange={(e) => onUpdate({ primary_actor: e.target.value })}
                className="w-full h-10 text-xs font-bold border-border/60 rounded-xl bg-background/50 px-3 hover:bg-background transition-colors outline-none focus:ring-1 focus:ring-primary/20"
              >
                <option value="">Select Primary...</option>
                {actors.filter(Boolean).map((act: string, idx: number) => (
                  <option key={idx} value={act}>{act}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                Secondary Actors
              </Label>
              <div className="flex flex-wrap gap-2">
                {actors
                  .filter(Boolean)
                  .filter((a: string) => a !== uc.primary_actor)
                  .map((act: string, idx: number) => {
                    const selected = (uc.secondary_actors || []).includes(act);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const curr = uc.secondary_actors || [];
                          const updated = selected
                            ? curr.filter((a: string) => a !== act)
                            : [...curr, act];
                          onUpdate({ secondary_actors: updated });
                        }}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-all ${
                          selected
                            ? "bg-primary/20 text-primary border-primary/40 shadow-sm"
                            : "bg-background/40 text-muted-foreground border-border/40 hover:border-primary/20 hover:text-foreground"
                        }`}
                      >
                        {act}
                      </button>
                    );
                  })}
                {actors.filter(Boolean).filter((a: string) => a !== uc.primary_actor).length === 0 && (
                  <p className="text-[10px] italic text-muted-foreground/40 leading-tight">No alternative actors defined.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conditions Split Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-4 border-t border-border/30">
        <ListSection
          label="Initialization Requirements"
          items={uc.preconditions || []}
          onChange={(items) => onUpdate({ preconditions: items })}
          placeholder="What must be true before ignition?"
          required
        />
        <ListSection
          label="Outcome Objectives"
          items={uc.postconditions || []}
          onChange={(items) => onUpdate({ postconditions: items })}
          placeholder="What is the guaranteed success state?"
          required
        />
      </div>

      {/* Main Flow Segment */}
      <div className="space-y-6 pt-6 border-t border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitPullRequest className="h-4 w-4 text-primary/60" />
            <Label className="text-sm font-bold tracking-tight">Standard Sequence</Label>
            <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest ml-2">(min 3 steps)</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-[10px] font-black uppercase tracking-widest px-3 hover:bg-primary/5 hover:text-primary rounded-xl"
            onClick={() => {
              const flow = uc.main_flow || [];
              onUpdate({ main_flow: [...flow, { actor: "", action: "" }] });
            }}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Phase
          </Button>
        </div>

        <div className="grid gap-3">
          {(uc.main_flow || []).map((step: UseCaseFlowStep, stepIdx: number) => (
            <div
              key={stepIdx}
              className="group/step flex items-start gap-3 p-3 rounded-[1.25rem] bg-muted/20 border border-border/40 hover:bg-background/40 hover:border-primary/20 transition-all"
            >
              <div className="mt-2.5 h-6 w-6 flex items-center justify-center rounded-lg bg-background border border-border/60 text-[10px] font-black font-mono text-muted-foreground/60 shrink-0">
                {stepIdx + 1}
              </div>
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-[140px_1fr] gap-3">
                <select
                  value={step.actor || ""}
                  onChange={(e) => {
                    const flow = [...(uc.main_flow || [])];
                    flow[stepIdx] = { ...flow[stepIdx], actor: e.target.value };
                    onUpdate({ main_flow: flow });
                  }}
                  className="h-10 text-xs font-bold border-border/60 rounded-xl bg-background/50 px-3 outline-none hover:bg-background focus:ring-1 focus:ring-primary/20"
                >
                  <option value="">Select Entity</option>
                  {[uc.primary_actor, ...(uc.secondary_actors || []), "System"]
                    .filter(Boolean)
                    .map((a: string, i: number) => (
                      <option key={i} value={a}>{a}</option>
                    ))}
                </select>
                <Input
                  value={step.action || ""}
                  onChange={(e) => {
                    const flow = [...(uc.main_flow || [])];
                    flow[stepIdx] = { ...flow[stepIdx], action: e.target.value };
                    onUpdate({ main_flow: flow });
                  }}
                  placeholder="Describe interaction or process phase..."
                  className="h-10 text-xs font-medium bg-background/50 border-border/60 rounded-xl hover:bg-background focus-visible:ring-primary/20"
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-muted-foreground/20 hover:text-destructive hover:bg-destructive/10 rounded-xl shrink-0 opacity-0 group-hover/step:opacity-100 transition-all"
                onClick={() => {
                  const flow = (uc.main_flow || []).filter((_, i: number) => i !== stepIdx);
                  onUpdate({ main_flow: flow });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {(uc.main_flow || []).length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border/40 rounded-[2rem] bg-muted/5">
              <p className="text-xs font-bold text-muted-foreground/30 uppercase tracking-[0.2em]">Flow structure undefined</p>
            </div>
          )}
        </div>
      </div>

      {/* Integration Links Segment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-6 border-t border-border/30">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary/60" />
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Logic Dependencies (User Stories)</Label>
            <span className="text-destructive/60">*</span>
          </div>
          {userStories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {userStories.map((us, usIdx: number) => {
                if (!us.goal) return null;
                const selected = (uc.related_user_stories || []).includes(us.id);
                return (
                  <button
                    key={us.id}
                    type="button"
                    onClick={() => {
                      const curr = uc.related_user_stories || [];
                      const updated = selected
                        ? curr.filter((id: string) => id !== us.id)
                        : [...curr, us.id];
                      onUpdate({ related_user_stories: updated });
                    }}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-all ${
                      selected
                        ? "bg-primary/10 text-primary border-primary/30 shadow-sm"
                        : "bg-background/40 text-muted-foreground border-border/40 hover:border-primary/20 hover:text-foreground"
                    }`}
                  >
                    <span className="opacity-50 mr-1">{getUsDisplayId(usIdx)}:</span> {(us.goal || "").slice(0, 30)}...
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground/40 italic p-3 border border-dashed border-border/40 rounded-2xl text-center">No mapped requirements found.</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">System Exceptions (Alt Flows)</Label>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-[10px] font-black uppercase tracking-widest px-2 hover:bg-primary/5 rounded-lg"
              onClick={() => {
                const alt = uc.alternative_flows || [];
                onUpdate({ alternative_flows: [...alt, { name: "", branch_from_step: "", steps: "" }] });
              }}
            >
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </div>
          <div className="grid gap-3">
            {(uc.alternative_flows || []).map((af: UseCaseAlternativeFlow, afIdx: number) => (
              <div key={afIdx} className="p-4 rounded-2xl border border-border/40 bg-muted/20 hover:bg-background/40 transition-all space-y-3">
                <div className="flex items-center gap-3">
                  <Input
                    value={af.name || ""}
                    onChange={(e) => {
                      const alt = [...(uc.alternative_flows || [])];
                      alt[afIdx] = { ...alt[afIdx], name: e.target.value };
                      onUpdate({ alternative_flows: alt });
                    }}
                    placeholder="Flow identity (e.g. Connection Error)"
                    className="h-8 text-xs font-bold bg-background/50 border-border/60 rounded-xl"
                  />
                  <Input
                    value={af.branch_from_step || ""}
                    onChange={(e) => {
                      const alt = [...(uc.alternative_flows || [])];
                      alt[afIdx] = { ...alt[afIdx], branch_from_step: e.target.value };
                      onUpdate({ alternative_flows: alt });
                    }}
                    placeholder="Step #"
                    className="h-8 text-xs w-20 text-center font-bold bg-background/50 border-border/60 rounded-xl"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 rounded-xl shrink-0"
                    onClick={() => {
                      const alt = (uc.alternative_flows || []).filter((_, i: number) => i !== afIdx);
                      onUpdate({ alternative_flows: alt });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  value={af.steps || ""}
                  onChange={(e) => {
                    const alt = [...(uc.alternative_flows || [])];
                    alt[afIdx] = { ...alt[afIdx], steps: e.target.value };
                    onUpdate({ alternative_flows: alt });
                  }}
                  placeholder="Detailed exception handling steps..."
                  className="min-h-[60px] text-xs leading-relaxed bg-background/50 border-border/60 rounded-xl resize-none"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
