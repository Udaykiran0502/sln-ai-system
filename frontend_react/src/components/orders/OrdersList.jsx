import React, { useEffect, memo } from 'react';
import { Search, RefreshCw, ChevronRight } from 'lucide-react';
import useDesignStore from '../../store/useDesignStore';

const STATUS_COLOR = {
  completed:  'badge-green',
  failed:     'badge-red',
  processing: 'badge-blue',
  queued:     'badge-amber',
  composited: 'badge-blue',
};

export const OrdersList = memo(function OrdersList() {
  const { ordersList, loadOrdersList, loadOrder, orderId: activeId } = useDesignStore();

  useEffect(() => { loadOrdersList(); }, []);

  return (
    <div className="flex flex-col gap-0 py-2">
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="panel-title flex-1">Orders</span>
        <button
          className="btn btn-ghost !py-0.5 !px-1.5 text-[10px]"
          onClick={loadOrdersList}
          title="Refresh"
        >
          <RefreshCw size={11} />
        </button>
      </div>

      {ordersList.length === 0 ? (
        <div className="px-3 py-6 text-center text-[11px] text-[#55556a] italic">
          No orders found
        </div>
      ) : (
        ordersList.map(order => (
          <button
            key={order.order_id}
            onClick={() => loadOrder(order.order_id)}
            className={`layer-item mx-2 mb-0.5 ${activeId === order.order_id ? 'active' : ''}`}
          >
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <span className="text-[11px] font-medium text-[#e8e8f0] truncate">
                {order.order_id}
              </span>
              <span className="text-[9px] text-[#55556a]">{order.updated_at?.slice(0,16) || ''}</span>
            </div>
            <span className={`badge ${STATUS_COLOR[order.status] || 'badge-gold'} !text-[9px]`}>
              {order.status}
            </span>
            <ChevronRight size={11} className="text-[#55556a]" />
          </button>
        ))
      )}
    </div>
  );
});
