"use client";

import { Button } from "@/components/ui/button";
import { Plus, Link2, Info } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { getCanonicalNodeFields } from "@/lib/canonicalContent";
import { NodeContentRepository } from "@/repositories/NodeRepository";
import {
  useSequenceLogic,
  type SequenceFields,
} from "./sequence/hooks/useSequenceLogic";
import { ParticipantItem } from "./sequence/components/ParticipantItem";
import { MessageItem } from "./sequence/components/MessageItem";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StructuredEditorProps } from "./editorTypes";

type UseCaseReference = { id?: string; name?: string };

function useUseCases(projectId?: string) {
  return (
    useLiveQuery(async () => {
      if (!projectId) return [] as UseCaseReference[];
      const content = await NodeContentRepository.findByProjectAndType(
        projectId,
        "use_cases",
      );
      return (getCanonicalNodeFields("use_cases", content).useCases || []) as UseCaseReference[];
    }, [projectId]) ?? []
  );
}

type SequenceEditorProps = StructuredEditorProps<SequenceFields>;

export function SequenceEditor({
  fields,
  onChange,
  projectId,
}: SequenceEditorProps) {
  const useCases = useUseCases(projectId);
  const {
    participants,
    messages,
    addParticipant,
    updateParticipant,
    removeParticipant,
    addMessage,
    updateMessage,
    removeMessage,
  } = useSequenceLogic(fields, onChange);

  const participantNames = participants.map((p) => p.name).filter(Boolean);

  // Auto-extract API endpoints for summary reference
  const apiEndpoints = messages
    .filter((m) => {
      const c = (m.content || "").toUpperCase();
      return (
        /^(GET|POST|PUT|PATCH|DELETE)\s/.test(c) ||
        /\/api\//.test(m.content || "")
      );
    })
    .map((m) => m.content);

  return (
    <div className="flex flex-col gap-10 p-8 w-full workspace-scroll pb-24 h-full">
      {/* Header & Meta */}
      <div className="space-y-6" id="sequence-overview">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <h2 className="text-2xl font-black tracking-tighter uppercase italic opacity-20">Sequence Flow</h2>
        </div>

        <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Link2 className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Connect to Business Logic</span>
          </div>
          <Select
            value={fields.related_use_case || "none"}
            onValueChange={(val) =>
              onChange({ ...fields, related_use_case: val === "none" ? "" : (val ?? "") })
            }
          >
            <SelectTrigger className="h-12 border-none bg-background rounded-2xl font-bold shadow-lg shadow-primary/5">
              <SelectValue placeholder="Link to existing Use Case..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="font-bold">Unlinked</SelectItem>
              {useCases.map((uc, i: number) => (
                <SelectItem
                  key={String(uc.id ?? `uc-${i + 1}`)}
                  value={String(uc.id ?? `uc-${i + 1}`)}
                  className="font-bold"
                >
                  UC-{String(i + 1).padStart(3, "0")}: {uc.name || "Untitled"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Participants Section */}
      <div className="space-y-6" id="sequence-participants">
        <div className="flex items-center justify-between px-2">
          <div className="space-y-1">
            <h3 className="text-sm font-black uppercase tracking-widest">Participants</h3>
            <p className="text-[10px] text-muted-foreground font-medium italic">Define actors and systems in this flow</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={addParticipant}
            className="h-10 px-4 rounded-xl font-black uppercase tracking-widest text-[10px] border-primary/20 hover:bg-primary/5 transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Identity
          </Button>
        </div>
        
        <div className="space-y-3">
          {participants.map((p, i) => (
            <ParticipantItem
              key={i}
              index={i}
              participant={p}
              onUpdate={(upd) => updateParticipant(i, upd)}
              onRemove={() => removeParticipant(i)}
            />
          ))}
          {participants.length === 0 && (
            <div className="p-12 border-2 border-dashed border-border/40 rounded-[2rem] flex flex-col items-center justify-center gap-3 grayscale opacity-30">
              <Info className="h-8 w-8" />
              <span className="text-xs font-black uppercase tracking-widest">Identity List Empty</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages Section */}
      <div className="space-y-6" id="sequence-messages">
        <div className="flex items-center justify-between px-2">
          <div className="space-y-1">
            <h3 className="text-sm font-black uppercase tracking-widest">Interaction Timeline</h3>
            <p className="text-[10px] text-muted-foreground font-medium italic">Map the sequence of events and messaging</p>
          </div>
          <Button
            size="sm"
            variant="default"
            onClick={addMessage}
            className="h-11 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Interaction
          </Button>
        </div>

        <div className="space-y-6">
          {messages.map((m, i) => (
            <MessageItem
              key={m.id}
              index={i}
              message={m}
              participants={participantNames}
              onUpdate={(upd) => updateMessage(m.id, upd)}
              onRemove={() => removeMessage(m.id)}
            />
          ))}
          {messages.length === 0 && (
            <div className="p-20 border-2 border-dashed border-border/40 rounded-[3rem] flex flex-col items-center justify-center gap-4 grayscale opacity-20">
              <Plus className="h-12 w-12" />
              <span className="text-sm font-black uppercase tracking-widest">Awaiting interaction</span>
            </div>
          )}
        </div>
      </div>

      {/* Detected Endpoints */}
      {apiEndpoints.length > 0 && (
        <div className="pt-10 space-y-4 border-t border-border/40">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-black uppercase tracking-widest opacity-50">Intelligent Context Discovery</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {apiEndpoints.map((ep, i) => (
              <span
                key={i}
                className="px-3 py-1.5 bg-emerald-500/5 text-emerald-600 border border-emerald-500/10 rounded-lg text-[10px] font-mono font-bold"
              >
                {ep}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
