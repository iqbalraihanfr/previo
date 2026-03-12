export const DATA_TYPES = [
  "uuid",
  "string",
  "integer",
  "bigint",
  "float",
  "decimal",
  "boolean",
  "text",
  "date",
  "datetime",
  "timestamp",
  "json",
  "jsonb",
  "blob",
  "enum",
] as const;

export const RELATIONSHIP_TYPES = [
  { value: "one-to-one", label: "1:1" },
  { value: "one-to-many", label: "1:N" },
  { value: "many-to-one", label: "N:1" },
  { value: "many-to-many", label: "N:M" },
] as const;
