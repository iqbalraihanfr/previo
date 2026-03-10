import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { NodeData, ValidationWarning } from '@/lib/db';
import { FileText, Database, CheckCircle2, Circle, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ArchwayNode = memo(({ data, selected }: { data: Record<string, unknown>, selected: boolean }) => {
  const nodeData = data as unknown as NodeData & { isNext?: boolean, warnings?: ValidationWarning[] };
  const getStatusIcon = (status: NodeData['status']) => {
    switch (status) {
      case 'Done': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'In Progress': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Circle className="h-4 w-4 text-slate-400" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'erd': return <Database className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  // Give each type a distinct color, like Opal
  const getHeaderColor = (type: string) => {
    switch (type) {
      case 'erd': return 'bg-[#d2d7fb]'; // Soft purple for DB
      case 'project_brief': return 'bg-[#e4faa0]'; // Yellow-green
      case 'requirements': return 'bg-[#fbc1c1]'; // Soft red/orange
      default: return 'bg-[#e4faa0]'; 
    }
  };

  return (
    <>
      <Handle 
        type="target" 
        id="left" 
        position={Position.Left} 
        className="w-4 h-4 border-[3px] border-white rounded-full bg-black -left-2! top-6! z-10" 
      />
      <Handle 
        type="target" 
        id="top" 
        position={Position.Top} 
        className="w-4 h-4 border-[3px] border-white rounded-full bg-black -top-2! z-10" 
      />
      
      <div
        className={cn(
          "flex flex-col rounded-[1.25rem] border-[3px] border-white overflow-hidden min-w-[280px] shadow-lg transition-all",
          selected ? "ring-2 ring-primary/40 scale-[1.02]" : "ring-1 ring-black/5",
          nodeData.isNext ? "animate-pulse shadow-[0_0_20px_rgba(228,250,160,0.5)]" : ""
        )}
      >
        {/* Header Section */}
        <div className={cn("flex items-center justify-between px-4 py-3 text-black", getHeaderColor(nodeData.type))}>
          <div className="flex items-center gap-3">
            {getTypeIcon(nodeData.type)}
            <span className="font-bold text-[15px]">{nodeData.label}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {nodeData.warnings && nodeData.warnings.length > 0 && (
              <div 
                className="flex items-center justify-center p-1 rounded-full bg-red-500/20 text-red-700"
                title={`${nodeData.warnings.length} issues found`}
              >
                <AlertTriangle className="h-4 w-4" />
              </div>
            )}
            
            {/* Using a play/triangle icon to mimic Opal */}
            <div className="text-black/50 ml-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 3l14 9-14 9V3z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#333333] text-zinc-300">
           <span className="text-sm font-medium tracking-wide font-sans">{nodeData.type === 'project_brief' ? 'Initialize' : 'Generate'}</span>
           
           <div className="ml-3" title={`Status: ${nodeData.status}`}>
             {getStatusIcon(nodeData.status)}
           </div>
        </div>
      </div>

      <Handle 
        type="source" 
        id="right" 
        position={Position.Right} 
        className="w-4 h-4 border-[3px] border-white rounded-full bg-black -right-2! top-6! z-10" 
      />
      <Handle 
        type="source" 
        id="bottom" 
        position={Position.Bottom} 
        className="w-4 h-4 border-[3px] border-white rounded-full bg-black -bottom-2! z-10" 
      />
    </>
  );
});

ArchwayNode.displayName = 'ArchwayNode';
