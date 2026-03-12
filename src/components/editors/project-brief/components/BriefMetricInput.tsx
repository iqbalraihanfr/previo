"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface MetricPair {
  metric: string;
  target: string;
}

interface BriefMetricInputProps {
  label: string;
  items: MetricPair[];
  onChange: (items: MetricPair[]) => void;
  icon?: React.ReactNode;
}

export function BriefMetricInput({
  label,
  items,
  onChange,
  icon,
}: BriefMetricInputProps) {
  const add = () => onChange([...items, { metric: "", target: "" }]);
  const update = (i: number, field: keyof MetricPair, val: string) => {
    const arr = [...items];
    arr[i] = { ...arr[i], [field]: val };
    onChange(arr);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground/60">
          {icon}
          <Label className="text-[10px] font-bold uppercase tracking-widest">{label}</Label>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={add}
          className="h-8 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-primary/5 hover:text-primary transition-all px-4 shadow-none"
        >
          <Plus className="h-3 w-3 mr-2" /> NEW METRIC
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, i) => (
          <div key={i} className="group relative p-6 bg-card/40 border border-border/40 rounded-[2rem] hover:bg-background/80 hover:border-border/60 transition-all duration-300 animate-in fade-in zoom-in-95">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Metric Name</Label>
                <Input
                  value={item.metric}
                  onChange={(e) => update(i, "metric", e.target.value)}
                  placeholder="e.g. System Performance"
                  className="h-10 bg-background/50 border-none rounded-xl text-sm shadow-none font-medium hover:bg-background transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Target Description</Label>
                <Input
                  value={item.target}
                  onChange={(e) => update(i, "target", e.target.value)}
                  placeholder="e.g. Sub-second response time"
                  className="h-10 bg-background/50 border-none rounded-xl text-sm shadow-none font-medium hover:bg-background transition-all"
                />
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-8 w-8 opacity-0 group-hover:opacity-100 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              onClick={() => remove(i)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="md:col-span-2 py-10 border border-dashed border-border/60 rounded-[3rem] bg-muted/5 flex flex-col items-center">
            <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">
              No metrics defined
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
