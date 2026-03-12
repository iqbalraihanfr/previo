"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface AcceptanceCriteriaProps {
  storyId: string;
  criteria: any[];
  onUpdate: (idx: number, key: "given" | "when" | "then", val: string) => void;
  onRemove: (idx: number) => void;
}

export function AcceptanceCriteriaSection({
  storyId,
  criteria,
  onUpdate,
  onRemove,
}: AcceptanceCriteriaProps) {
  return (
    <div className="space-y-4">
      {criteria.map((ac, idx) => {
        const isStructured = typeof ac === "object" && ac !== null;
        return (
          <div
            key={idx}
            className="group relative bg-muted/20 hover:bg-muted/30 border border-border/50 rounded-2xl p-5 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                Criteria {String(idx + 1).padStart(2, "0")}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onRemove(idx)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-[80px_1fr] items-center gap-4">
                <span className="text-[10px] font-black tracking-widest text-emerald-500/70 text-right uppercase">
                  Given
                </span>
                <Input
                  value={isStructured ? ac.given || "" : ac || ""}
                  onChange={(e) => onUpdate(idx, "given", e.target.value)}
                  placeholder="Pre-conditions or current state..."
                  className="h-9 text-xs bg-background/50 border-border/40 hover:border-emerald-500/30 focus:border-emerald-500/50 transition-all rounded-xl shadow-none"
                />
              </div>

              <div className="grid grid-cols-[80px_1fr] items-center gap-4">
                <span className="text-[10px] font-black tracking-widest text-sky-500/70 text-right uppercase">
                  When
                </span>
                <Input
                  value={isStructured ? ac.when || "" : ""}
                  onChange={(e) => onUpdate(idx, "when", e.target.value)}
                  placeholder="Action or event triggered..."
                  className="h-9 text-xs bg-background/50 border-border/40 hover:border-sky-500/30 focus:border-sky-500/50 transition-all rounded-xl shadow-none"
                />
              </div>

              <div className="grid grid-cols-[80px_1fr] items-center gap-4">
                <span className="text-[10px] font-black tracking-widest text-indigo-500/70 text-right uppercase">
                  Then
                </span>
                <Input
                  value={isStructured ? ac.then || "" : ""}
                  onChange={(e) => onUpdate(idx, "then", e.target.value)}
                  placeholder="Expected outcome or system response..."
                  className="h-9 text-xs bg-background/50 border-border/40 hover:border-indigo-500/30 focus:border-indigo-500/50 transition-all rounded-xl shadow-none"
                />
              </div>
            </div>
          </div>
        );
      })}

      {criteria.length === 0 && (
        <div className="py-8 border border-dashed border-border/60 rounded-2xl bg-muted/5 flex flex-col items-center">
          <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">
            No verification criteria defined
          </p>
        </div>
      )}
    </div>
  );
}
