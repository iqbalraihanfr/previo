"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ListChecks } from "lucide-react";
import { EditorProps } from "./ProjectBriefEditor";

import { useRequirementLogic } from "./requirement/hooks/useRequirementLogic";
import { RequirementItem } from "./requirement/components/RequirementItem";
import { RequirementValidationHeader } from "./requirement/components/RequirementValidationHeader";

export function RequirementEditor({
  fields,
  onChange,
  projectId,
}: EditorProps) {
  const [activeTab, setActiveTab] = useState<"FR" | "NFR">("FR");
  
  const {
    items,
    frItems,
    nfrItems,
    scopeInItems,
    addItem,
    updateItem,
    removeItem,
  } = useRequirementLogic(projectId!, fields, onChange);

  const activeItems = items.filter((i: any) => (i.type || "FR") === activeTab);
  const hasMust = items.some((i: any) => i.priority === "Must");

  const getDisplayId = (item: any) => {
    if ((item.type || "FR") === "FR") {
      const idx = frItems.findIndex((i: any) => i.id === item.id);
      return `FR-${String(idx + 1).padStart(3, "0")}`;
    }
    const idx = nfrItems.findIndex((i: any) => i.id === item.id);
    return `NFR-${String(idx + 1).padStart(3, "0")}`;
  };

  return (
    <div className="workspace-scroll flex-1 overflow-y-auto px-8 py-10 w-full bg-card/5">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header Segment */}
        <div className="space-y-4 border-b border-border/70 pb-10">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-readable-2xs font-bold uppercase tracking-widest text-primary">
              System Specification
            </span>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-readable-2xs font-bold uppercase tracking-widest text-accent-foreground/70">
              Requirements
            </span>
          </div>
          <div>
            <h2 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground">
              <ListChecks className="h-6 w-6 text-primary" />
              Functional Blueprint
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-xl">
              Document what the system must do (FR) and how it must perform (NFR). These constraints define the boundaries for all downstream architecture.
            </p>
          </div>
        </div>

        {/* Validation Header */}
        <RequirementValidationHeader
          frCount={frItems.length}
          nfrCount={nfrItems.length}
          hasMust={hasMust}
        />

        {/* Requirements Workspace */}
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <Tabs 
              value={activeTab} 
              onValueChange={(v) => setActiveTab(v as any)}
              className="w-full md:w-auto"
            >
              <TabsList className="h-12 bg-muted/50 p-1.5 rounded-2xl shadow-sm inline-flex">
                <TabsTrigger 
                  value="FR" 
                  className="rounded-xl px-6 text-xs font-bold uppercase tracking-widest data-[state=active]:bg-background transition-all"
                >
                  Functional
                </TabsTrigger>
                <TabsTrigger 
                  value="NFR" 
                  className="rounded-xl px-6 text-xs font-bold uppercase tracking-widest data-[state=active]:bg-background transition-all"
                >
                  Quality Attributes
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button
              size="sm"
              onClick={() => addItem(activeTab)}
              className="rounded-full h-10 font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-105 active:scale-95 transition-all px-8 shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" /> New Requirement
            </Button>
          </div>

          <div className="space-y-12 pb-20">
            {activeItems.map((item: any, idx: number) => (
              <RequirementItem
                key={item.id}
                item={item}
                index={idx}
                type={activeTab}
                displayId={getDisplayId(item)}
                scopeInItems={scopeInItems}
                onUpdate={(updates) => updateItem(item.id, updates)}
                onRemove={() => removeItem(item.id)}
              />
            ))}

            {activeItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border/60 rounded-[3rem] bg-muted/5">
                <div className="bg-primary/5 p-4 rounded-full mb-4">
                  <ListChecks className="h-8 w-8 text-primary/20" />
                </div>
                <h3 className="text-sm font-bold text-foreground/40 uppercase tracking-widest">
                  No {activeTab} defined
                </h3>
                <p className="mt-2 text-[10px] font-medium text-muted-foreground/30 px-6 text-center">
                  Define your initial system boundaries by adding a {activeTab === "FR" ? "functional capability" : "performance metric"}.
                </p>
                <Button
                  variant="link"
                  className="mt-4 text-xs font-bold text-primary/60 hover:text-primary"
                  onClick={() => addItem(activeTab)}
                >
                  Create initial requirement
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
