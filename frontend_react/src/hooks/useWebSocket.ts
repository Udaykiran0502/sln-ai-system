import { useEffect, useRef } from 'react';
import { useStore, type SceneNode } from '../store/useStore';

export const useWebSocket = () => {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  
  const updateTelemetry = useStore((state) => state.updateTelemetry);
  const addLog = useStore((state) => state.addLog);
  const updateSceneGraph = useStore((state) => state.updateSceneGraph);
  const project = useStore((state) => state.project);

  const connect = () => {
    updateTelemetry({ wsStatus: 'connecting' });
    addLog('Connecting to production WebSocket server...');
    
    // Connect to backend ws
    const wsUrl = 'ws://localhost:8000/ws/production';
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      updateTelemetry({ wsStatus: 'connected' });
      addLog('WebSocket connected successfully.');
      
      // Send initial workspace state synchronization request
      ws.send(JSON.stringify({
        type: 'INITIAL_SYNC',
        payload: {
          projectId: project.id,
          sceneGraph: project.sceneGraph
        }
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'SCENE_SYNC':
            if (message.payload?.sceneGraph) {
              updateSceneGraph(message.payload.sceneGraph as SceneNode[]);
              addLog('Scene Graph updated by server.');
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
      addLog('WebSocket connection closed. Retrying in 3 seconds...');
      
      // Auto-reconnect loop
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = (err) => {
      console.error('WebSocket encountered an error:', err);
      ws.close();
    };
  };

  const sendStateUpdate = (nodes: SceneNode[]) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'SCENE_UPDATE',
        payload: {
          projectId: project.id,
          sceneGraph: nodes
        }
      }));
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
