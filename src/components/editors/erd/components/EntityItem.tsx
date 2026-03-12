"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Database } from "lucide-react";
import { ERDEntity, ERDAttribute } from "../hooks/useERDLogic";
import { AttributeItem } from "./AttributeItem";

interface EntityItemProps {
  entity: ERDEntity;
  onUpdate: (updates: Partial<ERDEntity>) => void;
  onRemove: () => void;
  onAddAttribute: () => void;
  onUpdateAttribute: (idx: number, updates: Partial<ERDAttribute>) => void;
  onRemoveAttribute: (idx: number) => void;
}

export function EntityItem({
  entity,
  onUpdate,
  onRemove,
  onAddAttribute,
  onUpdateAttribute,
  onRemoveAttribute,
}: EntityItemProps) {
  const formatEntityName = (val: string) =>
    val.replace(/[^a-zA-Z0-9_]/g, "_").toUpperCase();

  return (
    <div className="group flex flex-col gap-6 p-8 bg-card/40 border border-border/40 rounded-[2.5rem] hover:bg-background/80 hover:border-border/60 transition-all duration-500 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-inner">
            <Database className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Entity Name</Label>
            <Input
              value={entity.name}
              onChange={(e) => onUpdate({ name: formatEntityName(e.target.value) })}
              placeholder="E.G. USERS"
              className="h-auto p-0 border-none bg-transparent text-2xl font-black uppercase tracking-tight placeholder:text-muted-foreground/10 focus-visible:ring-0 shadow-none font-mono"
            />
          </div>
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

      {/* Description */}
      <div className="px-1">
        <Input
          value={entity.description || ""}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Describe what this entity represents..."
          className="h-9 border-none bg-primary/5 rounded-xl px-4 text-sm font-medium placeholder:text-muted-foreground/30 shadow-none"
        />
      </div>

      {/* Attributes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Attributes</h4>
          <Button
            size="sm"
            variant="ghost"
            onClick={onAddAttribute}
            className="h-7 rounded-full text-[9px] font-black uppercase tracking-[0.1em] hover:bg-primary/5 hover:text-primary transition-all px-3"
          >
            <Plus className="h-3 w-3 mr-1" /> Add Attribute
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {entity.attributes.map((attr, idx) => (
            <AttributeItem
              key={idx}
              index={idx}
              attribute={attr}
              onUpdate={(updates) => onUpdateAttribute(idx, updates)}
              onRemove={() => onRemoveAttribute(idx)}
            />
          ))}

          {entity.attributes.length === 0 && (
            <div className="py-8 border border-dashed border-border/40 rounded-3xl bg-muted/5 flex flex-col items-center">
              <p className="text-[10px] font-bold text-muted-foreground/20 uppercase tracking-widest">
                No attributes defined
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
