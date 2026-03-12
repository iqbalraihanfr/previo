"use client";

export type DFDNodeType = "process" | "entity" | "datastore";

export interface DFDNode {
  id: string;
  label: string;
  type: DFDNodeType;
  related_use_case?: string;
  related_erd_entity?: string;
}

export interface DFDFlow {
  id: string;
  from: string;
  to: string;
  label: string;
}

export interface DFDFields {
  nodes?: DFDNode[];
  flows?: DFDFlow[];
}

export function useDFDLogic(fields: DFDFields, onChange: (f: DFDFields) => void) {
  const nodes = Array.isArray(fields.nodes) ? fields.nodes : [];
  const flows = Array.isArray(fields.flows) ? fields.flows : [];

  const updateNodes = (newN: DFDNode[]) => onChange({ ...fields, nodes: newN });
  const updateFlows = (newF: DFDFlow[]) => onChange({ ...fields, flows: newF });

  const addNode = (type: DFDNodeType) => {
    updateNodes([
      ...nodes,
      {
        id: window.crypto.randomUUID(),
        label: "",
        type,
        related_use_case: "",
        related_erd_entity: "",
      },
    ]);
  };

  const updateNode = (id: string, updates: Partial<DFDNode>) => {
    updateNodes(nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)));
  };

  const removeNode = (id: string) => {
    updateNodes(nodes.filter((n) => n.id !== id));
  };

  const addFlow = () => {
    updateFlows([
      ...flows,
      { id: window.crypto.randomUUID(), from: "", to: "", label: "" },
    ]);
  };

  const updateFlow = (id: string, updates: Partial<DFDFlow>) => {
    updateFlows(flows.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const removeFlow = (id: string) => {
    updateFlows(flows.filter((f) => f.id !== id));
  };

  const validateFlow = (flow: DFDFlow): string | null => {
    const fromNode = nodes.find((n) => n.id === flow.from);
    const toNode = nodes.find((n) => n.id === flow.to);
    
    if (!fromNode || !toNode) return null;

    if (fromNode.type === "entity" && (toNode.type === "entity" || toNode.type === "datastore")) {
      return `External Entity cannot connect directly to ${toNode.type === "entity" ? "another External Entity" : "a Data Store"}.`;
    }
    if (fromNode.type === "datastore" && (toNode.type === "entity" || toNode.type === "datastore")) {
      return `Data Store cannot connect directly to ${toNode.type === "entity" ? "External Entity" : "another Data Store"}.`;
    }

    return null;
  };

  return {
    nodes,
    flows,
    addNode,
    updateNode,
    removeNode,
    addFlow,
    updateFlow,
    removeFlow,
    validateFlow,
  };
}
