import React from 'react';
import { BaseEdge, EdgeProps, getSmoothStepPath } from '@xyflow/react';

type SourceStatus = 'Empty' | 'In Progress' | 'Done';

const EDGE_STYLES: Record<SourceStatus, { stroke: string; strokeDasharray: string; animate: boolean }> = {
  'Empty':       { stroke: '#94a3b8', strokeDasharray: '6 6',  animate: true  },
  'In Progress': { stroke: '#f59e0b', strokeDasharray: '5 4',  animate: true  },
  'Done':        { stroke: '#22c55e', strokeDasharray: 'none', animate: false },
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
}: EdgeProps) {
  const sourceStatus = ((data as Record<string, unknown>)?.sourceStatus as SourceStatus) ?? 'Empty';
  const { stroke, strokeDasharray, animate } = EDGE_STYLES[sourceStatus] ?? EDGE_STYLES['Empty'];

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 36,
  });

  return (
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
  );
}
