"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, FileText, Loader2, Upload } from "lucide-react";
import type { SourceType } from "@/lib/db";
import { SOURCE_TYPE_LABELS } from "@/lib/sourceArtifacts";
import {
  revalidateResolvedNodeImport,
  type ResolvedNodeImport,
} from "@/lib/sourceIntake";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FileDropzone } from "@/components/ui/file-dropzone";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

function buildPreview(fields: Record<string, unknown>) {
  const rows: Array<{ label: string; value: string }> = [];

  Object.entries(fields).forEach(([key, value]) => {
    if (key === "notes" || key === "sql") return;

    if (Array.isArray(value)) {
      rows.push({
        label: key,
        value: `${value.length} item(s)`,
      });
      return;
    }

    if (typeof value === "string") {
      rows.push({
        label: key,
        value: value.length > 72 ? `${value.slice(0, 72)}...` : value || "—",
      });
      return;
    }

    if (value && typeof value === "object") {
      rows.push({
        label: key,
        value: "Structured object",
      });
    }
  });

  return rows.slice(0, 8);
}

interface SourceImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  supportedSources: SourceType[];
  onResolve: (
    sourceType: SourceType,
    rawContent: string,
  ) => Promise<ResolvedNodeImport>;
  onApply: (result: ResolvedNodeImport) => void;
}

function updateResolvedFields(
  resolved: ResolvedNodeImport,
  fields: Record<string, unknown>,
) {
  return revalidateResolvedNodeImport(resolved, fields);
}

function listToMultiline(value: unknown) {
  if (!Array.isArray(value)) return "";
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .join("\n");
}

