"use client";

import { CheckCircle2, Layers, ListTodo, AlertTriangle } from "lucide-react";

interface SummaryStatsProps {
  nodesDone: number;
  totalNodes: number;
  totalTasks: number;
  tasksDone: number;
  warningCount: number;
}

export function SummaryStats({
  nodesDone,
  totalNodes,
  totalTasks,
  tasksDone,
  warningCount,
}: SummaryStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        icon={<Layers className="h-5 w-5" />}
        value={`${nodesDone}/${totalNodes}`}
        label="Nodes Done"
        color="text-primary"
        bgColor="bg-primary/10"
      />
      <StatCard
        icon={<ListTodo className="h-5 w-5" />}
        value={totalTasks}
        label="Tasks"
        color="text-blue-500"
        bgColor="bg-blue-500/10"
      />
      <StatCard
        icon={<CheckCircle2 className="h-5 w-5" />}
        value={`${tasksDone}/${totalTasks}`}
        label="Tasks Done"
        color="text-green-500"
        bgColor="bg-green-500/10"
      />
      <StatCard
        icon={<AlertTriangle className="h-5 w-5" />}
        value={warningCount}
        label="Warnings"
        color={warningCount > 0 ? "text-amber-500" : "text-green-500"}
        bgColor={warningCount > 0 ? "bg-amber-500/10" : "bg-green-500/10"}
      />
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
  bgColor,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-background/40 p-5 text-center shadow-sm backdrop-blur-sm transition-all hover:bg-card/50">
      <div className={`mb-3 rounded-full ${bgColor} p-2.5 ${color}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="mt-1 text-readable-xs font-bold uppercase tracking-widest text-muted-foreground/60">
        {label}
      </div>
    </div>
  );
}
