"use client";

import React, { useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Layers3, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROJECT_TEMPLATES, type WorkflowTemplateKey } from "@/features/dashboard/projectTemplates";
import {
  PROJECT_DOMAIN_OPTIONS,
  STARTER_INTENSITY_OPTIONS,
} from "@/lib/projectStarters";
import { DELIVERY_MODE_LABELS } from "@/lib/sourceArtifacts";
import type {
  DeliveryMode,
  ProjectDomain,
  StarterContentIntensity,
} from "@/lib/db";

export type TemplateKey = WorkflowTemplateKey;

export type TemplateConfig = {
  label: string;
  shortLabel: string;
  description: string;
  icon: typeof Zap;
  badge?: string;
  accentClass: string;
  cardClass: string;
  availability: "stable" | "experimental";
  helperText: string;
};

export const TEMPLATES: Record<TemplateKey, TemplateConfig> = {
  quick: {
    label: "Quick Start",
    shortLabel: "Quick",
    description:
      "Brief → Requirements → ERD → Task Board → Summary. Ideal for solo projects, prototypes, and client work.",
    icon: Zap,
    accentClass: "metric-pill metric-pill--success",
    cardClass:
      "border-border/70 bg-background hover:border-primary/35 hover:bg-primary/5",
    availability: "stable",
    helperText:
      "Best default. Fast path from idea to documentation and execution plan.",
  },
  full: {
    label: "Full Architecture",
    shortLabel: "Full",
    description:
      "Complete architecture workflow with user stories, use cases, DFD, flowcharts, sequence diagrams, tasks, and summary.",
    icon: BookOpen,
    badge: "Experimental",
    accentClass: "metric-pill metric-pill--warning",
    cardClass:
      "border-amber-500/25 bg-amber-500/5 hover:border-amber-500/40 hover:bg-amber-500/10",
    availability: "experimental",
    helperText:
      "For deeper documentation. Available now, but some editor flows may still evolve.",
  },
};

export const CREATE_PROJECT_STEPS = [
  {
    key: "basics",
    label: "Basics",
    helperText: "Name and description",
  },
  {
    key: "workflow",
    label: "Workflow",
    helperText: "Choose the canonical map",
  },
  {
    key: "delivery",
    label: "Delivery",
    helperText: "Set the release framing",
  },
  {
    key: "advanced",
    label: "Advanced",
    helperText: "Metadata and starter content",
  },
] as const;

const DOMAIN_OPTIONS = [
  {
    value: "general" as const,
    label: "General",
    description: "Keep the project as neutral metadata with no domain bias.",
  },
  ...PROJECT_DOMAIN_OPTIONS,
] as const;

interface CreateProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  onProjectNameChange: (value: string) => void;
  projectDesc: string;
  onProjectDescChange: (value: string) => void;
  selectedTemplate: TemplateKey;
  onTemplateChange: (key: TemplateKey) => void;
  selectedDomain: ProjectDomain;
  onDomainChange: (key: ProjectDomain) => void;
  selectedStarterContentIntensity: StarterContentIntensity;
  onStarterContentIntensityChange: (key: StarterContentIntensity) => void;
  deliveryMode: DeliveryMode;
  onDeliveryModeChange: (value: DeliveryMode) => void;
  onCreate: () => void;
  isCreating?: boolean;
}

const STEP_ORDER = CREATE_PROJECT_STEPS.map((step) => step.key);

