import React from 'react';
import { BaseEdge, EdgeProps, getSmoothStepPath } from '@xyflow/react';

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
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 36, // Sangat mulus seperti Opal
  });

  return (
    <>
      <BaseEdge 
        id={id}
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{ 
          ...style, 
          strokeWidth: 2, 
          stroke: '#94a3b8', /* tailwind slate-400 */
          strokeDasharray: '6 6', 
          animation: animated ? 'dashdraw 1s linear infinite' : 'none', 
          strokeLinecap: 'round'
        }} 
      />
    </>
  );
}
