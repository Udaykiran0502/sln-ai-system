import React, { memo } from 'react';
import { Palette } from 'lucide-react';
import useDesignStore from '../../store/useDesignStore';

export const ColorsInspector = memo(function ColorsInspector() {
  const orderMeta = useDesignStore(s => s.orderMeta);
  const colors = orderMeta?.qa_scores
    ? {}
    : {};

  // Try to get colors from order metadata if available
  // The backend stores color data inside the layout_plan but
  // the API surface returns order status — we show what's available
  const displayColors = orderMeta ? {
    Status: orderMeta.status,
  } : {};

  return (
    <section className="px-3 py-3">
      <div className="flex items-center gap-2 panel-title mb-3">
        <Palette size={11} />
        Design Colors
      </div>

      <p className="text-[10px] text-[#55556a] italic">
        Load an order to view the color palette extracted by the AI style analyzer.
      </p>
    </section>
  );
});
