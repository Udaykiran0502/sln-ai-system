import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Layers, ListTodo, LogIn, Cpu, Eye, EyeOff, Lock, Unlock, Database } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'layers' | 'orders' | 'telemetry'>('layers');
  
  const project = useStore((state) => state.project);
  const selectedNodeId = useStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useStore((state) => state.setSelectedNodeId);
  const updateNode = useStore((state) => state.updateNode);
  const telemetry = useStore((state) => state.telemetry);

  return (
    <div className="w-80 border-r border-[#1e2d4a] bg-[#030712] flex flex-col h-full select-none text-xs">
      {/* Sidebar Nav Tabs */}
      <div className="flex border-b border-[#1e2d4a] bg-[#080c14] shrink-0">
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 font-medium border-b-2 transition-all ${
            activeTab === 'layers'
              ? 'border-purple-500 text-purple-400 bg-[#0c1424]/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers size={14} />
          Layers
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 font-medium border-b-2 transition-all ${
            activeTab === 'orders'
              ? 'border-purple-500 text-purple-400 bg-[#0c1424]/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ListTodo size={14} />
          Orders
        </button>
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 font-medium border-b-2 transition-all ${
            activeTab === 'telemetry'
              ? 'border-purple-500 text-purple-400 bg-[#0c1424]/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu size={14} />
          Telemetry
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* LAYERS TAB */}
        {activeTab === 'layers' && (
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-400 uppercase tracking-wider mb-3">Scene Graph Tree</h3>
            <div className="space-y-1">
              {project.sceneGraph.map((node) => (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer transition-all border ${
                    selectedNodeId === node.id
                      ? 'bg-purple-950/40 border-purple-500 text-purple-200'
                      : 'bg-[#080c14] border-[#1e2d4a] hover:bg-[#0c1424] text-slate-300'
                  }`}
                >
                  <span className="truncate pr-2 font-mono text-[11px]">{node.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateNode(node.id, { visible: !node.visible });
                      }}
                      className="text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {node.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateNode(node.id, { locked: !node.locked });
                      }}
                      className="text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {node.locked ? <Lock size={12} /> : <Unlock size={12} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-400 uppercase tracking-wider mb-2">Print Queue</h3>
            <div className="p-3 bg-[#080c14] border border-[#1e2d4a] rounded space-y-2">
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span className="text-purple-400">#SLN-4890</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">Pending QA</span>
              </div>
              <p className="font-bold text-slate-200">Telugu Flex (10x8ft) - Political Campaign</p>
              <div className="text-[10px] text-slate-400">
                <p>Client: Janasena Youth Guntur</p>
                <p className="mt-1 font-mono">Design Priority: High</p>
              </div>
            </div>
            <div className="p-3 bg-[#0c1424]/30 border border-dashed border-[#1e2d4a] rounded text-center py-6 text-slate-500">
              No other active jobs.
            </div>
          </div>
        )}

        {/* TELEMETRY TAB */}
        {activeTab === 'telemetry' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-400 uppercase tracking-wider mb-2">Resource Monitor</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-[#080c14] border border-[#1e2d4a] rounded flex flex-col justify-between">
                <span className="text-[10px] text-slate-400">CPU Usage</span>
                <span className="text-lg font-bold font-mono text-purple-400 mt-1">{telemetry.cpuUsage}%</span>
              </div>
              <div className="p-3 bg-[#080c14] border border-[#1e2d4a] rounded flex flex-col justify-between">
                <span className="text-[10px] text-slate-400">RAM Allocation</span>
                <span className="text-lg font-bold font-mono text-purple-400 mt-1">{telemetry.ramUsage}%</span>
              </div>
            </div>
            
            <div className="p-3 bg-[#080c14] border border-[#1e2d4a] rounded space-y-2 font-mono text-[10px]">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Database size={12} className="text-purple-500" />
                <span>Scene Memory Allocation:</span>
              </div>
              <div className="w-full bg-[#030712] h-2.5 rounded-full overflow-hidden border border-[#1e2d4a]">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: '42%' }}></div>
              </div>
              <div className="flex justify-between text-slate-500 text-[9px]">
                <span>Active Nodes: {project.sceneGraph.length}</span>
                <span>Dirty: 0</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* System Event Logs Area */}
      <div className="border-t border-[#1e2d4a] bg-[#050914] p-3 h-48 flex flex-col shrink-0">
        <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase tracking-wider mb-2 text-[10px]">
          <LogIn size={12} />
          <span>Dev Telemetry Logs</span>
        </div>
        <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1 text-slate-400 scroll-smooth">
          {telemetry.logs.map((log, index) => (
            <div key={index} className="truncate select-text select-all border-b border-[#1e2d4a]/20 pb-0.5">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
