import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SectionHint } from "./components";

interface SqlNotesEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function SqlNotesEditor({ value, onChange }: SqlNotesEditorProps) {
  return (
    <div className="m-0 flex flex-1 flex-col px-6 pb-12 outline-none">
      <div className="pb-4 pt-1">
        <SectionHint
          title="Reference-only SQL notes"
          description="Paste CREATE TABLE statements or schema references here. This content is stored as notes and does not sync back into Guided fields automatically."
          tone="muted"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <Label className="text-sm font-semibold text-foreground">
          SQL schema notes
        </Label>
        <Textarea
          className="h-60 flex-1 resize-none bg-background font-mono text-sm leading-6"
          placeholder={`CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100)
);`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
