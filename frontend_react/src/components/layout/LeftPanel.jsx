import React, { useState, useEffect } from 'react';
import { FolderOpen, Layout, Image, Layers, Cpu } from 'lucide-react';
import useDesignStore from '../../store/useDesignStore';
import { OrdersList } from '../orders/OrdersList';
import { LayerTree } from '../layers/LayerTree';
import { AIControlRoom } from '../ai/AIControlRoom';

const TABS = [
  { id: 'orders',    icon: FolderOpen, label: 'Orders'    },
  { id: 'layers',    icon: Layers,     label: 'Layers'    },
  { id: 'ai',        icon: Cpu,        label: 'AI Tools'  },
];

export function LeftPanel() {
  const [activeTab, setActiveTab] = useState('orders');

  return (
    <aside
      style={{ width: 'var(--panel-w-left)', minWidth: 'var(--panel-w-left)' }}
      className="flex flex-col border-r border-white/5 bg-[#09090e] overflow-hidden"
    >
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-2 pt-2 pb-0 border-b border-white/5">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            title={label}
            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-t-md text-[10px] transition-all ${
              activeTab === id
                ? 'bg-[#D4AF37]/10 text-[#D4AF37]'
                : 'text-[#55556a] hover:text-[#8b8ba3]'
            }`}
          >
            <Icon size={14} />
            <span className="hidden sm:block">{label}</span>
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'orders' && <OrdersList />}
        {activeTab === 'layers' && <LayerTree />}
        {activeTab === 'ai'     && <AIControlRoom />}
      </div>
    </aside>
  );
}
