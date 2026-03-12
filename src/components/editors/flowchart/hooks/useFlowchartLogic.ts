"use client";

export type FlowStepType = "start" | "process" | "decision" | "end";

export interface FlowStep {
  id: string;
  label: string;
  type: FlowStepType;
  yes_target?: string;
  no_target?: string;
}

export interface FlowConnection {
  id: string;
  from: string;
  to: string;
  label: string;
}

export interface Flow {
  id: string;
  name: string;
  related_use_case: string;
  trigger: string;
  steps: FlowStep[];
  connections: FlowConnection[];
}

export interface FlowchartFields {
  flows?: Flow[];
}

export function useFlowchartLogic(fields: FlowchartFields, onChange: (f: FlowchartFields) => void) {
  const flows = Array.isArray(fields.flows) ? fields.flows : [];

  const updateFlows = (newF: Flow[]) => onChange({ ...fields, flows: newF });

  const addFlow = () => {
    updateFlows([
      ...flows,
      {
        id: window.crypto.randomUUID(),
        name: "",
        related_use_case: "",
        trigger: "",
        steps: [],
        connections: [],
      },
    ]);
  };

  const updateFlow = (id: string, updates: Partial<Flow>) => {
    updateFlows(flows.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const removeFlow = (id: string) => {
    updateFlows(flows.filter((f) => f.id !== id));
  };

  // Step operations
  const addStep = (flowId: string) => {
    const flow = flows.find((f) => f.id === flowId);
    if (!flow) return;
    updateFlow(flowId, {
      steps: [
        ...(flow.steps || []),
        { id: window.crypto.randomUUID(), label: "", type: "process" },
      ],
    });
  };

  const updateStep = (flowId: string, stepId: string, updates: Partial<FlowStep>) => {
    const flow = flows.find((f) => f.id === flowId);
    if (!flow) return;
    updateFlow(flowId, {
      steps: (flow.steps || []).map((s) => (s.id === stepId ? { ...s, ...updates } : s)),
    });
  };

  const removeStep = (flowId: string, stepId: string) => {
    const flow = flows.find((f) => f.id === flowId);
    if (!flow) return;
    updateFlow(flowId, {
      steps: (flow.steps || []).filter((s) => s.id !== stepId),
    });
  };

  // Connection operations
  const addConnection = (flowId: string) => {
    const flow = flows.find((f) => f.id === flowId);
    if (!flow) return;
    updateFlow(flowId, {
      connections: [
        ...(flow.connections || []),
        { id: window.crypto.randomUUID(), from: "", to: "", label: "" },
      ],
    });
  };

  const updateConnection = (flowId: string, connId: string, updates: Partial<FlowConnection>) => {
    const flow = flows.find((f) => f.id === flowId);
    if (!flow) return;
    updateFlow(flowId, {
      connections: (flow.connections || []).map((c) => (c.id === connId ? { ...c, ...updates } : c)),
    });
  };

  const removeConnection = (flowId: string, connId: string) => {
    const flow = flows.find((f) => f.id === flowId);
    if (!flow) return;
    updateFlow(flowId, {
      connections: (flow.connections || []).filter((c) => c.id !== connId),
    });
  };

  return {
    flows,
    addFlow,
    updateFlow,
    removeFlow,
    addStep,
    updateStep,
    removeStep,
    addConnection,
    updateConnection,
    removeConnection,
  };
}
