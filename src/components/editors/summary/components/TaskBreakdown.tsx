"use client";

interface TaskBreakdownProps {
  priority: {
    must: number;
    should: number;
    could: number;
  };
  status: {
    todo: number;
    in_progress: number;
    done: number;
  };
}

export function TaskBreakdown({ priority, status }: TaskBreakdownProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/70">
          Task Breakdown
        </h3>
        <div className="h-px flex-1 bg-border/40" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <PriorityBox label="Must" count={priority.must} color="text-destructive" />
        <PriorityBox label="Should" count={priority.should} color="text-amber-500" />
        <PriorityBox label="Could" count={priority.could} color="text-primary" />
      </div>

      <div className="flex items-center justify-center gap-6 rounded-2xl border border-border/40 bg-muted/20 py-3 px-4">
        <StatusText label="Todo" count={status.todo} />
        <div className="h-3 w-px bg-border/60" />
        <StatusText label="In Progress" count={status.in_progress} />
        <div className="h-3 w-px bg-border/60" />
        <StatusText label="Done" count={status.done} />
      </div>
    </div>
  );
}

function PriorityBox({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/40 p-4 text-center shadow-sm backdrop-blur-sm">
      <div className={`text-xl font-black ${color}`}>{count}</div>
      <div className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
        {label}
      </div>
    </div>
  );
}

function StatusText({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">
        {label}
      </span>
      <span className="text-sm font-bold text-foreground/80">{count}</span>
    </div>
  );
}
