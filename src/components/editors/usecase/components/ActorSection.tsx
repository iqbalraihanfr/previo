"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ActorSectionProps {
  actors: string[];
  targetUsers: string[];
  onUpdate: (actors: string[]) => void;
}

export function ActorSection({ actors, targetUsers, onUpdate }: ActorSectionProps) {
  const addActor = () => onUpdate([...actors, ""]);
  
  const updateActor = (index: number, val: string) => {
    const arr = [...actors];
    arr[index] = val;
    onUpdate(arr);
  };

  const removeActor = (index: number) =>
    onUpdate(actors.filter((_, i) => i !== index));

  return (
    <div className="space-y-6 rounded-3xl border border-border/60 bg-card/20 p-6 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-xl">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <Label className="text-base font-bold tracking-tight">System Actors</Label>
            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/50">
              Users & External Systems
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={addActor}
          className="rounded-full h-8 text-xs font-bold border-primary/20 hover:bg-primary/5 hover:text-primary transition-all"
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Actor
        </Button>
      </div>

      <div className="space-y-3">
        {targetUsers.length > 0 && actors.length === 0 && (
          <div className="text-xs font-medium text-amber-700 dark:text-amber-400 p-4 border border-amber-500/20 rounded-2xl bg-amber-500/5">
            Tip: Your Project Brief includes target users: <span className="font-bold underline">{targetUsers.join(", ")}</span>. Consider adding them as actors.
          </div>
        )}

        <div className="grid gap-3">
          {actors.map((actor, i) => (
            <div
              key={i}
              className="group flex items-center gap-3 p-3 border border-border/40 rounded-2xl bg-background/40 transition-all hover:bg-card/60 hover:border-primary/20"
            >
              <div className="flex-1 flex gap-3">
                {targetUsers.length > 0 ? (
                  <div className="flex-1 space-y-2">
                    <Select
                      value={actor || ""}
                      onValueChange={(val) =>
                        updateActor(i, val === "__custom__" || !val ? "" : val)
                      }
                    >
                      <SelectTrigger className="h-9 text-sm rounded-xl border-border/60 focus:ring-primary/20">
                        <SelectValue placeholder="Select from target users..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/60">
                        {targetUsers.map((u, idx) => (
                          <SelectItem key={idx} value={u} className="text-sm">
                            {u}
                          </SelectItem>
                        ))}
                        <SelectItem value="__custom__" className="text-sm italic">Custom name...</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {(!targetUsers.includes(actor) || !actor) && (
                      <Input
                        value={actor}
                        onChange={(e) => updateActor(i, e.target.value)}
                        placeholder="Define custom actor role..."
                        className="h-9 text-sm rounded-xl border-border/60 focus-visible:ring-primary/20"
                      />
                    )}
                  </div>
                ) : (
                  <Input
                    value={actor}
                    onChange={(e) => updateActor(i, e.target.value)}
                    placeholder="Role name (e.g. Administrator, API)"
                    className="h-9 text-sm rounded-xl border-border/60 focus-visible:ring-primary/20"
                  />
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                onClick={() => removeActor(i)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {actors.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border/60 rounded-3xl bg-muted/5">
              <p className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest text-center">
                No actors defined
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
