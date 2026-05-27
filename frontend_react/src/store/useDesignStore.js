import { create } from 'zustand';
import { getOrder, listOrders, previewUrl, getOrderQA, patchOrder, measureTypography } from '../api/orders';

// Helper to determine logical canvas dimensions based on physical dimensions (inches)
// maintaining the correct aspect ratio within an 800px bounding box
function calculateLogicalCanvasSize(widthInches, heightInches) {
  const maxDim = 800; // bounding dimension
  const ratio = (widthInches && heightInches) ? (widthInches / heightInches) : 2.0;
  if (ratio >= 1) {
    return { width: maxDim, height: Math.round(maxDim / ratio) };
  } else {
    return { width: Math.round(maxDim * ratio), height: maxDim };
  }
}

// Flatten scene graph nodes for the layer tree
function flattenNodes(node, depth = 0) {
  if (!node) return [];
  const self = { ...node, depth };
  const children = (node.children || []).flatMap(c => flattenNodes(c, depth + 1));
  return [self, ...children];
}

// Recursive helper to update a node within the scene graph tree
function updateNodeInTree(node, id, updates) {
  if (node.id === id) {
    return { ...node, ...updates };
  }
  if (node.children) {
    return {
      ...node,
      children: node.children.map(child => updateNodeInTree(child, id, updates)),
    };
  }
  return node;
}

// Recursive helper to remove a node within the scene graph tree
function removeNodeFromTree(node, id) {
  if (node.children) {
    return {
      ...node,
      children: node.children
        .filter(child => child.id !== id)
        .map(child => removeNodeFromTree(child, id)),
    };
  }
  return node;
}

// ── Buffered Log Streaming State ────────────────────────────────
let logBuffer = [];
let logTimeout = null;

