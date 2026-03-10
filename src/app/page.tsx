"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Folder, Trash2, ArrowRight, Zap, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";

type ProjectTemplate = 'quick' | 'full';

const TEMPLATES: Record<ProjectTemplate, {
  label: string;
  description: string;
  icon: typeof Zap;
  badge?: string;
  nodes: { type: string; label: string; x: number; y: number }[];
  edges?: [number, number][]; // [sourceIndex, targetIndex] — if omitted, sequential
}> = {
  quick: {
    label: 'Quick Start',
    description: 'Brief → Requirements → ERD → Task Board. Perfect for solo devs & client projects. Get to coding fast.',
    icon: Zap,
    nodes: [
      { type: 'project_brief', label: 'Project Brief', x: 0,   y: 0   },
      { type: 'requirements',  label: 'Requirements',  x: 350, y: 0   },
      { type: 'erd',           label: 'ERD',           x: 700, y: 0   },
      { type: 'task_board',    label: 'Task Board',    x: 1050, y: 0  },
      { type: 'summary',       label: 'Summary',       x: 1400, y: 0  },
    ],
    // Brief→Req, Req→ERD, Req→TaskBoard, ERD→TaskBoard, TaskBoard→Summary
    edges: [[0,1], [1,2], [1,3], [2,3], [3,4]],
  },
  full: {
    label: 'Full Architecture',
    description: 'All 10 nodes — Use Cases, DFD, Flowcharts, Sequence Diagrams, and more. For teams & formal documentation.',
    icon: BookOpen,
    badge: 'In Development',
    nodes: [
      { type: 'project_brief', label: 'Project Brief', x: 0,   y: 0   },
      { type: 'requirements',  label: 'Requirements',  x: 300, y: 0   },
      { type: 'user_stories',  label: 'User Stories',  x: 600, y: 0   },
      { type: 'use_cases',     label: 'Use Case',      x: 0,   y: 150 },
      { type: 'flowchart',     label: 'Flowchart',     x: 300, y: 150 },
      { type: 'dfd',           label: 'DFD',           x: 0,   y: 300 },
      { type: 'erd',           label: 'ERD',           x: 300, y: 300 },
      { type: 'sequence',      label: 'Sequence',      x: 600, y: 300 },
      { type: 'task_board',    label: 'Task Board',    x: 0,   y: 450 },
      { type: 'summary',       label: 'Summary',       x: 300, y: 450 },
    ],
  },
};

