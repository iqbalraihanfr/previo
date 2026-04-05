"use client";

import { useMemo, useState } from "react";
import { FileText, FolderOpenDot, Sparkles, PencilLine } from "lucide-react";
import type { Attachment } from "@/lib/db";
import type { ManualEntryMode, NodeCapability } from "@/lib/nodeCapabilities";
import { SOURCE_TYPE_LABELS } from "@/lib/sourceArtifacts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  buildStructuredPreviewRows,
  getEntryStateCopy,
  type EditorSectionLink,
} from "./editorShell";
import { AttachmentsTab } from "./AttachmentsTab";
import { NotesEditor } from "./NotesEditor";
import { SqlNotesEditor } from "./SqlNotesEditor";

export function EditorEntryState({
  nodeLabel,
  capability,
  importableSources,
  onImport,
  onGenerate,
  onManualEntry,
}: {
  nodeLabel: string;
  capability: NodeCapability;
  importableSources: string[];
  onImport?: () => void;
  onGenerate?: () => void;
  onManualEntry?: () => void;
}) {
  const copy = getEntryStateCopy({
    nodeLabel,
    capability,
    importableSourceLabels: importableSources,
  });

  const manualLabel =
    capability.manualEntryMode === "primary" ? "Start writing" : "Create manually";

  return (
    <div
      className="flex flex-1 items-start justify-center px-6 py-8"
      data-testid="editor-entry-state"
    >
      <div className="w-full max-w-4xl rounded-[28px] border border-border/70 bg-background/80 p-8 shadow-sm">
        <div className="max-w-2xl space-y-4">
          <Badge variant="outline" className="rounded-full px-3 py-1">
            {copy.eyebrow}
          </Badge>
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
              {copy.title}
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              {copy.description}
            </p>
            <p className="text-xs leading-6 text-muted-foreground">
              {copy.importSummary}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {onImport && (
            <button
              type="button"
              onClick={onImport}
              className="rounded-[24px] border border-border/70 bg-background px-5 py-5 text-left transition-all hover:border-primary/30 hover:bg-primary/5"
              data-testid="node-source-import"
            >
              <FolderOpenDot className="h-5 w-5 text-primary" />
              <p className="mt-4 text-base font-semibold text-foreground">
                Import existing source
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Pull structured data from existing artifacts and keep it as the canonical source.
              </p>
            </button>
          )}

          {onGenerate && (
            <button
              type="button"
              onClick={onGenerate}
              className="rounded-[24px] border border-border/70 bg-background px-5 py-5 text-left transition-all hover:border-primary/30 hover:bg-primary/5"
              data-testid="node-source-generate"
            >
              <Sparkles className="h-5 w-5 text-primary" />
              <p className="mt-4 text-base font-semibold text-foreground">
                Generate draft
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Build the first structured version from upstream project context.
              </p>
            </button>
          )}

          {onManualEntry && capability.manualEntryMode !== "none" && (
            <button
              type="button"
              onClick={onManualEntry}
              className="rounded-[24px] border border-border/70 bg-background px-5 py-5 text-left transition-all hover:border-primary/30 hover:bg-primary/5"
              data-testid="node-source-manual-action"
            >
              <PencilLine className="h-5 w-5 text-primary" />
              <p className="mt-4 text-base font-semibold text-foreground">
                {manualLabel}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {capability.manualEntryMode === "primary"
                  ? "Start with structured fields immediately and keep supporting notes separate."
                  : "Use manual entry only when no mature import source exists yet."}
              </p>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EditorSectionNav({
  links,
}: {
  links: EditorSectionLink[];
}) {
  if (links.length === 0) return null;

  return (
    <div
      className="sticky top-0 z-10 border-b border-border/50 bg-background/85 px-6 py-3 backdrop-blur-sm"
      data-testid="editor-section-nav"
    >
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Button
            key={link.id}
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => {
              document.getElementById(link.id)?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
          >
            {link.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function StructuredContentPreview({
  nodeLabel,
  fields,
  manualEntryMode,
  sourceType,
}: {
  nodeLabel: string;
  fields: Record<string, unknown>;
  manualEntryMode: ManualEntryMode;
  sourceType?: string;
}) {
  const rows = useMemo(() => buildStructuredPreviewRows(fields), [fields]);

  return (
    <div className="flex flex-1 justify-center px-6 py-8" data-testid="editor-review-panel">
      <div className="w-full max-w-4xl space-y-5">
        <div className="rounded-[24px] border border-border/70 bg-background/80 px-6 py-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">
                {nodeLabel} snapshot
              </p>
              <p className="text-sm text-muted-foreground">
                {sourceType
                  ? `Canonical source: ${SOURCE_TYPE_LABELS[sourceType as keyof typeof SOURCE_TYPE_LABELS] ?? sourceType}`
                  : manualEntryMode === "primary" || manualEntryMode === "secondary"
                    ? "Structured manual draft"
                    : "Structured review"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((row) => (
            <div
              key={row.label}
              className="rounded-[20px] border border-border/70 bg-background/70 px-5 py-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {row.label}
              </p>
              <p className="mt-2 text-sm leading-6 text-foreground">{row.value}</p>
            </div>
          ))}

          {rows.length === 0 && (
            <div className="rounded-[20px] border border-dashed border-border/70 bg-background/70 px-5 py-6 text-sm text-muted-foreground">
              No structured fields are ready to review yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function EditorReferenceArea({
  attachments,
  freeText,
  sqlSchema,
  onDrop,
  onDeleteAttachment,
  onFreeTextChange,
  onSqlSchemaChange,
  defaultOpen = false,
}: {
  attachments: Attachment[];
  freeText: string;
  sqlSchema: string;
  onDrop: (files: File[]) => void;
  onDeleteAttachment: (id: string) => void;
  onFreeTextChange: (value: string) => void;
  onSqlSchemaChange?: (value: string) => void;
  defaultOpen?: boolean;
}) {
  const [manualOpenState, setManualOpenState] = useState<boolean | null>(null);
  const isOpen = manualOpenState ?? defaultOpen;

  return (
    <div
      className="mx-6 mb-6 rounded-[24px] border border-border/60 bg-background/60"
      data-testid="editor-reference-area"
    >
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left text-sm font-semibold text-foreground"
        data-testid="editor-reference-toggle"
        onClick={() => setManualOpenState((current) => !(current ?? defaultOpen))}
      >
        Notes & Files
        <span className="text-xs text-muted-foreground">{isOpen ? "▲" : "▼"}</span>
      </button>
      {isOpen && (
        <div className="grid gap-6 border-t border-border/60 px-5 py-5 lg:grid-cols-2">
          <div>
            <NotesEditor value={freeText} onChange={onFreeTextChange} />
          </div>
          <div className="space-y-6">
            {onSqlSchemaChange && (
              <SqlNotesEditor value={sqlSchema} onChange={onSqlSchemaChange} />
            )}
            <div className="px-6 pb-6">
              <AttachmentsTab
                attachments={attachments}
                onDropAction={onDrop}
                onDeleteAction={onDeleteAttachment}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
