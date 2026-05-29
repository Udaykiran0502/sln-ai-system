import React, { useState, useEffect } from 'react';
import { FolderOpen, Layout, Image, Layers, Cpu, Edit3 } from 'lucide-react';
import useDesignStore from '../../store/useDesignStore';
import { OrdersList } from '../orders/OrdersList';
import { LayerTree } from '../layers/LayerTree';
import { AIControlRoom } from '../ai/AIControlRoom';
import { EditOrderForm } from '../orders/EditOrderForm';

export function LeftPanel() {
  const { orderId } = useDesignStore();
  const [activeTab, setActiveTab] = useState('orders');

  // Adjust active tab if orderId is cleared
  useEffect(() => {
    if (!orderId && activeTab === 'edit') {
      setActiveTab('orders');
    }
  }, [orderId, activeTab]);

  const tabs = [
    { id: 'orders',    icon: FolderOpen, label: 'Orders'    },
    ...(orderId ? [{ id: 'edit', icon: Edit3, label: 'Edit Details' }] : []),
    { id: 'layers',    icon: Layers,     label: 'Layers'    },
    { id: 'ai',        icon: Cpu,        label: 'AI Tools'  },
  ];

  return (
    <aside
      style={{ width: 'var(--panel-w-left)', minWidth: 'var(--panel-w-left)' }}
      className="flex flex-col border-r border-white/5 bg-[#09090e] overflow-hidden"
    >
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-2 pt-2 pb-0 border-b border-white/5">
        {tabs.map(({ id, icon: Icon, label }) => (
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
        {activeTab === 'edit'   && <EditOrderForm />}
        {activeTab === 'layers' && <LayerTree />}
        {activeTab === 'ai'     && <AIControlRoom />}
      </div>
    </aside>
  );
}
