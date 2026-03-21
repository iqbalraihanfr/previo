"use client";

import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type NodeData } from "@/lib/db";
import { getNodeCapability } from "@/lib/nodeCapabilities";
import { SOURCE_TYPE_LABELS } from "@/lib/sourceArtifacts";
import {
  generateDerivedNode,
  resolveNodeImport,
  type ResolvedNodeImport,
} from "@/lib/sourceIntake";
import { Button } from "@/components/ui/button";
import { TaskBoardEditor } from "@/components/editors/TaskBoardEditor";
import { SummaryNodeEditor } from "@/components/editors/SummaryNodeEditor";

import { DIAGRAM_NODES, GUIDED_NODE_TYPES } from "./panel/constants";
import { EditorPanelHeader } from "./panel/components";
import { GuidedEditorContent } from "./panel/GuidedEditorContent";
import { NodeSourceToolbar } from "./panel/NodeSourceToolbar";
import { SourceImportDialog } from "./panel/SourceImportDialog";
import {
  EditorEntryState,
  EditorReferenceArea,
  EditorSectionNav,
  StructuredContentPreview,
} from "./panel/ModeFirstPanel";
import {
  getEditorSectionLinks,
  getInitialEditorShellMode,
  hasEntryData,
  hasReferenceContent,
  type EditorShellMode,
} from "./panel/editorShell";
import { useNodeEditorData } from "./hooks/useNodeEditorData";
import { useNodeSync, type PendingSourceSync } from "./hooks/useNodeSync";
import { useMermaidRenderer } from "./hooks/useMermaidRenderer";
import { useAttachments } from "./hooks/useAttachments";
import { MermaidEditor } from "./panel/MermaidEditor";
import { NotesEditor } from "./panel/NotesEditor";
import type { WorkspaceNavigationIntent } from "@/features/workspace/navigationIntent";

