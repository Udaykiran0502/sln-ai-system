import React from 'react';
import { useStore } from '../store/useStore';
import { AlignLeft, AlignCenter, AlignRight, Type, Layers } from 'lucide-react';

export const PropertiesPanel: React.FC = () => {
  const selectedNodeId = useStore((state) => state.selectedNodeId);
  const project = useStore((state) => state.project);
  const updateNode = useStore((state) => state.updateNode);

  const selectedNode = project.sceneGraph.find(n => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <div className="w-80 border-l border-[#1e2d4a] bg-[#030712] p-6 flex flex-col justify-center items-center h-full text-center text-slate-500 select-none">
        <Layers size={36} className="text-slate-700 mb-2" />
        <p className="text-xs">No layer selected</p>
        <p className="text-[10px] text-slate-600 mt-1">Select any element on the canvas to configure properties</p>
      </div>
    );
  }

  const handleStyleChange = (key: string, value: any) => {
    updateNode(selectedNode.id, {
      style: {
        ...selectedNode.style,
        [key]: value
      }
    });
  };

  return (
    <div className="w-80 border-l border-[#1e2d4a] bg-[#030712] flex flex-col h-full select-none text-xs text-slate-200">
      <div className="p-4 border-b border-[#1e2d4a] bg-[#080c14]">
        <h3 className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Properties Panel</h3>
        <span className="font-bold text-slate-200 text-sm mt-1 block font-mono">{selectedNode.name}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* COORDINATE SYSTEMS */}
        <div className="space-y-2">
          <h4 className="font-bold text-purple-400 uppercase tracking-wider text-[9px] mb-2">Transform Coordinates</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-500 font-mono block text-[9px] mb-1">X Position</label>
              <input
                type="number"
                value={Math.round(selectedNode.x)}
                onChange={(e) => updateNode(selectedNode.id, { x: Number(e.target.value) })}
                className="w-full bg-[#080c14] border border-[#1e2d4a] px-2 py-1.5 rounded text-slate-200 font-mono focus:border-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="text-slate-500 font-mono block text-[9px] mb-1">Y Position</label>
              <input
                type="number"
                value={Math.round(selectedNode.y)}
                onChange={(e) => updateNode(selectedNode.id, { y: Number(e.target.value) })}
                className="w-full bg-[#080c14] border border-[#1e2d4a] px-2 py-1.5 rounded text-slate-200 font-mono focus:border-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="text-slate-500 font-mono block text-[9px] mb-1">Width</label>
              <input
                type="number"
                value={Math.round(selectedNode.width)}
                onChange={(e) => updateNode(selectedNode.id, { width: Number(e.target.value) })}
                className="w-full bg-[#080c14] border border-[#1e2d4a] px-2 py-1.5 rounded text-slate-200 font-mono focus:border-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="text-slate-500 font-mono block text-[9px] mb-1">Height</label>
              <input
                type="number"
                value={Math.round(selectedNode.height)}
                onChange={(e) => updateNode(selectedNode.id, { height: Number(e.target.value) })}
                className="w-full bg-[#080c14] border border-[#1e2d4a] px-2 py-1.5 rounded text-slate-200 font-mono focus:border-purple-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* ROTATION & OPACITY */}
        <div className="space-y-3 border-t border-[#1e2d4a]/50 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-500 font-mono block text-[9px] mb-1">Rotation (°)</label>
              <input
                type="number"
                min="0"
                max="360"
                value={Math.round(selectedNode.rotation)}
                onChange={(e) => updateNode(selectedNode.id, { rotation: Number(e.target.value) })}
                className="w-full bg-[#080c14] border border-[#1e2d4a] px-2 py-1.5 rounded text-slate-200 font-mono focus:border-purple-500 outline-none"
              />
            </div>
            {selectedNode.type === 'image' && (
              <div>
                <label className="text-slate-500 font-mono block text-[9px] mb-1">Opacity</label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={selectedNode.style.opacity ?? 1}
                  onChange={(e) => handleStyleChange('opacity', Number(e.target.value))}
                  className="w-full bg-[#080c14] border border-[#1e2d4a] px-2 py-1.5 rounded text-slate-200 font-mono focus:border-purple-500 outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* TYPOGRAPHY PROPERTIES */}
        {selectedNode.type === 'text' && (
          <div className="space-y-3 border-t border-[#1e2d4a]/50 pt-3">
            <h4 className="font-bold text-purple-400 uppercase tracking-wider text-[9px] mb-1">Typography Settings</h4>
            
            <div>
              <label className="text-slate-500 block text-[9px] mb-1">Telugu Text Input</label>
              <textarea
                value={selectedNode.style.text ?? ''}
                onChange={(e) => handleStyleChange('text', e.target.value)}
                className="w-full bg-[#080c14] border border-[#1e2d4a] p-2 rounded text-slate-200 focus:border-purple-500 outline-none min-h-[60px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-500 block text-[9px] mb-1">Font Size</label>
                <input
                  type="number"
                  value={selectedNode.style.fontSize ?? 12}
                  onChange={(e) => handleStyleChange('fontSize', Number(e.target.value))}
                  className="w-full bg-[#080c14] border border-[#1e2d4a] px-2 py-1.5 rounded text-slate-200 font-mono focus:border-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="text-slate-500 block text-[9px] mb-1">Color (HEX)</label>
                <div className="flex gap-1.5">
                  <input
                    type="color"
                    value={selectedNode.style.fill ?? '#ffffff'}
                    onChange={(e) => handleStyleChange('fill', e.target.value)}
                    className="w-8 h-7 bg-[#080c14] border border-[#1e2d4a] rounded cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={selectedNode.style.fill ?? ''}
                    onChange={(e) => handleStyleChange('fill', e.target.value)}
                    className="w-full bg-[#080c14] border border-[#1e2d4a] px-2 py-1.5 rounded text-slate-200 font-mono focus:border-purple-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-slate-500 block text-[9px] mb-1">Telugu Font Family</label>
              <select
                value={selectedNode.style.fontFamily ?? 'Inter'}
                onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                className="w-full bg-[#080c14] border border-[#1e2d4a] px-2 py-1.5 rounded text-slate-200 focus:border-purple-500 outline-none"
              >
                <option value="Inter">Inter (Default Sans)</option>
                <option value="Mandali">Mandali (Telugu Serif)</option>
                <option value="NTR">NTR (Telugu Elegant)</option>
                <option value="Ramabhadra">Ramabhadra (Telugu Bold)</option>
                <option value="TenaliRamakrishna">Tenali (Telugu Classic)</option>
              </select>
            </div>

            {/* Telugu Indic Shaping Toggle */}
            <div className="flex items-center justify-between p-2 bg-[#0c1424]/40 border border-[#1e2d4a] rounded mt-2">
              <div className="flex flex-col">
                <span className="font-bold text-[10px] text-slate-200">Telugu HarfBuzz Shaping</span>
                <span className="text-[8px] text-slate-500">Corrects glyph complex layout combinations</span>
              </div>
              <button
                onClick={() => handleStyleChange('teluguShaped', !selectedNode.style.teluguShaped)}
                className={`w-10 h-5 rounded-full p-0.5 transition-all ${
                  selectedNode.style.teluguShaped ? 'bg-purple-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full transition-all ${
                    selectedNode.style.teluguShaped ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex justify-between items-center bg-[#080c14] p-1.5 border border-[#1e2d4a] rounded">
              <button
                onClick={() => handleStyleChange('align', 'left')}
                className={`p-1 rounded transition-colors ${selectedNode.style.align === 'left' ? 'bg-purple-950 text-purple-400' : 'text-slate-400'}`}
              >
                <AlignLeft size={14} />
              </button>
              <button
                onClick={() => handleStyleChange('align', 'center')}
                className={`p-1 rounded transition-colors ${selectedNode.style.align === 'center' ? 'bg-purple-950 text-purple-400' : 'text-slate-400'}`}
              >
                <AlignCenter size={14} />
              </button>
              <button
                onClick={() => handleStyleChange('align', 'right')}
                className={`p-1 rounded transition-colors ${selectedNode.style.align === 'right' ? 'bg-purple-950 text-purple-400' : 'text-slate-400'}`}
              >
                <AlignRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick AI Suggestions Panel */}
      <div className="border-t border-[#1e2d4a] bg-[#050914] p-4 h-44 shrink-0 flex flex-col justify-between">
        <div className="flex items-center gap-1.5 text-purple-400 font-semibold uppercase tracking-wider text-[10px]">
          <Type size={12} />
          <span>AI Creative Companion</span>
        </div>
        <p className="text-[10px] text-slate-400 italic">
          "Suggest scaling the main title header by 1.2x to balance the horizontal clipping ratio for print flex spacing."
        </p>
        <button className="w-full bg-purple-700 hover:bg-purple-600 text-white font-bold py-1.5 rounded transition-all text-[10px] uppercase tracking-wider">
          Apply AI Suggestion
        </button>
      </div>
    </div>
  );
};
