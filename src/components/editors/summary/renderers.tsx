import { useEffect, useState, useMemo } from "react";
import mermaid from "mermaid";
import { MarkdownViewer as MarkdownBlock } from "@/components/ui/markdown-viewer";
import type { NodeData } from "@/lib/db";
import type { ProjectBriefFields } from "@/components/editors/ProjectBriefEditor";

import type {
  SummaryStructuredFields,
  SummaryContent,
  DFDFlow,
} from "./types";

import {
  asString,
  asStringArray,
  getRequirementItems,
  getUserStoryItems,
  getUseCaseItems,
  getERDEntities,
  getFlowchartFlows,
  getSequenceMessages,
  getDFDNodes,
  isObject,
  formatMermaidError,
} from "./helpers";

export const STATUS_BADGE_CLASS: Record<NodeData["status"], string> = {
  Done: "bg-green-500/10 text-green-600",
  "In Progress": "bg-blue-500/10 text-blue-600",
  Empty: "bg-muted text-muted-foreground",
};

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "strict",
});

export function SummarySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h4 className="border-b pb-1 text-xs font-semibold uppercase text-muted-foreground">
        {title}
      </h4>
      {children}
    </div>
  );
}

export function MermaidPreview({ syntax }: { syntax: string }) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function renderDiagram() {
      if (!syntax.trim()) {
        if (!isCancelled) {
          setSvg("");
          setError(null);
        }
        return;
      }

      try {
        const id = `summary-mermaid-${crypto.randomUUID()}`;
        const rendered = await mermaid.render(id, syntax);

        if (!isCancelled) {
          setSvg(rendered.svg);
          setError(null);
        }
      } catch (renderError: unknown) {
        if (!isCancelled) {
          setSvg("");
          setError(formatMermaidError(renderError));
        }
      }
    }

    void renderDiagram();

    return () => {
      isCancelled = true;
    };
  }, [syntax]);

  return (
    <div className="rounded-md border bg-white p-4 min-h-25 overflow-x-auto">
      {error ? (
        <div className="rounded bg-red-50 p-4 text-sm text-red-500 dark:bg-red-950">
          {error}
        </div>
      ) : svg ? (
        <div
          className="mermaid-preview flex h-full w-full items-center justify-center"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <p className="text-sm text-muted-foreground">No diagram available.</p>
      )}
    </div>
  );
}

