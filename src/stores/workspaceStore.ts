import { create } from 'zustand';
import { NodeData } from '@/lib/db';

interface WorkspaceState {
  activeProjectId: string | null;
  activeNodeId: string | null;
  nodes: NodeData[];
  
  // Actions
  setActiveProject: (id: string | null) => void;
  setActiveNode: (id: string | null) => void;
  setNodes: (nodes: NodeData[]) => void;
  
  updateNodeStatus: (id: string, status: NodeData['status']) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeProjectId: null,
  activeNodeId: null,
  nodes: [],

  setActiveProject: (id) => set({ activeProjectId: id }),
  setActiveNode: (id) => set({ activeNodeId: id }),
  setNodes: (nodes) => set({ nodes }),
  
  updateNodeStatus: (id, status) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, status } : node
      ),
    })),
}));
