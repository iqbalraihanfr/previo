"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, FileText, Loader2, Upload } from "lucide-react";
import type { SourceType } from "@/lib/db";
import { SOURCE_TYPE_LABELS } from "@/lib/sourceArtifacts";
import {
  revalidateResolvedNodeImport,
  type ResolvedNodeImport,
} from "@/lib/sourceIntake";
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
import { Input } from "@/components/ui/input";

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

function updateResolvedFields(
  resolved: ResolvedNodeImport,
  fields: Record<string, unknown>,
) {
  return revalidateResolvedNodeImport(resolved, fields);
}

function listToMultiline(value: unknown) {
  if (!Array.isArray(value)) return "";
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .join("\n");
}

function multilineToList(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function renderProjectBriefReview(
  resolved: ResolvedNodeImport,
  onChange: (fields: Record<string, unknown>) => void,
) {
  const fields = resolved.fields;

  return (
    <div
      className="grid gap-4 rounded-2xl border border-border/70 bg-background/70 p-4"
      data-testid="source-import-brief-review"
    >
      <div className="grid gap-2">
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Name
        </label>
        <Input
          value={String(fields.name ?? "")}
          onChange={(event) =>
            onChange({ ...fields, name: event.target.value })
          }
          data-testid="import-review-brief-name"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Background
        </label>
        <Textarea
          value={String(fields.background ?? "")}
          onChange={(event) =>
            onChange({ ...fields, background: event.target.value })
          }
          className="min-h-[110px]"
          data-testid="import-review-brief-background"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Target Users
          </label>
          <Textarea
            value={listToMultiline(fields.target_users)}
            onChange={(event) =>
              onChange({
                ...fields,
                target_users: multilineToList(event.target.value),
              })
            }
            className="min-h-[110px]"
            data-testid="import-review-brief-target-users"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Scope In
          </label>
          <Textarea
            value={listToMultiline(fields.scope_in)}
            onChange={(event) =>
              onChange({
                ...fields,
                scope_in: multilineToList(event.target.value),
              })
            }
            className="min-h-[110px]"
            data-testid="import-review-brief-scope-in"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Objectives
          </label>
          <Textarea
            value={listToMultiline(fields.objectives)}
            onChange={(event) =>
              onChange({
                ...fields,
                objectives: multilineToList(event.target.value),
              })
            }
            className="min-h-[110px]"
            data-testid="import-review-brief-objectives"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Constraints
          </label>
          <Textarea
            value={listToMultiline(fields.constraints)}
            onChange={(event) =>
              onChange({
                ...fields,
                constraints: multilineToList(event.target.value),
              })
            }
            className="min-h-[110px]"
            data-testid="import-review-brief-constraints"
          />
        </div>
      </div>
    </div>
  );
}

function renderRequirementsReview(
  resolved: ResolvedNodeImport,
  onChange: (fields: Record<string, unknown>) => void,
) {
  const items = Array.isArray(resolved.fields.items) ? resolved.fields.items : [];

  return (
    <div
      className="space-y-3 rounded-2xl border border-border/70 bg-background/70 p-4"
      data-testid="source-import-requirements-review"
    >
      {items.map((item, index) => {
        const requirement = item as Record<string, unknown>;

        const updateItem = (updates: Record<string, unknown>) => {
          const nextItems = items.map((currentItem, currentIndex) =>
            currentIndex === index ? { ...currentItem, ...updates } : currentItem,
          );
          onChange({
            ...resolved.fields,
            items: nextItems,
          });
        };

        return (
          <div
            key={String(requirement.id ?? `req-${index}`)}
            className="rounded-xl border border-border/60 bg-background/80 p-4"
            data-testid={`import-review-requirement-${index}`}
          >
            <div className="grid gap-3 md:grid-cols-[100px_120px_minmax(0,1fr)]">
              <div className="grid gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Type
                </label>
                <Select
                  value={String(requirement.type ?? "FR")}
                  onValueChange={(value) => updateItem({ type: value })}
                >
                  <SelectTrigger
                    className="h-10 rounded-xl"
                    data-testid={`import-review-requirement-type-${index}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FR">FR</SelectItem>
                    <SelectItem value="NFR">NFR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Priority
                </label>
                <Select
                  value={String(requirement.priority ?? "Should")}
                  onValueChange={(value) => updateItem({ priority: value })}
                >
                  <SelectTrigger
                    className="h-10 rounded-xl"
                    data-testid={`import-review-requirement-priority-${index}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Must">Must</SelectItem>
                    <SelectItem value="Should">Should</SelectItem>
                    <SelectItem value="Could">Could</SelectItem>
                    <SelectItem value="Wont">Wont</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Description
                </label>
                <Input
                  value={String(requirement.description ?? "")}
                  onChange={(event) =>
                    updateItem({ description: event.target.value })
                  }
                  data-testid={`import-review-requirement-description-${index}`}
                />
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Category
                </label>
                <Input
                  value={String(requirement.category ?? "")}
                  onChange={(event) =>
                    updateItem({ category: event.target.value })
                  }
                  data-testid={`import-review-requirement-category-${index}`}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Related Scope
                </label>
                <Input
                  value={String(requirement.related_scope ?? "")}
                  onChange={(event) =>
                    updateItem({ related_scope: event.target.value })
                  }
                  data-testid={`import-review-requirement-scope-${index}`}
                />
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Metric
                </label>
                <Input
                  value={String(requirement.metric ?? "")}
                  onChange={(event) => updateItem({ metric: event.target.value })}
                  data-testid={`import-review-requirement-metric-${index}`}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Target
                </label>
                <Input
                  value={String(requirement.target ?? "")}
                  onChange={(event) => updateItem({ target: event.target.value })}
                  data-testid={`import-review-requirement-target-${index}`}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
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
  const unresolvedCount = resolved?.unresolvedFields.length ?? 0;

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
                  Review imported structure
                </div>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  Resolve missing fields before this import becomes canonical data for the node.
                </p>
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

              {resolved.issues.length > 0 && (
                <div
                  className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-4"
                  data-testid="source-import-issues"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Import review issues
                  </div>
                  <div className="mt-3 space-y-2">
                    {resolved.issues.map((issue) => (
                      <div
                        key={`${issue.field}-${issue.message}`}
                        className="rounded-xl border border-border/50 bg-background/70 px-3 py-2"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            {issue.field}
                          </span>
                          <span className="rounded-full border border-border/60 bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            {issue.severity}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-foreground/80">{issue.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {resolved.nodeType === "project_brief" &&
                renderProjectBriefReview(resolved, (fields) =>
                  setResolved((current) =>
                    current ? updateResolvedFields(current, fields) : current,
                  ),
                )}

              {resolved.nodeType === "requirements" &&
                renderRequirementsReview(resolved, (fields) =>
                  setResolved((current) =>
                    current ? updateResolvedFields(current, fields) : current,
                  ),
                )}

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
                {unresolvedCount > 0 ? `Accept with ${unresolvedCount} unresolved` : "Accept & Save"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
