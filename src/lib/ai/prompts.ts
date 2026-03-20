export type AssistContext = Record<string, unknown>;

export const ASSIST_SECTIONS = [
  "objectives",
  "target_users",
  "scope_in",
  "scope_out",
  "constraints",
  "tech_stack",
] as const;

export type AssistSection = (typeof ASSIST_SECTIONS)[number];

type PromptContextEntry = {
  label: string;
  value: unknown;
  fallback?: string;
};

type AssistPromptDefinition = {
  request: string;
  context: (context: AssistContext) => PromptContextEntry[];
  rules: string[];
};

const ASSIST_SECTION_SET = new Set<string>(ASSIST_SECTIONS);

const JSON_ONLY_INSTRUCTION =
  "Return ONLY valid JSON. No markdown, no code fences, no explanation.";

const LANGUAGE_MATCH_INSTRUCTION =
  "Detect the dominant language from the provided context and respond in that same language. If the context is Indonesian (Bahasa Indonesia), respond in Indonesian. If the context is English, respond in English. Support any language.";

function formatPromptValue(value: unknown, fallback = "Not provided"): string {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized || fallback;
  }

  if (value === undefined || value === null) {
    return fallback;
  }

  return JSON.stringify(value, null, 2);
}

function renderContext(entries: PromptContextEntry[]): string {
  return entries
    .map(({ label, value, fallback }) => {
      return `${label}: ${formatPromptValue(value, fallback)}`;
    })
    .join("\n");
}

function renderRules(rules: string[]): string {
  return rules.map((rule) => `- ${rule}`).join("\n");
}

const ASSIST_PROMPTS: Record<AssistSection, AssistPromptDefinition> = {
  objectives: {
    request: "Generate project objectives for this software project.",
    context: (context) => [
      { label: "Project", value: context.name, fallback: "Unknown" },
      { label: "Background", value: context.background },
      { label: "Target Users", value: context.target_users, fallback: "[]" },
    ],
    rules: [
      "Return 3-5 items.",
      "Each objective must be actionable and concrete.",
      "Focus on outcomes the project should achieve, not implementation details.",
      'Return a JSON array of strings, for example ["Objective 1", "Objective 2"].',
    ],
  },
  target_users: {
    request: "Suggest target users or personas for this software project.",
    context: (context) => [
      { label: "Project", value: context.name, fallback: "Unknown" },
      { label: "Background", value: context.background },
      { label: "Objectives", value: context.objectives, fallback: "[]" },
    ],
    rules: [
      "Return 3-5 items.",
      "Use realistic user types or personas relevant to the project.",
      'Be specific when helpful, for example "Operations Manager" instead of "User".',
      'Return a JSON array of strings, for example ["Admin User", "End Customer"].',
    ],
  },
  scope_in: {
    request: "Suggest features or capabilities that should be included in scope.",
    context: (context) => [
      { label: "Project", value: context.name, fallback: "Unknown" },
      { label: "Background", value: context.background },
      { label: "Objectives", value: context.objectives, fallback: "[]" },
      { label: "Target Users", value: context.target_users, fallback: "[]" },
      { label: "Existing Scope Items", value: context.scope_in, fallback: "[]" },
    ],
    rules: [
      "Return 4-6 items.",
      "Do not repeat existing scope items.",
      "Suggest capabilities that clearly belong in the MVP or current phase.",
      'Return a JSON array of strings, for example ["User authentication", "Reporting dashboard"].',
    ],
  },
  scope_out: {
    request:
      "Suggest items that should be explicitly marked as out of scope for the current project phase.",
    context: (context) => [
      { label: "Project", value: context.name, fallback: "Unknown" },
      { label: "Scope In", value: context.scope_in, fallback: "[]" },
      { label: "Objectives", value: context.objectives, fallback: "[]" },
    ],
    rules: [
      "Return 3-5 items.",
      "Focus on realistic exclusions that keep the project scoped.",
      "Avoid duplicating items already present in scope_in.",
      'Return a JSON array of strings, for example ["Native mobile app", "Complex analytics suite"].',
    ],
  },
  constraints: {
    request: "Suggest realistic project constraints for this project.",
    context: (context) => [
      { label: "Project", value: context.name, fallback: "Unknown" },
      { label: "Background", value: context.background },
      { label: "Tech Stack", value: context.tech_stack, fallback: "[]" },
      { label: "Scope", value: context.scope_in, fallback: "[]" },
    ],
    rules: [
      "Return 3-5 items.",
      "Mix delivery, budget, technical, compliance, or team constraints where relevant.",
      "Keep each item realistic and concise.",
      'Return a JSON array of strings, for example ["6-week delivery window", "Must run on low-spec devices"].',
    ],
  },
  tech_stack: {
    request: "Suggest a relevant technology stack for this project.",
    context: (context) => [
      { label: "Project", value: context.name, fallback: "Unknown" },
      { label: "Background", value: context.background },
      { label: "Objectives", value: context.objectives, fallback: "[]" },
      { label: "Scope", value: context.scope_in, fallback: "[]" },
    ],
    rules: [
      "Return 3-6 items.",
      'Be specific when possible, for example "Next.js 15" instead of just "Next.js".',
      "Prefer a coherent stack that matches the project scope.",
      'Return a JSON array of strings, for example ["Next.js 15", "PostgreSQL", "Tailwind CSS"].',
    ],
  },
};

