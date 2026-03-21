"use client";

import { Button } from "@/components/ui/button";
import { Plus, Users2 } from "lucide-react";
import type { StructuredEditorProps } from "./editorTypes";

import {
  useUserStoryLogic,
  type UserStoryFields,
  type UserStoryFieldItem,
} from "./userstory/hooks/useUserStoryLogic";
import { UserStoryItem } from "./userstory/components/UserStoryItem";

type UserStoryEditorProps = StructuredEditorProps<UserStoryFields>;

export function UserStoryEditor({
  fields,
  onChange,
  projectId,
}: UserStoryEditorProps) {
  const {
    items,
    targetUsers,
    frItems,
    addItem,
    updateItem,
    removeItem,
    addCriteria,
    updateCriteria,
    removeCriteria,
    getAutoPriority,
  } = useUserStoryLogic(projectId, fields, onChange);

  return (
    <div className="workspace-scroll flex-1 overflow-y-auto px-8 py-10 w-full bg-card/5">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header Segment */}
        <div className="space-y-4 border-b border-border/70 pb-10" id="user-stories-overview">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-readable-2xs font-bold uppercase tracking-widest text-primary">
              Narrative Model
            </span>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-readable-2xs font-bold uppercase tracking-widest text-accent-foreground/70">
              User Centricity
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground">
                <Users2 className="h-6 w-6 text-primary" />
                User Stories
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-xl">
                Define value-driven narratives from the persona&apos;s perspective. Link stories to requirements for full functional traceability.
              </p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between" id="user-stories-registry">
          <div className="space-y-1">
            <h3 className="text-sm font-bold tracking-tight">Narrative Registry</h3>
            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/50">
              {items.length} Stories defined
            </p>
          </div>
          <Button
            size="sm"
            onClick={addItem}
            className="rounded-full h-9 font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-105 active:scale-95 transition-all px-6"
          >
            <Plus className="h-4 w-4 mr-2" /> New Story
          </Button>
        </div>

        {/* User Stories List */}
        <div className="space-y-16 pb-20">
          {items.map((item: UserStoryFieldItem, itemIdx: number) => (
            <UserStoryItem
              key={item.id}
              item={item}
              index={itemIdx}
              targetUsers={targetUsers}
              frItems={frItems}
              autoPriority={getAutoPriority(item)}
              onUpdate={(updates) => updateItem(item.id, updates)}
              onRemove={() => removeItem(item.id)}
              onAddCriteria={() => addCriteria(item.id)}
              onUpdateCriteria={(idx, key, val) => updateCriteria(item.id, idx, key, val)}
              onRemoveCriteria={(idx) => removeCriteria(item.id, idx)}
            />
          ))}

          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-border/60 rounded-[3rem] bg-muted/5">
              <div className="bg-primary/5 p-6 rounded-full mb-6">
                <Users2 className="h-10 w-10 text-primary/20" />
              </div>
              <h3 className="text-sm font-bold text-foreground/40 uppercase tracking-widest">
                No Narratives Yet
              </h3>
              <p className="mt-2 text-[10px] font-medium text-muted-foreground/30 px-6 text-center max-w-[280px]">
                Start capturing user needs by creating your first persona-focused story.
              </p>
              <Button
                variant="link"
                className="mt-6 text-xs font-bold text-primary/60 hover:text-primary transition-colors"
                onClick={addItem}
              >
                Create initial story
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
