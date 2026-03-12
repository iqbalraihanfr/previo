import { File, Trash2 } from "lucide-react";
import type { Attachment } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { SectionHint } from "./components";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function AttachmentsTab({
  attachments,
  onDropAction,
  onDeleteAction,
}: {
  attachments: Attachment[];
  onDropAction: (files: globalThis.File[]) => void;
  onDeleteAction: (id: string) => void;
}) {
  return (
    <>
      <div className="pb-4 pt-1">
        <SectionHint
          title="Reference files"
          description="Store supporting documents such as briefs, quotations, mockups, or specs. Files are saved for reference only and are not parsed automatically."
          tone="muted"
        />
      </div>

      <FileDropzone onDrop={onDropAction} />

      {attachments.length > 0 && (
        <div className="mt-5 flex flex-col">
          <h3 className="border-b border-border/70 pb-2 text-sm font-semibold text-foreground">
            Attached files ({attachments.length})
          </h3>
          <div className="mt-3 space-y-2 pr-1">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3 shadow-sm transition-colors hover:bg-muted/25"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <File className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p
                      className="truncate text-sm font-medium text-foreground"
                      title={attachment.filename}
                    >
                      {attachment.filename}
                    </p>
                    <p className="mt-0.5 text-readable-xs text-muted-foreground">
                      {formatSize(attachment.size)}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onDeleteAction(attachment.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