export const ASSIST_SYSTEM_PROMPT = [
  "You are a senior business analyst helping define software projects.",
  LANGUAGE_MATCH_INSTRUCTION,
  JSON_ONLY_INSTRUCTION,
  "Response format: a JSON array of strings.",
].join(" ");

const PROJECT_BRIEF_RESPONSE_SHAPE = `{
  "name": "project name (string)",
  "background": "why this project exists, what problem it solves (max 300 chars)",
  "objectives": ["actionable goal 1", "actionable goal 2"],
  "target_users": ["User Type 1", "User Type 2"],
  "scope_in": ["feature or capability 1", "feature or capability 2"],
  "scope_out": ["excluded item 1"],
  "success_metrics": [{"metric": "metric name", "target": "concrete target value"}],
  "constraints": ["constraint 1"],
  "tech_stack": ["Technology 1"],
  "references": []
}`;

export const IMPORT_DOCUMENT_SYSTEM_PROMPT = [
  "You are a business analyst assistant. Extract structured project brief information from the provided document (quotation, BQ, SOW, or project proposal).",
  LANGUAGE_MATCH_INSTRUCTION,
  JSON_ONLY_INSTRUCTION,
  "Return a JSON object with exactly these keys:",
  PROJECT_BRIEF_RESPONSE_SHAPE,
  "Rules:",
  "- objectives: 3-6 clear, actionable goals",
  "- target_users: user types or personas who will use the system",
  "- scope_in: features or capabilities that WILL be built",
  "- scope_out: things explicitly excluded or clearly out of scope",
  '- success_metrics: measurable outcomes with concrete targets, for example {"metric": "Page load time", "target": "< 2s"}',
  "- Keep background under 300 characters",
  "- Use empty arrays [] for fields with no relevant info",
].join("\n");

export const IMPORT_DOCUMENT_USER_PROMPT =
  "Extract the structured project brief information from this document.";

const ERD_RESPONSE_SHAPE = `{
  "entities": [
    {
      "id": "abc12345",
      "name": "ENTITY_NAME",
      "description": "",
      "attributes": [
        {
          "name": "column_name",
          "type": "VARCHAR|INT|TEXT|BOOLEAN|TIMESTAMP|DECIMAL|UUID|etc",
          "isPrimaryKey": false,
          "isForeignKey": false,
          "isUnique": false,
          "isNullable": true,
          "isRequired": false,
          "isIndex": false,
          "description": ""
        }
      ]
    }
  ],
  "relationships": [
    {
      "id": "def67890",
      "from": "TABLE_A",
      "to": "TABLE_B",
      "type": "one-to-many",
      "label": "has"
    }
  ]
}`;

export const PARSE_SQL_SYSTEM_PROMPT = [
  "You are a database architect. Parse the provided SQL CREATE TABLE statements and extract the schema into structured ERD format.",
  JSON_ONLY_INSTRUCTION,
  "Return a JSON object with this exact structure:",
  ERD_RESPONSE_SHAPE,
  "Rules:",
  '- Entity names MUST be UPPERCASE, for example "USERS" or "ORDERS"',
  "- Attribute names must be snake_case",
  "- Infer relationships from FOREIGN KEY constraints and column naming patterns",
  '- Relationship types must be one of: "one-to-one", "one-to-many", "many-to-one", "many-to-many"',
  '- Use "one-to-many" as the default for FK relationships unless context clearly suggests otherwise',
  '- Generate 8-character alphanumeric ids, for example "a1b2c3d4"',
  '- If no valid SQL is provided, return { "entities": [], "relationships": [] }',
].join("\n");

export function isAssistSection(value: string): value is AssistSection {
  return ASSIST_SECTION_SET.has(value);
}

export function buildAssistPrompt(
  section: AssistSection,
  context: AssistContext,
): string {
  const definition = ASSIST_PROMPTS[section];

  return [
    "Task:",
    definition.request,
    "",
    "Project Context:",
    renderContext(definition.context(context)),
    "",
    "Requirements:",
    renderRules(definition.rules),
  ].join("\n");
}
