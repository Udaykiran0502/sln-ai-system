import { create } from 'zustand';

export interface SceneNode {
  id: string;
  type: 'text' | 'image' | 'shape' | 'group';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  visible: boolean;
  locked: boolean;
  style: {
    // Text specific properties
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    fill?: string;
    align?: 'left' | 'center' | 'right';
    teluguShaped?: boolean;
    
    // Image specific properties
    src?: string;
    opacity?: number;
    
    // Shape specific properties
    shapeType?: 'rect' | 'circle' | 'star';
    stroke?: string;
    strokeWidth?: number;
  };
  children?: SceneNode[];
}

export interface TelemetryData {
  latency: number;
  wsStatus: 'connecting' | 'connected' | 'disconnected';
  cpuUsage: number;
  ramUsage: number;
  queueLength: number;
  logs: string[];
}

interface ProjectState {
  id: string;
  name: string;
  width: number;
  height: number;
  sceneGraph: SceneNode[];
}

interface StoreState {
  // Project & Canvas state
  project: ProjectState;
  selectedNodeId: string | null;
  activeTool: 'select' | 'text' | 'rect' | 'circle' | 'image';
  zoom: number;
  
  // Real-time telemetry state
  telemetry: TelemetryData;
  
  // Actions
  setProject: (project: ProjectState) => void;
  updateSceneGraph: (nodes: SceneNode[]) => void;
  updateNode: (id: string, updates: Partial<SceneNode>) => void;
  addNode: (node: SceneNode) => void;
  deleteNode: (id: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  setActiveTool: (tool: 'select' | 'text' | 'rect' | 'circle' | 'image') => void;
  setZoom: (zoom: number) => void;
  
  // Telemetry Actions
  updateTelemetry: (updates: Partial<TelemetryData>) => void;
  addLog: (log: string) => void;
}

const mockInitialNodes: SceneNode[] = [
  {
    id: 'bg-rect',
    type: 'shape',
    name: 'Background Card',
    x: 0,
    y: 0,
    width: 800,
    height: 600,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    visible: true,
    locked: true,
    style: {
      shapeType: 'rect',
      fill: '#080c14',
      stroke: '#1e2d4a',
      strokeWidth: 2,
    }
  },
  {
    id: 'header-text',
    type: 'text',
    name: 'Telugu Header Banner',
    x: 100,
    y: 80,
    width: 600,
    height: 100,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    visible: true,
    locked: false,
    style: {
      text: 'శ్రీ లక్ష్మీ నరసింహ డిజిటల్స్',
      fontSize: 48,
      fontFamily: 'Inter',
      fill: '#e2e8f0',
      align: 'center',
      teluguShaped: true
    }
  },
  {
    id: 'subtitle-text',
    type: 'text',
    name: 'Subtitle',
    x: 150,
    y: 200,
    width: 500,
    height: 50,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    visible: true,
    locked: false,
    style: {
      text: 'AI-Orchestrated Creative Production OS',
      fontSize: 24,
      fontFamily: 'Inter',
      fill: '#a855f7',
      align: 'center',
      teluguShaped: false
    }
  }
];

export const useStore = create<StoreState>((set) => ({
  project: {
    id: 'sln-project-01',
    name: 'Sri Lakshmi Narasimha Banner Project',
    width: 800,
    height: 600,
    sceneGraph: mockInitialNodes,
  },
  selectedNodeId: null,
  activeTool: 'select',
  zoom: 1,
  telemetry: {
    latency: 0,
    wsStatus: 'disconnected',
    cpuUsage: 14,
    ramUsage: 38,
    queueLength: 0,
    logs: ['[System] Store initialized successfully.'],
  },
  
  setProject: (project) => set({ project }),
  
  updateSceneGraph: (sceneGraph) => 
    set((state) => ({ project: { ...state.project, sceneGraph } })),
    
  updateNode: (id, updates) =>
    set((state) => {
      const updatedNodes = state.project.sceneGraph.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            ...updates,
            style: {
              ...node.style,
              ...updates.style,
            }
          };
        }
        return node;
      });
      return { project: { ...state.project, sceneGraph: updatedNodes } };
    }),
    
  addNode: (node) =>
    set((state) => ({
      project: {
        ...state.project,
        sceneGraph: [...state.project.sceneGraph, node],
      }
    })),
    
  deleteNode: (id) =>
    set((state) => ({
      project: {
        ...state.project,
        sceneGraph: state.project.sceneGraph.filter((node) => node.id !== id),
      },
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    })),
    
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  
  setActiveTool: (activeTool) => set({ activeTool }),
  
  setZoom: (zoom) => set({ zoom }),
  
  updateTelemetry: (updates) =>
    set((state) => ({ telemetry: { ...state.telemetry, ...updates } })),
    
  addLog: (log) =>
    set((state) => {
      const fullLog = `[${new Date().toLocaleTimeString()}] ${log}`;
      return {
        telemetry: {
          ...state.telemetry,
          logs: [fullLog, ...state.telemetry.logs].slice(0, 100),
        }
      };
    }),
}));