export default function Dashboard() {
  const router = useRouter();
  const projects = useLiveQuery(() => db.projects.toArray()) || [];

  const allNodes = useLiveQuery(() => db.nodes.toArray()) || [];
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate>('quick');

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    const newId = crypto.randomUUID();
    const now = new Date().toISOString();
    const template = TEMPLATES[selectedTemplate];

    await db.projects.add({
      id: newId,
      name: newProjectName.trim(),
      description: newProjectDesc.trim(),
      created_at: now,
      updated_at: now
    });

    const defaultNodes = template.nodes.map(pos => ({
      id: crypto.randomUUID(),
      type: pos.type,
      label: pos.label,
      x: pos.x,
      y: pos.y
    }));

    const nodesToInsert = defaultNodes.map((pn, i) => ({
      id: pn.id,
      type: pn.type,
      label: pn.label,
      project_id: newId,
      status: 'Empty' as const,
      position_x: pn.x,
      position_y: pn.y,
      sort_order: i,
      updated_at: now
    }));

    await db.nodes.bulkAdd(nodesToInsert);

    // Add edges based on template definition or sequential fallback
    const edgesToInsert = [];
    if (template.edges) {
      for (const [srcIdx, tgtIdx] of template.edges) {
        edgesToInsert.push({
          id: crypto.randomUUID(),
          project_id: newId,
          source_node_id: defaultNodes[srcIdx].id,
          target_node_id: defaultNodes[tgtIdx].id
        });
      }
    } else {
      for (let i = 0; i < defaultNodes.length - 1; i++) {
        edgesToInsert.push({
          id: crypto.randomUUID(),
          project_id: newId,
          source_node_id: defaultNodes[i].id,
          target_node_id: defaultNodes[i + 1].id
        });
      }
    }

    await db.edges.bulkAdd(edgesToInsert);

    setIsCreateOpen(false);
    setNewProjectName("");
    setNewProjectDesc("");
    setSelectedTemplate('quick');
    router.push(`/workspace/${newId}`);
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this project? All associated nodes and tasks will be lost.")) {
      await db.projects.delete(id);
      const nodes = await db.nodes.where({ project_id: id }).toArray();
      const nodeIds = nodes.map(n => n.id);
      await db.nodes.bulkDelete(nodeIds);
      await db.edges.where({ project_id: id }).delete();
      await db.nodeContents.where('node_id').anyOf(nodeIds).delete();
      await db.tasks.where({ project_id: id }).delete();
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">ARCHWAY</h1>
          <p className="text-muted-foreground mt-2 text-lg">The Bridge Between Thinking and Building</p>
        </div>

        <div className="flex items-center gap-4">
          <ModeToggle />
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger render={
            <Button size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all">
              <Plus className="mr-2 h-5 w-5" /> New Project
            </Button>
          } />
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Choose a template and start documenting.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Toko Online, Portfolio"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="A brief description of this project"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                />
              </div>

              {/* Template Selection */}
              <div className="grid gap-2">
                <Label>Project Template</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.entries(TEMPLATES) as [ProjectTemplate, typeof TEMPLATES['quick']][]).map(([key, tmpl]) => {
                    const Icon = tmpl.icon;
                    const isSelected = selectedTemplate === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedTemplate(key)}
                        className={`relative flex flex-col gap-2 p-4 rounded-lg border-2 text-left transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-muted hover:border-primary/30 hover:bg-muted/50'
                        }`}
                      >
                        {tmpl.badge && (
                          <span className="absolute top-2 right-2 text-[9px] font-medium bg-amber-500/15 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                            {tmpl.badge}
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-md ${isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="font-semibold text-sm">{tmpl.label}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{tmpl.description}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {tmpl.nodes.map((n, i) => (
                            <span key={i} className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{n.label}</span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsCreateOpen(false)} variant="outline">Cancel</Button>
              <Button onClick={handleCreateProject} disabled={!newProjectName.trim()}>Create Workspace</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-full py-16 text-center border-2 border-dashed rounded-xl border-gray-200 dark:border-gray-800">
            <Folder className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium">No projects yet</h3>
            <p className="text-muted-foreground mb-6">Create your first project to start mapping your thoughts.</p>
            <Button onClick={() => setIsCreateOpen(true)} variant="outline">Create Project</Button>
          </div>
        ) : (
          projects.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer group hover:border-primary/50 transition-colors shadow-sm hover:shadow-md"
              onClick={() => router.push(`/workspace/${project.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{project.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                    onClick={(e) => handleDeleteProject(project.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription className="line-clamp-2">
                  {project.description || "No description provided."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const projectNodes = allNodes.filter(n => n.project_id === project.id);
                  const doneCount = projectNodes.filter(n => n.status === 'Done').length;
                  const totalCount = projectNodes.length;
                  const isQuickStart = totalCount <= 5;
                  return (
                    <div className="bg-secondary/50 p-3 rounded-md text-sm text-secondary-foreground flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Progress:</span>
                        <span className="text-muted-foreground">{doneCount}/{totalCount} nodes done</span>
                      </div>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${isQuickStart ? 'bg-primary/10 text-primary' : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'}`}>
                        {isQuickStart ? 'Quick Start' : 'Full Architecture'}
                      </span>
                    </div>
                  );
                })()}
                <div className="text-xs text-muted-foreground mt-4">
                  Last updated: {new Date(project.updated_at).toLocaleDateString()} {new Date(project.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </CardContent>
              <CardFooter className="pt-0 justify-end">
                 <div className="flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                    Open Workspace <ArrowRight className="ml-1 h-4 w-4" />
                 </div>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
