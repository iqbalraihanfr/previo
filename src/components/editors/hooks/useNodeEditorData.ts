import { useState, useEffect } from "react";
import { db, type NodeData, type NodeContent, type Attachment } from "@/lib/db";
import { MERMAID_TEMPLATES, DIAGRAM_NODES } from "../panel/constants";

export function useNodeEditorData(node: NodeData) {
  const isDiagram = DIAGRAM_NODES.includes(node.type);

  const [content, setContent] = useState<NodeContent | null>(null);
  const [status, setStatus] = useState<NodeData["status"]>(node.status);
  const [freeText, setFreeText] = useState("");
  const [mermaidSyntax, setMermaidSyntax] = useState("");
  const [sqlSchema, setSqlSchema] = useState("");
  const [guidedFields, setGuidedFields] = useState<Record<string, unknown>>({});
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
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
        const structuredFields = (data.structured_fields || {}) as Record<
          string,
          unknown
        >;

        setContent(data);
        setStatus(node.status);
        setFreeText((structuredFields.notes as string | undefined) || "");
        setMermaidSyntax(data.mermaid_manual || data.mermaid_auto || "");
        setSqlSchema((structuredFields.sql as string | undefined) || "");

        let sf: Record<string, unknown> = { ...structuredFields };

        // Migration logic for project_brief
        if (node.type === "project_brief") {
          let migrated = false;

          if (sf.description && !sf.background) {
            sf.background = sf.description;
            delete sf.description;
            migrated = true;
          }

          if (typeof sf.target_user === "string" && !sf.target_users) {
            sf.target_users = (sf.target_user as string)
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean);
            delete sf.target_user;
            migrated = true;
          }

          if (typeof sf.scope === "string" && !sf.scope_in) {
            sf.scope_in = sf.scope ? [sf.scope] : [];
            delete sf.scope;
            migrated = true;
          }

          if (
            typeof sf.success_metrics === "string" &&
            !Array.isArray(sf.success_metrics)
          ) {
            sf.success_metrics = sf.success_metrics
              ? [{ metric: sf.success_metrics, target: "" }]
              : [];
            migrated = true;
          }

          if (
            typeof sf.constraints === "string" &&
            !Array.isArray(sf.constraints)
          ) {
            sf.constraints = sf.constraints ? [sf.constraints] : [];
            migrated = true;
          }

          if (
            typeof sf.tech_stack === "string" &&
            !Array.isArray(sf.tech_stack)
          ) {
            sf.tech_stack = (sf.tech_stack as string)
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean);
            migrated = true;
          }

          if (migrated) {
            await db.nodeContents.update(data.id, { structured_fields: sf });
          }
        }

        setGuidedFields(sf);
        setAttachments(atts);
        setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [node.id, node.type, node.status, isDiagram]);

  return {
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
  };
}
