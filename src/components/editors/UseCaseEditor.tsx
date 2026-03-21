"use client";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Workflow } from "lucide-react";
import type { StructuredEditorProps } from "./editorTypes";

import {
  useUseCaseLogic,
  type UseCaseFields,
  type UseCaseItemData,
} from "./usecase/hooks/useUseCaseLogic";
import { ActorSection } from "./usecase/components/ActorSection";
import { UseCaseItem } from "./usecase/components/UseCaseItem";

type UseCaseEditorProps = StructuredEditorProps<UseCaseFields>;

export function UseCaseEditor({
  fields,
  onChange,
  projectId,
}: UseCaseEditorProps) {
  const {
    targetUsers,
    actors,
    useCases,
    userStories,
    updateActors,
    addUseCase,
    updateUseCase,
    removeUseCase,
  } = useUseCaseLogic(projectId, fields, onChange);

  return (
    <div className="workspace-scroll flex-1 overflow-y-auto px-8 py-10 w-full bg-card/5">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header Segment */}
        <div className="space-y-4 border-b border-border/70 pb-10">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-readable-2xs font-bold uppercase tracking-widest text-primary">
              Behavioral Model
            </span>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-readable-2xs font-bold uppercase tracking-widest text-accent-foreground/70">
              User Interactions
            </span>
          </div>
          <div>
            <h2 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground">
              <Workflow className="h-6 w-6 text-primary" />
              Use Case Blueprint
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-xl">
              Define system actors and their interaction sequences. These flows form the functional backbone of architectural requirements.
            </p>
          </div>
        </div>

        {/* Actors Configuration */}
        <div id="use-cases-actors">
          <ActorSection
            actors={actors}
            targetUsers={targetUsers}
            onUpdate={updateActors}
          />
        </div>

        {/* Use Cases Grid */}
        <div className="space-y-8" id="use-cases-protocols">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-bold tracking-tight">Interaction Protocols</Label>
              <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/50">
                Detailed Use Case Specifications
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={addUseCase}
              className="rounded-full h-8 text-xs font-bold border-primary/20 hover:bg-primary/5 hover:text-primary transition-all px-4"
            >
              <Plus className="h-3.5 w-3.5 mr-2" /> New Use Case
            </Button>
          </div>

          <div className="space-y-12">
            {useCases.map((uc: UseCaseItemData, ucIdx: number) => (
              <UseCaseItem
                key={uc.id}
                useCase={uc}
                index={ucIdx}
                actors={actors}
                userStories={userStories}
                onUpdate={(updates) => updateUseCase(uc.id, updates)}
                onRemove={() => removeUseCase(uc.id)}
              />
            ))}

            {useCases.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border/60 rounded-[3rem] bg-muted/5">
                <div className="bg-primary/5 p-4 rounded-full mb-4">
                  <Workflow className="h-8 w-8 text-primary/20" />
                </div>
                <h3 className="text-sm font-bold text-foreground/40 uppercase tracking-widest">
                  No Protocols Defined
                </h3>
                <p className="mt-2 text-[10px] font-medium text-muted-foreground/30 px-6 text-center">
                  Start mapping your system&apos;s capabilities by adding your first interaction sequence.
                </p>
                <Button
                  variant="link"
                  className="mt-4 text-xs font-bold text-primary/60 hover:text-primary"
                  onClick={addUseCase}
                >
                  Create initial use case
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
