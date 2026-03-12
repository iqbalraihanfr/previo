"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ExternalLink } from "lucide-react";

interface ReferencePair {
  name: string;
  url: string;
}

interface BriefReferenceInputProps {
  label: string;
  items: ReferencePair[];
  onChange: (items: ReferencePair[]) => void;
  icon?: React.ReactNode;
}

export function BriefReferenceInput({
  label,
  items,
  onChange,
  icon,
}: BriefReferenceInputProps) {
  const add = () => onChange([...items, { name: "", url: "" }]);
  const update = (i: number, field: keyof ReferencePair, val: string) => {
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
          <Plus className="h-3 w-3 mr-2" /> NEW REFERENCE
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="group flex items-start gap-4 p-5 bg-card/40 border border-border/40 rounded-[2rem] hover:bg-background/80 hover:border-border/60 transition-all duration-300 animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="p-3 bg-primary/5 rounded-2xl text-primary/40 group-hover:text-primary transition-colors">
              <ExternalLink className="h-4 w-4" />
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Input
                  value={item.name}
                  onChange={(e) => update(i, "name", e.target.value)}
                  placeholder="Document Name"
                  className="h-9 border-none bg-background/50 text-sm font-bold shadow-none rounded-xl hover:bg-background transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <Input
                  value={item.url}
                  onChange={(e) => update(i, "url", e.target.value)}
                  placeholder="URL (optional)"
                  className="h-9 border-none bg-background/50 text-xs font-medium text-muted-foreground shadow-none rounded-xl hover:bg-background transition-all"
                />
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="mt-1 h-9 w-9 opacity-0 group-hover:opacity-100 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
              onClick={() => remove(i)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="py-10 border border-dashed border-border/60 rounded-[3rem] bg-muted/5 flex flex-col items-center">
            <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">
              No references added
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
