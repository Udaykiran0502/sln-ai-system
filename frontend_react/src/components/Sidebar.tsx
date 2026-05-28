import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { TemplatesTab } from './TemplatesTab';
import { AssetsTab } from './AssetsTab';
import { Layers, Layout, Grid, ShieldAlert, Cpu, Eye, EyeOff, Lock, Unlock, Database, AlertCircle, AlertTriangle } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'layers' | 'templates' | 'assets' | 'qa' | 'telemetry'>('layers');
  
  const project = useStore((state) => state.project);
  const selectedNodeId = useStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useStore((state) => state.setSelectedNodeId);
  const updateNode = useStore((state) => state.updateNode);
  const telemetry = useStore((state) => state.telemetry);
  const qaViolations = useStore((state) => state.qaViolations);

  return (
    <div className="w-80 border-r border-[#1e2d4a] bg-[#030712] flex flex-col h-full select-none text-xs">
      {/* Sidebar Nav Tabs */}
      <div className="flex flex-wrap border-b border-[#1e2d4a] bg-[#080c14] shrink-0">
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-3 px-1 flex items-center justify-center gap-1 font-medium border-b-2 text-[10px] transition-all ${
            activeTab === 'layers'
              ? 'border-purple-500 text-purple-400 bg-[#0c1424]/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers size={11} />
          Layers
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-3 px-1 flex items-center justify-center gap-1 font-medium border-b-2 text-[10px] transition-all ${
            activeTab === 'templates'
              ? 'border-purple-500 text-purple-400 bg-[#0c1424]/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layout size={11} />
          Presets
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className={`flex-1 py-3 px-1 flex items-center justify-center gap-1 font-medium border-b-2 text-[10px] transition-all ${
            activeTab === 'assets'
              ? 'border-purple-500 text-purple-400 bg-[#0c1424]/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Grid size={11} />
          Assets
        </button>
        <button
          onClick={() => setActiveTab('qa')}
          className={`flex-1 py-3 px-1 flex items-center justify-center gap-1 font-medium border-b-2 text-[10px] relative transition-all ${
            activeTab === 'qa'
              ? 'border-purple-500 text-purple-400 bg-[#0c1424]/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert size={11} />
          QA
          {qaViolations.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`flex-1 py-3 px-1 flex items-center justify-center gap-1 font-medium border-b-2 text-[10px] transition-all ${
            activeTab === 'telemetry'
              ? 'border-purple-500 text-purple-400 bg-[#0c1424]/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu size={11} />
          System
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

        {/* PRESETS TAB */}
        {activeTab === 'templates' && <TemplatesTab />}

        {/* ASSETS TAB */}
        {activeTab === 'assets' && <AssetsTab />}

        {/* QA TAB */}
        {activeTab === 'qa' && (
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-400 uppercase tracking-wider mb-2">Print QA Checklist</h3>
            {qaViolations.length === 0 ? (
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded text-center text-emerald-400 flex flex-col items-center py-8">
                <Database size={24} className="mb-2 text-emerald-500" />
                <span className="font-bold">Scene Graph Clean</span>
                <span className="text-[9px] text-slate-500 mt-1">Zero bleed bounds or clipping violations.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {qaViolations.map((violation) => (
                  <div
                    key={violation.id}
                    className={`p-3 border rounded space-y-1 ${
                      violation.severity === 'critical'
                        ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                        : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[10px]">
                      {violation.severity === 'critical' ? (
                        <AlertCircle size={12} className="text-rose-500" />
                      ) : (
                        <AlertTriangle size={12} className="text-amber-500" />
                      )}
                      <span className="uppercase tracking-wider font-mono">{violation.type} Warning</span>
                    </div>
                    <span className="font-bold text-[9px] block text-slate-400 font-mono">Layer: {violation.nodeName}</span>
                    <p className="text-[9px] leading-relaxed text-slate-300">{violation.message}</p>
                  </div>
                ))}
              </div>
            )}
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
          <Database size={12} className="text-purple-500" />
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
