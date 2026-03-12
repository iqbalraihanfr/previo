"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowRightLeft, AlertTriangle } from "lucide-react";
import { ERDRelationship, ERDEntity } from "../hooks/useERDLogic";
import { RELATIONSHIP_TYPES } from "../constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RelationshipItemProps {
  relationship: ERDRelationship;
  entities: ERDEntity[];
  onUpdate: (updates: Partial<ERDRelationship>) => void;
  onRemove: () => void;
}

export function RelationshipItem({
  relationship,
  entities,
  onUpdate,
  onRemove,
}: RelationshipItemProps) {
  const isManyToMany = relationship.type === "many-to-many";

  return (
    <div className="group relative p-6 bg-card/40 border border-border/40 rounded-[2rem] hover:bg-background/80 hover:border-border/60 transition-all duration-300 animate-in fade-in zoom-in-95 shadow-sm">
      <div className="flex flex-col gap-6">
        {/* Core Relationship Row */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/5 rounded-2xl text-primary/40 group-hover:text-primary transition-colors">
            <ArrowRightLeft className="h-4 w-4" />
          </div>

          <div className="flex-1 grid grid-cols-[1fr,auto,1fr] items-center gap-3">
            {/* Entity A */}
            <Select
              value={relationship.from}
              onValueChange={(val) => onUpdate({ from: val })}
            >
              <SelectTrigger className="h-10 border-none bg-background/50 rounded-xl font-bold uppercase tracking-tight font-mono text-xs">
                <SelectValue placeholder="ENTITY A" />
              </SelectTrigger>
              <SelectContent>
                {entities.map((e) => (
                  <option key={e.id} value={e.name}>
                    {e.name || "UNNAMED"}
                  </option>
                ))}
              </SelectContent>
            </Select>

            {/* Type */}
            <Select
              value={relationship.type}
              onValueChange={(val) => onUpdate({ type: val as any })}
            >
              <SelectTrigger className="h-9 w-24 border-none bg-primary/10 text-primary font-black text-[10px] rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-xs font-bold">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Entity B */}
            <Select
              value={relationship.to}
              onValueChange={(val) => onUpdate({ to: val })}
            >
              <SelectTrigger className="h-10 border-none bg-background/50 rounded-xl font-bold uppercase tracking-tight font-mono text-xs">
                <SelectValue placeholder="ENTITY B" />
              </SelectTrigger>
              <SelectContent>
                {entities.map((e) => (
                  <option key={e.id} value={e.name}>
                    {e.name || "UNNAMED"}
                  </option>
                ))}
              </SelectContent>
            </Select>
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

        {/* Label and Junction Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-1">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Relationship Label</label>
            <Input
              value={relationship.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="e.g. places orders, belongs to..."
              className="h-10 bg-primary/5 border-none rounded-xl text-sm italic font-medium"
            />
          </div>

          {isManyToMany && (
            <div className="space-y-2 animate-in slide-in-from-right-4">
              <div className="flex items-center gap-2 ml-1">
                <AlertTriangle className="h-3 w-3 text-amber-500/60" />
                <label className="text-[9px] font-black uppercase tracking-widest text-amber-600/60">Junction Table</label>
              </div>
              <Input
                value={relationship.junction_table || (relationship.from && relationship.to ? `${relationship.from}_${relationship.to}` : "")}
                onChange={(e) => onUpdate({ junction_table: e.target.value })}
                placeholder="junction_table_name"
                className="h-10 bg-amber-500/5 border border-amber-500/10 rounded-xl text-sm font-mono uppercase text-amber-700 dark:text-amber-400"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
