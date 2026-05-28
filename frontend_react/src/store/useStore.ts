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

export interface QAViolation {
  id: string;
  nodeId: string;
  nodeName: string;
  type: 'clipping' | 'bleed' | 'dpi' | 'brand';
  severity: 'warning' | 'critical';
  message: string;
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
  
  // History & Versioning System
  history: SceneNode[][];
  historyIndex: number;
  
  // Strict print QA validations
  qaViolations: QAViolation[];
  
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
  
  // QA Validation Controller
  triggerQAValidation: () => void;
  
  // History Actions
  pushHistory: (scene: SceneNode[]) => void;
  undo: () => void;
  redo: () => void;
  
  // JSON Serialization Actions
  exportToJson: () => string;
  importFromJson: (jsonStr: string) => void;
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
      fill: '#ffffff',
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

// Subsystem #5: Workspace Recovery - Read Local Autosave on boot
const getAutosavedWorkspace = (): ProjectState => {
  try {
    const saved = localStorage.getItem('sln-workspace-autosave');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.sceneGraph && parsed.sceneGraph.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Zustand] Recovery autosave read failed, mounting defaults.', err);
  }
  return {
    id: 'sln-project-01',
    name: 'Sri Lakshmi Narasimha Banner Project',
    width: 800,
    height: 600,
    sceneGraph: mockInitialNodes,
  };
};

const initialProject = getAutosavedWorkspace();