function multilineToList(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getSourceImportGuidance(sourceType: SourceType) {
  if (sourceType === "requirements_doc") {
    return {
      title: "Recommended formats",
      description:
        "Previo can parse requirements from structured lines or Markdown tables, then ask you to confirm any inferred scope links.",
      examples: [
        "[FR] [Must] User can log in | Authentication | User authentication",
        "| ID | Description | Priority |",
        "| FR-001 | Navbar shows logo and links | Must |",
        "| NFR-001 | Performance | Page load time | LCP | < 3s |",
      ],
    };
  }

  return null;
}

function renderProjectBriefReview(
  resolved: ResolvedNodeImport,
  onChange: (fields: Record<string, unknown>) => void,
) {
  const fields = resolved.fields;

  return (
    <div
      className="grid gap-4 rounded-2xl border border-border/70 bg-background/70 p-4"
      data-testid="source-import-brief-review"
    >
      <div className="grid gap-2">
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Name
        </label>
        <Input
          value={String(fields.name ?? "")}
          onChange={(event) =>
            onChange({ ...fields, name: event.target.value })
          }
          data-testid="import-review-brief-name"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Background
        </label>
        <Textarea
          value={String(fields.background ?? "")}
          onChange={(event) =>
            onChange({ ...fields, background: event.target.value })
          }
          className="min-h-[110px]"
          data-testid="import-review-brief-background"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Target Users
          </label>
          <Textarea
            value={listToMultiline(fields.target_users)}
            onChange={(event) =>
              onChange({
                ...fields,
                target_users: multilineToList(event.target.value),
              })
            }
            className="min-h-[110px]"
            data-testid="import-review-brief-target-users"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Scope In
          </label>
          <Textarea
            value={listToMultiline(fields.scope_in)}
            onChange={(event) =>
              onChange({
                ...fields,
                scope_in: multilineToList(event.target.value),
              })
            }
            className="min-h-[110px]"
            data-testid="import-review-brief-scope-in"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Objectives
          </label>
          <Textarea
            value={listToMultiline(fields.objectives)}
            onChange={(event) =>
              onChange({
                ...fields,
                objectives: multilineToList(event.target.value),
              })
            }
            className="min-h-[110px]"
            data-testid="import-review-brief-objectives"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Constraints
          </label>
          <Textarea
            value={listToMultiline(fields.constraints)}
            onChange={(event) =>
              onChange({
                ...fields,
                constraints: multilineToList(event.target.value),
              })
            }
            className="min-h-[110px]"
            data-testid="import-review-brief-constraints"
          />
        </div>
      </div>
    </div>
  );
}

function renderRequirementsReview(
  resolved: ResolvedNodeImport,
  onChange: (fields: Record<string, unknown>) => void,
) {
  const items = Array.isArray(resolved.fields.items) ? resolved.fields.items : [];

  return (
    <div
      className="space-y-3 rounded-2xl border border-border/70 bg-background/70 p-4"
      data-testid="source-import-requirements-review"
    >
      {items.map((item, index) => {
        const requirement = item as Record<string, unknown>;

        const updateItem = (updates: Record<string, unknown>) => {
          const nextItems = items.map((currentItem, currentIndex) =>
            currentIndex === index ? { ...currentItem, ...updates } : currentItem,
          );
          onChange({
            ...resolved.fields,
            items: nextItems,
          });
        };

        return (
          <div
            key={String(requirement.id ?? `req-${index}`)}
            className="rounded-xl border border-border/60 bg-background/80 p-4"
            data-testid={`import-review-requirement-${index}`}
          >
            <div className="grid gap-3 md:grid-cols-[100px_120px_minmax(0,1fr)]">
              <div className="grid gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Type
                </label>
                <Select
                  value={String(requirement.type ?? "FR")}
                  onValueChange={(value) => updateItem({ type: value })}
                >
                  <SelectTrigger
                    className="h-10 rounded-xl"
                    data-testid={`import-review-requirement-type-${index}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FR">FR</SelectItem>
                    <SelectItem value="NFR">NFR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Priority
                </label>
                <Select
                  value={String(requirement.priority ?? "Should")}
                  onValueChange={(value) => updateItem({ priority: value })}
                >
                  <SelectTrigger
                    className="h-10 rounded-xl"
                    data-testid={`import-review-requirement-priority-${index}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Must">Must</SelectItem>
                    <SelectItem value="Should">Should</SelectItem>
                    <SelectItem value="Could">Could</SelectItem>
                    <SelectItem value="Wont">Wont</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Description
                </label>
                <Input
                  value={String(requirement.description ?? "")}
                  onChange={(event) =>
                    updateItem({ description: event.target.value })
                  }
                  data-testid={`import-review-requirement-description-${index}`}
                />
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Category
                </label>
                <Input
                  value={String(requirement.category ?? "")}
                  onChange={(event) =>
                    updateItem({ category: event.target.value })
                  }
                  data-testid={`import-review-requirement-category-${index}`}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Related Scope
                </label>
                <Input
                  value={String(requirement.related_scope ?? "")}
                  onChange={(event) =>
                    updateItem({ related_scope: event.target.value })
                  }
                  data-testid={`import-review-requirement-scope-${index}`}
                />
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Metric
                </label>
                <Input
                  value={String(requirement.metric ?? "")}
                  onChange={(event) => updateItem({ metric: event.target.value })}
                  data-testid={`import-review-requirement-metric-${index}`}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Target
                </label>
                <Input
                  value={String(requirement.target ?? "")}
                  onChange={(event) => updateItem({ target: event.target.value })}
                  data-testid={`import-review-requirement-target-${index}`}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function renderUserStoriesReview(
  resolved: ResolvedNodeImport,
  onChange: (fields: Record<string, unknown>) => void,
) {
  const items = Array.isArray(resolved.fields.items) ? resolved.fields.items : [];
  const requirementOptions = resolved.reviewContext?.requirementOptions ?? [];

  return (
    <div
      className="space-y-3 rounded-2xl border border-border/70 bg-background/70 p-4"
      data-testid="source-import-user-stories-review"
    >
      {items.map((item, index) => {
        const story = item as Record<string, unknown>;

        const updateItem = (updates: Record<string, unknown>) => {
          const nextItems = items.map((currentItem, currentIndex) =>
            currentIndex === index ? { ...currentItem, ...updates } : currentItem,
          );
          onChange({
            ...resolved.fields,
            items: nextItems,
          });
        };

        return (
          <div
            key={String(story.id ?? `story-${index}`)}
            className="rounded-xl border border-border/60 bg-background/80 p-4"
            data-testid={`import-review-story-${index}`}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Role
                </label>
                <Input
                  value={String(story.role ?? "")}
                  onChange={(event) => updateItem({ role: event.target.value })}
                  data-testid={`import-review-story-role-${index}`}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Related Requirement
                </label>
                {requirementOptions.length > 0 ? (
                  <Select
                    value={String(story.related_requirement ?? "__none__") || "__none__"}
                    onValueChange={(value) =>
                      updateItem({
                        related_requirement: value === "__none__" ? "" : value,
                      })
                    }
                  >
                    <SelectTrigger
                      className="h-10 rounded-xl"
                      data-testid={`import-review-story-requirement-${index}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Unlinked</SelectItem>
                      {requirementOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={String(story.related_requirement ?? "")}
                    onChange={(event) =>
                      updateItem({ related_requirement: event.target.value })
                    }
                    data-testid={`import-review-story-requirement-${index}`}
                  />
                )}
              </div>
            </div>

            <div className="mt-3 grid gap-3">
              <div className="grid gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Goal
                </label>
                <Input
                  value={String(story.goal ?? "")}
                  onChange={(event) => updateItem({ goal: event.target.value })}
                  data-testid={`import-review-story-goal-${index}`}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Benefit
                </label>
                <Input
                  value={String(story.benefit ?? "")}
                  onChange={(event) => updateItem({ benefit: event.target.value })}
                  data-testid={`import-review-story-benefit-${index}`}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Acceptance Criteria
                </label>
                <Textarea
                  value={listToMultiline(story.acceptance_criteria)}
                  onChange={(event) =>
                    updateItem({
                      acceptance_criteria: multilineToList(event.target.value),
                    })
                  }
                  className="min-h-[100px]"
                  data-testid={`import-review-story-criteria-${index}`}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function renderErdReview(
  resolved: ResolvedNodeImport,
  onChange: (fields: Record<string, unknown>) => void,
) {
  const entities = Array.isArray(resolved.fields.entities) ? resolved.fields.entities : [];
  const relationships = Array.isArray(resolved.fields.relationships)
    ? resolved.fields.relationships
    : [];

  const updateEntity = (index: number, updates: Record<string, unknown>) => {
    const nextEntities = entities.map((entity, entityIndex) =>
      entityIndex === index ? { ...entity, ...updates } : entity,
    );
    onChange({ ...resolved.fields, entities: nextEntities });
  };

  const updateRelationship = (index: number, updates: Record<string, unknown>) => {
    const nextRelationships = relationships.map((relationship, relationshipIndex) =>
      relationshipIndex === index ? { ...relationship, ...updates } : relationship,
    );
    onChange({ ...resolved.fields, relationships: nextRelationships });
  };

  return (
    <div
      className="space-y-4 rounded-2xl border border-border/70 bg-background/70 p-4"
      data-testid="source-import-erd-review"
    >
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Entities
        </p>
        {entities.map((entity, index) => {
          const currentEntity = entity as Record<string, unknown>;
          const attributes = Array.isArray(currentEntity.attributes)
            ? currentEntity.attributes
            : [];

          return (
            <div
              key={String(currentEntity.id ?? `entity-${index}`)}
              className="rounded-xl border border-border/60 bg-background/80 p-4"
            >
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px]">
                <div className="grid gap-2">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Entity Name
                  </label>
                  <Input
                    value={String(currentEntity.name ?? "")}
                    onChange={(event) => updateEntity(index, { name: event.target.value })}
                    data-testid={`import-review-entity-name-${index}`}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Attributes
                  </label>
                  <div className="rounded-xl border border-border/60 bg-background px-3 py-2 text-sm text-foreground">
                    {attributes.length}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                {attributes
                  .slice(0, 4)
                  .map((attribute) => {
                    const currentAttribute = attribute as Record<string, unknown>;
                    return `${String(currentAttribute.name ?? "Unnamed")} : ${String(currentAttribute.type ?? "unknown")}`;
                  })
                  .join(" • ") || "No parsed attributes yet."}
              </p>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Relationships
        </p>
        {relationships.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-background/60 px-4 py-4 text-sm text-muted-foreground">
            No relationships were parsed from the imported schema yet.
          </div>
        ) : (
          relationships.map((relationship, index) => {
            const currentRelationship = relationship as Record<string, unknown>;
            return (
              <div
                key={String(currentRelationship.id ?? `relationship-${index}`)}
                className="rounded-xl border border-border/60 bg-background/80 p-4"
              >
                <div className="grid gap-3 md:grid-cols-3">
                  <Input
                    value={String(currentRelationship.from ?? "")}
                    onChange={(event) =>
                      updateRelationship(index, { from: event.target.value })
                    }
                    data-testid={`import-review-relationship-from-${index}`}
                  />
                  <Select
                    value={String(currentRelationship.type ?? "one-to-many")}
                    onValueChange={(value) =>
                      updateRelationship(index, { type: value })
                    }
                  >
                    <SelectTrigger
                      className="h-10 rounded-xl"
                      data-testid={`import-review-relationship-type-${index}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one-to-one">one-to-one</SelectItem>
                      <SelectItem value="one-to-many">one-to-many</SelectItem>
                      <SelectItem value="many-to-one">many-to-one</SelectItem>
                      <SelectItem value="many-to-many">many-to-many</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={String(currentRelationship.to ?? "")}
                    onChange={(event) =>
                      updateRelationship(index, { to: event.target.value })
                    }
                    data-testid={`import-review-relationship-to-${index}`}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function renderFlowchartReview(
  resolved: ResolvedNodeImport,
  onChange: (fields: Record<string, unknown>) => void,
) {
  const flows = Array.isArray(resolved.fields.flows) ? resolved.fields.flows : [];
  const useCaseOptions = resolved.reviewContext?.useCaseOptions ?? [];

  return (
    <div
      className="space-y-3 rounded-2xl border border-border/70 bg-background/70 p-4"
      data-testid="source-import-flowchart-review"
    >
      {flows.map((flow, index) => {
        const currentFlow = flow as Record<string, unknown>;
        const steps = Array.isArray(currentFlow.steps) ? currentFlow.steps : [];
        const connections = Array.isArray(currentFlow.connections)
          ? currentFlow.connections
          : [];

        const updateFlow = (updates: Record<string, unknown>) => {
          const nextFlows = flows.map((currentItem, currentIndex) =>
            currentIndex === index ? { ...currentItem, ...updates } : currentItem,
          );
          onChange({
            ...resolved.fields,
            flows: nextFlows,
          });
        };

        return (
          <div
            key={String(currentFlow.id ?? `flow-${index}`)}
            className="rounded-xl border border-border/60 bg-background/80 p-4"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Flow Name
                </label>
                <Input
                  value={String(currentFlow.name ?? "")}
                  onChange={(event) => updateFlow({ name: event.target.value })}
                  data-testid={`import-review-flow-name-${index}`}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Related Use Case
                </label>
                {useCaseOptions.length > 0 ? (
                  <Select
                    value={String(currentFlow.related_use_case ?? "__none__") || "__none__"}
                    onValueChange={(value) =>
                      updateFlow({
                        related_use_case: value === "__none__" ? "" : value,
                      })
                    }
                  >
                    <SelectTrigger
                      className="h-10 rounded-xl"
                      data-testid={`import-review-flow-use-case-${index}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Unlinked</SelectItem>
                      {useCaseOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={String(currentFlow.related_use_case ?? "")}
                    onChange={(event) =>
                      updateFlow({ related_use_case: event.target.value })
                    }
                    data-testid={`import-review-flow-use-case-${index}`}
                  />
                )}
              </div>
            </div>

            <div className="mt-3 grid gap-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Trigger
              </label>
              <Input
                value={String(currentFlow.trigger ?? "")}
                onChange={(event) => updateFlow({ trigger: event.target.value })}
                data-testid={`import-review-flow-trigger-${index}`}
              />
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-border/60 bg-background px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Steps
                </p>
                <p className="mt-1 text-sm text-foreground">{steps.length}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {steps
                    .slice(0, 4)
                    .map((step) => String((step as Record<string, unknown>).label ?? "Unnamed"))
                    .join(" • ") || "No parsed steps yet."}
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Connections
                </p>
                <p className="mt-1 text-sm text-foreground">{connections.length}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {connections
                    .slice(0, 3)
                    .map((connection) => {
                      const currentConnection = connection as Record<string, unknown>;
                      return `${String(currentConnection.from ?? "?")} -> ${String(currentConnection.to ?? "?")}`;
                    })
                    .join(" • ") || "No explicit connections yet."}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function renderSequenceReview(
  resolved: ResolvedNodeImport,
  onChange: (fields: Record<string, unknown>) => void,
) {
  const participants = Array.isArray(resolved.fields.participants)
    ? resolved.fields.participants
    : [];
  const messages = Array.isArray(resolved.fields.messages) ? resolved.fields.messages : [];
  const useCaseOptions = resolved.reviewContext?.useCaseOptions ?? [];

  return (
    <div
      className="space-y-4 rounded-2xl border border-border/70 bg-background/70 p-4"
      data-testid="source-import-sequence-review"
    >
      <div className="grid gap-2">
        <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Related Use Case
        </label>
        {useCaseOptions.length > 0 ? (
          <Select
            value={String(resolved.fields.related_use_case ?? "__none__") || "__none__"}
            onValueChange={(value) =>
              onChange({
                ...resolved.fields,
                related_use_case: value === "__none__" ? "" : value,
              })
            }
          >
            <SelectTrigger className="h-10 rounded-xl" data-testid="import-review-sequence-use-case">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Unlinked</SelectItem>
              {useCaseOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={String(resolved.fields.related_use_case ?? "")}
            onChange={(event) =>
              onChange({
                ...resolved.fields,
                related_use_case: event.target.value,
              })
            }
            data-testid="import-review-sequence-use-case"
          />
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-background/80 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Participants
          </p>
          <div className="mt-3 space-y-2">
            {participants.map((participant, index) => {
              const currentParticipant = participant as Record<string, unknown>;
              return (
                <div key={`participant-${index}`} className="grid gap-2 md:grid-cols-[minmax(0,1fr)_120px]">
                  <Input
                    value={String(currentParticipant.name ?? "")}
                    onChange={(event) => {
                      const updated = participants.map((currentItem, currentIndex) =>
                        currentIndex === index
                          ? { ...currentItem, name: event.target.value }
                          : currentItem,
                      );
                      onChange({ ...resolved.fields, participants: updated });
                    }}
                    data-testid={`import-review-sequence-participant-${index}`}
                  />
                  <Input
                    value={String(currentParticipant.type ?? "")}
                    onChange={(event) => {
                      const updated = participants.map((currentItem, currentIndex) =>
                        currentIndex === index
                          ? { ...currentItem, type: event.target.value }
                          : currentItem,
                      );
                      onChange({ ...resolved.fields, participants: updated });
                    }}
                    data-testid={`import-review-sequence-participant-type-${index}`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-background/80 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Messages
          </p>
          <div className="mt-3 space-y-2">
            {messages.slice(0, 6).map((message, index) => {
              const currentMessage = message as Record<string, unknown>;
              return (
                <div key={String(currentMessage.id ?? `message-${index}`)} className="rounded-xl border border-border/60 bg-background px-3 py-3">
                  <p className="text-xs text-muted-foreground">
                    {String(currentMessage.from ?? "?")} {"->"} {String(currentMessage.to ?? "?")}
                  </p>
                  <Input
                    value={String(currentMessage.content ?? "")}
                    onChange={(event) => {
                      const updated = messages.map((currentItem, currentIndex) =>
                        currentIndex === index
                          ? { ...currentItem, content: event.target.value }
                          : currentItem,
                      );
                      onChange({ ...resolved.fields, messages: updated });
                    }}
                    className="mt-2"
                    data-testid={`import-review-sequence-message-${index}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SourceImportDialog({
  open,
  onOpenChange,
  title,
  supportedSources,
  onResolve,
  onApply,
}: SourceImportDialogProps) {
  const [sourceType, setSourceType] = useState<SourceType>(
    supportedSources[0] ?? "manual_structured",
  );
  const [rawContent, setRawContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState<ResolvedNodeImport | null>(null);

  const previewRows = useMemo(
    () => buildPreview(resolved?.fields ?? {}),
    [resolved],
  );
  const unresolvedCount = resolved?.unresolvedFields.length ?? 0;
  const issueCount = resolved?.issues.length ?? 0;
  const sourceGuidance = getSourceImportGuidance(sourceType);

  const reset = () => {
    setSourceType(supportedSources[0] ?? "manual_structured");
    setRawContent("");
    setIsLoading(false);
    setError(null);
    setResolved(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset();
    }
    onOpenChange(nextOpen);
  };

  const handleResolve = async () => {
    setIsLoading(true);
    setError(null);
    setResolved(null);

    try {
      const next = await onResolve(sourceType, rawContent);
      setResolved(next);
    } catch (resolveError) {
      setError(
        resolveError instanceof Error
          ? resolveError.message
          : "Failed to import source.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const text = await file.text();
    setRawContent(text);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-[640px]"
        data-testid="source-import-dialog"
      >
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Import parseable source data, preview the normalized structure, then apply it to this node.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {!resolved ? (
            <>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Source Type
                </label>
                <Select
                  value={sourceType}
                  onValueChange={(value) => setSourceType(value as SourceType)}
                >
                  <SelectTrigger
                    className="h-11 rounded-xl"
                    data-testid="source-import-type-trigger"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedSources.map((supportedSource) => (
                      <SelectItem key={supportedSource} value={supportedSource}>
                        {SOURCE_TYPE_LABELS[supportedSource]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Textarea
                data-testid="source-import-textarea"
                value={rawContent}
                onChange={(event) => setRawContent(event.target.value)}
                placeholder="Paste markdown, CSV, Mermaid, DBML, SQL, or other supported text source..."
                className="min-h-[220px] rounded-2xl text-sm"
              />

              <FileDropzone
                onDrop={(acceptedFiles) => {
                  void handleFileDrop(acceptedFiles);
                }}
                multiple={false}
                accept={{
                  "text/plain": [".txt", ".md", ".csv", ".mmd", ".dbml", ".sql"],
                }}
                title="Drop a text-based source file"
                description="or click to browse for CSV, Markdown, Mermaid, DBML, or SQL"
                hints="Only text-based imports are treated as canonical source input."
              />

              {sourceGuidance && (
                <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-4">
                  <div className="text-sm font-medium text-foreground">
                    {sourceGuidance.title}
                  </div>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">
                    {sourceGuidance.description}
                  </p>
                  <div className="mt-3 space-y-2">
                    {sourceGuidance.examples.map((example) => (
                      <pre
                        key={example}
                        className="overflow-x-auto rounded-xl border border-border/50 bg-background/80 px-3 py-2 text-xs text-foreground/80"
                      >
                        {example}
                      </pre>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <FileText className="h-4 w-4 text-primary" />
                  Review imported structure
                </div>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  Confirm parsed fields and inferred mappings before this import becomes canonical data for the node.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-[11px] font-semibold text-foreground">
                    {SOURCE_TYPE_LABELS[resolved.sourceType]}
                  </span>
                  <span className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-[11px] font-semibold text-foreground">
                    Parser {resolved.parserVersion}
                  </span>
                  <span className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-[11px] font-semibold text-foreground">
                    {issueCount} issue(s)
                  </span>
                  <span className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-[11px] font-semibold text-foreground">
                    {unresolvedCount} unresolved field(s)
                  </span>
                </div>
                {(resolved.reviewContext?.importNotes?.length ?? 0) > 0 && (
                  <div className="mt-3 space-y-2">
                    {resolved.reviewContext?.importNotes?.map((note) => (
                      <div
                        key={note}
                        className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs leading-6 text-foreground/80"
                      >
                        {note}
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3 grid gap-2">
                  {previewRows.map((row) => (
                    <div
                      key={row.label}
                      className="grid gap-1 rounded-xl border border-border/50 bg-background/80 px-3 py-2 sm:grid-cols-[120px_minmax(0,1fr)]"
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {row.label}
                      </span>
                      <span className="text-sm text-foreground/80">{row.value}</span>
                    </div>
                  ))}
                  {previewRows.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Parsed source is valid but has no previewable fields.
                    </p>
                  )}
                </div>
              </div>

              {resolved.issues.length > 0 && (
                <div
                  className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-4"
                  data-testid="source-import-issues"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Import review issues
                  </div>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">
                    Parsing succeeded. The items below still need confirmation or cleanup before save.
                  </p>
                  <div className="mt-3 space-y-2">
                    {resolved.issues.map((issue) => (
                      <div
                        key={`${issue.field}-${issue.message}`}
                        className="rounded-xl border border-border/50 bg-background/70 px-3 py-2"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            {issue.field}
                          </span>
                          <span className="rounded-full border border-border/60 bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            {issue.severity}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-foreground/80">{issue.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {resolved.nodeType === "project_brief" &&
                renderProjectBriefReview(resolved, (fields) =>
                  setResolved((current) =>
                    current ? updateResolvedFields(current, fields) : current,
                  ),
                )}

              {resolved.nodeType === "requirements" &&
                renderRequirementsReview(resolved, (fields) =>
                  setResolved((current) =>
                    current ? updateResolvedFields(current, fields) : current,
                  ),
                )}

              {resolved.nodeType === "user_stories" &&
                renderUserStoriesReview(resolved, (fields) =>
                  setResolved((current) =>
                    current ? updateResolvedFields(current, fields) : current,
                  ),
                )}

              {resolved.nodeType === "erd" &&
                renderErdReview(resolved, (fields) =>
                  setResolved((current) =>
                    current ? updateResolvedFields(current, fields) : current,
                  ),
                )}

              {resolved.nodeType === "flowchart" &&
                renderFlowchartReview(resolved, (fields) =>
                  setResolved((current) =>
                    current ? updateResolvedFields(current, fields) : current,
                  ),
                )}

              {resolved.nodeType === "sequence" &&
                renderSequenceReview(resolved, (fields) =>
                  setResolved((current) =>
                    current ? updateResolvedFields(current, fields) : current,
                  ),
                )}

              <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-xs text-muted-foreground">
                Applying this import will replace the current structured content for this node. Canonical source remains import-first and free notes stay secondary.
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t px-6 py-4">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>

          {!resolved ? (
            <Button
              onClick={() => void handleResolve()}
              disabled={!rawContent.trim() || isLoading}
              data-testid="source-import-parse"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Parsing
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Parse Source
                </>
              )}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setResolved(null)}
                data-testid="source-import-back"
              >
                Back
              </Button>
              <Button onClick={() => onApply(resolved)} data-testid="source-import-apply">
                {unresolvedCount > 0 ? `Accept with ${unresolvedCount} unresolved` : "Accept & Save"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
