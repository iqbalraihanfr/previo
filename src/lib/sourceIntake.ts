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

export interface ResolvedNodeImport {
  fields: Record<string, unknown>;
  sourceType: SourceType;
  rawContent: string;
  parserVersion: string;
  title: string;
  mermaidSyntax?: string;
}

export interface ResolvedTaskImport {
  items: BacklogItem[];
  sourceType: Extract<SourceType, "jira_csv" | "linear_csv">;
  rawContent: string;
  parserVersion: string;
  title: string;
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

function parseRequirementsLines(raw: string): RequirementItem[] {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !line.startsWith("#"));

  const parsed: Array<RequirementItem | null> = lines.map((line, index) => {
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

      return {
        id: `req-${index + 1}`,
        type: (typeMatch?.[1]?.toUpperCase() as "FR" | "NFR") || "FR",
        description,
        priority: ((priorityMatch?.[1] ?? "Should").replace("Won't", "Wont") as RequirementItem["priority"]),
        category: category || "General",
        related_scope: scope || undefined,
        metric: metric || undefined,
        target: target || undefined,
      };
    });

  return parsed.filter((item): item is RequirementItem => item !== null);
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

export async function resolveNodeImport(params: {
  nodeType: string;
  sourceType: SourceType;
  rawContent: string;
  projectId: string;
}): Promise<ResolvedNodeImport> {
  const { nodeType, sourceType, rawContent } = params;

  if (nodeType === "project_brief") {
    return {
      fields: await parseBriefText(rawContent),
      sourceType,
      rawContent,
      parserVersion: SOURCE_ARTIFACT_PARSER_VERSION,
      title: "Imported brief",
    };
  }

  if (nodeType === "requirements") {
    return {
      fields: { items: parseRequirementsLines(rawContent) },
      sourceType,
      rawContent,
      parserVersion: SOURCE_ARTIFACT_PARSER_VERSION,
      title: "Imported requirements",
    };
  }

  if (nodeType === "user_stories") {
    return {
      fields: { items: parseUserStoriesCsv(rawContent) },
      sourceType,
      rawContent,
      parserVersion: SOURCE_ARTIFACT_PARSER_VERSION,
      title: "Imported user stories",
    };
  }

  if (nodeType === "erd") {
    const fields =
      sourceType === "dbml" ? parseDbmlToERD(rawContent) : parseSqlToERD(rawContent);
    if (!fields.entities?.length) {
      throw new Error("Schema import did not produce any entities.");
    }
    return {
      fields: fields as Record<string, unknown>,
      sourceType,
      rawContent,
      parserVersion: SOURCE_ARTIFACT_PARSER_VERSION,
      title: "Imported schema",
    };
  }

  if (nodeType === "flowchart") {
    return {
      fields: parseMermaidFlowchart(rawContent),
      sourceType,
      rawContent,
      parserVersion: SOURCE_ARTIFACT_PARSER_VERSION,
      title: "Imported flowchart",
      mermaidSyntax: rawContent,
    };
  }

  if (nodeType === "sequence") {
    return {
      fields: parseMermaidSequence(rawContent),
      sourceType,
      rawContent,
      parserVersion: SOURCE_ARTIFACT_PARSER_VERSION,
      title: "Imported sequence",
      mermaidSyntax: rawContent,
    };
  }

  if (nodeType === "use_cases") {
    return {
      fields: parseUseCaseText(rawContent),
      sourceType,
      rawContent,
      parserVersion: SOURCE_ARTIFACT_PARSER_VERSION,
      title: "Imported use cases",
    };
  }

  if (nodeType === "dfd") {
    return {
      fields: parseMermaidDFD(rawContent),
      sourceType,
      rawContent,
      parserVersion: SOURCE_ARTIFACT_PARSER_VERSION,
      title: "Imported DFD",
      mermaidSyntax: rawContent,
    };
  }

  throw new Error(`Import is not supported for node type "${nodeType}".`);
}

export async function generateDerivedNode(params: {
  nodeType: "use_cases" | "dfd";
  projectId: string;
}): Promise<ResolvedNodeImport> {
  const { nodeType, projectId } = params;

  if (nodeType === "use_cases") {
    const fields = await generateUseCaseDrafts(projectId);
    return {
      fields: fields as Record<string, unknown>,
      sourceType: "manual_structured",
      rawContent: "Generated from brief, requirements, and user stories.",
      parserVersion: SOURCE_ARTIFACT_PARSER_VERSION,
      title: "Generated use cases",
    };
  }

  const fields = await generateDFDFromProject(projectId);
  return {
    fields: fields as Record<string, unknown>,
    sourceType: "manual_structured",
    rawContent: "Generated from project brief, use cases, and ERD.",
    parserVersion: SOURCE_ARTIFACT_PARSER_VERSION,
    title: "Generated DFD",
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
  sourceType: SourceType;
  title: string;
  rawContent: string;
  normalizedData: Record<string, unknown>;
}): SourceArtifactInput {
  return {
    project_id: params.projectId,
    node_id: params.nodeId,
    source_type: params.sourceType,
    title: params.title,
    raw_content: params.rawContent,
    normalized_data: params.normalizedData,
    parser_version: SOURCE_ARTIFACT_PARSER_VERSION,
  };
}