export const useStore = create<StoreState>((set, get) => ({
  project: initialProject,
  selectedNodeId: null,
  activeTool: 'select',
  zoom: 1,
  qaViolations: [],
  
  // History arrays
  history: [initialProject.sceneGraph],
  historyIndex: 0,
  
  telemetry: {
    latency: 0,
    wsStatus: 'disconnected',
    cpuUsage: 14,
    ramUsage: 38,
    queueLength: 0,
    logs: ['[System] Store initialized. Recovered active snapshot.'],
  },
  
  setProject: (project) => {
    set({
      project,
      history: [project.sceneGraph],
      historyIndex: 0,
    });
    // Subsystem #5: Update local autosave block
    try {
      localStorage.setItem('sln-workspace-autosave', JSON.stringify(project));
    } catch (e) {
      console.warn(e);
    }
    get().triggerQAValidation();
  },
  
  updateSceneGraph: (sceneGraph) => {
    set((state) => {
      const updatedProject = { ...state.project, sceneGraph };
      try {
        localStorage.setItem('sln-workspace-autosave', JSON.stringify(updatedProject));
      } catch (e) {
        console.warn(e);
      }
      return { project: updatedProject };
    });
    get().triggerQAValidation();
  },
    
  updateNode: (id, updates) => {
    set((state) => {
      const updatedNodes = state.project.sceneGraph.map((node) => {
        if (node.id === id) {
          const mergedStyle = {
            ...node.style,
            ...(updates.style || {})
          };
          return {
            ...node,
            ...updates,
            style: mergedStyle
          };
        }
        return node;
      });
      
      const updatedProject = { ...state.project, sceneGraph: updatedNodes };
      try {
        localStorage.setItem('sln-workspace-autosave', JSON.stringify(updatedProject));
      } catch (e) {
        console.warn(e);
      }

      // Push history point
      const newIndex = state.historyIndex + 1;
      const newHistory = state.history.slice(0, newIndex);
      newHistory.push(updatedNodes);
      
      return {
        project: updatedProject,
        history: newHistory,
        historyIndex: newIndex
      };
    });
    get().triggerQAValidation();
  },
    
  addNode: (node) => {
    set((state) => {
      const updatedNodes = [...state.project.sceneGraph, node];
      const updatedProject = { ...state.project, sceneGraph: updatedNodes };
      try {
        localStorage.setItem('sln-workspace-autosave', JSON.stringify(updatedProject));
      } catch (e) {
        console.warn(e);
      }

      const newIndex = state.historyIndex + 1;
      const newHistory = state.history.slice(0, newIndex);
      newHistory.push(updatedNodes);
      
      return {
        project: updatedProject,
        history: newHistory,
        historyIndex: newIndex
      };
    });
    get().triggerQAValidation();
  },
    
  deleteNode: (id) => {
    set((state) => {
      const updatedNodes = state.project.sceneGraph.filter((node) => node.id !== id);
      const updatedProject = { ...state.project, sceneGraph: updatedNodes };
      try {
        localStorage.setItem('sln-workspace-autosave', JSON.stringify(updatedProject));
      } catch (e) {
        console.warn(e);
      }

      const newIndex = state.historyIndex + 1;
      const newHistory = state.history.slice(0, newIndex);
      newHistory.push(updatedNodes);
      
      return {
        project: updatedProject,
        history: newHistory,
        historyIndex: newIndex,
        selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId
      };
    });
    get().triggerQAValidation();
  },
    
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

  // Subsystem #11: Deterministic Brand Rule Engine & QA Verification
  triggerQAValidation: () => {
    const { sceneGraph, width, height } = get().project;
    const violations: QAViolation[] = [];
    const bleedMargin = 20; // 20px bleed safety border

    sceneGraph.forEach((node) => {
      // Skip background card from bounds violations
      if (node.id === 'bg-rect' || node.id === 'bg-political' || node.id === 'bg-retail' || node.id === 'bg-wedding' || node.id === 'bg-ai-generated') return;

      const rightEdge = node.x + node.width;
      const bottomEdge = node.y + node.height;

      // 1. Check boundary clipping (element extending past stage edges)
      if (node.x < 0 || rightEdge > width || node.y < 0 || bottomEdge > height) {
        violations.push({
          id: `clip-${node.id}`,
          nodeId: node.id,
          nodeName: node.name,
          type: 'clipping',
          severity: 'critical',
          message: `Layer exceeds bounds: ${Math.round(node.width)}x${Math.round(node.height)}px extends beyond print safety margin.`
        });
      }

      // 2. Check print bleed safety boundaries
      if (
        (node.x < bleedMargin && node.x >= 0) || 
        (rightEdge > (width - bleedMargin) && rightEdge <= width) ||
        (node.y < bleedMargin && node.y >= 0) ||
        (bottomEdge > (height - bleedMargin) && bottomEdge <= height)
      ) {
        violations.push({
          id: `bleed-${node.id}`,
          nodeId: node.id,
          nodeName: node.name,
          type: 'bleed',
          severity: 'warning',
          message: `Bleed Alert: Element lies inside the outer ${bleedMargin}px cut line (bleed margin).`
        });
      }

      // 3. Subsystem #11: TDP / Janasena Brand Logo Protection Zone rules
      const isPolitical = get().project.name.toLowerCase().includes('janasena') || get().project.name.toLowerCase().includes('campaign') || get().project.name.toLowerCase().includes('political') || get().project.name.toLowerCase().includes('tdp');
      if (isPolitical) {
        // Enforce top-left protected coordinate zone (x:0-120, y:0-120) for party icons
        if (node.x < 120 && node.y < 120 && !node.id.includes('logo') && !node.id.includes('bg')) {
          violations.push({
            id: `brand-logo-${node.id}`,
            nodeId: node.id,
            nodeName: node.name,
            type: 'brand',
            severity: 'warning',
            message: `Brand Rule: Element encroaches top-left Party Logo protected clear-zone boundary.`
          });
        }

        // Color harmony constraint checks: Telugu political text elements should use high contrast corporate branding rules
        if (node.type === 'text' && node.style.fill) {
          const fill = node.style.fill.toLowerCase();
          const hasInvalidMutedColors = fill === '#7f1d1d' || fill === '#0f172a' || fill === '#1e293b';
          if (hasInvalidMutedColors) {
            violations.push({
              id: `brand-color-${node.id}`,
              nodeId: node.id,
              nodeName: node.name,
              type: 'brand',
              severity: 'warning',
              message: `Color Rule: Muted text color detected. Political banners require high contrast yellow, red, or white scripts.`
            });
          }
        }
      }
    });

    set({ qaViolations: violations });
  },
  
  // History Actions
  pushHistory: (scene) => {
    set((state) => {
      const newIndex = state.historyIndex + 1;
      const newHistory = state.history.slice(0, newIndex);
      newHistory.push(scene);
      return {
        history: newHistory,
        historyIndex: newIndex
      };
    });
  },
  
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevScene = history[prevIndex];
      set((state) => {
        const updatedProject = { ...state.project, sceneGraph: prevScene };
        try {
          localStorage.setItem('sln-workspace-autosave', JSON.stringify(updatedProject));
        } catch (e) {
          console.warn(e);
        }
        return {
          project: updatedProject,
          historyIndex: prevIndex
        };
      });
      get().triggerQAValidation();
      get().addLog(`Undo action triggered. Restored to step #${prevIndex}.`);
    }
  },
  
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextScene = history[nextIndex];
      set((state) => {
        const updatedProject = { ...state.project, sceneGraph: nextScene };
        try {
          localStorage.setItem('sln-workspace-autosave', JSON.stringify(updatedProject));
        } catch (e) {
          console.warn(e);
        }
        return {
          project: updatedProject,
          historyIndex: nextIndex
        };
      });
      get().triggerQAValidation();
      get().addLog(`Redo action triggered. Moved forward to step #${nextIndex}.`);
    }
  },
  
  // JSON Serialization Actions
  exportToJson: () => {
    const { id, name, width, height, sceneGraph } = get().project;
    // Map stage coordinates to a clean normalized relative format for DB storage
    const normalizedNodes = sceneGraph.map(node => {
      return {
        ...node,
        // Save coordinates as ratios relative to stage size to maintain design integrity across templates
        relX: node.x / width,
        relY: node.y / height,
        relWidth: node.width / width,
        relHeight: node.height / height
      };
    });
    
    get().addLog('Serializing scene graph coordinates to database compliant JSON schemas...');
    return JSON.stringify({ id, name, width, height, nodes: normalizedNodes }, null, 2);
  },
  
  importFromJson: (jsonStr) => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.nodes) {
        const denormalizedNodes = data.nodes.map((node: any) => {
          const { relX, relY, relWidth, relHeight, ...rest } = node;
          return {
            ...rest,
            // Recover absolute coordinates on load
            x: relX ? relX * data.width : node.x,
            y: relY ? relY * data.height : node.y,
            width: relWidth ? relWidth * data.width : node.width,
            height: relHeight ? relHeight * data.height : node.height,
          };
        });
        
        const updatedProject = {
          id: data.id || get().project.id,
          name: data.name || get().project.name,
          width: data.width || get().project.width,
          height: data.height || get().project.height,
          sceneGraph: denormalizedNodes
        };

        try {
          localStorage.setItem('sln-workspace-autosave', JSON.stringify(updatedProject));
        } catch (e) {
          console.warn(e);
        }

        set({
          project: updatedProject,
          history: [denormalizedNodes],
          historyIndex: 0
        });
        
        get().triggerQAValidation();
        get().addLog(`Import check: successfully recovered project '${data.name}'.`);
      }
    } catch (err) {
      console.error('Failed to import JSON template:', err);
    }
  }
}));
