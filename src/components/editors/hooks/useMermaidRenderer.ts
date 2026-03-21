import { useState, useEffect, useRef } from "react";
import { DIAGRAM_NODES } from "../panel/constants";

let mermaidInstance: typeof import("mermaid").default | null = null;

async function getMermaid() {
  if (!mermaidInstance) {
    const m = await import("mermaid");
    mermaidInstance = m.default;
    mermaidInstance.initialize({
      startOnLoad: false,
      theme: "dark",
      securityLevel: "loose",
    });
  }
  return mermaidInstance;
}

export function useMermaidRenderer(nodeType: string, mermaidSyntax: string) {
  const isDiagram = DIAGRAM_NODES.includes(nodeType);
  const [mermaidSvg, setMermaidSvg] = useState<string>("");
  const [mermaidError, setMermaidError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    const renderDiagram = async () => {
      if (!isDiagram || !mermaidSyntax.trim()) {
        setMermaidSvg("");
        setMermaidError(null);
        return;
      }

      try {
        const mermaid = await getMermaid();
        if (cancelledRef.current) return;
        const id = `mermaid-${crypto.randomUUID()}`;
        const { svg } = await mermaid.render(id, mermaidSyntax);
        if (cancelledRef.current) return;
        setMermaidSvg(svg);
        setMermaidError(null);
      } catch (error: unknown) {
        if (cancelledRef.current) return;
        const message =
          error instanceof Error ? error.message : "Invalid Mermaid syntax";
        setMermaidSvg("");
        setMermaidError(message);
      }
    };

    const renderTimeout = setTimeout(() => {
      void renderDiagram();
    }, 500);

    return () => {
      cancelledRef.current = true;
      clearTimeout(renderTimeout);
    };
  }, [mermaidSyntax, isDiagram]);

  return { mermaidSvg, mermaidError };
}