export function CreateProjectDialog({
  isOpen,
  onOpenChange,
  projectName,
  onProjectNameChange,
  projectDesc,
  onProjectDescChange,
  selectedTemplate,
  onTemplateChange,
  selectedDomain,
  onDomainChange,
  selectedStarterContentIntensity,
  onStarterContentIntensityChange,
  deliveryMode,
  onDeliveryModeChange,
  onCreate,
  isCreating = false,
}: CreateProjectDialogProps) {
  const [activeStep, setActiveStep] = useState<(typeof STEP_ORDER)[number]>("basics");

  const stepIndex = STEP_ORDER.indexOf(activeStep);
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === STEP_ORDER.length - 1;
  const activeStepConfig = CREATE_PROJECT_STEPS[stepIndex];
  const activeTemplate = TEMPLATES[selectedTemplate];
  const ActiveTemplateIcon = activeTemplate.icon;

  const selectedDomainOption =
    DOMAIN_OPTIONS.find((option) => option.value === selectedDomain) ??
    DOMAIN_OPTIONS[0];
  const selectedIntensityOption =
    STARTER_INTENSITY_OPTIONS.find(
      (option) => option.value === selectedStarterContentIntensity,
    ) ?? STARTER_INTENSITY_OPTIONS[0];

  const goToNextStep = () => {
    const nextStep = STEP_ORDER[Math.min(stepIndex + 1, STEP_ORDER.length - 1)];
    setActiveStep(nextStep);
  };

  const goToPreviousStep = () => {
    const previousStep = STEP_ORDER[Math.max(stepIndex - 1, 0)];
    setActiveStep(previousStep);
  };

  const handleCreate = () => {
    if (!projectName.trim()) {
      return;
    }

    onCreate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[92dvh] flex-col overflow-hidden p-0 sm:max-w-3xl lg:max-w-5xl"
        data-testid="create-project-dialog"
      >
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex flex-wrap items-center gap-2">
            {CREATE_PROJECT_STEPS.map((step, index) => {
              const isActive = step.key === activeStep;
              const isCompleted = index < stepIndex;

              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => setActiveStep(step.key)}
                  data-testid={`create-project-step-${step.key}`}
                  className={[
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-left transition-colors",
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : isCompleted
                        ? "border-border/80 bg-muted/60 text-foreground"
                        : "border-border/60 bg-background text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  <span className="text-readable-2xs font-bold uppercase tracking-[0.16em]">
                    {index + 1}
                  </span>
                  <span className="text-xs font-semibold">{step.label}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 space-y-1">
            <DialogTitle>Create new project</DialogTitle>
            <DialogDescription>
              Build the workspace in four short passes. Workflow and delivery are
              structural, while domain lives in advanced metadata.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid gap-6">
            <div className="flex items-start justify-between gap-4 rounded-[16px] border border-border/70 bg-muted/30 px-4 py-3">
              <div>
                <p className="text-readable-2xs uppercase tracking-[0.18em] text-muted-foreground">
                  Step {stepIndex + 1} of {CREATE_PROJECT_STEPS.length}
                </p>
                <h3 className="mt-1 text-base font-semibold text-foreground">
                  {activeStepConfig.label}
                </h3>
              </div>
              <p className="max-w-sm text-right text-sm leading-6 text-muted-foreground">
                {activeStepConfig.helperText}
              </p>
            </div>

            {activeStep === "basics" && (
              <section
                className="grid gap-4"
                data-testid="create-project-panel-basics"
              >
                <div className="grid gap-2">
                  <Label htmlFor="project-name">Project name</Label>
                  <Input
                    id="project-name"
                    placeholder="e.g. Toko Online, Portfolio, Internal HRIS"
                    value={projectName}
                    onChange={(event) => onProjectNameChange(event.target.value)}
                    autoFocus
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="project-description">
                    Description{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="project-description"
                    placeholder="Short context about the project"
                    value={projectDesc}
                    onChange={(event) => onProjectDescChange(event.target.value)}
                  />
                </div>
              </section>
            )}

            {activeStep === "workflow" && (
              <section
                className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]"
                data-testid="create-project-panel-workflow"
              >
                <div className="grid gap-3">
                  {(
                    Object.entries(TEMPLATES) as [TemplateKey, TemplateConfig][]
                  ).map(([key, template]) => {
                    const Icon = template.icon;
                    const isSelected = selectedTemplate === key;

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => onTemplateChange(key)}
                        data-testid={`workflow-option-${key}`}
                        className={[
                          "rounded-[14px] border p-4 text-left transition-all",
                          isSelected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : template.cardClass,
                        ].join(" ")}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <div
                                className={[
                                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]",
                                  isSelected
                                    ? "bg-primary/10 text-primary"
                                    : "bg-muted text-muted-foreground",
                                ].join(" ")}
                              >
                                <Icon className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-semibold">
                                    {template.label}
                                  </span>
                                  <span className={template.accentClass}>
                                    {template.badge ?? "Stable"}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                  {template.helperText}
                                </p>
                              </div>
                            </div>

                            <p className="text-sm leading-relaxed text-muted-foreground sm:pl-13">
                              {template.description}
                            </p>
                          </div>

                          {isSelected && (
                            <Badge className="w-fit px-3 py-1 text-readable-xs">
                              Selected
                            </Badge>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-[16px] border border-border/70 bg-secondary/45 p-5">
                  <div className="flex items-center gap-2 font-medium">
                    <ActiveTemplateIcon className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">{activeTemplate.label}</h3>
                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {activeTemplate.description}
                  </p>

                  {activeTemplate.availability === "experimental" && (
                    <div className="mt-4 rounded-[12px] border border-amber-500/25 bg-amber-500/10 px-3 py-3">
                      <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                        Experimental template
                      </p>
                      <p className="mt-1 text-readable-xs leading-5 text-amber-700/90 dark:text-amber-300">
                        Great for deeper architecture work. Some editor flows may
                        still evolve, but you can already use it productively.
                      </p>
                    </div>
                  )}

                  <div className="mt-5 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      Included nodes
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {PROJECT_TEMPLATES[selectedTemplate].nodes.map((node, index) => (
                        <Badge
                          key={`${node.type}-${index}`}
                          variant="secondary"
                          className="border border-border/60 bg-background px-2.5 py-1 text-readable-xs font-medium"
                        >
                          {node.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeStep === "delivery" && (
              <section
                className="grid gap-3"
                data-testid="create-project-panel-delivery"
              >
                <div className="space-y-1">
                  <Label>Delivery mode</Label>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Previo keeps one canonical task model, then frames the output
                    using the delivery style you choose here.
                  </p>
                </div>

                <Select
                  value={deliveryMode}
                  onValueChange={(value) => onDeliveryModeChange(value as DeliveryMode)}
                >
                  <SelectTrigger
                    className="h-11 rounded-xl"
                    data-testid="delivery-mode-trigger"
                  >
                    <SelectValue placeholder="Choose delivery mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(DELIVERY_MODE_LABELS) as [DeliveryMode, string][]
                    ).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </section>
            )}

            {activeStep === "advanced" && (
              <section
                className="grid gap-6"
                data-testid="create-project-panel-advanced"
              >
                <div className="rounded-[16px] border border-border/70 bg-secondary/30 p-4">
                  <div className="flex items-center gap-2">
                    <Layers3 className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">Advanced metadata</h3>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Domain is metadata only. It helps seed context and framing,
                    but it never changes the canonical workflow map.
                  </p>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="project-domain-trigger">Domain</Label>
                  <Select
                    value={selectedDomain}
                    onValueChange={(value) => onDomainChange(value as ProjectDomain)}
                  >
                    <SelectTrigger
                      id="project-domain-trigger"
                      className="h-11 rounded-xl"
                      data-testid="project-domain-trigger"
                    >
                      <SelectValue placeholder="Choose a domain" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOMAIN_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-readable-xs text-muted-foreground">
                    {selectedDomainOption.description}
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="space-y-1">
                    <Label>Starter content intensity</Label>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Pick how much starter content to seed into the workspace
                      before you start editing.
                    </p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    {STARTER_INTENSITY_OPTIONS.map((option) => {
                      const isSelected =
                        selectedStarterContentIntensity === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          data-testid={`intensity-option-${option.value}`}
                          onClick={() =>
                            onStarterContentIntensityChange(option.value)
                          }
                          className={[
                            "rounded-[14px] border p-4 text-left transition-all",
                            isSelected
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                              : "border-border/60 bg-background hover:border-primary/30 hover:bg-primary/5",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold">{option.label}</p>
                              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                {option.description}
                              </p>
                            </div>
                            {isSelected && (
                              <Badge className="px-2 py-1 text-readable-xs">
                                Selected
                              </Badge>
                            )}
                          </div>
                          <p className="mt-3 text-readable-xs text-muted-foreground">
                            {option.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="rounded-[14px] border border-border/60 bg-background/80 px-4 py-3">
                    <p className="text-readable-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Metadata preview
                    </p>
                    <p className="mt-2 text-sm text-foreground">
                      {selectedDomain === "general"
                        ? "No extra domain metadata"
                        : selectedDomainOption.label}
                    </p>
                    <p className="mt-1 text-readable-xs text-muted-foreground">
                      Starter content: {selectedIntensityOption.label}
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        <DialogFooter className="border-t bg-muted/30 px-6 py-4">
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              data-testid="create-project-cancel"
            >
              Cancel
            </Button>

            <div className="flex items-center gap-3 sm:ml-auto">
              {!isFirstStep && (
                <Button
                  variant="outline"
                  onClick={goToPreviousStep}
                  data-testid="create-project-back"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}

              {!isLastStep ? (
                <Button
                  onClick={goToNextStep}
                  disabled={!projectName.trim() && activeStep === "basics"}
                  data-testid="create-project-next"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleCreate}
                  disabled={!projectName.trim() || isCreating}
                  data-testid="create-workspace-submit"
                >
                  {isCreating ? "Creating workspace…" : "Create workspace"}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
