import React, { memo } from 'react';
import { Cpu, Activity, ArrowRight } from 'lucide-react';
import useDesignStore from '../../store/useDesignStore';

// LangGraph node ordering from design_pipeline.py
const PIPELINE_NODES = [
  'input_parser', 'research', 'style_analyzer', 'decision_engine',
  'template_selector', 'copywriter', 'indictrans_agent',
  'font_intelligence', 'layout_engine', 'image_editor',
  'composition', 'qa_engine', 'auto_fix', 'export',
];

export const AIControlRoom = memo(function AIControlRoom() {
  const { pipelineStatus, activeAgent, pipelineProgress } = useDesignStore();

  const activeIndex = PIPELINE_NODES.indexOf(activeAgent);

  return (
    <div className="flex flex-col py-2">
      <div className="flex items-center gap-2 px-3 py-2 panel-title">
        <Cpu size={11} />
        AI Orchestration
      </div>

      {/* Progress bar */}
      <div className="px-3 mb-3">
        <div className="h-1 rounded-full bg-white/5">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pipelineProgress}%`,
              background: 'linear-gradient(90deg, #6366f1, #D4AF37)',
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-[#55556a]">{pipelineStatus}</span>
          <span className="text-[9px] font-mono text-[#55556a]">{pipelineProgress}%</span>
        </div>
      </div>

      {/* Node steps */}
      <div className="px-3 flex flex-col gap-0.5">
        {PIPELINE_NODES.map((node, idx) => {
          const isActive  = node === activeAgent;
          const isDone    = pipelineStatus === 'completed' || (activeIndex > idx);
          const isPending = !isActive && !isDone;

          return (
            <div
              key={node}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-all ${
                isActive  ? 'bg-[#6366f1]/15 border border-[#6366f1]/30' :
                isDone    ? 'opacity-50' : 'opacity-25'
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  isActive ? 'bg-[#6366f1] animate-pulse' :
                  isDone   ? 'bg-emerald-500' : 'bg-[#55556a]'
                }`}
              />
              <span className={`text-[10px] font-mono flex-1 ${
                isActive ? 'text-[#818cf8]' :
                isDone   ? 'text-emerald-400' : 'text-[#55556a]'
              }`}>
                {node}
              </span>
              {isActive && (
                <Activity size={10} className="text-[#818cf8] animate-pulse" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
