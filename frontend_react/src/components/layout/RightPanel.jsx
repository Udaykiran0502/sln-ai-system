import React from 'react';
import { TypographyInspector } from '../inspector/TypographyInspector';
import { PropertiesInspector } from '../inspector/PropertiesInspector';
import { ColorsInspector } from '../inspector/ColorsInspector';
import { QAInspector } from '../qa/QAInspector';

export function RightPanel() {
  return (
    <aside
      style={{ width: 'var(--panel-w-right)', minWidth: 'var(--panel-w-right)' }}
      className="flex flex-col border-l border-white/5 bg-[#09090e] overflow-y-auto gap-0"
    >
      <PropertiesInspector />
      <div className="divider" />
      <TypographyInspector />
      <div className="divider" />
      <ColorsInspector />
      <div className="divider" />
      <QAInspector />
    </aside>
  );
}
