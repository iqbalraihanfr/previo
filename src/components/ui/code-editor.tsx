import CodeMirror, { type ReactCodeMirrorProps } from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { cn } from "@/lib/utils";

export interface CodeEditorProps
  extends Omit<ReactCodeMirrorProps, "extensions"> {
  value: string;
  onChange: (value: string) => void;
  language?: "javascript";
  className?: string;
}

export function CodeEditor({
  value,
  onChange,
  className,
  ...props
}: CodeEditorProps) {
  const extensions = [javascript()];

  return (
    <div
      className={cn(
        "min-h-0 overflow-hidden rounded-2xl border border-border/70 bg-background",
        className
      )}
    >
      <CodeMirror
        value={value}
        height="100%"
        extensions={extensions}
        onChange={onChange}
        theme="dark"
        className="h-full text-sm"
        {...props}
      />
    </div>
  );
}
