import React, { useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { useWebSocket } from '../hooks/useWebSocket';
import useDesignStore from '../store/useDesignStore';

export function Workspace() {
  const { orderId, loadOrder } = useDesignStore();
  const [inputId, setInputId] = useState(orderId || '');

  // Connect WebSocket for active order
  useWebSocket(orderId);

  const handleLoad = () => {
    const id = inputId.trim();
    if (id) loadOrder(id);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Order loader bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-[#09090e] flex-shrink-0">
        <span className="text-[11px] text-[#55556a] whitespace-nowrap">Order ID</span>
        <input
          className="sln-input flex-1 max-w-xs !text-[12px]"
          placeholder="e.g. ORD-1748000000"
          value={inputId}
          onChange={e => setInputId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLoad()}
        />
        <button className="btn btn-gold !py-1" onClick={handleLoad}>
          <Search size={12} /> Load
        </button>
        {orderId && (
          <button
            className="btn btn-ghost !py-1 text-[11px]"
            onClick={() => loadOrder(orderId)}
            title="Refresh"
          >
            <RefreshCw size={12} />
          </button>
        )}
      </div>

      {/* 3-panel workspace */}
      <WorkspaceLayout />
    </div>
  );
}
