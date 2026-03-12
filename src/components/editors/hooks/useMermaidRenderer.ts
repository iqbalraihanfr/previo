import { useState, useEffect } from "react";
import mermaid from "mermaid";
import { DIAGRAM_NODES } from "../panel/constants";

// Initialize mermaid once at the module level or within the hook if needed.
// Given it was already at the top of NodeEditorPanel, we'll keep it as a side effect or in an effect.
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
});

export function useMermaidRenderer(nodeType: string, mermaidSyntax: string) {
  const isDiagram = DIAGRAM_NODES.includes(nodeType);
  const [mermaidSvg, setMermaidSvg] = useState<string>("");
  const [mermaidError, setMermaidError] = useState<string | null>(null);

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

  return { mermaidSvg, mermaidError };
}
