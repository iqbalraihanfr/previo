"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Key, Link, ShieldCheck, HelpCircle } from "lucide-react";
import { DATA_TYPES } from "../constants";
import { ERDAttribute } from "../hooks/useERDLogic";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface AttributeItemProps {
  attribute: ERDAttribute;
  onUpdate: (updates: Partial<ERDAttribute>) => void;
  onRemove: () => void;
  index: number;
}

export function AttributeItem({ 
  attribute, 
  onUpdate, 
  onRemove,
  index 
}: AttributeItemProps) {
  const formatAttrName = (val: string) =>
    val.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();

  return (
    <div className="group relative p-4 bg-background/50 border border-border/40 rounded-2xl hover:bg-background hover:border-border/60 transition-all duration-300 animate-in slide-in-from-left-2">
      <div className="flex flex-col gap-4">
        {/* Header: Name and Type */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-muted-foreground/20 w-4">{index + 1}</span>
          
          <div className="flex-1">
            <Input
              value={attribute.name}
              onChange={(e) => onUpdate({ name: formatAttrName(e.target.value) })}
              placeholder="column_name"
              className="h-9 font-mono text-xs border-none bg-primary/5 focus-visible:ring-1 focus-visible:ring-primary/20 rounded-lg"
            />
          </div>

          <div className="w-32">
            <Select
              value={attribute.type}
              onValueChange={(val) => onUpdate({ type: val })}
            >
              <SelectTrigger className="h-9 text-xs border-none bg-muted/30 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATA_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
            onClick={onRemove}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Constraints Row */}
        <div className="flex flex-wrap gap-2 px-7">
          <ConstraintToggle
            active={attribute.isPrimaryKey}
            onClick={() => onUpdate({ isPrimaryKey: !attribute.isPrimaryKey })}
            label="PK"
            icon={<Key className="h-2.5 w-2.5" />}
            color="amber"
          />
          <ConstraintToggle
            active={attribute.isForeignKey}
            onClick={() => onUpdate({ isForeignKey: !attribute.isForeignKey })}
            label="FK"
            icon={<Link className="h-2.5 w-2.5" />}
            color="blue"
          />
          <ConstraintToggle
            active={attribute.isUnique}
            onClick={() => onUpdate({ isUnique: !attribute.isUnique })}
            label="UQ"
            icon={<ShieldCheck className="h-2.5 w-2.5" />}
            color="emerald"
          />
          <ConstraintToggle
            active={attribute.isRequired}
            onClick={() => onUpdate({ isRequired: !attribute.isRequired })}
            label="REQ"
            color="rose"
          />
          <ConstraintToggle
            active={!attribute.isNullable}
            onClick={() => onUpdate({ isNullable: !attribute.isNullable })}
            label="NN"
            color="indigo"
          />
        </div>

        {/* Description */}
        <div className="px-7">
          <Input
            value={attribute.description || ""}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Attribute description..."
            className="h-7 text-[10px] border-none bg-transparent p-0 text-muted-foreground italic placeholder:text-muted-foreground/20 focus-visible:ring-0 shadow-none"
          />
        </div>
      </div>
    </div>
  );
}

function ConstraintToggle({ 
  active, 
  onClick, 
  label, 
  icon,
  color 
}: { 
  active?: boolean; 
  onClick: () => void; 
  label: string;
  icon?: React.ReactNode;
  color: "amber" | "blue" | "emerald" | "rose" | "indigo";
}) {
  const colors = {
    amber: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    blue: "text-blue-600 bg-blue-500/10 border-blue-500/20",
    emerald: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
    rose: "text-rose-600 bg-rose-500/10 border-rose-500/20",
    indigo: "text-indigo-600 bg-indigo-500/10 border-indigo-500/20",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-md border text-[9px] font-black transition-all",
        active 
          ? colors[color]
          : "text-muted-foreground/40 bg-transparent border-transparent grayscale opacity-50 hover:opacity-100 hover:grayscale-0"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
