import React from 'react';
import { BaseEdge, EdgeProps, getSmoothStepPath, EdgeLabelRenderer } from '@xyflow/react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { ValidationWarning } from '@/lib/db';

type SourceStatus = 'Empty' | 'In Progress' | 'Done';

const EDGE_STYLES: Record<SourceStatus, { stroke: string; strokeDasharray: string; animate: boolean }> = {
  'Empty':       { stroke: '#8f9b8b', strokeDasharray: '6 6',  animate: true  },
  'In Progress': { stroke: '#8d7340', strokeDasharray: '5 4',  animate: true  },
  'Done':        { stroke: '#4a7c59', strokeDasharray: 'none', animate: false },
};

const SEMANTIC_LABELS: Record<string, string> = {
  'project_brief-requirements': 'defines scope',
  'requirements-erd': 'drives schema',
  'requirements-task_board': 'becomes tasks',
  'erd-task_board': 'generates work',
  'sequence-task_board': 'defines APIs',
  'user_stories-task_board': 'implementation',
  'use_cases-flowchart': 'logic flow',
  'use_cases-sequence': 'interaction',
};

export function ArchwayEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  animated,
  data,
  label,
}: EdgeProps) {
  const sourceStatus = ((data as Record<string, unknown>)?.sourceStatus as SourceStatus) ?? 'Empty';
  const sourceType = (data as Record<string, unknown>)?.sourceType as string;
  const targetType = (data as Record<string, unknown>)?.targetType as string;
  const warnings = ((data as Record<string, unknown>)?.warnings as ValidationWarning[]) ?? [];
  
  const { stroke, strokeDasharray, animate } = EDGE_STYLES[sourceStatus] ?? EDGE_STYLES['Empty'];

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 36,
  });

  const semanticKey = `${sourceType}-${targetType}`;
  const displayLabel = label || SEMANTIC_LABELS[semanticKey];

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: sourceStatus === 'Done' ? 2.5 : 2,
          stroke,
          strokeDasharray,
          animation: animate && animated ? 'dashdraw 1s linear infinite' : 'none',
          strokeLinecap: 'round',
        }}
      />
      {displayLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <Popover>
              <PopoverTrigger className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] shadow-sm backdrop-blur-md transition-all hover:scale-[1.02] active:scale-95 ${
                warnings.length > 0 
                  ? "border-amber-300/55 bg-amber-50/90 text-amber-800 hover:bg-amber-100" 
                  : "border-border/60 bg-card/90 text-muted-foreground/80 hover:bg-card hover:text-foreground"
              }`}>
                {displayLabel}
                {warnings.length > 0 && (
                  <span className="flex h-3 w-3 items-center justify-center rounded-full bg-amber-500 text-[8px] text-white">
                    {warnings.length}
                  </span>
                )}
              </PopoverTrigger>
              <PopoverContent className="w-80 rounded-[12px] p-4 shadow-[0_4px_20px_rgba(46,50,48,0.06)]" side="top">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <h4 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/70">
                      Cross-Validation
                    </h4>
                    <span className="text-[9px] font-semibold text-muted-foreground/45">{semanticKey.replace('-', ' → ')}</span>
                  </div>
                  
                  {warnings.length === 0 ? (
                    <div className="flex items-start gap-3 py-2">
                      <div className="rounded-full bg-primary/10 p-1.5">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">Connection Verified</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">All semantic requirements between these nodes are satisfied.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {warnings.map((w) => (
                        <div key={w.id} className="flex items-start gap-3 rounded-[12px] border border-amber-300/40 bg-amber-500/5 p-3">
                          {w.severity === 'error' ? (
                            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                          ) : (
                            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                          )}
                          <p className="text-[11px] font-medium leading-relaxed text-amber-900">
                            {w.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
