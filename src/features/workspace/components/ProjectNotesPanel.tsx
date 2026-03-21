"use client";

import { useEffect, useRef, useState } from "react";
import { Check, NotebookPen, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Project } from "@/lib/db";
import { db } from "@/lib/db";

interface ProjectNotesPanelProps {
  project: Project;
  onCloseAction: () => void;
}

export function ProjectNotesPanel({
  project,
  onCloseAction,
}: ProjectNotesPanelProps) {
  const [draft, setDraft] = useState(project.project_notes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const latestDraftRef = useRef(draft);

  latestDraftRef.current = draft;

  const persistNotes = async (value: string, syncState = true) => {
    await db.projects.update(project.id, {
      project_notes: value,
      updated_at: new Date().toISOString(),
    });

    if (syncState) {
      setLastSavedAt(new Date().toISOString());
      setIsSaving(false);
    }
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
        void persistNotes(latestDraftRef.current, false);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduleSave = (nextValue: string) => {
    setDraft(nextValue);
    setIsSaving(true);

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      saveTimeoutRef.current = null;
      void persistNotes(nextValue);
    }, 250);
  };

  const handleClose = () => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
      void persistNotes(latestDraftRef.current, false);
    }

    onCloseAction();
  };

  return (
    <div
      className="flex h-full w-full flex-col bg-card/40 backdrop-blur-md shadow-[-20px_0_40px_-20px_rgba(0,0,0,0.15)] overflow-hidden"
      data-testid="project-notes-panel"
    >
      <div className="flex items-start justify-between border-b border-border/70 px-8 py-6 bg-card/10 shrink-0">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-readable-2xs font-bold uppercase tracking-widest text-muted-foreground">
              Non-canonical
            </span>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-readable-2xs font-bold uppercase tracking-widest text-accent-foreground/70">
              Private Context
            </span>
          </div>

          <div>
            <h2 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground">
              <NotebookPen className="h-6 w-6 text-primary" />
              Project Notes
            </h2>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
              Scratch notes, reminders, and supporting context. These notes do not affect validation, tasks, summary, or readiness.
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="rounded-full h-10 w-10 hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
          data-testid="project-notes-close"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="workspace-scroll flex-1 overflow-y-auto px-8 py-8 bg-card/5">
        <div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-5">
          <div className="rounded-3xl border border-border/70 bg-background/50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-readable-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Note handling
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Use this space for rough thinking and supporting references that should stay outside the canonical workflow engine.
                </p>
              </div>
              <div
                className="rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-readable-xs font-medium text-muted-foreground"
                data-testid="project-notes-save-state"
              >
                {isSaving
                  ? "Saving..."
                  : lastSavedAt
                    ? `Saved ${new Date(lastSavedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : "Ready"}
              </div>
            </div>
          </div>

          <div className="flex-1 rounded-3xl border border-border/70 bg-background/60 p-5">
            <label
              htmlFor="project-notes-textarea"
              className="block text-sm font-semibold text-foreground"
            >
              Working notes
            </label>
            <Textarea
              id="project-notes-textarea"
              value={draft}
              onChange={(event) => scheduleSave(event.target.value)}
              placeholder="Capture private notes, open questions, links, reminders, and client context that should not drive compile logic."
              className="mt-4 min-h-[420px] resize-none rounded-3xl border-border/70 bg-background/80 px-4 py-3 text-sm leading-7"
              data-testid="project-notes-textarea"
            />
          </div>

          <div className="rounded-3xl border border-border/70 bg-background/40 p-5 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
                <Check className="h-4 w-4" />
              </div>
              <p className="leading-6">
                These notes stay visible to you, but they never become source of truth. Structured fields and normalized artifacts remain the only inputs for tasks, summary, and validation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
