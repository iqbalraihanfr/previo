export interface StructuredEditorProps<TFields> {
  fields: TFields;
  onChange: (fields: TFields) => void;
  projectId?: string;
}
