import React from 'react';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { CanvasToolbar } from '../../canvas/CanvasToolbar';
import { StageContainer } from '../../canvas/StageContainer';
import { LogConsole } from '../logs/LogConsole';

export function WorkspaceLayout() {
  return (
    <div className="flex flex-1 w-full h-full overflow-hidden">
      <LeftPanel />

      {/* Center Canvas Area */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <CanvasToolbar />
        <div className="flex-grow w-full relative overflow-hidden bg-[#07080b]">
          <StageContainer />
        </div>
        <LogConsole />
      </main>

      <RightPanel />
    </div>
  );
}
