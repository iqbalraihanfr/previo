import { parseDbmlToERD } from "@/lib/parseDbml";
import { parseSqlToERD } from "@/lib/parseSql";
import { generateDFDFromProject, generateUseCaseDrafts } from "@/lib/nodeDerivations";
import {
  SOURCE_ARTIFACT_PARSER_VERSION,
  type BacklogItem,
  type RequirementItem,
  type StoryItem,
  type SourceArtifactInput,
} from "@/lib/sourceArtifacts";
import type { SourceType } from "@/lib/db";
import type { ProjectBriefFields } from "@/components/editors/ProjectBriefEditor";
import type { UseCaseFields } from "@/lib/canonical";
import { getCanonicalNodeFields } from "@/lib/canonicalContent";
import { NodeContentRepository, NodeRepository } from "@/repositories/NodeRepository";

export interface ResolvedNodeImport {
  nodeType: string;
  fields: Record<string, unknown>;
  sourceType: SourceType;
  rawContent: string;
  parserVersion: string;
  title: string;
  mermaidSyntax?: string;
  issues: ImportReviewIssue[];
  unresolvedFields: string[];
  reviewContext?: ImportReviewContext;
}

export interface ResolvedTaskImport {
  items: BacklogItem[];
  sourceType: Extract<SourceType, "jira_csv" | "linear_csv">;
  rawContent: string;
  parserVersion: string;
  title: string;
}

export interface ImportReviewIssue {
  field: string;
  severity: "error" | "warning";
  message: string;
}

export interface ImportReviewContext {
  briefScopeOptions?: string[];
  requirementOptions?: Array<{ value: string; label: string }>;
  useCaseOptions?: Array<{ value: string; label: string }>;
  importNotes?: string[];
}

function parseCsv(raw: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];
    const next = raw[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      if (current.length > 0 || row.length > 0) {
        row.push(current.trim());
        rows.push(row);
      }
      current = "";
      row = [];
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    rows.push(row);
  }

  if (rows.length === 0) return [];
  const [header, ...body] = rows;
  const normalizedHeader = header.map((column) => column.trim().toLowerCase());

  return body
    .filter((columns) => columns.some((column) => column.trim().length > 0))
    .map((columns) =>
      Object.fromEntries(
        normalizedHeader.map((column, index) => [column, columns[index] ?? ""]),
      ),
    );
}

function normalizePriority(value: string) {
  const normalized = value.trim().toLowerCase();
  if (["must", "high", "critical", "urgent", "p0"].includes(normalized)) {
    return "must" as const;
  }
  if (["should", "medium", "p1"].includes(normalized)) {
    return "should" as const;
  }
  if (["could", "low", "p2"].includes(normalized)) {
    return "could" as const;
  }
  if (["wont", "won't", "backlog", "p3"].includes(normalized)) {
    return "wont" as const;
  }
  return "should" as const;
}

function normalizeStatus(value: string) {
  const normalized = value.trim().toLowerCase();
  if (["done", "complete", "completed", "closed"].includes(normalized)) {
    return "done" as const;
  }
  if (["in progress", "in_progress", "doing", "started"].includes(normalized)) {
    return "in_progress" as const;
  }
  return "todo" as const;
}

function normalizeRequirementPriority(value: string | undefined) {
  const normalized = normalizePriority(value ?? "");
  if (normalized === "must") return "Must" as const;
  if (normalized === "could") return "Could" as const;
  if (normalized === "wont") return "Wont" as const;
  return "Should" as const;
}

function normalizeRequirementType(value: string | undefined) {
  return value?.trim().toUpperCase() === "NFR" ? "NFR" : "FR";
}

function normalizeLooseScope(value: string) {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferBriefScope(
  briefScopeOptions: string[],
  ...candidates: Array<string | undefined>
) {
  if (briefScopeOptions.length === 0) return undefined;

  const preparedScopes = briefScopeOptions.map((scope) => ({
    raw: scope,
    exact: scope.trim().toLowerCase(),
    loose: normalizeLooseScope(scope),
  }));

  for (const candidate of candidates) {
    const trimmedCandidate = candidate?.trim();
    if (!trimmedCandidate) continue;

    const exact = trimmedCandidate.toLowerCase();
    const loose = normalizeLooseScope(trimmedCandidate);

    const exactMatch = preparedScopes.find(
      (scope) => scope.exact === exact || (loose && scope.loose === loose),
    );
    if (exactMatch) return exactMatch.raw;

    if (!loose) continue;

    const partialMatches = preparedScopes.filter(
      (scope) =>
        scope.loose.length > 0 &&
        (scope.loose.includes(loose) || loose.includes(scope.loose)),
    );

    if (partialMatches.length === 1) {
      return partialMatches[0]?.raw;
    }
  }

  return undefined;
}

function splitMarkdownTableRow(line: string) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|")) return [];
  const stripped = trimmed.replace(/^\|/, "").replace(/\|$/, "");
  return stripped.split("|").map((part) => part.trim());
}

function isMarkdownTableDivider(cells: string[]) {
  return (
    cells.length > 0 &&
    cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s+/g, "")))
  );
}

function normalizeTableHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function extractHeadingCategory(line: string) {
  const match = line.match(/^#{1,6}\s+category\s*:\s*(.+)$/i);
  return match?.[1]?.trim() ?? "";
}

function buildRequirementItem(params: {
  description: string;
  type?: string;
  priority?: string;
  category?: string;
  relatedScope?: string;
  metric?: string;
  target?: string;
}): Omit<RequirementItem, "id"> | null {
  const description = params.description.trim();
  if (!description) return null;

  return {
    type: normalizeRequirementType(params.type),
    description,
    priority: normalizeRequirementPriority(params.priority),
    category: params.category?.trim() || "General",
    related_scope: params.relatedScope?.trim() || undefined,
    metric: params.metric?.trim() || undefined,
    target: params.target?.trim() || undefined,
  };
}

function parseStructuredRequirementLine(
  line: string,
  currentCategory: string,
): Omit<RequirementItem, "id"> | null {
  const normalized = line.replace(/^[-*]\s*/, "");
  const [first, category = "", scope = "", metric = "", target = ""] =
    normalized.split("|").map((part) => part.trim());
  if (!first) return null;

  const typeMatch = first.match(/\[(FR|NFR)\]/i);
  const priorityMatch = first.match(/\[(Must|Should|Could|Wont|Won't)\]/i);
  const description = first
    .replace(/\[(FR|NFR)\]/gi, "")
    .replace(/\[(Must|Should|Could|Wont|Won't)\]/gi, "")
    .trim();

  return buildRequirementItem({
    description,
    type: typeMatch?.[1],
    priority: priorityMatch?.[1],
    category: category || currentCategory || "General",
    relatedScope: scope || undefined,
    metric: metric || undefined,
    target: target || undefined,
  });
}

function parseMarkdownRequirementRow(params: {
  headers: string[];
  cells: string[];
  currentCategory: string;
}): Omit<RequirementItem, "id"> | null {
  const row = Object.fromEntries(
    params.headers.map((header, index) => [header, params.cells[index] ?? ""]),
  );

  const id = String(row.id ?? row.requirement_id ?? "").trim();
  const description = String(
    row.description ?? row.requirement ?? row.requirement_text ?? "",
  ).trim();
  const category = String(row.category ?? params.currentCategory ?? "").trim();
  const relatedScope = String(
    row.related_scope ?? row.relatedscope ?? row.scope ?? row.scope_item ?? "",
  ).trim();
  const metric = String(row.metric ?? row.measure ?? "").trim();
  const target = String(row.target ?? row.threshold ?? "").trim();
  const explicitType = String(row.type ?? "").trim();
  const explicitPriority = String(row.priority ?? row.moscow ?? "").trim();

  return buildRequirementItem({
    description,
    type: explicitType || (id.toUpperCase().startsWith("NFR-") ? "NFR" : "FR"),
    priority: explicitPriority,
    category,
    relatedScope,
    metric,
    target,
  });
}

function parseRequirementsLines(
  raw: string,
  briefScopeOptions: string[] = [],
): { items: RequirementItem[]; notes: string[] } {
  const lines = raw.split(/\r?\n/);
  const parsed: Array<Omit<RequirementItem, "id">> = [];
  let currentCategory = "";
  let currentTableHeaders: string[] | null = null;
  let usedMarkdownTableParser = false;
  let inferredScopeCount = 0;

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      currentTableHeaders = null;
      return;
    }

    if (/^-{3,}$/.test(line)) {
      currentTableHeaders = null;
      return;
    }

    const headingCategory = extractHeadingCategory(line);
    if (headingCategory) {
      currentCategory = headingCategory;
      currentTableHeaders = null;
      return;
    }

    if (line.startsWith("#")) {
      currentTableHeaders = null;
      return;
    }

    if (line.startsWith("|")) {
      const cells = splitMarkdownTableRow(line);
      if (cells.length === 0) return;
      if (isMarkdownTableDivider(cells)) return;

      const normalizedHeaders = cells.map(normalizeTableHeader);
      const looksLikeHeader = normalizedHeaders.some((header) =>
        ["id", "description", "priority", "category", "metric", "target", "type", "scope", "related_scope"].includes(
          header,
        ),
      );

      if (!currentTableHeaders || looksLikeHeader) {
        currentTableHeaders = normalizedHeaders;
        return;
      }

      const item = parseMarkdownRequirementRow({
        headers: currentTableHeaders,
        cells,
        currentCategory,
      });
      if (item) {
        parsed.push(item);
        usedMarkdownTableParser = true;
      }
      return;
    }

    currentTableHeaders = null;
    const item = parseStructuredRequirementLine(line, currentCategory);
    if (item) {
      parsed.push(item);
    }
  });

  const items = parsed.map((item, index) => {
    const inferredScope =
      item.related_scope || inferBriefScope(briefScopeOptions, item.category, item.description);
    if (!item.related_scope && inferredScope) {
      inferredScopeCount += 1;
    }

    return {
      id: `req-${index + 1}`,
      ...item,
      related_scope: inferredScope,
    };
  });

  const notes: string[] = [];
  if (usedMarkdownTableParser) {
    notes.push("Detected Markdown table requirements and normalized them into Previo fields.");
  }
  if (inferredScopeCount > 0) {
    notes.push(
      `Auto-linked ${inferredScopeCount} requirement(s) to brief scope items using category or section matches.`,
    );
  }

  return { items, notes };
}

function parseUserStorySentence(value: string) {
  const match = value.match(
    /as\s+a[n]?\s+(.*?),\s*i\s+want\s+(.*?)(?:,\s*so\s+that\s+(.*))?$/i,
  );

  if (!match) return null;

  return {
    role: match[1]?.trim() ?? "",
    goal: match[2]?.trim() ?? "",
    benefit: match[3]?.trim() ?? "",
  };
}

function parseUserStoriesCsv(raw: string): StoryItem[] {
  return parseCsv(raw).map((row, index) => {
    const sentence =
      row.story || row.user_story || row.title || row.summary || "";
    const parsedSentence = parseUserStorySentence(sentence);
    const acceptanceCriteria = (row.acceptance_criteria || row.acceptance || "")
      .split("||")
      .map((part) => part.trim())
      .filter(Boolean);

    return {
      id: row.id || row.key || `story-${index + 1}`,
      role: row.role || parsedSentence?.role || "",
      goal: row.goal || parsedSentence?.goal || sentence || "",
      benefit: row.benefit || parsedSentence?.benefit || "",
      related_requirement:
        row.related_requirement || row.requirement || row.requirement_id || "",
      acceptance_criteria: acceptanceCriteria,
    };
  });
}

function extractNodeLabel(raw: string, fallback: string) {
  return raw.trim().replace(/[_-]+/g, " ") || fallback;
}

function splitMermaidEdge(line: string) {
  const labeledArrowMatch = line.match(/^(.*?)\s*-->\|(.+?)\|\s*(.*)$/);
  if (labeledArrowMatch) {
    return {
      from: labeledArrowMatch[1]?.trim() ?? "",
      label: labeledArrowMatch[2]?.trim() ?? "",
      to: labeledArrowMatch[3]?.trim() ?? "",
    };
  }

  const inlineLabelMatch = line.match(/^(.*?)\s*--\s*(.+?)\s*-->\s*(.*)$/);
  if (inlineLabelMatch) {
    return {
      from: inlineLabelMatch[1]?.trim() ?? "",
      label: inlineLabelMatch[2]?.trim() ?? "",
      to: inlineLabelMatch[3]?.trim() ?? "",
    };
  }

  const plainArrowMatch = line.match(/^(.*?)\s*-->\s*(.*)$/);
  if (plainArrowMatch) {
    return {
      from: plainArrowMatch[1]?.trim() ?? "",
      label: "",
      to: plainArrowMatch[2]?.trim() ?? "",
    };
  }

  return null;
}

function parseFlowchartNode(token: string) {
  const match = token.match(
    /^([A-Za-z0-9_]+)(?:\[(.*?)\]|\((.*?)\)|\{(.*?)\})?$/,
  );
  if (!match) return null;

  return {
    id: match[1],
    label: extractNodeLabel(match[2] || match[3] || match[4] || match[1], match[1]),
    type: match[4] ? "decision" : match[3] ? "start" : "process",
  };
}

function parseDFDNode(token: string) {
  const match = token.match(
    /^([A-Za-z0-9_]+)(?:\[\((.*?)\)\]|\(\((.*?)\)\)|\[(.*?)\])?$/,
  );
  if (!match) return null;

  const label = extractNodeLabel(match[2] || match[3] || match[4] || match[1], match[1]);
  const type: "datastore" | "process" | "entity" = match[2]
    ? "datastore"
    : match[3]
      ? "process"
      : "entity";

  return {
    id: match[1],
    label,
    type,
    related_use_case: "",
    related_erd_entity: type === "datastore" ? label : "",
  };
}

function parseMermaidFlowchart(raw: string) {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const steps = new Map<string, { id: string; label: string; type: string }>();
  const connections: Array<{ id: string; from: string; to: string; label: string }> =
    [];

  lines.forEach((line) => {
    if (line.startsWith("flowchart")) return;
    const edge = splitMermaidEdge(line);
    if (!edge) return;

    const fromNode = parseFlowchartNode(edge.from);
    const toNode = parseFlowchartNode(edge.to);
    if (!fromNode || !toNode) return;

    if (!steps.has(fromNode.id)) {
      steps.set(fromNode.id, fromNode);
    }
    if (!steps.has(toNode.id)) {
      steps.set(toNode.id, {
        ...toNode,
        type: toNode.type === "start" ? "end" : toNode.type,
      });
    }

    connections.push({
      id: crypto.randomUUID(),
      from: fromNode.id,
      to: toNode.id,
      label: edge.label,
    });
  });

  return {
    flows: [
      {
        id: crypto.randomUUID(),
        name: "Imported Mermaid Flow",
        related_use_case: "",
        trigger: "",
        steps: Array.from(steps.values()),
        connections,
      },
    ],
  };
}

function parseMermaidSequence(raw: string) {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const participants: Array<{ name: string; type: string; order: number }> = [];
  const messages: Array<Record<string, unknown>> = [];
  const participantSeen = new Set<string>();

  lines.forEach((line) => {
    if (line.startsWith("sequenceDiagram")) return;
    if (line.startsWith("participant ") || line.startsWith("actor ")) {
      const [kind, ...rest] = line.split(/\s+/);
      const name = rest.join(" ").trim();
      if (name && !participantSeen.has(name)) {
        participantSeen.add(name);
        participants.push({
          name,
          type: kind === "actor" ? "actor" : "system",
          order: participants.length,
        });
      }
      return;
    }

    const match = line.match(/^(.+?)(->>|-->>|->|-->)\s*(.+?)\s*:\s*(.+)$/);
    if (!match) return;

    const from = match[1].trim();
    const to = match[3].trim();
    if (!participantSeen.has(from)) {
      participantSeen.add(from);
      participants.push({ name: from, type: "system", order: participants.length });
    }
    if (!participantSeen.has(to)) {
      participantSeen.add(to);
      participants.push({ name: to, type: "system", order: participants.length });
    }

    messages.push({
      id: crypto.randomUUID(),
      from,
      to,
      content: match[4].trim(),
      type: match[2].includes("--") ? "response" : "request",
      group: "none",
      group_label: "",
    });
  });

  return {
    related_use_case: "",
    participants,
    messages,
  };
}

function parseUseCaseText(raw: string) {
  const blocks = raw
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const useCases = blocks.map((block, index) => {
    const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const nameLine = lines[0]?.replace(/^[-*#\s]+/, "") || `Use Case ${index + 1}`;
    const actorLine = lines.find((line) => /^actor:/i.test(line));
    const descriptionLine = lines.find((line) => /^description:/i.test(line));

    return {
      id: `uc-${index + 1}`,
      name: nameLine,
      primary_actor: actorLine?.replace(/^actor:/i, "").trim() || "User",
      secondary_actors: [],
      description: descriptionLine?.replace(/^description:/i, "").trim() || "",
      preconditions: [],
      postconditions: [],
      main_flow: lines
        .slice(1)
        .filter((line) => !/^actor:/i.test(line) && !/^description:/i.test(line))
        .map((line) => ({
          actor: actorLine?.replace(/^actor:/i, "").trim() || "User",
          action: line.replace(/^[-*]\s*/, ""),
        })),
      alternative_flows: [],
      related_user_stories: [],
      include_extend: [],
    };
  });

  return {
    actors: Array.from(
      new Set(useCases.map((useCase) => useCase.primary_actor).filter(Boolean)),
    ),
    useCases,
  };
}

function parseMermaidDFD(raw: string) {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const nodes = new Map<
    string,
    {
      id: string;
      label: string;
      type: "process" | "entity" | "datastore";
      related_use_case: string;
      related_erd_entity: string;
    }
  >();
  const flows: Array<{ id: string; from: string; to: string; label: string }> = [];

  lines.forEach((line) => {
    if (line.startsWith("graph")) return;
    const edge = splitMermaidEdge(line);
    if (!edge) return;

    const fromNode = parseDFDNode(edge.from);
    const toNode = parseDFDNode(edge.to);
    if (!fromNode || !toNode) return;

    if (!nodes.has(fromNode.id)) {
      nodes.set(fromNode.id, fromNode);
    }
    if (!nodes.has(toNode.id)) {
      nodes.set(toNode.id, toNode);
    }

    flows.push({
      id: crypto.randomUUID(),
      from: fromNode.id,
      to: toNode.id,
      label: edge.label,
    });
  });

  return {
    nodes: Array.from(nodes.values()),
    flows,
  };
}

function parseBacklogCsv(
  raw: string,
  sourceType: Extract<SourceType, "jira_csv" | "linear_csv">,
): BacklogItem[] {
  const externalSource = sourceType === "jira_csv" ? "jira" : "linear";

  return parseCsv(raw).map((row) => {
    const title = row.title || row.summary || row.name || "Untitled task";
    const description = row.description || row.body || "";
    return {
      title,
      description,
      priority: normalizePriority(row.priority || row.severity || ""),
      status: normalizeStatus(row.status || row.state || ""),
      external_source: externalSource,
      external_task_id: row.id || row.key || row.issue || undefined,
      external_status: row.status || row.state || undefined,
      normalized_title: title.trim().toLowerCase(),
    };
  });
}

async function parseBriefText(
  raw: string,
): Promise<Record<string, unknown>> {
  const response = await fetch("/api/ai/import-document", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: raw }),
  });
  const data = (await response.json()) as {
    fields?: ProjectBriefFields;
    error?: string;
  };

  if (!response.ok || !data.fields) {
    throw new Error(data.error ?? "Failed to import brief document.");
  }

  return data.fields as Record<string, unknown>;
}

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asTrimmedStringList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => asTrimmedString(item))
    .filter(Boolean);
}

function buildBriefImportReview(fields: Record<string, unknown>): {
  issues: ImportReviewIssue[];
  unresolvedFields: string[];
} {
  const issues: ImportReviewIssue[] = [];
  const unresolvedFields: string[] = [];

  const requiredFieldChecks: Array<[string, boolean, string]> = [
    ["name", asTrimmedString(fields.name).length > 0, "Project name is still missing."],
    [
      "background",
      asTrimmedString(fields.background).length > 0,
      "Background / project context is still missing.",
    ],
    [
      "target_users",
      asTrimmedStringList(fields.target_users).length > 0,
      "At least one target user is required before the brief becomes canonical.",
    ],
    [
      "scope_in",
      asTrimmedStringList(fields.scope_in).length > 0,
      "At least one scope-in item is required before the brief becomes canonical.",
    ],
    [
      "objectives",
      asTrimmedStringList(fields.objectives).length > 0,
      "At least one objective is required before the brief becomes canonical.",
    ],
  ];

  requiredFieldChecks.forEach(([field, isValid, message]) => {
    if (!isValid) {
      unresolvedFields.push(field);
      issues.push({
        field,
        severity: "error",
        message,
      });
    }
  });

  const constraints = asTrimmedStringList(fields.constraints);
  if (constraints.length === 0) {
    issues.push({
      field: "constraints",
      severity: "warning",
      message:
        "No explicit constraints were detected. Add them if the client has budget, timeline, or technical limits.",
    });
  }

  return { issues, unresolvedFields };
}

function buildRequirementImportReview(
  fields: Record<string, unknown>,
  context?: ImportReviewContext,
): {
  issues: ImportReviewIssue[];
  unresolvedFields: string[];
} {
  const issues: ImportReviewIssue[] = [];
  const unresolvedFields: string[] = [];
  const items = Array.isArray(fields.items) ? fields.items : [];
  const briefScopes = new Set(
    (context?.briefScopeOptions ?? []).map((scope) => scope.trim().toLowerCase()),
  );

  if (items.length === 0) {
    issues.push({
      field: "items",
      severity: "error",
      message: "No requirements were parsed from the imported source.",
    });
    unresolvedFields.push("items");
    return { issues, unresolvedFields };
  }

  const frItems = items.filter((item) => {
    const type = asTrimmedString((item as Record<string, unknown>).type).toUpperCase();
    return type === "" || type === "FR";
  });

  if (frItems.length === 0) {
    issues.push({
      field: "items",
      severity: "error",
      message: "At least one functional requirement is required for implementation planning.",
    });
    unresolvedFields.push("items");
  }

  items.forEach((item, index) => {
    const requirement = item as Record<string, unknown>;
    const description = asTrimmedString(requirement.description);
    const category = asTrimmedString(requirement.category);
    const relatedScope = asTrimmedString(requirement.related_scope);
    const type = asTrimmedString(requirement.type).toUpperCase() || "FR";
    const fieldBase = `items[${index}]`;

    if (!description) {
      unresolvedFields.push(`${fieldBase}.description`);
      issues.push({
        field: `${fieldBase}.description`,
        severity: "error",
        message: `Requirement ${index + 1} is missing a description.`,
      });
    }

    if (!category) {
      unresolvedFields.push(`${fieldBase}.category`);
      issues.push({
        field: `${fieldBase}.category`,
        severity: "warning",
        message: `Requirement ${index + 1} has no category yet.`,
      });
    }

    if (type === "FR" && briefScopes.size > 0 && !relatedScope) {
      unresolvedFields.push(`${fieldBase}.related_scope`);
      issues.push({
        field: `${fieldBase}.related_scope`,
        severity: "warning",
        message: `Requirement ${index + 1} is not linked to any brief scope item.`,
      });
    } else if (
      type === "FR" &&
      relatedScope &&
      briefScopes.size > 0 &&
      !briefScopes.has(relatedScope.toLowerCase())
    ) {
      unresolvedFields.push(`${fieldBase}.related_scope`);
      issues.push({
        field: `${fieldBase}.related_scope`,
        severity: "warning",
        message: `Requirement ${index + 1} points to a scope item that is not present in the current brief.`,
      });
    }
  });

  return { issues, unresolvedFields: Array.from(new Set(unresolvedFields)) };
}

function buildStoryImportReview(
  fields: Record<string, unknown>,
  context?: ImportReviewContext,
) {
  const issues: ImportReviewIssue[] = [];
  const unresolvedFields: string[] = [];
  const items = Array.isArray(fields.items) ? fields.items : [];
  const requirementOptions = new Set(
    (context?.requirementOptions ?? []).map((option) => option.value.toLowerCase()),
  );

  if (items.length === 0) {
    issues.push({
      field: "items",
      severity: "error",
      message: "No user stories were parsed from the imported source.",
    });
    unresolvedFields.push("items");
    return { issues, unresolvedFields };
  }

  items.forEach((item, index) => {
    const story = item as Record<string, unknown>;
    const role = asTrimmedString(story.role);
    const goal = asTrimmedString(story.goal);
    const benefit = asTrimmedString(story.benefit);
    const relatedRequirement = asTrimmedString(story.related_requirement);
    const fieldBase = `items[${index}]`;

    if (!role) {
      unresolvedFields.push(`${fieldBase}.role`);
      issues.push({
        field: `${fieldBase}.role`,
        severity: "warning",
        message: `Story ${index + 1} does not have a target persona yet.`,
      });
    }

    if (!goal) {
      unresolvedFields.push(`${fieldBase}.goal`);
      issues.push({
        field: `${fieldBase}.goal`,
        severity: "error",
        message: `Story ${index + 1} is missing its goal statement.`,
      });
    }

    if (!benefit) {
      issues.push({
        field: `${fieldBase}.benefit`,
        severity: "warning",
        message: `Story ${index + 1} has no explicit benefit yet.`,
      });
    }

    if (requirementOptions.size > 0 && !relatedRequirement) {
      unresolvedFields.push(`${fieldBase}.related_requirement`);
      issues.push({
        field: `${fieldBase}.related_requirement`,
        severity: "warning",
        message: `Story ${index + 1} is not linked to any imported requirement.`,
      });
    } else if (
      relatedRequirement &&
      requirementOptions.size > 0 &&
      !requirementOptions.has(relatedRequirement.toLowerCase())
    ) {
      unresolvedFields.push(`${fieldBase}.related_requirement`);
      issues.push({
        field: `${fieldBase}.related_requirement`,
        severity: "warning",
        message: `Story ${index + 1} points to a requirement id that is not present in the current requirements node.`,
      });
    }
  });

  return { issues, unresolvedFields: Array.from(new Set(unresolvedFields)) };
}

function buildERDImportReview(fields: Record<string, unknown>) {
  const issues: ImportReviewIssue[] = [];
  const unresolvedFields: string[] = [];
  const entities = Array.isArray(fields.entities) ? fields.entities : [];
  const relationships = Array.isArray(fields.relationships) ? fields.relationships : [];

  if (entities.length === 0) {
    issues.push({
      field: "entities",
      severity: "error",
      message: "No entities were parsed from the imported schema.",
    });
    unresolvedFields.push("entities");
    return { issues, unresolvedFields };
  }

  entities.forEach((entity, index) => {
    const currentEntity = entity as Record<string, unknown>;
    const attributes = Array.isArray(currentEntity.attributes)
      ? currentEntity.attributes
      : [];
    const fieldBase = `entities[${index}]`;

    if (!asTrimmedString(currentEntity.name)) {
      unresolvedFields.push(`${fieldBase}.name`);
      issues.push({
        field: `${fieldBase}.name`,
        severity: "error",
        message: `Entity ${index + 1} is missing a name.`,
      });
    }

    if (attributes.length === 0) {
      issues.push({
        field: `${fieldBase}.attributes`,
        severity: "warning",
        message: `Entity ${index + 1} has no parsed attributes yet.`,
      });
    }
  });

  if (relationships.length === 0 && entities.length > 1) {
    issues.push({
      field: "relationships",
      severity: "warning",
      message: "No relationships were parsed from the schema yet.",
    });
  }

  return { issues, unresolvedFields: Array.from(new Set(unresolvedFields)) };
}

function buildFlowchartImportReview(
  fields: Record<string, unknown>,
  context?: ImportReviewContext,
) {
  const issues: ImportReviewIssue[] = [];
  const unresolvedFields: string[] = [];
  const flows = Array.isArray(fields.flows) ? fields.flows : [];
  const useCaseOptions = new Set(
    (context?.useCaseOptions ?? []).map((option) => option.value.toLowerCase()),
  );

  if (flows.length === 0) {
    issues.push({
      field: "flows",
      severity: "error",
      message: "No flow definitions were parsed from the imported Mermaid source.",
    });
    unresolvedFields.push("flows");
    return { issues, unresolvedFields };
  }

  flows.forEach((flow, index) => {
    const currentFlow = flow as Record<string, unknown>;
    const steps = Array.isArray(currentFlow.steps) ? currentFlow.steps : [];
    const connections = Array.isArray(currentFlow.connections)
      ? currentFlow.connections
      : [];
    const relatedUseCase = asTrimmedString(currentFlow.related_use_case);
    const fieldBase = `flows[${index}]`;

    if (!asTrimmedString(currentFlow.name)) {
      unresolvedFields.push(`${fieldBase}.name`);
      issues.push({
        field: `${fieldBase}.name`,
        severity: "warning",
        message: `Flow ${index + 1} has no explicit name yet.`,
      });
    }

    if (steps.length === 0) {
      unresolvedFields.push(`${fieldBase}.steps`);
      issues.push({
        field: `${fieldBase}.steps`,
        severity: "error",
        message: `Flow ${index + 1} has no parsed steps.`,
      });
    }

    if (connections.length === 0 && steps.length > 1) {
      issues.push({
        field: `${fieldBase}.connections`,
        severity: "warning",
        message: `Flow ${index + 1} still needs explicit logical connections.`,
      });
    }

    if (useCaseOptions.size > 0 && !relatedUseCase) {
      unresolvedFields.push(`${fieldBase}.related_use_case`);
      issues.push({
        field: `${fieldBase}.related_use_case`,
        severity: "warning",
        message: `Flow ${index + 1} is not linked to a use case yet.`,
      });
    } else if (
      relatedUseCase &&
      useCaseOptions.size > 0 &&
      !useCaseOptions.has(relatedUseCase.toLowerCase())
    ) {
      unresolvedFields.push(`${fieldBase}.related_use_case`);
      issues.push({
        field: `${fieldBase}.related_use_case`,
        severity: "warning",
        message: `Flow ${index + 1} points to a use case id that is not present in the current use cases node.`,
      });
    }
  });

  return { issues, unresolvedFields: Array.from(new Set(unresolvedFields)) };
}

function buildSequenceImportReview(
  fields: Record<string, unknown>,
  context?: ImportReviewContext,
) {
  const issues: ImportReviewIssue[] = [];
  const unresolvedFields: string[] = [];
  const participants = Array.isArray(fields.participants) ? fields.participants : [];
  const messages = Array.isArray(fields.messages) ? fields.messages : [];
  const relatedUseCase = asTrimmedString(fields.related_use_case);
  const useCaseOptions = new Set(
    (context?.useCaseOptions ?? []).map((option) => option.value.toLowerCase()),
  );

  if (participants.length === 0) {
    unresolvedFields.push("participants");
    issues.push({
      field: "participants",
      severity: "error",
      message: "No sequence participants were parsed from the imported Mermaid source.",
    });
  }

  if (messages.length === 0) {
    unresolvedFields.push("messages");
    issues.push({
      field: "messages",
      severity: "error",
      message: "No sequence interactions were parsed from the imported Mermaid source.",
    });
  }

  if (useCaseOptions.size > 0 && !relatedUseCase) {
    unresolvedFields.push("related_use_case");
    issues.push({
      field: "related_use_case",
      severity: "warning",
      message: "The imported sequence is not linked to a use case yet.",
    });
  } else if (
    relatedUseCase &&
    useCaseOptions.size > 0 &&
    !useCaseOptions.has(relatedUseCase.toLowerCase())
  ) {
    unresolvedFields.push("related_use_case");
    issues.push({
      field: "related_use_case",
      severity: "warning",
      message: "The imported sequence points to a use case id that is not present in the current use cases node.",
    });
  }

  return { issues, unresolvedFields: Array.from(new Set(unresolvedFields)) };
}

function buildImportReview(
  nodeType: string,
  fields: Record<string, unknown>,
  context?: ImportReviewContext,
) {
  if (nodeType === "project_brief") {
    return buildBriefImportReview(fields);
  }

  if (nodeType === "requirements") {
    return buildRequirementImportReview(fields, context);
  }

  if (nodeType === "user_stories") {
    return buildStoryImportReview(fields, context);
  }

  if (nodeType === "erd") {
    return buildERDImportReview(fields);
  }

  if (nodeType === "flowchart") {
    return buildFlowchartImportReview(fields, context);
  }

  if (nodeType === "sequence") {
    return buildSequenceImportReview(fields, context);
  }

  return {
    issues: [] as ImportReviewIssue[],
    unresolvedFields: [] as string[],
  };
}

export function revalidateResolvedNodeImport(
  result: Pick<ResolvedNodeImport, "nodeType" | "reviewContext"> &
    Omit<ResolvedNodeImport, "issues" | "unresolvedFields">,
  fields: Record<string, unknown>,
): ResolvedNodeImport {
  const review = buildImportReview(result.nodeType, fields, result.reviewContext);
  return {
    ...result,
    fields,
    issues: review.issues,
    unresolvedFields: review.unresolvedFields,
  };
}

export async function resolveNodeImport(params: {
  nodeType: string;
  sourceType: SourceType;
  rawContent: string;
  projectId: string;
}): Promise<ResolvedNodeImport> {
  const { nodeType, sourceType, rawContent } = params;
  let fields: Record<string, unknown>;
  let title = "Imported source";
  let mermaidSyntax: string | undefined;
  let reviewContext: ImportReviewContext | undefined;

  if (nodeType === "project_brief") {
    fields = await parseBriefText(rawContent);
    title = "Imported brief";
  } else if (nodeType === "requirements") {
    let briefScopeOptions: string[] = [];

    try {
      const briefNode = await NodeRepository.findByProjectAndType(
        params.projectId,
        "project_brief",
      );
      const briefContent = briefNode
        ? await NodeContentRepository.findByNodeId(briefNode.id)
        : null;
      briefScopeOptions = asTrimmedStringList(
        getCanonicalNodeFields("project_brief", briefContent).scope_in,
      );
    } catch {
      briefScopeOptions = [];
    }

    const parsedRequirements = parseRequirementsLines(rawContent, briefScopeOptions);
    fields = { items: parsedRequirements.items };
    title = "Imported requirements";
    reviewContext = {
      briefScopeOptions,
      importNotes: parsedRequirements.notes,
    };
  } else if (nodeType === "user_stories") {
    let requirementOptions: Array<{ value: string; label: string }> = [];
    try {
      const requirementsNode = await NodeRepository.findByProjectAndType(
        params.projectId,
        "requirements",
      );
      const requirementsContent = requirementsNode
        ? await NodeContentRepository.findByNodeId(requirementsNode.id)
        : null;
      const requirementItems =
        getCanonicalNodeFields("requirements", requirementsContent).items ?? [];
      requirementOptions = requirementItems
        .filter((item) => asTrimmedString(item.type || "FR").toUpperCase() === "FR")
        .map((item, index) => ({
          value: asTrimmedString(item.id) || `FR-${String(index + 1).padStart(3, "0")}`,
          label: `FR-${String(index + 1).padStart(3, "0")} - ${asTrimmedString(item.description) || "Untitled requirement"}`,
        }));
    } catch {
      requirementOptions = [];
    }
    fields = { items: parseUserStoriesCsv(rawContent) };
    title = "Imported user stories";
    reviewContext = { requirementOptions };
  } else if (nodeType === "erd") {
    const schemaFields =
      sourceType === "dbml" ? parseDbmlToERD(rawContent) : parseSqlToERD(rawContent);
    if (!schemaFields.entities?.length) {
      throw new Error("Schema import did not produce any entities.");
    }
    fields = schemaFields as Record<string, unknown>;
    title = "Imported schema";
  } else if (nodeType === "flowchart") {
    let useCaseOptions: Array<{ value: string; label: string }> = [];
    try {
      const useCaseNode = await NodeRepository.findByProjectAndType(
        params.projectId,
        "use_cases",
      );
      const useCaseContent = useCaseNode
        ? await NodeContentRepository.findByNodeId(useCaseNode.id)
        : null;
      const useCases: UseCaseFields["useCases"] =
        getCanonicalNodeFields("use_cases", useCaseContent).useCases ?? [];
      useCaseOptions = useCases.map((useCase, index) => ({
        value: asTrimmedString(useCase.id) || `uc-${index + 1}`,
        label: `UC-${String(index + 1).padStart(3, "0")} - ${asTrimmedString(useCase.name) || "Untitled use case"}`,
      }));
    } catch {
      useCaseOptions = [];
    }
    fields = parseMermaidFlowchart(rawContent);
    title = "Imported flowchart";
    mermaidSyntax = rawContent;
    reviewContext = { useCaseOptions };
  } else if (nodeType === "sequence") {
    let useCaseOptions: Array<{ value: string; label: string }> = [];
    try {
      const useCaseNode = await NodeRepository.findByProjectAndType(
        params.projectId,
        "use_cases",
      );
      const useCaseContent = useCaseNode
        ? await NodeContentRepository.findByNodeId(useCaseNode.id)
        : null;
      const useCases: UseCaseFields["useCases"] =
        getCanonicalNodeFields("use_cases", useCaseContent).useCases ?? [];
      useCaseOptions = useCases.map((useCase, index) => ({
        value: asTrimmedString(useCase.id) || `uc-${index + 1}`,
        label: `UC-${String(index + 1).padStart(3, "0")} - ${asTrimmedString(useCase.name) || "Untitled use case"}`,
      }));
    } catch {
      useCaseOptions = [];
    }
    fields = parseMermaidSequence(rawContent);
    title = "Imported sequence";
    mermaidSyntax = rawContent;
    reviewContext = { useCaseOptions };
  } else if (nodeType === "use_cases") {
    fields = parseUseCaseText(rawContent);
    title = "Imported use cases";
  } else if (nodeType === "dfd") {
    fields = parseMermaidDFD(rawContent);
    title = "Imported DFD";
    mermaidSyntax = rawContent;
  } else {
    throw new Error(`Import is not supported for node type "${nodeType}".`);
  }

  return revalidateResolvedNodeImport(
    {
      nodeType,
      fields,
      sourceType,
      rawContent,
      parserVersion: SOURCE_ARTIFACT_PARSER_VERSION,
      title,
      mermaidSyntax,
      reviewContext,
    },
    fields,
  );
}

export async function generateDerivedNode(params: {
  nodeType: "use_cases" | "dfd";
  projectId: string;
}): Promise<ResolvedNodeImport> {
  const { nodeType, projectId } = params;

  if (nodeType === "use_cases") {
    const fields = await generateUseCaseDrafts(projectId);
    return {
      nodeType,
      fields: fields as Record<string, unknown>,
      sourceType: "manual_structured",
      rawContent: "Generated from brief, requirements, and user stories.",
      parserVersion: SOURCE_ARTIFACT_PARSER_VERSION,
      title: "Generated use cases",
      issues: [],
      unresolvedFields: [],
    };
  }

  const fields = await generateDFDFromProject(projectId);
  return {
    nodeType,
    fields: fields as Record<string, unknown>,
    sourceType: "manual_structured",
    rawContent: "Generated from project brief, use cases, and ERD.",
    parserVersion: SOURCE_ARTIFACT_PARSER_VERSION,
    title: "Generated DFD",
    issues: [],
    unresolvedFields: [],
  };
}

export async function resolveBacklogImport(params: {
  sourceType: Extract<SourceType, "jira_csv" | "linear_csv">;
  rawContent: string;
}): Promise<ResolvedTaskImport> {
  const { sourceType, rawContent } = params;
  return {
    items: parseBacklogCsv(rawContent, sourceType),
    sourceType,
    rawContent,
    parserVersion: SOURCE_ARTIFACT_PARSER_VERSION,
    title: "Imported backlog",
  };
}

export function createSourceArtifactInput(params: {
  projectId: string;
  nodeId: string;
  targetNodeType?: import("@/lib/canonical").NodeType;
  sourceType: SourceType;
  title: string;
  rawContent: string;
  normalizedData: Record<string, unknown>;
}): SourceArtifactInput {
  return {
    project_id: params.projectId,
    node_id: params.nodeId,
    target_node_type: params.targetNodeType,
    source_type: params.sourceType,
    import_status: "accepted",
    title: params.title,
    raw_content: params.rawContent,
    normalized_data: params.normalizedData,
    parser_version: SOURCE_ARTIFACT_PARSER_VERSION,
    content_schema_version: 1,
  };
}