const useDesignStore = create((set, get) => ({
  // ── Connection / Orchestration ──
  health: null,
  pipelineStatus: 'idle',   // idle | queued | processing | composited | completed | failed
  activeAgent: null,        // current LangGraph node name
  pipelineProgress: 0,      // 0-100
  performanceTelemetry: {
    cpu_pct: 0,
    memory_mb: 0,
    ws_latency_ms: 0,
  },
  adminMetrics: {
    queue_size: 0,
    active_workers: 0,
    cache_hits: 0,
  },

  // ── Active router ──
  currentRoute: 'dashboard', // 'dashboard' | 'workspace' | 'create-wizard' | 'templates' | 'exports' | 'admin'
  routeParams: {},

  // ── Buffered Log Console ──
  runtimeLogs: [],
  logFilter: 'ALL',
  logSearchQuery: '',

  // ── Active order ──
  orderId: null,
  orderMeta: null,          // raw API response from /api/orders/{id}
  qaScores: {},
  qaPassed: null,
  exportPaths: {},
  compositeUrl: '',

  // ── Scene graph & layers ──
  sceneGraph: null,         // raw JSON string from backend
  layers: [],               // flattened logical-coord array for Konva
  selectedNodeId: null,
  isDraggingActive: false,  // performance optimization toggle during dragging

  // ── Canvas display ──
  zoomLevel: 1.0,
  showGrid: false,
  showSafeZone: true,
  canvasLogicalW: 800,      // viewport width in logical px
  canvasLogicalH: 400,      // viewport height in logical px

  // ── Orders list ──
  ordersList: [],

  // ── Dirty flag ──
  isDirty: false,

  // ──────────────────────────────────────────────
  // ACTIONS
  // ──────────────────────────────────────────────

  setHealth: (h) => set({ health: h }),

  setPipelineStatus: (status) => set({ pipelineStatus: status }),

  setDraggingActive: (drag) => set({ isDraggingActive: drag }),

  setActiveAgent: (name, progress) =>
    set({ activeAgent: name, pipelineProgress: progress ?? get().pipelineProgress }),

  // ── Router Actions ──
  setRoute: (route, params = {}, skipHistory = false) => {
    set({ currentRoute: route, routeParams: params });
    if (skipHistory) return;

    let path = `/${route}`;
    if (route === 'workspace' && params.orderId) {
      path = `/workspace/${params.orderId}`;
    } else if (route === 'dashboard') {
      path = '/';
    }

    if (window.location.pathname !== path) {
      window.history.pushState({ route, params }, '', path);
    }
  },

  hydrateRouteFromUrl: () => {
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);

    if (parts.length === 0) {
      get().setRoute('dashboard', {}, true);
    } else if (parts[0] === 'workspace') {
      const orderId = parts[1] || null;
      get().setRoute('workspace', orderId ? { orderId } : {}, true);
      if (orderId && get().orderId !== orderId) {
        get().loadOrder(orderId);
      }
    } else {
      const validRoutes = ['dashboard', 'create-wizard', 'templates', 'exports', 'admin'];
      const target = validRoutes.includes(parts[0]) ? parts[0] : 'dashboard';
      get().setRoute(target, {}, true);
    }
  },

  // ── Log Streaming Actions ──
  queueLog: (logItem) => {
    logBuffer.push({
      ...logItem,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString()
    });

    if (logTimeout) return;

    // Buffer logs for 150ms before committing to Zustand store state to avoid render storm locks
    logTimeout = setTimeout(() => {
      set((state) => {
        const merged = [...state.runtimeLogs, ...logBuffer];
        const trimmed = merged.slice(-300); // cap logs at 300 entries to prevent memory leak crashes
        logBuffer = [];
        logTimeout = null;
        return { runtimeLogs: trimmed };
      });
    }, 150);
  },

  clearLogs: () => set({ runtimeLogs: [] }),
  setLogFilter: (filter) => set({ logFilter: filter }),
  setLogSearchQuery: (query) => set({ logSearchQuery: query }),

  // Load a full order from backend and hydrate store
  loadOrder: async (orderId) => {
    set({ pipelineStatus: 'loading', compositeUrl: '' });
    try {
      const res = await getOrder(orderId);
      const order = res.data;

      // Handle custom aspect ratio and canvas logical sizing
      const dims = order.dimensions || { width_inches: 48, height_inches: 24 };
      const { width, height } = calculateLogicalCanvasSize(dims.width_inches, dims.height_inches);

      set({
        orderId,
        orderMeta: order,
        pipelineStatus: order.status || 'unknown',
        qaPassed: order.qa_passed ?? null,
        qaScores: order.qa_scores || {},
        exportPaths: order.export_paths || {},
        compositeUrl: previewUrl(orderId),
        canvasLogicalW: width,
        canvasLogicalH: height,
      });

      if (order.scene_graph) {
        get().setSceneGraph(order.scene_graph);
      }
    } catch (e) {
      set({ pipelineStatus: 'failed', orderId });
    }
  },

  // Refresh preview URL (called after composition completes)
  refreshPreview: () => {
    const { orderId } = get();
    if (orderId) set({ compositeUrl: previewUrl(orderId) });
  },

  // Hydrate QA scores from backend
  loadQA: async (orderId) => {
    try {
      const res = await getOrderQA(orderId);
      set({ qaScores: res.data.qa_scores || {}, qaPassed: res.data.qa_passed });
    } catch { /* QA not ready yet */ }
  },

  // Inject scene graph from backend JSON string and compute flat layers using Canonical Scene units
  setSceneGraph: (jsonStr) => {
    try {
      const root = JSON.parse(jsonStr);
      const { canvasLogicalW, canvasLogicalH } = get();
      const flat = flattenNodes(root)
        .filter(n => n.type !== 'RootNode' && n.type !== 'GroupNode')
        .map(n => ({
          ...n,
          // Translate canonical bounds [0.0, 1.0] -> logical canvas px for Konva display
          transform: {
            x:        (n.transform?.x || 0) * canvasLogicalW,
            y:        (n.transform?.y || 0) * canvasLogicalH,
            rotation: n.transform?.rotation || 0,
          },
          bounds: {
            x:      (n.bounds?.x || 0) * canvasLogicalW,
            y:      (n.bounds?.y || 0) * canvasLogicalH,
            width:  (n.bounds?.width || 0.2) * canvasLogicalW,
            height: (n.bounds?.height || 0.1) * canvasLogicalH,
          },
        }));
      set({ sceneGraph: jsonStr, layers: flat });
    } catch (e) {
      console.warn('Failed parsing scene graph:', e);
    }
  },

  // Select / deselect a canvas node
  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  // Update layer properties (transform, bounds, text) and dynamically calculate Canonical Scene coordinates
  updateLayer: (nodeId, updates) => {
    set((state) => {
      const { canvasLogicalW, canvasLogicalH, sceneGraph } = state;
      
      const newLayers = state.layers.map(l => {
        if (l.id !== nodeId) return l;
        const newTransform = updates.transform ? { ...l.transform, ...updates.transform } : l.transform;
        const newBounds = updates.bounds ? { ...l.bounds, ...updates.bounds } : l.bounds;
        return {
          ...l,
          transform: newTransform,
          bounds: newBounds,
          ...updates,
          dirty: true
        };
      });

      // Update the scene graph JSON tree using canonical (normalized) values
      let updatedJsonStr = sceneGraph;
      if (sceneGraph) {
        try {
          const root = JSON.parse(sceneGraph);
          const targetLayer = newLayers.find(l => l.id === nodeId);
          if (targetLayer) {
            const canonicalUpdates = {
              transform: {
                x:        targetLayer.transform.x / canvasLogicalW,
                y:        targetLayer.transform.y / canvasLogicalH,
                rotation: targetLayer.transform.rotation,
              },
              bounds: {
                x:      targetLayer.bounds.x / canvasLogicalW,
                y:      targetLayer.bounds.y / canvasLogicalH,
                width:  targetLayer.bounds.width / canvasLogicalW,
                height: targetLayer.bounds.height / canvasLogicalH,
              }
            };
            // Propagate typography attributes to the scene graph nodes
            if (updates.text_content !== undefined) {
              canonicalUpdates.text_content = updates.text_content;
            }
            if (updates.font_size !== undefined) {
              canonicalUpdates.font_size = updates.font_size;
            }
            if (updates.color !== undefined) {
              canonicalUpdates.color = updates.color;
            }
            if (updates.alignment !== undefined) {
              canonicalUpdates.alignment = updates.alignment;
            }
            const updatedRoot = updateNodeInTree(root, nodeId, canonicalUpdates);
            updatedJsonStr = JSON.stringify(updatedRoot);
          }
        } catch (err) {
          console.error("Error updating scene graph tree:", err);
        }
      }

      return {
        layers: newLayers,
        sceneGraph: updatedJsonStr,
        isDirty: true
      };
    });
  },

  // Robust property routing helper
  updateLayerTransform: (nodeId, delta) => {
    const updates = {};
    const transformKeys = ['x', 'y', 'rotation'];
    const boundsKeys = ['width', 'height', 'boundsX', 'boundsY'];
    
    for (const key of Object.keys(delta)) {
      if (transformKeys.includes(key)) {
        if (!updates.transform) updates.transform = {};
        updates.transform[key] = delta[key];
      } else if (boundsKeys.includes(key)) {
        if (!updates.bounds) updates.bounds = {};
        const bk = key === 'boundsX' ? 'x' : key === 'boundsY' ? 'y' : key;
        updates.bounds[bk] = delta[key];
      } else {
        updates[key] = delta[key];
      }
    }
    
    get().updateLayer(nodeId, updates);
  },

  // Asynchronously query typography metrics and auto-fit layer bounds
  syncTextBounds: async (nodeId) => {
    const { layers, canvasLogicalW, canvasLogicalH } = get();
    const node = layers.find(l => l.id === nodeId && l.type === 'TextNode');
    if (!node) return;

    try {
      const fontFile = node.font_path ? node.font_path.split(/[\\/]/).pop() : 'NTR.ttf';
      const res = await measureTypography({
        text: node.text_content || '',
        font_file: fontFile,
        font_size: node.font_size || 24,
        max_width: node.bounds.width
      });
      
      if (res && res.data) {
        const { width, height } = res.data;
        // Safely adjust bounds based on measured sizes (logical scale)
        get().updateLayer(nodeId, {
          bounds: {
            width: Math.max(40, width),
            height: Math.max(15, height)
          }
        });
      }
    } catch (err) {
      console.warn('Auto text bounds sync failed:', err);
    }
  },

  // Measure any text node metrics
  measureTextMetrics: async (text, fontFile, fontSize, maxWidth) => {
    try {
      const res = await measureTypography({
        text,
        font_file: fontFile,
        font_size: fontSize,
        max_width: maxWidth
      });
      return res.data;
    } catch (err) {
      console.error('Failed to measure typography:', err);
      return null;
    }
  },

  // Delete a canvas node and remove it from the scene graph tree
  deleteNode: (nodeId) => {
    set((state) => {
      const { sceneGraph } = state;
      if (!sceneGraph) return {};

      let updatedJsonStr = sceneGraph;
      try {
        const root = JSON.parse(sceneGraph);
        const updatedRoot = removeNodeFromTree(root, nodeId);
        updatedJsonStr = JSON.stringify(updatedRoot);
      } catch (err) {
        console.error("Error deleting node in scene graph tree:", err);
      }

      const newLayers = state.layers.filter(l => l.id !== nodeId);

      return {
        layers: newLayers,
        sceneGraph: updatedJsonStr,
        selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
        isDirty: true
      };
    });
  },

  // Post transactional patches to selective run backend
  saveEdits: async (isGeometryOnly = true) => {
    const { orderId, sceneGraph, isDirty } = get();
    if (!orderId || !isDirty || !sceneGraph) return;

    set({ pipelineStatus: 'processing' });
    try {
      const res = await patchOrder(orderId, {
        scene_graph: sceneGraph,
        is_geometry_only: isGeometryOnly
      });
      if (res.data.status === 'completed' || res.data.status === 'composited') {
        set({ isDirty: false, pipelineStatus: 'completed' });
        get().refreshPreview();
      } else {
        set({ pipelineStatus: res.data.status || 'failed' });
      }
    } catch (err) {
      console.error('Failed to save edits:', err);
      set({ pipelineStatus: 'failed' });
    }
  },

  // Canvas viewport
  setZoom: (z) => set({ zoomLevel: Math.max(0.25, Math.min(3, z)) }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleSafeZone: () => set((s) => ({ showSafeZone: !s.showSafeZone })),

  // Orders list
  loadOrdersList: async () => {
    try {
      const res = await listOrders();
      set({ ordersList: res.data.orders || [] });
    } catch { /* ignore */ }
  },

  // WebSocket events
  onWsMessage: (msg) => {
    const { orderId } = get();
    
    // Performance instrumentation check
    if (msg.cpu_pct !== undefined || msg.memory_mb !== undefined) {
      set({
        performanceTelemetry: {
          cpu_pct: msg.cpu_pct,
          memory_mb: msg.memory_mb,
          ws_latency_ms: msg.duration_ms || 0,
        }
      });
    }

    // Capture background execution logs if streamed from the backend
    if (msg.type === 'log') {
      get().queueLog({
        level: msg.level || 'INFO',
        message: msg.message,
        node: msg.node
      });
    }

    switch (msg.type) {
      case 'agent_start':
        set({ activeAgent: msg.node, pipelineStatus: 'processing', pipelineProgress: msg.progress || 0 });
        get().queueLog({
          level: 'INFO',
          message: `Agent execution started for node: ${msg.node}`,
          node: msg.node
        });
        break;
      case 'agent_end':
        set({ pipelineProgress: msg.progress || 0 });
        get().queueLog({
          level: 'INFO',
          message: `Agent execution ended for node: ${msg.node}`,
          node: msg.node
        });
        if (msg.node === 'composition') get().refreshPreview();
        break;
      case 'scene_graph_update':
        get().setSceneGraph(msg.scene_graph);
        get().queueLog({
          level: 'INFO',
          message: 'Scene graph update received from backend.',
          node: 'composition'
        });
        break;
      case 'qa_update':
        set({ qaScores: msg.scores || {}, qaPassed: msg.passed });
        get().queueLog({
          level: msg.passed ? 'INFO' : 'WARNING',
          message: `QA checks processed. Passed: ${msg.passed ? 'YES' : 'NO'}. Composite: ${msg.scores?.composite ?? 'N/A'}.`,
          node: 'qa_engine'
        });
        break;
      case 'pipeline_complete':
        set({ pipelineStatus: 'completed', pipelineProgress: 100, activeAgent: null });
        get().queueLog({
          level: 'INFO',
          message: 'Design pipeline successfully completed E2E execution.',
          node: 'orchestration'
        });
        if (orderId) get().loadOrder(orderId);
        break;
      case 'pipeline_failed':
        set({ pipelineStatus: 'failed', activeAgent: null });
        get().queueLog({
          level: 'ERROR',
          message: `Design pipeline failed: ${msg.error || 'Unknown error'}`,
          node: 'orchestration'
        });
        break;
      default:
        break;
    }
  },
}));

export default useDesignStore;