export function renderProjectBrief(fields: ProjectBriefFields) {
  const objectives = Array.isArray(fields.objectives) ? fields.objectives : [];
  const targetUsers = Array.isArray(fields.target_users)
    ? fields.target_users
    : [];
  const scopeIn = Array.isArray(fields.scope_in) ? fields.scope_in : [];
  const scopeOut = Array.isArray(fields.scope_out) ? fields.scope_out : [];
  const successMetrics = Array.isArray(fields.success_metrics)
    ? fields.success_metrics
    : [];
  const techStack = Array.isArray(fields.tech_stack) ? fields.tech_stack : [];
  const constraints = Array.isArray(fields.constraints)
    ? fields.constraints
    : [];
  const references = Array.isArray(fields.references) ? fields.references : [];

  return (
    <div className="space-y-4 text-sm">
      {fields.name && (
        <div>
          <span className="font-semibold text-muted-foreground">
            Project Name:
          </span>{" "}
          {fields.name}
        </div>
      )}

      {fields.background && (
        <div>
          <span className="font-semibold text-muted-foreground">
            Background / Why:
          </span>
          <p className="mt-1">{fields.background}</p>
        </div>
      )}

      {objectives.length > 0 && (
        <div>
          <span className="font-semibold text-muted-foreground">
            Objectives:
          </span>
          <ul className="mt-1 list-disc pl-5">
            {objectives.map((objective, index) => (
              <li key={`${objective}-${index}`}>{objective}</li>
            ))}
          </ul>
        </div>
      )}

      {targetUsers.length > 0 && (
        <div>
          <span className="font-semibold text-muted-foreground">
            Target Users:
          </span>{" "}
          {targetUsers.join(", ")}
        </div>
      )}

      {scopeIn.length > 0 && (
        <div>
          <span className="font-semibold text-muted-foreground">Scope In:</span>
          <ul className="mt-1 list-disc pl-5">
            {scopeIn.map((scopeItem, index) => (
              <li key={`${scopeItem}-${index}`}>{scopeItem}</li>
            ))}
          </ul>
        </div>
      )}

      {scopeOut.length > 0 && (
        <div>
          <span className="font-semibold text-muted-foreground">
            Scope Out:
          </span>
          <ul className="mt-1 list-disc pl-5">
            {scopeOut.map((scopeItem, index) => (
              <li key={`${scopeItem}-${index}`}>{scopeItem}</li>
            ))}
          </ul>
        </div>
      )}

      {successMetrics.length > 0 && (
        <div>
          <span className="font-semibold text-muted-foreground">
            Success Metrics:
          </span>
          <ul className="mt-1 list-disc pl-5">
            {successMetrics.map((metric, index) => {
              const metricName = asString(metric.metric);
              const target = asString(metric.target);
              if (!metricName && !target) return null;

              return (
                <li key={`${metricName}-${target}-${index}`}>
                  {metricName || "Metric"}
                  {target ? `: ${target}` : ""}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {techStack.length > 0 && (
        <div>
          <span className="font-semibold text-muted-foreground">
            Tech Stack:
          </span>{" "}
          {techStack.join(", ")}
        </div>
      )}

      {constraints.length > 0 && (
        <div>
          <span className="font-semibold text-muted-foreground">
            Constraints:
          </span>
          <ul className="mt-1 list-disc pl-5">
            {constraints.map((constraint, index) => (
              <li key={`${constraint}-${index}`}>{constraint}</li>
            ))}
          </ul>
        </div>
      )}

      {references.length > 0 && (
        <div>
          <span className="font-semibold text-muted-foreground">
            References:
          </span>
          <ul className="mt-1 list-disc pl-5">
            {references.map((reference, index) => {
              const name = asString(reference.name);
              const url = asString(reference.url);
              if (!name && !url) return null;

              return (
                <li key={`${name}-${url}-${index}`}>
                  {name || "Reference"}
                  {url ? ` — ${url}` : ""}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export function renderRequirements(fields: SummaryStructuredFields) {
  const items = getRequirementItems(fields);

  if (items.length === 0) {
    return (
      <p className="text-sm italic text-muted-foreground">
        No requirements defined.
      </p>
    );
  }

  return (
    <ul className="list-disc space-y-2 pl-5 text-sm">
      {items.map((item, index) => {
        const priority = asString(item.priority) || "Unspecified";
        const description =
          asString(item.description) || "Untitled requirement";
        const type = asString(item.type || "FR");

        return (
          <li key={item.id ?? `${type}-${index}`}>
            <span className="font-semibold">
              [{type} · {priority}]
            </span>{" "}
            {description}
          </li>
        );
      })}
    </ul>
  );
}

export function renderUserStories(fields: SummaryStructuredFields) {
  const items = getUserStoryItems(fields);

  if (items.length === 0) {
    return (
      <p className="text-sm italic text-muted-foreground">
        No user stories defined.
      </p>
    );
  }

  return (
    <ul className="space-y-3 text-sm">
      {items.map((item, index) => (
        <li
          key={item.id ?? `story-${index}`}
          className="rounded-md border bg-muted/30 p-3"
        >
          <strong>As a</strong> {asString(item.role) || "..."},{" "}
          <strong>I want</strong> {asString(item.goal) || "..."},{" "}
          <strong>so that</strong> {asString(item.benefit) || "..."}
        </li>
      ))}
    </ul>
  );
}

export function renderUseCases(fields: SummaryStructuredFields) {
  const useCases = getUseCaseItems(fields);

  if (useCases.length === 0) {
    return (
      <p className="text-sm italic text-muted-foreground">
        No use cases defined.
      </p>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      {useCases.map((useCase, index) => {
        const mainFlow = Array.isArray(useCase.main_flow)
          ? useCase.main_flow
          : [];
        const preconditions = asStringArray(useCase.preconditions);
        const postconditions = asStringArray(useCase.postconditions);

        return (
          <div
            key={useCase.id ?? `uc-${index}`}
            className="rounded-md border bg-muted/20 p-3"
          >
            <div className="flex items-center gap-2">
              <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
                UC-{String(index + 1).padStart(3, "0")}
              </span>
              <span className="font-semibold">
                {asString(useCase.name) || "Untitled Use Case"}
              </span>
            </div>

            {useCase.description && (
              <p className="mt-2 text-muted-foreground">
                {useCase.description}
              </p>
            )}

            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <div>
                <span className="font-semibold text-muted-foreground">
                  Primary Actor:
                </span>{" "}
                {asString(useCase.primary_actor) || "—"}
              </div>
              <div>
                <span className="font-semibold text-muted-foreground">
                  Secondary Actors:
                </span>{" "}
                {asStringArray(useCase.secondary_actors).join(", ") || "—"}
              </div>
            </div>

            {preconditions.length > 0 && (
              <div className="mt-3">
                <span className="font-semibold text-muted-foreground">
                  Preconditions:
                </span>
                <ul className="mt-1 list-disc pl-5">
                  {preconditions.map((item, itemIndex) => (
                    <li key={`${item}-${itemIndex}`}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {mainFlow.length > 0 && (
              <div className="mt-3">
                <span className="font-semibold text-muted-foreground">
                  Main Flow:
                </span>
                <ol className="mt-1 list-decimal pl-5">
                  {mainFlow.map((step, stepIndex) => (
                    <li key={`${useCase.id ?? index}-step-${stepIndex}`}>
                      {[asString(step.actor), asString(step.action)]
                        .filter((part) => part.trim().length > 0)
                        .join(": ") || "Unspecified step"}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {postconditions.length > 0 && (
              <div className="mt-3">
                <span className="font-semibold text-muted-foreground">
                  Postconditions:
                </span>
                <ul className="mt-1 list-disc pl-5">
                  {postconditions.map((item, itemIndex) => (
                    <li key={`${item}-${itemIndex}`}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function renderERDSummary(fields: SummaryStructuredFields) {
  const entities = getERDEntities(fields);

  if (entities.length === 0) {
    return (
      <p className="text-sm italic text-muted-foreground">
        No entities defined.
      </p>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      {entities.map((entity, index) => {
        const attributes = Array.isArray(entity.attributes)
          ? entity.attributes
          : [];

        return (
          <div
            key={entity.id ?? `entity-${index}`}
            className="rounded-md border bg-muted/20 p-3"
          >
            <div className="font-semibold">
              {asString(entity.name) || "Unnamed Entity"}
            </div>

            {entity.description && (
              <p className="mt-1 text-muted-foreground">{entity.description}</p>
            )}

            {attributes.length > 0 && (
              <ul className="mt-2 list-disc pl-5">
                {attributes.map((attribute, attributeIndex) => {
                  const flags = [
                    attribute.isPrimaryKey ? "PK" : null,
                    attribute.isForeignKey ? "FK" : null,
                    attribute.isUnique ? "Unique" : null,
                    attribute.isIndex ? "Index" : null,
                  ].filter(Boolean);

                  return (
                    <li key={`${entity.id ?? index}-attr-${attributeIndex}`}>
                      <span className="font-mono">
                        {asString(attribute.name) || "column"}
                      </span>
                      {attribute.type ? ` : ${attribute.type}` : ""}
                      {flags.length > 0 ? ` (${flags.join(", ")})` : ""}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function renderFlowchartSummary(fields: SummaryStructuredFields) {
  const flows = getFlowchartFlows(fields);

  if (flows.length === 0) {
    return (
      <p className="text-sm italic text-muted-foreground">No flows defined.</p>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      {flows.map((flow, index) => {
        const steps = Array.isArray(flow.steps) ? flow.steps : [];
        const connections = Array.isArray(flow.connections)
          ? flow.connections
          : [];

        return (
          <div
            key={flow.id ?? `flow-${index}`}
            className="rounded-md border bg-muted/20 p-3"
          >
            <div className="font-semibold">
              {asString(flow.name) || `Flow ${index + 1}`}
            </div>
            {flow.trigger && (
              <p className="mt-1 text-muted-foreground">
                Trigger: {flow.trigger}
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {steps.length} steps · {connections.length} connections
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function renderSequenceSummary(fields: SummaryStructuredFields) {
  const rawParticipants = Array.isArray(fields.participants)
    ? fields.participants
    : [];
  const participants = rawParticipants
    .map((participant) =>
      typeof participant === "string"
        ? participant
        : asString(participant.name),
    )
    .filter((name) => name.trim().length > 0);

  const messages = getSequenceMessages(fields);

  if (participants.length === 0 && messages.length === 0) {
    return (
      <p className="text-sm italic text-muted-foreground">
        No sequence interactions defined.
      </p>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      {participants.length > 0 && (
        <div>
          <span className="font-semibold text-muted-foreground">
            Participants:
          </span>{" "}
          {participants.join(", ")}
        </div>
      )}

      {messages.length > 0 && (
        <ol className="list-decimal space-y-2 pl-5">
          {messages.map((message, index) => (
            <li key={message.id ?? `message-${index}`}>
              <span className="font-semibold">
                {asString(message.from) || "Unknown"} →{" "}
                {asString(message.to) || "Unknown"}:
              </span>{" "}
              {asString(message.content) || "No message content"}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function renderDFDSummary(fields: SummaryStructuredFields) {
  const nodes = getDFDNodes(fields);
  const flows = Array.isArray(fields.flows)
    ? fields.flows.filter((item): item is DFDFlow => isObject(item))
    : [];

  if (nodes.length === 0 && flows.length === 0) {
    return (
      <p className="text-sm italic text-muted-foreground">
        No DFD content defined.
      </p>
    );
  }

  const processCount = nodes.filter((node) => node.type === "process").length;
  const entityCount = nodes.filter((node) => node.type === "entity").length;
  const datastoreCount = nodes.filter(
    (node) => node.type === "datastore",
  ).length;

  return (
    <div className="space-y-2 text-sm">
      <p>
        <span className="font-semibold text-muted-foreground">Processes:</span>{" "}
        {processCount}
      </p>
      <p>
        <span className="font-semibold text-muted-foreground">
          External Entities:
        </span>{" "}
        {entityCount}
      </p>
      <p>
        <span className="font-semibold text-muted-foreground">
          Data Stores:
        </span>{" "}
        {datastoreCount}
      </p>
      <p>
        <span className="font-semibold text-muted-foreground">Flows:</span>{" "}
        {flows.length}
      </p>
    </div>
  );
}

export function NodeSummarySection({
  node,
  content,
}: {
  node: NodeData;
  content: SummaryContent;
}) {
  const fields = content.structured_fields;
  const notes = asString(fields.notes);
  const diagramSyntax = asString(
    content.mermaid_manual || content.mermaid_auto,
  );
  const sqlSchema = asString(fields.sql);

  const guidedSummary = useMemo(() => {
    switch (node.type) {
      case "project_brief":
        return renderProjectBrief(fields as ProjectBriefFields);
      case "requirements":
        return renderRequirements(fields);
      case "user_stories":
        return renderUserStories(fields);
      case "use_cases":
        return renderUseCases(fields);
      case "erd":
        return renderERDSummary(fields);
      case "flowchart":
        return renderFlowchartSummary(fields);
      case "sequence":
        return renderSequenceSummary(fields);
      case "dfd":
        return renderDFDSummary(fields);
      default:
        return null;
    }
  }, [fields, node.type]);

  return (
    <div className="mb-6 overflow-hidden rounded-lg border bg-background shadow-sm">
      <div className="flex items-center justify-between border-b bg-muted px-4 py-2">
        <h3 className="font-semibold text-foreground">{node.label}</h3>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_BADGE_CLASS[node.status]}`}
          >
            {node.status}
          </span>
          <span className="text-[10px] font-mono uppercase text-muted-foreground">
            {node.type}
          </span>
        </div>
      </div>

      <div className="space-y-6 p-4">
        {guidedSummary}

        {notes.trim() && (
          <SummarySection title="Notes">
            <MarkdownBlock value={notes} />
          </SummarySection>
        )}

        {node.type === "erd" && sqlSchema.trim() && (
          <SummarySection title="SQL Schema">
            <pre className="overflow-x-auto rounded-md bg-muted p-2 text-xs">
              {sqlSchema}
            </pre>
          </SummarySection>
        )}

        {diagramSyntax.trim() && (
          <SummarySection title="Diagram">
            <MermaidPreview syntax={diagramSyntax} />
          </SummarySection>
        )}
      </div>
    </div>
  );
}
