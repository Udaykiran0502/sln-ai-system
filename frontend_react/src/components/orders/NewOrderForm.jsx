import React, { useState, useEffect } from 'react';
import { createOrder, uploadAsset } from '../../api/orders';
import useDesignStore from '../../store/useDesignStore';

const BANNER_TYPES = ['political', 'wedding', 'business', 'religious', 'general'];

export function NewOrderForm({ onSuccess }) {
  const [form, setForm] = useState({
    client_name: '',
    banner_type: 'political',
    language: 'telugu',
    dimensions: { width_inches: 10, height_inches: 5 },
    dpi: 150,
    colors: { primary: '#FF9933', accent: '#008000' },
    text_content: { heading: '', subheading: '', phone: '' },
    phone_numbers: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const set = (path, val) => {
    setForm(prev => {
      const next = { ...prev };
      const parts = path.split('.');
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
      cur[parts[parts.length - 1]] = val;
      return { ...next };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const phone = form.text_content.phone.replace(/\D/g, '');
      const payload = { ...form, phone_numbers: [phone] };
      const res = await createOrder(payload);
      const { order_id } = res.data;
      onSuccess && onSuccess(order_id);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.detail || 'Submission failed.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
      {error && (
        <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[11px]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-[#55556a] block mb-1">Client Name *</label>
          <input className="sln-input" placeholder="e.g. Ravi Kumar" required
            value={form.client_name} onChange={e => set('client_name', e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] text-[#55556a] block mb-1">Banner Type *</label>
          <select className="sln-input" value={form.banner_type} onChange={e => set('banner_type', e.target.value)}>
            {BANNER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-[#55556a] block mb-1">Heading (Telugu) *</label>
          <input className="sln-input" placeholder="జై శ్రీరాం" required
            value={form.text_content.heading} onChange={e => set('text_content.heading', e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] text-[#55556a] block mb-1">Phone Number *</label>
          <input className="sln-input" placeholder="9876543210" required
            value={form.text_content.phone} onChange={e => set('text_content.phone', e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] text-[#55556a] block mb-1">Width (inches)</label>
          <input type="number" className="sln-input" min={6} max={240}
            value={form.dimensions.width_inches} onChange={e => set('dimensions.width_inches', Number(e.target.value))} />
        </div>
        <div>
          <label className="text-[10px] text-[#55556a] block mb-1">Height (inches)</label>
          <input type="number" className="sln-input" min={6} max={120}
            value={form.dimensions.height_inches} onChange={e => set('dimensions.height_inches', Number(e.target.value))} />
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn btn-gold self-end">
        {loading ? 'Submitting…' : '✨ Submit Order'}
      </button>
    </form>
  );
}
