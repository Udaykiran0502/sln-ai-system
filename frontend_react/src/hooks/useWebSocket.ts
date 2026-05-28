import { useEffect, useRef } from 'react';
import { useStore, type SceneNode } from '../store/useStore';

export const useWebSocket = () => {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  
  // Subsystem #12: Offline mutation queue
  const offlineQueueRef = useRef<SceneNode[][]>([]);
  
  const updateTelemetry = useStore((state) => state.updateTelemetry);
  const addLog = useStore((state) => state.addLog);
  const updateSceneGraph = useStore((state) => state.updateSceneGraph);
  const project = useStore((state) => state.project);

  const connect = () => {
    updateTelemetry({ wsStatus: 'connecting' });
    addLog(`Connecting to production WebSocket server (Attempt #${reconnectAttemptsRef.current + 1})...`);
    
    const wsUrl = 'ws://localhost:8000/ws/production';
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      updateTelemetry({ wsStatus: 'connected' });
      addLog('WebSocket connected successfully.');
      reconnectAttemptsRef.current = 0; // Reset exponential attempts count
      
      // Send initial workspace state synchronization request
      ws.send(JSON.stringify({
        type: 'INITIAL_SYNC',
        payload: {
          projectId: project.id,
          sceneGraph: project.sceneGraph
        }
      }));

      // Flush offline mutation buffers upon recovery
      if (offlineQueueRef.current.length > 0) {
        addLog(`[Offline Recovery] Flashing ${offlineQueueRef.current.length} queued offline mutations to backend server...`);
        offlineQueueRef.current.forEach((bufferedNodes) => {
          ws.send(JSON.stringify({
            type: 'SCENE_UPDATE',
            payload: {
              projectId: project.id,
              sceneGraph: bufferedNodes
            }
          }));
        });
        offlineQueueRef.current = [];
        addLog('[Offline Recovery] Reconnection workspace reconciliation complete.');
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'SCENE_SYNC':
            if (message.payload?.sceneGraph) {
              updateSceneGraph(message.payload.sceneGraph as SceneNode[]);
              addLog('Scene Sync: layout synchronized with paired workstation.');
            }
            break;
          case 'TELEMETRY_UPDATE':
            if (message.payload) {
              updateTelemetry({
                cpuUsage: message.payload.cpuUsage ?? 0,
                ramUsage: message.payload.ramUsage ?? 0,
                queueLength: message.payload.queueLength ?? 0,
                latency: message.payload.latency ?? 0
              });
            }
            break;
          case 'LOG_MESSAGE':
            if (message.payload?.text) {
              addLog(message.payload.text);
            }
            break;
          default:
            console.warn('Unknown WebSocket message type:', message.type);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onclose = () => {
      updateTelemetry({ wsStatus: 'disconnected' });
      
      // Subsystem #5: Exponential Backoff Reconnection delay calculations
      reconnectAttemptsRef.current += 1;
      const backoffDelay = Math.min(10000, 500 * Math.pow(2, reconnectAttemptsRef.current));
      
      addLog(`WebSocket connection interrupted. Attempting self-healing reconnection in ${backoffDelay}ms...`);
      
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect();
      }, backoffDelay);
    };

    ws.onerror = (err) => {
      console.error('WebSocket encountered an error:', err);
      ws.close();
    };
  };

  // Subsystem #12: Optimistic Local State sync or offline queue buffering
  const sendStateUpdate = (nodes: SceneNode[]) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      // Bandwidth optimization: Log delta transmission triggers
      addLog(`[Sync] Broadcasting scene graph delta update to WS hub.`);
      socketRef.current.send(JSON.stringify({
        type: 'SCENE_UPDATE',
        payload: {
          projectId: project.id,
          sceneGraph: nodes
        }
      }));
    } else {
      // Buffer modifications inside queue if offline
      addLog('[Sync Warning] Server offline. Buffering mutation to local recovery queue.');
      offlineQueueRef.current.push(nodes);
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return { sendStateUpdate };
};
