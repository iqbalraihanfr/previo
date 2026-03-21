"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import type { GenerationStatus, OverrideStatus, SourceType } from "@/lib/db";
import type { NodeCapability } from "@/lib/nodeCapabilities";
import {
  GENERATION_STATUS_LABELS,
  OVERRIDE_STATUS_LABELS,
  SOURCE_TYPE_LABELS,
} from "@/lib/sourceArtifacts";

interface NodeSourceToolbarProps {
  capability: NodeCapability;
  sourceType?: SourceType;
  generationStatus?: GenerationStatus;
  overrideStatus?: OverrideStatus;
  importedAt?: string;
  actions?: ReactNode;
}

function formatTimestamp(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function NodeSourceToolbar({
  capability,
  sourceType,
  generationStatus = "none",
  overrideStatus = "none",
  importedAt,
  actions,
}: NodeSourceToolbarProps) {
  const lastSyncLabel = formatTimestamp(importedAt);

  return (
    <div
      className="border-b border-border/50 bg-muted/15 px-6 py-4"
      data-testid="node-source-toolbar"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-[20px] border border-border/60 bg-background/70 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full px-3 py-1">
              {capability.classification.replace(/_/g, " ")}
            </Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              State: {GENERATION_STATUS_LABELS[generationStatus]}
            </Badge>
            {sourceType && (
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                Source: {SOURCE_TYPE_LABELS[sourceType]}
              </Badge>
            )}
          </div>
          <div className="flex flex-col gap-2 text-sm leading-6 text-muted-foreground">
            <p>
              Keep imported and generated structure as the primary source of truth. Free notes stay secondary.
            </p>
            <p className="text-xs">
              {lastSyncLabel
                ? `Last sync: ${lastSyncLabel}`
                : "Last sync: not available yet"}
              {overrideStatus !== "none"
                ? ` • ${OVERRIDE_STATUS_LABELS[overrideStatus]}`
                : ""}
            </p>
          </div>

          <details
            className="rounded-2xl border border-border/50 bg-background/55"
            data-testid="node-source-provenance-details"
          >
            <summary
              className="cursor-pointer list-none px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
              data-testid="node-source-provenance-toggle"
            >
              Provenance details
            </summary>
            <div className="grid gap-3 border-t border-border/50 px-4 py-4 text-sm text-muted-foreground md:grid-cols-2">
              <p>
                <span className="font-medium text-foreground">Classification:</span>{" "}
                {capability.classification.replace(/_/g, " ")}
              </p>
              <p>
                <span className="font-medium text-foreground">Manual entry:</span>{" "}
                {capability.manualEntryMode.replace(/_/g, " ")}
              </p>
              <p>
                <span className="font-medium text-foreground">Last sync:</span>{" "}
                {lastSyncLabel ?? "not available yet"}
              </p>
              <p>
                <span className="font-medium text-foreground">Override state:</span>{" "}
                {OVERRIDE_STATUS_LABELS[overrideStatus]}
              </p>
            </div>
          </details>
        </div>

        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
