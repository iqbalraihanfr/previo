"use client";

import { useMemo, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ResolvedTaskImport } from "@/lib/sourceIntake";
import { SOURCE_TYPE_LABELS } from "@/lib/sourceArtifacts";

type BacklogSource = "jira_csv" | "linear_csv";

interface TaskBacklogImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (
    sourceType: BacklogSource,
    rawContent: string,
  ) => Promise<ResolvedTaskImport>;
  onApply: (result: ResolvedTaskImport) => void;
}

export function TaskBacklogImportDialog({
  open,
  onOpenChange,
  onResolve,
  onApply,
}: TaskBacklogImportDialogProps) {
  const [sourceType, setSourceType] = useState<BacklogSource>("jira_csv");
  const [rawContent, setRawContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState<ResolvedTaskImport | null>(null);

  const previewItems = useMemo(() => resolved?.items.slice(0, 8) ?? [], [resolved]);

  const reset = () => {
    setSourceType("jira_csv");
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
          : "Failed to import backlog.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-[640px]"
        data-testid="task-backlog-import-dialog"
      >
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle>Import Backlog CSV</DialogTitle>
          <DialogDescription>
            Import Jira or Linear style CSV for reconciliation against generated tasks.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {!resolved ? (
            <>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Source
                </label>
                <Select
                  value={sourceType}
                  onValueChange={(value) => setSourceType(value as BacklogSource)}
                >
                  <SelectTrigger
                    className="h-11 rounded-xl"
                    data-testid="task-backlog-source-trigger"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jira_csv">
                      {SOURCE_TYPE_LABELS.jira_csv}
                    </SelectItem>
                    <SelectItem value="linear_csv">
                      {SOURCE_TYPE_LABELS.linear_csv}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Textarea
                data-testid="task-backlog-textarea"
                value={rawContent}
                onChange={(event) => setRawContent(event.target.value)}
                placeholder="Paste CSV content with title, description, priority, and status columns..."
                className="min-h-[220px] rounded-2xl text-sm"
              />

              <FileDropzone
                onDrop={(acceptedFiles) => {
                  const file = acceptedFiles[0];
                  if (!file) return;
                  void file.text().then(setRawContent);
                }}
                multiple={false}
                accept={{ "text/csv": [".csv"], "text/plain": [".csv", ".txt"] }}
                title="Drop CSV backlog export"
                description="or click to browse for a Jira/Linear CSV export"
                hints="Imported backlog items stay non-generated and are used for reconciliation."
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
                <p className="text-sm font-medium text-foreground">
                  {resolved.items.length} backlog item(s) ready to import
                </p>
                <div className="mt-3 space-y-2">
                  {previewItems.map((item, index) => (
                    <div
                      key={`${item.title}-${index}`}
                      className="rounded-xl border border-border/50 bg-background/80 px-3 py-2"
                    >
                      <p className="text-sm font-semibold text-foreground">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.external_source.toUpperCase()} · {item.status} · {item.priority}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-xs text-muted-foreground">
                Imported backlog items are added as non-generated tasks and marked for reconciliation.
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
              data-testid="task-backlog-parse"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Parsing
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Parse CSV
                </>
              )}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setResolved(null)}
                data-testid="task-backlog-back"
              >
                Back
              </Button>
              <Button onClick={() => onApply(resolved)} data-testid="task-backlog-apply">
                Import Tasks
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
