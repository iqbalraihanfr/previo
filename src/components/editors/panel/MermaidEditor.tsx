import { useRef } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/ui/code-editor";
import { SectionHint } from "./components";
import { exportDiagramToPNG } from "@/lib/exportEngine";

interface MermaidEditorProps {
  mermaidSyntax: string;
  onSyntaxChange: (value: string) => void;
  mermaidSvg: string;
  mermaidError: string | null;
  nodeLabel: string;
}

export function MermaidEditor({
  mermaidSyntax,
  onSyntaxChange,
  mermaidSvg,
  mermaidError,
  nodeLabel,
}: MermaidEditorProps) {
  const mermaidRef = useRef<HTMLDivElement>(null);

  const handleExport = () => {
    if (mermaidRef.current) {
      exportDiagramToPNG(mermaidRef.current, `${nodeLabel}-diagram`);
    }
  };

  return (
    <div className="m-0 flex-1 px-6 pb-12 outline-none">
      <div className="grid gap-3 pb-4 pt-1">
        <SectionHint
          title="Diagram editor"
          description="This view reflects Guided content first. Only make manual changes here when you intentionally want to override the generated diagram."
          tone="muted"
        />
      </div>

      <div className="flex flex-1 flex-col gap-4 xl:grid xl:grid-cols-[0.95fr_1.05fr]">
        <CodeEditor value={mermaidSyntax} onChange={onSyntaxChange} />

        <div className="relative flex h-[400px] min-h-0 items-center justify-center overflow-auto rounded-2xl border border-border/70 bg-secondary/20 p-4 xl:h-auto">
          {!mermaidError && mermaidSvg && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="absolute right-3 top-3 rounded-full"
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export PNG
            </Button>
          )}

          {mermaidError ? (
            <div className="absolute inset-0 overflow-auto bg-background/95 p-4 text-sm text-destructive">
              <div className="mb-2 font-semibold uppercase tracking-[0.14em]">
                Mermaid syntax error
              </div>
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {mermaidError}
              </pre>
            </div>
          ) : (
            <div
              ref={mermaidRef}
              dangerouslySetInnerHTML={{ __html: mermaidSvg }}
              className="mermaid-preview flex h-full w-full items-center justify-center bg-white"
            />
          )}

          {!mermaidSvg && !mermaidError && (
            <span className="text-sm text-muted-foreground">
              Rendering live preview...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
