import { useEffect, useRef, useState } from 'react';
import useDesignStore from '../store/useDesignStore';

const BASE_WS = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000';

export function useWebSocket(orderId) {
  const socketRef = useRef(null);
  const onWsMessage = useDesignStore((s) => s.onWsMessage);
  const setPipelineStatus = useDesignStore((s) => s.setPipelineStatus);
  const queueLog = useDesignStore((s) => s.queueLog);
  const loadOrder = useDesignStore((s) => s.loadOrder);
  
  const retryCountRef = useRef(0);
  const pingIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const lastPongRef = useRef(0);

  useEffect(() => {
    if (!orderId) return;

    let destroyed = false;

    function connect() {
      if (destroyed) return;
      
      cleanupTimers();
      
      const url = `${BASE_WS}/api/ws/orders/${orderId}`;
      const ws = new WebSocket(url);
      socketRef.current = ws;
      
      setPipelineStatus('connecting');

      ws.onopen = () => {
        if (destroyed) {
          ws.close();
          return;
        }
        
        console.log(`[WS] Authoritative sync connected for order ${orderId}`);
        setPipelineStatus('connected');
        retryCountRef.current = 0;
        lastPongRef.current = Date.now();

        // 1. Trigger automated 15-second heartbeat ping loop
        startHeartbeatLoop(ws);

        // 2. Perform optimistic reconciliation check
        // Resync local canvas state against the authoritative backend store on reconnect
        loadOrder(orderId);
      };

      ws.onmessage = (event) => {
        try {
          if (event.data === 'ping') {
            ws.send('pong');
            return;
          }
          const msg = JSON.parse(event.data);
          
          if (msg.type === 'pong') {
            lastPongRef.current = Date.now();
            return;
          }
          
          onWsMessage(msg);
        } catch (e) {
          if (event.data === 'pong') {
            lastPongRef.current = Date.now();
          } else {
            console.warn('[WS] Parse error or unhandled format:', e);
          }
        }
      };

      ws.onclose = (event) => {
        if (destroyed) return;
        setPipelineStatus('disconnected');
        scheduleReconnect();
      };

      ws.onerror = (err) => {
        console.error('[WS] Connection exception encountered:', err);
      };
    }

    function startHeartbeatLoop(ws) {
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send('ping');
          
          // If no response is received in 35 seconds, treat it as a zombie socket
          if (Date.now() - lastPongRef.current > 35000) {
            console.warn('[WS] Heartbeat timeout. Pruning zombie socket.');
            ws.close(); // Triggers connection retry
          }
        }
      }, 15000);
    }

    function scheduleReconnect() {
      // Exponential backoff strategy up to a 30s maximum limit
      const nextDelay = Math.min(1000 * Math.pow(1.5, retryCountRef.current), 30000);
      retryCountRef.current += 1;
      
      queueLog({
        level: 'WARNING',
        message: `WebSocket link broken. Reconnecting in ${(nextDelay / 1000).toFixed(1)}s...`,
        node: 'client'
      });

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, nextDelay);
    }

    function cleanupTimers() {
      clearInterval(pingIntervalRef.current);
      clearTimeout(reconnectTimeoutRef.current);
    }

    connect();

    return () => {
      destroyed = true;
      cleanupTimers();
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [orderId]);

  return socketRef;
}
