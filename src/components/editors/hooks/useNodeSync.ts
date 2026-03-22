import { useState, useEffect, useRef } from "react";
import {
  type NodeData,
  type NodeContent,
  type TaskData,
  type SourceType,
} from "@/lib/db";
import { getCanonicalNotes, getCanonicalSql } from "@/lib/canonical";
import { generateTasksFromNode } from "@/services/taskEngine";
import { crossValidateAll } from "@/services/ValidationService";
import { generateMermaid } from "@/lib/diagramGenerators";
import { createSourceArtifactInput } from "@/lib/sourceIntake";
import { SourceArtifactRepository } from "@/repositories/SourceArtifactRepository";
import { TaskRepository } from "@/repositories/TaskRepository";
import { buildProjectReadinessModel, buildReadinessSnapshot } from "@/lib/readiness";
import { ReadinessSnapshotRepository } from "@/repositories/ReadinessRepository";
import { ValidationWarningRepository } from "@/repositories/MiscRepository";
import { NodeContentRepository, NodeRepository } from "@/repositories/NodeRepository";
import { DIAGRAM_NODES } from "../panel/constants";

export interface PendingSourceSync {
  mode: "imported" | "generated";
  sourceType: SourceType;
  rawContent: string;
  parserVersion: string;
  title: string;
}

interface UseNodeSyncParams {
  node: NodeData;
  content: NodeContent | null;
  setContent: (content: NodeContent | null) => void;
  freeText: string;
  mermaidSyntax: string;
  sqlSchema: string;
  guidedFields: Record<string, unknown>;
  pendingSourceSync: PendingSourceSync | null;
  onSourceSyncCommitted: () => void;
}

export function useNodeSync({
  node,
  content,
  setContent,
  freeText,
  mermaidSyntax,
  sqlSchema,
  guidedFields,
  pendingSourceSync,
  onSourceSyncCommitted,
}: UseNodeSyncParams) {
  const isDiagram = DIAGRAM_NODES.includes(node.type);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    const contentSql = getCanonicalSql(contentFields);
    const contentNotes = getCanonicalNotes(contentFields);

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
    const hasCanonicalChanges =
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

      await NodeContentRepository.update(content.id, {
        mermaid_manual: mermaidSyntax,
        mermaid_auto: autoMermaid,
        structured_fields: updatedFields,
        content_schema_version: content.content_schema_version ?? 1,
        reviewed_at: pendingSourceSync ? now : content.reviewed_at,
        updated_at: now,
      });

      if (pendingSourceSync) {
        const artifactId = crypto.randomUUID();
        await SourceArtifactRepository.create({
          id: artifactId,
          created_at: now,
          updated_at: now,
          ...createSourceArtifactInput({
            projectId: node.project_id,
            nodeId: node.id,
            targetNodeType: node.type,
            sourceType: pendingSourceSync.sourceType,
            title: pendingSourceSync.title,
            rawContent: pendingSourceSync.rawContent,
            normalizedData: updatedFields,
          }),
        });

        await NodeRepository.update(node.id, {
          source_type: pendingSourceSync.sourceType,
          source_artifact_id: artifactId,
          imported_at: now,
          parser_version: pendingSourceSync.parserVersion,
          generation_status: pendingSourceSync.mode,
          override_status: "none",
          updated_at: now,
        });
      } else if (
        node.source_type &&
        node.override_status !== "manual_override" &&
        hasCanonicalChanges
      ) {
        await NodeRepository.update(node.id, {
          override_status: "manual_override",
          updated_at: now,
        });
      } else {
        await NodeRepository.update(node.id, { updated_at: now });
      }

      const updatedContent: NodeContent = {
        ...content,
        mermaid_manual: mermaidSyntax,
        mermaid_auto: autoMermaid,
        structured_fields: updatedFields,
        updated_at: now,
      };

      setContent(updatedContent);

      // Task generation logic
      const generatedTasks = generateTasksFromNode(
        node,
        updatedContent,
        node.project_id,
      );

      const existingTasks = await TaskRepository.findBySourceNodeId(node.id);
      const existingAutoTasksMap = new Map<
        string,
        TaskData & { source_item_id: string }
      >();

      existingTasks.forEach((task) => {
        if (!task.is_manual && task.source_item_id) {
          existingAutoTasksMap.set(task.source_item_id, task as TaskData & { source_item_id: string });
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
            source_node_type: generatedTask.source_node_type,
            source_item_label: generatedTask.source_item_label,
            group_key: generatedTask.group_key,
            priority: generatedTask.priority,
            labels: generatedTask.labels,
            status: generatedTask.status,
            task_origin: "generated",
            generation_rule: generatedTask.generation_rule,
            generation_version: generatedTask.generation_version,
            upstream_refs: generatedTask.upstream_refs,
            sort_order: generatedTask.sort_order,
            updated_at: now,
          });
          tasksToKeepIds.add(existing.id);
        } else {
          tasksToPut.push({
            ...generatedTask,
            task_origin: "generated",
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
        await TaskRepository.bulkDelete(autoTaskIdsToDelete);
      }

      if (tasksToPut.length > 0) {
        await TaskRepository.bulkPut(tasksToPut);
      }

      await crossValidateAll(node.project_id);
      const [allNodes, warnings] = await Promise.all([
        NodeRepository.findAllByProjectId(node.project_id),
        ValidationWarningRepository.findAllByProjectId(node.project_id),
      ]);
      const allContents = await NodeContentRepository.findAllByNodeIds(
        allNodes.map((projectNode) => projectNode.id),
      );
      const readiness = buildProjectReadinessModel({
        nodes: allNodes,
        contents: allContents,
        warnings,
      });
      await ReadinessSnapshotRepository.upsert(
        buildReadinessSnapshot({
          projectId: node.project_id,
          readiness,
          computedAt: now,
        }),
      );
      if (pendingSourceSync) {
        onSourceSyncCommitted();
      }

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
    onSourceSyncCommitted,
    pendingSourceSync,
    setContent,
  ]);

  return { isSaving, lastSaved };
}
