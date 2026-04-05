"use client";

import type { ReactNode } from "react";
import { Info } from "lucide-react";
import type { GenerationStatus, OverrideStatus, SourceType } from "@/lib/db";
import type { NodeCapability } from "@/lib/nodeCapabilities";
import {
  GENERATION_STATUS_LABELS,
  OVERRIDE_STATUS_LABELS,
  SOURCE_TYPE_LABELS,
} from "@/lib/sourceArtifacts";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  const statusLabel = GENERATION_STATUS_LABELS[generationStatus];
  const sourceLabel = sourceType ? SOURCE_TYPE_LABELS[sourceType] : null;

  return (
    <div
      className="flex h-15 shrink-0 items-center gap-2 border-b border-border/50 bg-muted/10 px-4 py-2"
      data-testid="node-source-toolbar"
    >
      {/* Status badge */}
      <span className="rounded-full bg-muted px-2 py-0.5 text-readable-2xs font-medium text-muted-foreground">
        {sourceLabel ?? statusLabel}
      </span>

      {/* Timestamp */}
      {lastSyncLabel && (
        <span className="text-readable-2xs text-muted-foreground/60">
          · synced {lastSyncLabel}
        </span>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action buttons (Edit fields, Import source, Generate draft) */}
      {actions && (
        <div className="flex items-center gap-1.5">
          {actions}
        </div>
      )}

      {/* Provenance popover */}
      <Popover>
        <PopoverTrigger
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/50 hover:bg-muted hover:text-muted-foreground"
          data-testid="node-source-provenance-toggle"
        >
          <Info className="h-3.5 w-3.5" />
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 text-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Source Provenance
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between gap-2">
              <span className="font-medium text-foreground">Classification</span>
              <span>{capability.classification.replace(/_/g, " ")}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="font-medium text-foreground">State</span>
              <span>{statusLabel}</span>
            </div>
            {sourceLabel && (
              <div className="flex justify-between gap-2">
                <span className="font-medium text-foreground">Source</span>
                <span>{sourceLabel}</span>
              </div>
            )}
            <div className="flex justify-between gap-2">
              <span className="font-medium text-foreground">Last sync</span>
              <span>{lastSyncLabel ?? "not yet"}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="font-medium text-foreground">Override</span>
              <span>{OVERRIDE_STATUS_LABELS[overrideStatus]}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="font-medium text-foreground">Manual entry</span>
              <span>{capability.manualEntryMode.replace(/_/g, " ")}</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground/60">
            Keep imported/generated structure as primary source. Free notes stay secondary.
          </p>
        </PopoverContent>
      </Popover>
    </div>
  );
}
