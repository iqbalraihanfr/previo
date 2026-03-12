"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import mermaid from "mermaid";
import { Download, Sparkles } from "lucide-react";

import { db, type NodeData, type NodeContent, type Attachment, type TaskData } from "@/lib/db";
import { generateTasksFromNode } from "@/lib/taskEngine";
import { crossValidateAll } from "@/lib/validationEngine";
import { exportDiagramToPNG } from "@/lib/exportEngine";
import { generateMermaid } from "@/lib/diagramGenerators";

import { TaskBoardEditor } from "@/components/editors/TaskBoardEditor";
import { SummaryNodeEditor } from "@/components/editors/SummaryNodeEditor";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/ui/code-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  MERMAID_TEMPLATES,
  DIAGRAM_NODES,
  GUIDED_NODE_TYPES,
  type EditorTab,
} from "./panel/constants";
import {
  EditorPanelHeader,
  GuidedOverview,
  SectionHint,
  TabBadge,
} from "./panel/components";
import { AttachmentsTab } from "./panel/AttachmentsTab";
import { GuidedEditorContent } from "./panel/GuidedEditorContent";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
});

export function NodeEditorPanel({
  node,
  onCloseAction,
  onDeleteAction,
}: {
  node: NodeData;
  onCloseAction: () => void;
  onDeleteAction?: () => void;
}) {
  const isDiagram = DIAGRAM_NODES.includes(node.type);
  const isErd = node.type === "erd";
  const hasGuidedEditor = GUIDED_NODE_TYPES.includes(node.type);

  const [content, setContent] = useState<NodeContent | null>(null);
  const [status, setStatus] = useState<NodeData["status"]>(node.status);

  const [freeText, setFreeText] = useState("");
  const [mermaidSyntax, setMermaidSyntax] = useState("");
  const [sqlSchema, setSqlSchema] = useState("");
  const [guidedFields, setGuidedFields] = useState<Record<string, unknown>>({});
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [mermaidError, setMermaidError] = useState<string | null>(null);
  const [mermaidSvg, setMermaidSvg] = useState<string>("");
  const defaultTab: EditorTab = hasGuidedEditor
    ? "guided"
    : isDiagram
      ? "mermaid"
      : "text";

  const [activeTab, setActiveTab] = useState<EditorTab>(defaultTab);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mermaidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      let data = await db.nodeContents.where({ node_id: node.id }).first();

      if (!data) {
        const newId = crypto.randomUUID();
        const now = new Date().toISOString();
        const initialContent: NodeContent = {
          id: newId,
          node_id: node.id,
          structured_fields: {},
          mermaid_auto: isDiagram ? MERMAID_TEMPLATES[node.type] || "" : "",
          mermaid_manual: "",
          updated_at: now,
        };

        await db.nodeContents.add(initialContent);
        data = initialContent;
      }

      const atts = await db.attachments.where({ node_id: node.id }).toArray();

      if (isMounted) {
        const structuredFields = data.structured_fields as Record<
          string,
          unknown
        >;

        setContent(data);
        setFreeText((structuredFields.notes as string | undefined) || "");
        setMermaidSyntax(data.mermaid_manual || data.mermaid_auto || "");
        setSqlSchema((structuredFields.sql as string | undefined) || "");

        let sf: Record<string, unknown> = structuredFields;

        if (node.type === "project_brief") {
          let migrated = false;

          if (sf.description && !sf.background) {
            sf = { ...sf, background: sf.description };
            delete sf.description;
            migrated = true;
          }

          if (typeof sf.target_user === "string" && !sf.target_users) {
            sf = {
              ...sf,
              target_users: sf.target_user
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean),
            };
            delete sf.target_user;
            migrated = true;
          }

          if (typeof sf.scope === "string" && !sf.scope_in) {
            sf = { ...sf, scope_in: sf.scope ? [sf.scope] : [] };
            delete sf.scope;
            migrated = true;
          }

          if (
            typeof sf.success_metrics === "string" &&
            !Array.isArray(sf.success_metrics)
          ) {
            sf = {
              ...sf,
              success_metrics: sf.success_metrics
                ? [{ metric: sf.success_metrics, target: "" }]
                : [],
            };
            migrated = true;
          }

          if (
            typeof sf.constraints === "string" &&
            !Array.isArray(sf.constraints)
          ) {
            sf = {
              ...sf,
              constraints: sf.constraints ? [sf.constraints] : [],
            };
            migrated = true;
          }

          if (
            typeof sf.tech_stack === "string" &&
            !Array.isArray(sf.tech_stack)
          ) {
            sf = {
              ...sf,
              tech_stack: sf.tech_stack
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean),
            };
            migrated = true;
          }

          if (migrated) {
            await db.nodeContents.update(data.id, { structured_fields: sf });
          }
        }

        setGuidedFields(sf);
        setAttachments(atts);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [node.id, node.type, isDiagram]);

  const handleStatusChange = async (newStatus: string | null) => {
    if (!newStatus) return;
    const validStatus = newStatus as NodeData["status"];
    setStatus(validStatus);
    await db.nodes.update(node.id, {
      status: validStatus,
      updated_at: new Date().toISOString(),
    });
  };

  useEffect(() => {
    if (!content) return;

    const restGuidedFields = Object.fromEntries(
      Object.entries(guidedFields).filter(
        ([key]) => key !== "sql" && key !== "notes",
      ),
    ) as Record<string, unknown>;

    const contentFields = (content.structured_fields || {}) as Record<
      string,
      unknown
    >;

    const contentSql = contentFields.sql;
    const contentNotes = contentFields.notes;

    const restContentGuidedFields = Object.fromEntries(
      Object.entries(contentFields).filter(
        ([key]) => key !== "sql" && key !== "notes",
      ),
    ) as Record<string, unknown>;

    const hasChanges =
      freeText !== ((contentNotes as string | undefined) || "") ||
      mermaidSyntax !==
        (content.mermaid_manual || content.mermaid_auto || "") ||
      sqlSchema !== ((contentSql as string | undefined) || "") ||
      JSON.stringify(restGuidedFields) !==
        JSON.stringify(restContentGuidedFields);

    const autoMermaid = isDiagram
      ? generateMermaid(node.type, guidedFields)
      : content.mermaid_auto;

    if (!hasChanges && autoMermaid === content.mermaid_auto) return;

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    const timeout = setTimeout(async () => {
      setIsSaving(true);

      const now = new Date().toISOString();
      const updatedFields: Record<string, unknown> = {
        ...guidedFields,
        notes: freeText,
        sql: sqlSchema,
      };

      await db.nodeContents.update(content.id, {
        mermaid_manual: mermaidSyntax,
        mermaid_auto: autoMermaid,
        structured_fields: updatedFields,
        updated_at: now,
      });

      await db.nodes.update(node.id, { updated_at: now });

      setContent((prev) =>
        prev
          ? {
              ...prev,
              mermaid_manual: mermaidSyntax,
              mermaid_auto: autoMermaid,
              structured_fields: updatedFields,
              updated_at: now,
            }
          : null,
      );

      const updatedContent: NodeContent = {
        ...content,
        mermaid_manual: mermaidSyntax,
        mermaid_auto: autoMermaid,
        structured_fields: updatedFields,
        updated_at: now,
      };

      const generatedTasks = generateTasksFromNode(
        node,
        updatedContent,
        node.project_id,
      );

      const existingTasks = await db.tasks
        .where({ source_node_id: node.id })
        .toArray();
      const existingAutoTasksMap = new Map<
        string,
        TaskData & { source_item_id: string }
      >();

      existingTasks.forEach((task) => {
        if (!task.is_manual && task.source_item_id) {
          existingAutoTasksMap.set(task.source_item_id, {
            ...task,
            source_item_id: task.source_item_id, // Type coercion helper
          });
        }
      });

      const tasksToPut: TaskData[] = [];
      const tasksToKeepIds = new Set<string>();

      for (const generatedTask of generatedTasks) {
        if (
          generatedTask.source_item_id &&
          existingAutoTasksMap.has(generatedTask.source_item_id)
        ) {
          const existing = existingAutoTasksMap.get(
            generatedTask.source_item_id,
          );

          if (!existing) continue;

          tasksToPut.push({
            ...existing,
            title: generatedTask.title,
            description: generatedTask.description,
            group_key: generatedTask.group_key,
            priority: generatedTask.priority,
            labels: generatedTask.labels,
            status: generatedTask.status,
            sort_order: generatedTask.sort_order,
            updated_at: now,
          });
          tasksToKeepIds.add(existing.id);
        } else {
          tasksToPut.push({
            ...generatedTask,
            id: crypto.randomUUID(),
            created_at: now,
            updated_at: now,
          });
        }
      }

      const autoTaskIdsToDelete = existingTasks
        .filter((task) => !task.is_manual && !tasksToKeepIds.has(task.id))
        .map((task) => task.id);

      if (autoTaskIdsToDelete.length > 0) {
        await db.tasks.bulkDelete(autoTaskIdsToDelete);
      }

      if (tasksToPut.length > 0) {
        await db.tasks.bulkPut(tasksToPut);
      }

      await crossValidateAll(node.project_id);

      setIsSaving(false);
      setLastSaved(new Date());
    }, 1000);

    debounceTimeoutRef.current = timeout;

    return () => {
      clearTimeout(timeout);
    };
  }, [
    freeText,
    mermaidSyntax,
    sqlSchema,
    content,
    node,
    guidedFields,
    isDiagram,
  ]);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!isDiagram || !mermaidSyntax.trim()) {
        setMermaidSvg("");
        setMermaidError(null);
        return;
      }

      try {
        const id = `mermaid-${crypto.randomUUID()}`;
        const { svg } = await mermaid.render(id, mermaidSyntax);
        setMermaidSvg(svg);
        setMermaidError(null);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Invalid Mermaid syntax";
        setMermaidSvg("");
        setMermaidError(message);
      }
    };

    const renderTimeout = setTimeout(() => {
      void renderDiagram();
    }, 500);

    return () => clearTimeout(renderTimeout);
  }, [mermaidSyntax, isDiagram]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newAtts: Attachment[] = [];
      const now = new Date().toISOString();

      for (const file of acceptedFiles) {
        const attId = crypto.randomUUID();
        const attachment: Attachment = {
          id: attId,
          node_id: node.id,
          filename: file.name,
          mime_type: file.type,
          size: file.size,
          data: file,
          created_at: now,
        };
        await db.attachments.add(attachment);
        newAtts.push(attachment);
      }

      setAttachments((prev) => [...prev, ...newAtts]);
    },
    [node.id],
  );

  const deleteAttachment = async (attId: string) => {
    await db.attachments.delete(attId);
    setAttachments((prev) =>
      prev.filter((attachment) => attachment.id !== attId),
    );
  };

  if (!node) return null;

  if (node.type === "task_board") {
    return <TaskBoardEditor node={node} onCloseAction={onCloseAction} />;
  }

  if (node.type === "summary") {
    return <SummaryNodeEditor node={node} onCloseAction={onCloseAction} />;
  }

  return (
    <div className="flex h-full w-160 shrink-0 flex-col border-l border-border/70 bg-card shadow-[-10px_0_24px_-10px_rgba(0,0,0,0.12)]">
      <EditorPanelHeader
        node={node}
        isSaving={isSaving}
        lastSaved={lastSaved}
        status={status}
        onStatusChange={handleStatusChange}
        onCloseAction={onCloseAction}
        onDeleteAction={onDeleteAction}
      />

      <div className="flex min-h-0 flex-1 flex-col bg-card">
        <GuidedOverview
          hasGuidedEditor={hasGuidedEditor}
          isDiagram={isDiagram}
          isErd={isErd}
        />

        <Tabs
          key={node.id}
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as EditorTab)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="px-5 pb-3 pt-4">
            <TabsList className="flex h-auto w-full flex-wrap gap-2 rounded-2xl bg-muted/45 p-2">
              {hasGuidedEditor && (
                <TabsTrigger
                  className="min-h-10.5 flex-1 rounded-xl px-3 py-2 text-sm"
                  value="guided"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span>Guided</span>
                    <TabBadge label="Primary" tone="primary" />
                  </div>
                </TabsTrigger>
              )}

              {isDiagram && (
                <TabsTrigger
                  className="min-h-10.5 flex-1 rounded-xl px-3 py-2 text-sm"
                  value="mermaid"
                >
                  <div className="flex items-center gap-2">
                    <span>Diagram</span>
                    <TabBadge label="Advanced" tone="muted" />
                  </div>
                </TabsTrigger>
              )}

              {isErd && (
                <TabsTrigger
                  className="min-h-10.5 flex-1 rounded-xl px-3 py-2 text-sm"
                  value="sql"
                >
                  <div className="flex items-center gap-2">
                    <span>SQL Notes</span>
                    <TabBadge label="Reference" tone="muted" />
                  </div>
                </TabsTrigger>
              )}

              <TabsTrigger
                className="min-h-10.5 flex-1 rounded-xl px-3 py-2 text-sm"
                value="text"
              >
                <div className="flex items-center gap-2">
                  <span>Notes</span>
                  <TabBadge label="Reference" tone="muted" />
                </div>
              </TabsTrigger>

              <TabsTrigger
                className="min-h-10.5 flex-1 rounded-xl px-3 py-2 text-sm"
                value="attachments"
              >
                <div className="flex items-center gap-2">
                  <span>Files</span>
                  <TabBadge label="Reference" tone="muted" />
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="relative flex min-h-0 flex-1">
            {hasGuidedEditor && (
              <TabsContent
                value="guided"
                className="m-0 flex min-h-0 flex-1 flex-col overflow-hidden"
              >
                <div className="px-5 pb-3">
                  <SectionHint
                    title="Guided is your main editing mode"
                    description="Fill this tab first. Structured data here powers generated diagrams, tasks, validation, and exports across the workspace."
                    tone="primary"
                  />
                </div>

                <div className="min-h-0 flex-1 overflow-hidden">
                  <GuidedEditorContent
                    type={node.type}
                    fields={guidedFields}
                    onChange={(fields) =>
                      setGuidedFields(fields as Record<string, unknown>)
                    }
                    projectId={node.project_id}
                  />
                </div>
              </TabsContent>
            )}

            {isDiagram && (
              <TabsContent
                value="mermaid"
                className="m-0 flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-5"
              >
                <div className="grid gap-3 pb-4 pt-1">
                  <SectionHint
                    title="Diagram editor"
                    description="This view reflects Guided content first. Only make manual changes here when you intentionally want to override the generated diagram."
                    tone="muted"
                  />
                </div>

                <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                  <CodeEditor
                    value={mermaidSyntax}
                    onChange={(value) => setMermaidSyntax(value)}
                  />

                  <div className="relative flex min-h-0 items-center justify-center overflow-auto rounded-2xl border border-border/70 bg-secondary/20 p-4">
                    {!mermaidError && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (mermaidRef.current) {
                            exportDiagramToPNG(
                              mermaidRef.current,
                              `${node.label}-diagram`,
                            );
                          }
                        }}
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
              </TabsContent>
            )}

            {isErd && (
              <TabsContent
                value="sql"
                className="m-0 flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-5"
              >
                <div className="pb-4 pt-1">
                  <SectionHint
                    title="Reference-only SQL notes"
                    description="Paste CREATE TABLE statements or schema references here. This content is stored as notes and does not sync back into Guided fields automatically."
                    tone="muted"
                  />
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-2">
                  <Label className="text-sm font-semibold text-foreground">
                    SQL schema notes
                  </Label>
                  <Textarea
                    className="min-h-0 flex-1 resize-none bg-background font-mono text-sm leading-6"
                    placeholder={`CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100)
);`}
                    value={sqlSchema}
                    onChange={(event) => setSqlSchema(event.target.value)}
                  />
                </div>
              </TabsContent>
            )}

            <TabsContent
              value="text"
              className="m-0 flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-5"
            >
              <div className="pb-4 pt-1">
                <SectionHint
                  title="Freeform notes"
                  description="Use this space for supporting context, rough thinking, or references. These notes do not drive generated diagrams, tasks, or validation."
                  tone="muted"
                />
              </div>

              <Textarea
                className="min-h-0 flex-1 resize-none bg-background text-sm leading-7 shadow-inner"
                placeholder="Additional context, assumptions, references, or working notes..."
                value={freeText}
                onChange={(event) => setFreeText(event.target.value)}
              />
            </TabsContent>

            <TabsContent
              value="attachments"
              className="m-0 flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-5"
            >
              <AttachmentsTab
                attachments={attachments}
                onDropAction={(files) => void onDrop(files)}
                onDeleteAction={(id) => void deleteAttachment(id)}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
