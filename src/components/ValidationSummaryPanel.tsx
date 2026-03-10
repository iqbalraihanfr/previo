import { X, AlertTriangle, AlertCircle, ExternalLink, CheckCircle2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ValidationWarning } from '@/lib/db';

export function ValidationSummaryPanel({
  warnings,
  onClose,
  onNodeNavigate
}: {
  projectId: string;
  warnings: ValidationWarning[];
  onClose: () => void;
  onNodeNavigate: (nodeId: string) => void;
}) {
  const errors = warnings.filter(w => w.severity === 'error');
  const warns = warnings.filter(w => w.severity === 'warning');
  const infos = warnings.filter(w => w.severity === 'info');

  return (
    <div className="absolute left-4 top-20 w-[400px] bottom-4 bg-background border rounded-lg shadow-xl shadow-black/5 flex flex-col overflow-hidden z-20">
      <div className="p-4 border-b bg-card flex items-center justify-between shrink-0">
        <h2 className="font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Validation Summary
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {warnings.length === 0 ? (
          <div className="text-center text-muted-foreground p-8">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-4 text-green-500 opacity-50" />
            <p className="font-medium text-foreground">All clear!</p>
            <p className="text-sm mt-1">No cross-validation issues found in your project.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {errors.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" /> Errors ({errors.length})
                </h3>
                {errors.map(err => (
                  <div key={err.id} className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm">
                    <p className="font-medium text-destructive mb-1">{err.message}</p>
                    <p className="text-xs text-muted-foreground mb-2">Rule: {err.rule_id}</p>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onNodeNavigate(err.source_node_id)}>
                      <ExternalLink className="h-3 w-3 mr-1" /> View Node
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {warns.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                  <AlertTriangle className="h-4 w-4" /> Warnings ({warns.length})
                </h3>
                {warns.map(warn => (
                  <div key={warn.id} className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-sm">
                    <p className="font-medium text-yellow-700 dark:text-yellow-400 mb-1">{warn.message}</p>
                    <p className="text-xs text-muted-foreground mb-2">Rule: {warn.rule_id}</p>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onNodeNavigate(warn.source_node_id)}>
                      <ExternalLink className="h-3 w-3 mr-1" /> View Node
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {infos.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Info className="h-4 w-4" /> Info ({infos.length})
                </h3>
                {infos.map(info => (
                  <div key={info.id} className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md text-sm">
                    <p className="font-medium text-blue-700 dark:text-blue-400 mb-1">{info.message}</p>
                    <p className="text-xs text-muted-foreground mb-2">Rule: {info.rule_id}</p>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onNodeNavigate(info.source_node_id)}>
                      <ExternalLink className="h-3 w-3 mr-1" /> View Node
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
