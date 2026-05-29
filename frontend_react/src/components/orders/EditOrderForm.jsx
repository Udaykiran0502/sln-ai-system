import React, { useState, useEffect } from 'react';
import { Sparkles, Save, ShieldAlert, Loader2, RefreshCw } from 'lucide-react';
import useDesignStore from '../../store/useDesignStore';

const BANNER_TYPES = [
  { id: 'political', icon: '🏛️', label: 'Political' },
  { id: 'wedding', icon: '💒', label: 'Wedding' },
  { id: 'business', icon: '💼', label: 'Business' },
  { id: 'religious', icon: '🕉️', label: 'Religious' },
  { id: 'general', icon: '🎯', label: 'General' },
];

export function EditOrderForm() {
  const { orderId, orderMeta, saveOrderMetadata, pipelineStatus } = useDesignStore();

  const [form, setForm] = useState({
    client_name: '',
    banner_type: 'political',
    event_type: '',
    language: 'telugu',
    dimensions: { width_inches: 48, height_inches: 24 },
    dpi: 300,
    colors: { primary: '#FF9933', accent: '#008000' },
    text_content: { heading: '', subheading: '', phone: '', tagline: '' },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Hydrate form when orderMeta changes
  useEffect(() => {
    if (orderMeta) {
      setForm({
        client_name: orderMeta.client_name || '',
        banner_type: orderMeta.banner_type || 'political',
        event_type: orderMeta.event_type || '',
        language: orderMeta.language || 'telugu',
        dimensions: {
          width_inches: orderMeta.dimensions?.width_inches ?? 48,
          height_inches: orderMeta.dimensions?.height_inches ?? 24,
        },
        dpi: orderMeta.dpi ?? 300,
        colors: {
          primary: orderMeta.colors?.primary || '#FF9933',
          accent: orderMeta.colors?.accent || '#008000',
        },
        text_content: {
          heading: orderMeta.text_content?.heading || '',
          subheading: orderMeta.text_content?.subheading || '',
          phone: orderMeta.text_content?.phone || '',
          tagline: orderMeta.text_content?.tagline || '',
        },
      });
    }
  }, [orderMeta]);

  if (!orderId) {
    return (
      <div className="px-4 py-8 text-center text-xs text-[#55556a] italic">
        Please load an order to edit its details.
      </div>
    );
  }

  const setField = (path, val) => {
    setForm(prev => {
      const next = { ...prev };
      const parts = path.split('.');
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) {
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = val;
      return { ...next };
    });
    setSuccess('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const cleanedPhone = form.text_content.phone.replace(/\D/g, '');
      const payload = {
        ...form,
        phone_numbers: [cleanedPhone],
        text_content: {
          ...form.text_content,
          phone: cleanedPhone,
        },
      };

      await saveOrderMetadata(payload);
      setSuccess('✨ Order details updated & pipeline rerun successfully!');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.detail || 'Update failed.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const isPipelineRunning = pipelineStatus === 'processing' || pipelineStatus === 'queued' || pipelineStatus === 'regenerating';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs p-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <span className="panel-title flex items-center gap-1.5 text-[#D4AF37]">
          <span>✏️ Edit Order Details</span>
        </span>
        {isPipelineRunning && (
          <span className="flex items-center gap-1 text-[10px] text-amber-400">
            <RefreshCw size={10} className="animate-spin" /> Running...
          </span>
        )}
      </div>

      {error && (
        <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] flex items-start gap-2">
          <ShieldAlert size={12} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px]">
          {success}
        </div>
      )}

      <div className="space-y-3.5">
        {/* Client Name */}
        <div>
          <label className="text-[10px] font-semibold text-[#8b8ba3] block mb-1 uppercase tracking-wide">Client Name *</label>
          <input
            className="sln-input w-full"
            placeholder="e.g. Sri Lakshmi Enterprises"
            required
            value={form.client_name}
            onChange={e => setField('client_name', e.target.value)}
          />
        </div>

        {/* Categories */}
        <div>
          <label className="text-[10px] font-semibold text-[#8b8ba3] block mb-1 uppercase tracking-wide">Category *</label>
          <select
            className="sln-input w-full bg-[#050508]"
            value={form.banner_type}
            onChange={e => setField('banner_type', e.target.value)}
          >
            {BANNER_TYPES.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Occasion / Event */}
        <div>
          <label className="text-[10px] font-semibold text-[#8b8ba3] block mb-1 uppercase tracking-wide">Event / Occasion</label>
          <input
            className="sln-input w-full"
            placeholder="e.g. Campaign, Inauguration"
            value={form.event_type}
            onChange={e => setField('event_type', e.target.value)}
          />
        </div>

        {/* Text Content */}
        <div className="p-3 rounded-lg border border-white/5 bg-white/[0.01] space-y-3">
          <span className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-wider block">Visual Content</span>
          
          <div>
            <label className="text-[10px] text-[#8b8ba3] block mb-1">Main Heading (Telugu) *</label>
            <input
              className="sln-input w-full"
              placeholder="జై శ్రీరాం"
              required
              value={form.text_content.heading}
              onChange={e => setField('text_content.heading', e.target.value)}
            />
          </div>

          <div>
            <label className="text-[10px] text-[#8b8ba3] block mb-1">Subheading</label>
            <input
              className="sln-input w-full"
              placeholder="మీ సేవలో మేము"
              value={form.text_content.subheading}
              onChange={e => setField('text_content.subheading', e.target.value)}
            />
          </div>

          <div>
            <label className="text-[10px] text-[#8b8ba3] block mb-1">Phone Number *</label>
            <input
              className="sln-input w-full font-mono"
              placeholder="9876543210"
              required
              value={form.text_content.phone}
              onChange={e => setField('text_content.phone', e.target.value)}
            />
          </div>

          <div>
            <label className="text-[10px] text-[#8b8ba3] block mb-1">Tagline / Footer</label>
            <input
              className="sln-input w-full"
              placeholder="Visit us or Call for reservations"
              value={form.text_content.tagline}
              onChange={e => setField('text_content.tagline', e.target.value)}
            />
          </div>
        </div>

        {/* Dimension Specs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-semibold text-[#8b8ba3] block mb-1 uppercase tracking-wide">Width (inches)</label>
            <input
              type="number"
              className="sln-input w-full font-mono"
              min={6}
              max={240}
              value={form.dimensions.width_inches}
              onChange={e => setField('dimensions.width_inches', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-[#8b8ba3] block mb-1 uppercase tracking-wide">Height (inches)</label>
            <input
              type="number"
              className="sln-input w-full font-mono"
              min={6}
              max={120}
              value={form.dimensions.height_inches}
              onChange={e => setField('dimensions.height_inches', Number(e.target.value))}
            />
          </div>
        </div>

        {/* Language & Resolution */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-semibold text-[#8b8ba3] block mb-1 uppercase tracking-wide">Language</label>
            <select
              className="sln-input w-full bg-[#050508]"
              value={form.language}
              onChange={e => setField('language', e.target.value)}
            >
              <option value="telugu">Telugu</option>
              <option value="english">English</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-[#8b8ba3] block mb-1 uppercase tracking-wide">DPI</label>
            <select
              className="sln-input w-full bg-[#050508]"
              value={form.dpi}
              onChange={e => setField('dpi', Number(e.target.value))}
            >
              <option value={300}>300 DPI</option>
              <option value={150}>150 DPI</option>
              <option value={72}>72 DPI</option>
            </select>
          </div>
        </div>

        {/* Colors */}
        <div className="p-3 rounded-lg border border-white/5 bg-white/[0.01] grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-[#8b8ba3] block mb-1">Primary Color</label>
            <div className="flex gap-1.5 items-center">
              <input
                type="color"
                className="w-6 h-6 rounded cursor-pointer border border-white/10 bg-transparent"
                value={form.colors.primary}
                onChange={e => setField('colors.primary', e.target.value)}
              />
              <input
                type="text"
                className="sln-input w-full font-mono text-[10px] text-center"
                value={form.colors.primary}
                onChange={e => setField('colors.primary', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-[#8b8ba3] block mb-1">Accent Color</label>
            <div className="flex gap-1.5 items-center">
              <input
                type="color"
                className="w-6 h-6 rounded cursor-pointer border border-white/10 bg-transparent"
                value={form.colors.accent}
                onChange={e => setField('colors.accent', e.target.value)}
              />
              <input
                type="text"
                className="sln-input w-full font-mono text-[10px] text-center"
                value={form.colors.accent}
                onChange={e => setField('colors.accent', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || isPipelineRunning}
        className="btn btn-gold w-full mt-2 flex items-center justify-center gap-1.5 py-2 text-xs"
      >
        {loading ? (
          <>
            <Loader2 size={13} className="animate-spin" />
            <span>Regenerating Design...</span>
          </>
        ) : (
          <>
            <Sparkles size={13} />
            <span>✨ Apply Details & Rerun</span>
          </>
        )}
      </button>
    </form>
  );
}
