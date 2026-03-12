import { useState, useEffect, useRef } from "react";
import { db, type NodeData, type NodeContent, type TaskData } from "@/lib/db";
import { generateTasksFromNode } from "@/lib/taskEngine";
import { crossValidateAll } from "@/lib/validationEngine";
import { generateMermaid } from "@/lib/diagramGenerators";
import { DIAGRAM_NODES } from "../panel/constants";

interface UseNodeSyncParams {
  node: NodeData;
  content: NodeContent | null;
  setContent: (content: NodeContent | null) => void;
  freeText: string;
  mermaidSyntax: string;
  sqlSchema: string;
  guidedFields: Record<string, unknown>;
}

export function useNodeSync({
  node,
  content,
  setContent,
  freeText,
  mermaidSyntax,
  sqlSchema,
  guidedFields,
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

      const existingTasks = await db.tasks
        .where({ source_node_id: node.id })
        .toArray();
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
    setContent,
  ]);

  return { isSaving, lastSaved };
}
