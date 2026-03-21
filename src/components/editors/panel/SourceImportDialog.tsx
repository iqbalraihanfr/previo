"use client";

import { useMemo, useState } from "react";
import { FileText, Loader2, Upload } from "lucide-react";
import type { SourceType } from "@/lib/db";
import { SOURCE_TYPE_LABELS } from "@/lib/sourceArtifacts";
import type { ResolvedNodeImport } from "@/lib/sourceIntake";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FileDropzone } from "@/components/ui/file-dropzone";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function buildPreview(fields: Record<string, unknown>) {
  const rows: Array<{ label: string; value: string }> = [];

  Object.entries(fields).forEach(([key, value]) => {
    if (key === "notes" || key === "sql") return;

    if (Array.isArray(value)) {
      rows.push({
        label: key,
        value: `${value.length} item(s)`,
      });
      return;
    }

    if (typeof value === "string") {
      rows.push({
        label: key,
        value: value.length > 72 ? `${value.slice(0, 72)}...` : value || "—",
      });
      return;
    }

    if (value && typeof value === "object") {
      rows.push({
        label: key,
        value: "Structured object",
      });
    }
  });

  return rows.slice(0, 8);
}

interface SourceImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  supportedSources: SourceType[];
  onResolve: (
    sourceType: SourceType,
    rawContent: string,
  ) => Promise<ResolvedNodeImport>;
  onApply: (result: ResolvedNodeImport) => void;
}

export function SourceImportDialog({
  open,
  onOpenChange,
  title,
  supportedSources,
  onResolve,
  onApply,
}: SourceImportDialogProps) {
  const [sourceType, setSourceType] = useState<SourceType>(
    supportedSources[0] ?? "manual_structured",
  );
  const [rawContent, setRawContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState<ResolvedNodeImport | null>(null);

  const previewRows = useMemo(
    () => buildPreview(resolved?.fields ?? {}),
    [resolved],
  );

  const reset = () => {
    setSourceType(supportedSources[0] ?? "manual_structured");
    setRawContent("");
    setIsLoading(false);
    setError(null);
    setResolved(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset();
    }
    onOpenChange(nextOpen);
  };

  const handleResolve = async () => {
    setIsLoading(true);
    setError(null);
    setResolved(null);

    try {
      const next = await onResolve(sourceType, rawContent);
      setResolved(next);
    } catch (resolveError) {
      setError(
        resolveError instanceof Error
          ? resolveError.message
          : "Failed to import source.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const text = await file.text();
    setRawContent(text);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-[640px]"
        data-testid="source-import-dialog"
      >
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Import parseable source data, preview the normalized structure, then apply it to this node.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {!resolved ? (
            <>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Source Type
                </label>
                <Select
                  value={sourceType}
                  onValueChange={(value) => setSourceType(value as SourceType)}
                >
                  <SelectTrigger
                    className="h-11 rounded-xl"
                    data-testid="source-import-type-trigger"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedSources.map((supportedSource) => (
                      <SelectItem key={supportedSource} value={supportedSource}>
                        {SOURCE_TYPE_LABELS[supportedSource]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Textarea
                data-testid="source-import-textarea"
                value={rawContent}
                onChange={(event) => setRawContent(event.target.value)}
                placeholder="Paste markdown, CSV, Mermaid, DBML, SQL, or other supported text source..."
                className="min-h-[220px] rounded-2xl text-sm"
              />

              <FileDropzone
                onDrop={(acceptedFiles) => {
                  void handleFileDrop(acceptedFiles);
                }}
                multiple={false}
                accept={{
                  "text/plain": [".txt", ".md", ".csv", ".mmd", ".dbml", ".sql"],
                }}
                title="Drop a text-based source file"
                description="or click to browse for CSV, Markdown, Mermaid, DBML, or SQL"
                hints="Only text-based imports are treated as canonical source input."
              />

              {error && (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <FileText className="h-4 w-4 text-primary" />
                  Normalized preview
                </div>
                <div className="mt-3 grid gap-2">
                  {previewRows.map((row) => (
                    <div
                      key={row.label}
                      className="grid gap-1 rounded-xl border border-border/50 bg-background/80 px-3 py-2 sm:grid-cols-[120px_minmax(0,1fr)]"
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {row.label}
                      </span>
                      <span className="text-sm text-foreground/80">{row.value}</span>
                    </div>
                  ))}
                  {previewRows.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Parsed source is valid but has no previewable fields.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-xs text-muted-foreground">
                Applying this import will replace the current structured content for this node. Canonical source remains import-first and free notes stay secondary.
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t px-6 py-4">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>

          {!resolved ? (
            <Button
              onClick={() => void handleResolve()}
              disabled={!rawContent.trim() || isLoading}
              data-testid="source-import-parse"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Parsing
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Parse Source
                </>
              )}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setResolved(null)}
                data-testid="source-import-back"
              >
                Back
              </Button>
              <Button onClick={() => onApply(resolved)} data-testid="source-import-apply">
                Apply Import
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
