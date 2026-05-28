import React from 'react';
import { useStore } from '../store/useStore';
import { templatesData, type TemplatePreset } from '../data/templates';
import { Layout, Check, Palette } from 'lucide-react';

export const TemplatesTab: React.FC = () => {
  const currentProjectId = useStore((state) => state.project.id);
  const setProject = useStore((state) => state.setProject);
  const setSelectedNodeId = useStore((state) => state.setSelectedNodeId);
  const addLog = useStore((state) => state.addLog);

  const handleSelectTemplate = (template: TemplatePreset) => {
    addLog(`Loading layout template: ${template.name} (${template.width}x${template.height}px)...`);
    
    // Inject standard template into Zustand store
    setProject({
      id: template.id,
      name: template.name,
      width: template.width,
      height: template.height,
      sceneGraph: template.nodes,
    });
    
    // Reset selection handle
    setSelectedNodeId(null);
  };

  return (
    <div className="space-y-4 text-slate-300">
      <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-2">
        <Layout size={12} />
        <span>Layout Preset Templates</span>
      </div>

      <div className="space-y-3">
        {templatesData.map((template) => {
          const isActive = currentProjectId === template.id;
          return (
            <div
              key={template.id}
              onClick={() => handleSelectTemplate(template)}
              className={`p-3 rounded border cursor-pointer transition-all ${
                isActive
                  ? 'bg-purple-950/30 border-purple-500 text-purple-200'
                  : 'bg-[#080c14] border-[#1e2d4a] hover:bg-[#0c1424] hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="font-bold text-[11px] block">{template.name}</span>
                {isActive && (
                  <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[8px] font-mono uppercase tracking-wider flex items-center gap-0.5">
                    <Check size={8} /> Active
                  </span>
                )}
              </div>
              
              <span className="text-[9px] text-[#a855f7] font-mono mt-0.5 block uppercase tracking-wider">
                Category: {template.category}
              </span>

              <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                {template.description}
              </p>

              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#1e2d4a]/50 text-[9px] font-mono text-slate-500">
                <Palette size={10} />
                <span>Dimensions: {template.width} x {template.height} px</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
