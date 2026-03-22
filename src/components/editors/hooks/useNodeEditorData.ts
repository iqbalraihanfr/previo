import { useState, useEffect } from "react";
import { type NodeData, type NodeContent, type Attachment } from "@/lib/db";
import { createNodeContentRecord, getCanonicalFieldsForNode } from "@/lib/canonicalContent";
import { MERMAID_TEMPLATES, DIAGRAM_NODES } from "../panel/constants";
import { AttachmentRepository } from "@/repositories/MiscRepository";
import { NodeContentRepository } from "@/repositories/NodeRepository";

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
      let data = await NodeContentRepository.findByNodeId(node.id);

      if (!data) {
        const newId = crypto.randomUUID();
        const now = new Date().toISOString();
        const initialContent: NodeContent = createNodeContentRecord({
          id: newId,
          nodeId: node.id,
          nodeType: node.type,
          mermaidAuto: isDiagram ? MERMAID_TEMPLATES[node.type] || "" : "",
          updatedAt: now,
        });

        await NodeContentRepository.create(initialContent);
        data = initialContent;
      }

      const atts = await AttachmentRepository.findAllByNodeId(node.id);

      if (isMounted) {
        const structuredFields = getCanonicalFieldsForNode(node, data) as Record<
          string,
          unknown
        >;

        setContent(data);
        setStatus(node.status);
        setFreeText((structuredFields.notes as string | undefined) || "");
        setMermaidSyntax(data.mermaid_manual || data.mermaid_auto || "");
        setSqlSchema((structuredFields.sql as string | undefined) || "");

        const sf: Record<string, unknown> = { ...structuredFields };

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
            await NodeContentRepository.update(data.id, {
              structured_fields: sf,
              reviewed_at: nowIso(),
            });
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
  }, [isDiagram, node]);

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

function nowIso() {
  return new Date().toISOString();
}
