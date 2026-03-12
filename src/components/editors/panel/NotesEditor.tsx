import { Textarea } from "@/components/ui/textarea";
import { SectionHint } from "./components";

interface NotesEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function NotesEditor({ value, onChange }: NotesEditorProps) {
  return (
    <div className="m-0 flex-1 px-6 pb-12 outline-none">
      <div className="pb-4 pt-1">
        <SectionHint
          title="Freeform notes"
          description="Use this space for supporting context, rough thinking, or references. These notes do not drive generated diagrams, tasks, or validation."
          tone="muted"
        />
      </div>

      <Textarea
        className="h-80 flex-1 resize-none bg-background text-sm leading-7 shadow-inner"
        placeholder="Additional context, assumptions, references, or working notes..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