export function NodeEditorPanel({
  node,
  navigationIntent,
  onCloseAction,
  onDeleteAction,
}: {
  node: NodeData;
  navigationIntent?: WorkspaceNavigationIntent | null;
  onCloseAction: () => void;
  onDeleteAction?: () => void;
}) {
  const liveNode = useLiveQuery(() => db.nodes.get(node.id), [node.id], node);
  const currentNode = liveNode ?? node;
  const isDiagram = DIAGRAM_NODES.includes(currentNode.type);
  const isErd = currentNode.type === "erd";
  const hasGuidedEditor = GUIDED_NODE_TYPES.includes(currentNode.type);
  const capability = getNodeCapability(currentNode.type);
  const derivedNodeType =
    currentNode.type === "use_cases" || currentNode.type === "dfd"
      ? currentNode.type
      : null;
  const importableSources = capability.supportedImports.filter(
    (sourceType) => sourceType !== "manual_structured",
  );
  const importableSourceLabels = importableSources.map(
    (sourceType) => SOURCE_TYPE_LABELS[sourceType],
  );

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
  } = useNodeEditorData(currentNode);

  const initialMode = useMemo(
    () =>
      getInitialEditorShellMode({
        capability,
        fields: guidedFields,
        sourceType: currentNode.source_type,
        generationStatus: currentNode.generation_status,
      }),
    [
      capability,
      guidedFields,
      currentNode.source_type,
      currentNode.generation_status,
    ],
  );

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [pendingSourceSync, setPendingSourceSync] =
    useState<PendingSourceSync | null>(null);
  const [activeMode, setActiveMode] = useState<EditorShellMode>(initialMode);

  const { isSaving, lastSaved } = useNodeSync({
    node: currentNode,
    content,
    setContent,
    freeText,
    mermaidSyntax,
    sqlSchema,
    guidedFields,
    pendingSourceSync,
    onSourceSyncCommitted: () => setPendingSourceSync(null),
  });

  const { mermaidSvg, mermaidError } = useMermaidRenderer(
    currentNode.type,
    mermaidSyntax,
  );
  const { onDrop, deleteAttachment } = useAttachments(
    currentNode.id,
    attachments,
    setAttachments,
  );

  const hasCanonicalEntryData = hasEntryData({
    fields: guidedFields,
    sourceType: currentNode.source_type,
    generationStatus: currentNode.generation_status,
  });
  const hasReferenceArea = hasReferenceContent({
    attachments,
    freeText,
    sqlSchema,
  });
  const sectionLinks = getEditorSectionLinks(currentNode.type);

  const intentForCurrentNode =
    navigationIntent?.nodeId === currentNode.id ? navigationIntent : null;
  const resolvedMode =
    activeMode === "entry" && hasCanonicalEntryData
      ? "review"
      : intentForCurrentNode &&
          hasGuidedEditor &&
          capability.supportsManualStructured &&
          activeMode !== "entry"
        ? "editing"
        : activeMode;

  useEffect(() => {
    if (!intentForCurrentNode?.sectionId) return;

    const timer = window.setTimeout(() => {
      document.getElementById(intentForCurrentNode.sectionId ?? "")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [intentForCurrentNode]);

  const handleStatusChange = async (newStatus: string | null) => {
    if (!newStatus) return;
    setStatus(newStatus as NodeData["status"]);
    await db.nodes.update(currentNode.id, {
      status: newStatus as NodeData["status"],
      updated_at: new Date().toISOString(),
    });
  };

  const applyResolvedImport = (
    result: ResolvedNodeImport,
    mode: PendingSourceSync["mode"],
  ) => {
    setGuidedFields(result.fields);
    if (result.mermaidSyntax) {
      setMermaidSyntax(result.mermaidSyntax);
    }
    setPendingSourceSync({
      mode,
      sourceType: result.sourceType,
      rawContent: result.rawContent,
      parserVersion: result.parserVersion,
      title: result.title,
    });
    setIsImportOpen(false);
    setActiveMode("review");
  };

  if (currentNode.type === "task_board") {
    return <TaskBoardEditor node={currentNode} onCloseAction={onCloseAction} />;
  }

  if (currentNode.type === "summary") {
    return (
      <SummaryNodeEditor node={currentNode} onCloseAction={onCloseAction} />
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">Loading...</div>
    );
  }

  const actionButtons =
    hasGuidedEditor && resolvedMode !== "entry" ? (
      <>
        {resolvedMode === "review" && capability.supportsManualStructured && (
          <Button
            size="sm"
            className="rounded-full"
            onClick={() => setActiveMode("editing")}
            data-testid="editor-mode-editing"
          >
            Edit structured fields
          </Button>
        )}
        {resolvedMode === "editing" && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => setActiveMode("review")}
            data-testid="editor-mode-review"
          >
            Review snapshot
          </Button>
        )}
        {importableSources.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => setIsImportOpen(true)}
            data-testid="node-source-import"
          >
            Import source
          </Button>
        )}
        {derivedNodeType && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => {
              void generateDerivedNode({
                nodeType: derivedNodeType,
                projectId: currentNode.project_id,
              }).then((result) => applyResolvedImport(result, "generated"));
            }}
            data-testid="node-source-generate"
          >
            {resolvedMode === "editing" ? "Regenerate draft" : "Generate draft"}
          </Button>
        )}
      </>
    ) : null;

  const renderGuidedShell = () => {
    if (resolvedMode === "entry") {
      return (
        <EditorEntryState
          nodeLabel={currentNode.label}
          capability={capability}
          importableSources={importableSourceLabels}
          onImport={
            importableSources.length > 0 ? () => setIsImportOpen(true) : undefined
          }
          onGenerate={
            derivedNodeType
              ? () => {
                  void generateDerivedNode({
                    nodeType: derivedNodeType,
                    projectId: currentNode.project_id,
                  }).then((result) => applyResolvedImport(result, "generated"));
                }
              : undefined
          }
          onManualEntry={
            capability.manualEntryMode === "primary" ||
            capability.manualEntryMode === "secondary"
              ? () => setActiveMode("editing")
              : undefined
          }
        />
      );
    }

    if (resolvedMode === "review") {
      return (
        <StructuredContentPreview
          nodeLabel={currentNode.label}
          fields={guidedFields}
          manualEntryMode={capability.manualEntryMode}
          sourceType={currentNode.source_type}
        />
      );
    }

    return (
      <>
        <EditorSectionNav links={sectionLinks} />
        <div className="flex-1 overflow-y-auto" data-testid="editor-edit-panel">
          <GuidedEditorContent
            type={currentNode.type}
            fields={guidedFields}
            onChange={(fields) => setGuidedFields(fields as Record<string, unknown>)}
            projectId={currentNode.project_id}
          />
        </div>
      </>
    );
  };

  const renderFallbackEditor = () => (
    <div className="flex-1 overflow-y-auto">
      {resolvedMode === "entry" ? (
        <EditorEntryState
          nodeLabel={currentNode.label}
          capability={capability}
          importableSources={importableSourceLabels}
          onManualEntry={() => setActiveMode("editing")}
        />
      ) : (
        <div className="px-6 py-8">
          <NotesEditor value={freeText} onChange={setFreeText} />
        </div>
      )}
    </div>
  );

  return (
    <div
      className="flex h-full w-full flex-col bg-card/40 backdrop-blur-md"
      data-testid="node-editor-panel"
      data-node-type={currentNode.type}
      data-editor-mode={resolvedMode}
    >
      <EditorPanelHeader
        node={currentNode}
        isSaving={isSaving}
        lastSaved={lastSaved}
        status={status}
        onStatusChange={handleStatusChange}
        onCloseAction={onCloseAction}
        onDeleteAction={onDeleteAction}
      />

      {intentForCurrentNode && (
        <div className="border-b border-border/60 bg-primary/5 px-6 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Focused review
          </p>
          <p className="mt-1 text-sm text-foreground">
            {intentForCurrentNode.itemLabel ?? currentNode.label}
          </p>
          {intentForCurrentNode.reason && (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {intentForCurrentNode.reason}
            </p>
          )}
        </div>
      )}

      {hasGuidedEditor && resolvedMode !== "entry" && (
        <NodeSourceToolbar
          capability={capability}
          sourceType={currentNode.source_type}
          generationStatus={currentNode.generation_status}
          overrideStatus={currentNode.override_status}
          importedAt={currentNode.imported_at}
          actions={actionButtons}
        />
      )}

      <div className="flex min-h-0 flex-1 flex-col bg-background/30 transition-colors">
        {hasGuidedEditor ? renderGuidedShell() : renderFallbackEditor()}
      </div>

      {(hasGuidedEditor || hasReferenceArea) && resolvedMode !== "entry" && (
        <EditorReferenceArea
          attachments={attachments}
          freeText={freeText}
          sqlSchema={sqlSchema}
          onDrop={(files) => void onDrop(files)}
          onDeleteAttachment={(id) => void deleteAttachment(id)}
          onFreeTextChange={setFreeText}
          onSqlSchemaChange={isErd ? setSqlSchema : undefined}
          defaultOpen={resolvedMode === "editing" && hasReferenceArea}
        />
      )}

      {isDiagram && resolvedMode !== "entry" && (
        <details className="mx-6 mb-6 rounded-[24px] border border-border/60 bg-background/60">
          <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-foreground">
            Diagram override
          </summary>
          <div className="border-t border-border/60 px-5 py-5">
            <MermaidEditor
              mermaidSyntax={mermaidSyntax}
              onSyntaxChange={setMermaidSyntax}
              mermaidSvg={mermaidSvg}
              mermaidError={mermaidError}
              nodeLabel={currentNode.label}
            />
          </div>
        </details>
      )}

      {hasGuidedEditor && importableSources.length > 0 && (
        <SourceImportDialog
          open={isImportOpen}
          onOpenChange={setIsImportOpen}
          title={`Import ${currentNode.label}`}
          supportedSources={importableSources}
          onResolve={(sourceType, rawContent) =>
            resolveNodeImport({
              nodeType: currentNode.type,
              sourceType,
              rawContent,
              projectId: currentNode.project_id,
            })
          }
          onApply={(result) => applyResolvedImport(result, "imported")}
        />
      )}
    </div>
  );
}
