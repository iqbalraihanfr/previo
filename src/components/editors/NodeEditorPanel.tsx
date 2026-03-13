"use client";

import { useState } from "react";
import { type NodeData } from "@/lib/db";
import { TaskBoardEditor } from "@/components/editors/TaskBoardEditor";
import { SummaryNodeEditor } from "@/components/editors/SummaryNodeEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Paperclip } from "lucide-react";

import {
  DIAGRAM_NODES,
  GUIDED_NODE_TYPES,
  type EditorTab,
} from "./panel/constants";
import { EditorPanelHeader } from "./panel/components";
import { AttachmentsTab } from "./panel/AttachmentsTab";
import { GuidedEditorContent } from "./panel/GuidedEditorContent";

// Custom Hooks
import { useNodeEditorData } from "./hooks/useNodeEditorData";
import { useNodeSync } from "./hooks/useNodeSync";
import { useMermaidRenderer } from "./hooks/useMermaidRenderer";
import { useAttachments } from "./hooks/useAttachments";

// Sub-components
import { MermaidEditor } from "./panel/MermaidEditor";
import { NotesEditor } from "./panel/NotesEditor";
import { SqlNotesEditor } from "./panel/SqlNotesEditor";

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
  const isDiagramFirst = ["flowchart", "dfd", "sequence"].includes(node.type);

  // Data Loading & Basic State
  const {
    content,
    setContent,
    status,
    setStatus,
    freeText,
    setFreeText,
    mermaidSyntax,
    setMermaidSyntax,
    sqlSchema,
    setSqlSchema,
    guidedFields,
    setGuidedFields,
    attachments,
    setAttachments,
    isLoading,
  } = useNodeEditorData(node);

  // Sync Logic (Auto-save, Task generation, Validation)
  const { isSaving, lastSaved } = useNodeSync({
    node,
    content,
    setContent,
    freeText,
    mermaidSyntax,
    sqlSchema,
    guidedFields,
  });

  // Diagram Rendering
  const { mermaidSvg, mermaidError } = useMermaidRenderer(node.type, mermaidSyntax);

  // Attachment Actions
  const { onDrop, deleteAttachment } = useAttachments(node.id, attachments, setAttachments);

  const [activeTab, setActiveTab] = useState<EditorTab>("content");

  const handleStatusChange = async (newStatus: string | null) => {
    if (!newStatus) return;
    setStatus(newStatus as NodeData["status"]);
    const { db } = await import("@/lib/db");
    await db.nodes.update(node.id, {
      status: newStatus as NodeData["status"],
      updated_at: new Date().toISOString(),
    });
  };

  if (node.type === "task_board") {
    return <TaskBoardEditor node={node} onCloseAction={onCloseAction} />;
  }

  if (node.type === "summary") {
    return <SummaryNodeEditor node={node} onCloseAction={onCloseAction} />;
  }

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="flex h-full w-full flex-col bg-card/40 backdrop-blur-md">
      <EditorPanelHeader
        node={node}
        isSaving={isSaving}
        lastSaved={lastSaved}
        status={status}
        onStatusChange={handleStatusChange}
        onCloseAction={onCloseAction}
        onDeleteAction={onDeleteAction}
      />

      <div className="flex min-h-0 flex-1 flex-col bg-background/30 transition-colors">
        <Tabs
          key={node.id}
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as EditorTab)}
          className="workspace-scroll flex flex-1 flex-col overflow-y-auto overflow-x-hidden"
        >
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm px-6 py-4">
            <TabsList className="flex h-12 w-full items-center gap-1.5 rounded-2xl bg-muted/50 p-1.5 shadow-sm">
              <TabsTrigger
                className="h-full flex-1 rounded-xl px-3 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                value="content"
              >
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Content</span>
                </div>
              </TabsTrigger>

              <TabsTrigger
                className="h-full flex-1 rounded-xl px-3 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                value="meta"
              >
                <div className="flex items-center justify-center gap-2">
                  <Paperclip className="h-3.5 w-3.5" />
                  <span>
                    Notes & Files
                    {attachments.length > 0 && (
                      <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {attachments.length}
                      </span>
                    )}
                  </span>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="relative flex min-h-0 flex-1">
            {/* Content Tab */}
            <TabsContent value="content" className="m-0 flex flex-1 flex-col outline-none">
              {isDiagramFirst ? (
                <MermaidEditor
                  mermaidSyntax={mermaidSyntax}
                  onSyntaxChange={setMermaidSyntax}
                  mermaidSvg={mermaidSvg}
                  mermaidError={mermaidError}
                  nodeLabel={node.label}
                />
              ) : hasGuidedEditor ? (
                <GuidedEditorContent
                  type={node.type}
                  fields={guidedFields}
                  onChange={(fields) => setGuidedFields(fields as Record<string, unknown>)}
                  projectId={node.project_id}
                />
              ) : isDiagram ? (
                <MermaidEditor
                  mermaidSyntax={mermaidSyntax}
                  onSyntaxChange={setMermaidSyntax}
                  mermaidSvg={mermaidSvg}
                  mermaidError={mermaidError}
                  nodeLabel={node.label}
                />
              ) : (
                <NotesEditor value={freeText} onChange={setFreeText} />
              )}
            </TabsContent>

            {/* Notes & Files Tab */}
            <TabsContent value="meta" className="m-0 flex-1 outline-none">
              <div className="flex flex-col gap-0 divide-y divide-border/40">
                {/* Notes section */}
                <div className="px-6 py-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Notes
                  </p>
                  <NotesEditor value={freeText} onChange={setFreeText} />
                </div>

                {/* SQL Notes section — ERD only */}
                {isErd && (
                  <div className="px-6 py-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                      SQL / Schema Reference
                    </p>
                    <SqlNotesEditor value={sqlSchema} onChange={setSqlSchema} />
                  </div>
                )}

                {/* Files section */}
                <div className="px-6 py-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Files
                  </p>
                  <AttachmentsTab
                    attachments={attachments}
                    onDropAction={(files) => void onDrop(files)}
                    onDeleteAction={(id) => void deleteAttachment(id)}
                  />
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
