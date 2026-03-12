import Markdown from "react-markdown";
import { cn } from "@/lib/utils";

export interface MarkdownViewerProps {
  value: string;
  className?: string;
}

export function MarkdownViewer({ value, className }: MarkdownViewerProps) {
  if (!value?.trim()) return null;

  return (
    <div
      className={cn("prose dark:prose-invert max-w-none text-sm", className)}
    >
      <Markdown>{value}</Markdown>
    </div>
  );
}
