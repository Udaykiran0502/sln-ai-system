import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, Zap, ShieldCheck, Layers, Layout, ArrowRight,
  PlusCircle, FolderOpen, Activity
} from 'lucide-react';
import useDesignStore from '../store/useDesignStore';
import { NewOrderForm } from '../components/orders/NewOrderForm';

const PIPELINE_STEPS = [
  { n: '01', name: 'Create Design',   desc: 'Define client, type & text' },
  { n: '02', name: 'Upload Assets',   desc: 'Portrait & background images' },
  { n: '03', name: 'AI Orchestration', desc: 'LangGraph agents execute' },
  { n: '04', name: 'Scene Graph',     desc: 'Deterministic layout computed' },
  { n: '05', name: 'QA Validation',   desc: 'Contrast, safe-zone, Telugu checks' },
  { n: '06', name: 'Export Ready',    desc: 'CMYK PDF / 300 DPI TIFF' },
];

const CAPABILITIES = [
  {
    icon: <Layout size={16} className="text-[#D4AF37]" />,
    title: 'AI Layout Engine',
    desc: 'Deterministic bounding box math with percentage-based responsive regions.',
  },
  {
    icon: <span className="text-[#D4AF37] text-xs font-bold">TE</span>,
    title: 'Telugu Typography',
    desc: 'HarfBuzz OpenType shaping eliminates broken Indic ligatures on print output.',
  },
  {
    icon: <ShieldCheck size={16} className="text-[#D4AF37]" />,
    title: 'Print QA System',
    desc: 'Automated bleed, contrast, clipping, and phone number validation gates.',
  },
  {
    icon: <Layers size={16} className="text-[#D4AF37]" />,
    title: 'Editable Scene Graph',
    desc: 'Drag, resize, and inspect layers — synced to the backend deterministic renderer.',
  },
];

const STATUS_BADGE = {
  completed:  { cls: 'badge-green',  label: 'Done'       },
  failed:     { cls: 'badge-red',    label: 'Failed'     },
  processing: { cls: 'badge-blue',   label: 'Processing' },
  queued:     { cls: 'badge-amber',  label: 'Queued'     },
  composited: { cls: 'badge-blue',   label: 'Composited' },
};

export function Dashboard() {
  const { ordersList, loadOrdersList, loadOrder, health, setRoute } = useDesignStore();

  useEffect(() => { loadOrdersList(); }, []);

  const handleLoadOrder = (id) => {
    loadOrder(id);
    setRoute('workspace', { orderId: id });
  };

  const recentOrders = ordersList.slice(0, 6);

  return (
    <div className="flex-1 overflow-y-auto bg-[#07080c] relative flex flex-col items-center">
      {/* Ambient top glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[180px]"
        style={{ background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.07) 0%, transparent 70%)' }}
      />

      <div className="w-full max-w-5xl mx-auto px-6 py-10 flex flex-col gap-14 relative z-10">

        {/* ── Hero ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center gap-6"
        >
          {/* Logo ring */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-[#F3E5AB] p-[1px] shadow-xl shadow-[#D4AF37]/10">
            <div className="w-full h-full bg-[#08080d] rounded-[15px] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:12px_12px]" />
              <Sparkles size={28} className="text-[#D4AF37] relative z-10" />
            </div>
          </div>

          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
              SLN Creative OS
            </h1>
            <p className="text-[#8b8ba3] mt-2 text-sm max-w-xl">
              Professional AI-powered print production — deterministic layout, HarfBuzz Telugu shaping,
              automated QA, and CMYK-ready exports.
            </p>
          </div>

          {/* Status pill */}
          <div className={`badge ${health ? 'badge-green' : 'badge-red'}`}>
            <span className={`pulse-dot ${health ? 'bg-emerald-400' : 'bg-red-400'}`} />
            {health ? 'Backend Connected' : 'Backend Offline'}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 justify-center">
            <button className="btn btn-gold" onClick={() => setRoute('create-wizard')}>
              <PlusCircle size={14} /> New Design Order
            </button>
            <button className="btn btn-ghost" onClick={() => setRoute('workspace')}>
              <FolderOpen size={14} /> Open Workspace
            </button>
          </div>
        </motion.section>

        {/* ── Pipeline steps ── */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6"
        >
          <div className="text-center mb-6">
            <div className="panel-title text-[#D4AF37] mb-1">INTELLIGENT PIPELINE</div>
            <p className="text-[12px] text-[#55556a]">How your order flows through the LangGraph orchestration engine</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {PIPELINE_STEPS.map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-2 group">
                <div className="w-10 h-10 rounded-xl bg-[#0d0e16] border border-white/8 flex items-center justify-center font-mono font-bold text-[11px] text-[#D4AF37] group-hover:border-[#D4AF37]/40 transition-all">
                  {s.n}
                </div>
                <div className="text-[11px] font-semibold text-white/80 group-hover:text-[#D4AF37] transition-colors">{s.name}</div>
                <div className="text-[10px] text-[#55556a] leading-tight">{s.desc}</div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ── Capabilities ── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CAPABILITIES.map((cap, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="glass rounded-xl p-4 flex flex-col gap-3 hover:border-[#D4AF37]/25 transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center">
                {cap.icon}
              </div>
              <div>
                <div className="text-[12px] font-semibold text-white mb-1">{cap.title}</div>
                <div className="text-[11px] text-[#55556a] leading-relaxed">{cap.desc}</div>
              </div>
            </motion.div>
          ))}
        </section>

        {/* ── Recent orders ── */}
        {recentOrders.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="panel-title text-[#D4AF37]">RECENT ORDERS</div>
              <button
                className="btn btn-ghost !py-1 text-[11px] flex items-center gap-1"
                onClick={loadOrdersList}
              >
                Refresh <ArrowRight size={11} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {recentOrders.map(order => {
                const badge = STATUS_BADGE[order.status] || { cls: 'badge-gold', label: order.status };
                return (
                  <button
                    key={order.order_id}
                    onClick={() => handleLoadOrder(order.order_id)}
                    className="glass rounded-xl p-4 flex flex-col gap-3 text-left hover:border-[#D4AF37]/25 transition-all group"
                  >
                    <div className="w-full h-16 rounded-lg bg-gradient-to-tr from-[#D4AF37]/8 to-[#6366f1]/8 border border-white/5 flex items-center justify-center">
                      <span className="text-2xl opacity-20">🖼️</span>
                    </div>
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] font-semibold text-white truncate">{order.order_id}</span>
                        <span className={`badge ${badge.cls} !text-[9px] flex-shrink-0`}>{badge.label}</span>
                      </div>
                      <div className="text-[10px] text-[#55556a] mt-0.5 font-mono">
                        {order.updated_at?.slice(0, 16) || '—'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
