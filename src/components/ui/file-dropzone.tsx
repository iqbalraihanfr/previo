import {
  useDropzone,
  type DropzoneOptions,
  type FileRejection,
  type DropEvent,
} from "react-dropzone";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileDropzoneProps extends Omit<DropzoneOptions, "onDrop"> {
  onDrop: (
    acceptedFiles: File[],
    fileRejections: FileRejection[],
    event: DropEvent
  ) => void;
  className?: string;
  title?: string;
  description?: string;
  hints?: string;
}

export function FileDropzone({
  onDrop,
  className,
  title = "Drag and drop files here",
  description = "or click to browse your device",
  hints = "PDF, DOCX, images, markdown, and related references",
  ...dropzoneOptions
}: FileDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    ...dropzoneOptions,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/45 hover:bg-secondary/40",
        className
      )}
    >
      <input {...getInputProps()} />
      <UploadCloud className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
      <p className="text-base font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {hints && (
        <p className="mt-4 text-readable-xs text-muted-foreground">{hints}</p>
      )}
    </div>
  );
}
