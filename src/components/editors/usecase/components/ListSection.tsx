"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface ListSectionProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  required?: boolean;
}

export function ListSection({
  label,
  items,
  onChange,
  placeholder,
  required,
}: ListSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
          {label} {required && <span className="text-destructive/60">*</span>}
        </Label>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-[10px] font-black uppercase tracking-widest px-2 hover:bg-primary/5 hover:text-primary rounded-lg transition-all"
          onClick={() => onChange([...items, ""])}
        >
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>
      
      <div className="grid gap-2">
        {items.map((item, i) => (
          <div key={i} className="group flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary/30 mt-0.5 shrink-0" />
            <Input
              value={item}
              onChange={(e) => {
                const arr = [...items];
                arr[i] = e.target.value;
                onChange(arr);
              }}
              placeholder={placeholder}
              className="h-8 text-xs bg-background/30 border-border/40 hover:bg-background/50 focus-visible:ring-primary/20 rounded-xl"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        
        {items.length === 0 && (
          <div className="text-[10px] text-muted-foreground/40 italic p-3 border border-dashed border-border/40 rounded-2xl text-center bg-muted/5 font-medium">
            Requirement not defined.{required ? " (Entry required)" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
