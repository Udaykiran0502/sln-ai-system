import React from 'react';
import { useStore, type SceneNode } from '../store/useStore';
import { LayoutGrid, PlusCircle } from 'lucide-react';

interface AssetPreset {
  id: string;
  name: string;
  type: 'shape' | 'text';
  description: string;
  node: Omit<SceneNode, 'id'>;
}

const assetsCatalog: AssetPreset[] = [
  {
    id: 'asset-gold-wedding-frame',
    name: 'Gold Wedding Frame',
    type: 'shape',
    description: 'Gold ornamental outline frame for traditional panels.',
    node: {
      type: 'shape',
      name: 'Gold Wedding Frame',
      x: 50,
      y: 50,
      width: 700,
      height: 300,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      visible: true,
      locked: false,
      style: {
        shapeType: 'rect',
        fill: 'transparent',
        stroke: '#fbbf24',
        strokeWidth: 4,
      }
    }
  },
  {
    id: 'asset-political-badge',
    name: 'Political Campaign Badge',
    type: 'shape',
    description: 'A crimson circular stamp panel for campaign badges.',
    node: {
      type: 'shape',
      name: 'Campaign Stamp',
      x: 100,
      y: 100,
      width: 150,
      height: 150,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      visible: true,
      locked: false,
      style: {
        shapeType: 'circle',
        fill: '#b91c1c',
        stroke: '#fef08a',
        strokeWidth: 3,
      }
    }
  },
  {
    id: 'asset-telugu-sub-heading',
    name: 'Telugu Subtext Node',
    type: 'text',
    description: 'Pre-styled Telugu text box ready for editor typesetting.',
    node: {
      type: 'text',
      name: 'Telugu Subtext block',
      x: 200,
      y: 200,
      width: 400,
      height: 60,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      visible: true,
      locked: false,
      style: {
        text: 'ఆత్మీయ స్వాగతం - సుస్వాగతం',
        fontSize: 28,
        fontFamily: 'NTR',
        fill: '#ffffff',
        align: 'center',
        teluguShaped: true
      }
    }
  }
];

export const AssetsTab: React.FC = () => {
  const addNode = useStore((state) => state.addNode);
  const addLog = useStore((state) => state.addLog);

  const handleSpawnAsset = (asset: AssetPreset) => {
    const spawnedId = `${asset.id}-${Date.now().toString().slice(-4)}`;
    addLog(`Spawning print asset: ${asset.name} onto active stage...`);
    
    // Inject node with unique ID
    addNode({
      ...asset.node,
      id: spawnedId,
    } as SceneNode);
  };

  return (
    <div className="space-y-4 text-slate-300">
      <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-2">
        <LayoutGrid size={12} />
        <span>Spawning Indic Assets</span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {assetsCatalog.map((asset) => (
          <div
            key={asset.id}
            className="p-3 bg-[#080c14] border border-[#1e2d4a] rounded flex items-center justify-between hover:border-slate-700 transition-all select-none"
          >
            <div className="flex flex-col pr-4">
              <span className="font-bold text-[11px] text-slate-200">{asset.name}</span>
              <span className="text-[9px] text-slate-500 mt-0.5 leading-relaxed">{asset.description}</span>
            </div>
            
            <button
              onClick={() => handleSpawnAsset(asset)}
              className="text-[#a855f7] hover:text-[#c084fc] transition-colors shrink-0"
            >
              <PlusCircle size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
