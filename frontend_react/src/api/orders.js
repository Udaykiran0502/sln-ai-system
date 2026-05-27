import client from './client';

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// ── Health ──────────────────────────────────────────────────────
export const getHealth = () => client.get('/api/health');

// ── Orders ──────────────────────────────────────────────────────
export const listOrders       = ()          => client.get('/api/orders');
export const getOrder         = (id)        => client.get(`/api/orders/${id}`);
export const createOrder      = (payload)   => client.post('/api/orders', payload);
export const regenerateOrder  = (id)        => client.post(`/api/orders/${id}/regenerate`);
export const getOrderQA       = (id)        => client.get(`/api/qa/${id}`);

// ── Assets ──────────────────────────────────────────────────────
export const uploadAsset = (file, orderId) => {
  const fd = new FormData();
  fd.append('file', file);
  if (orderId) fd.append('order_id', orderId);
  return client.post('/api/uploads', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
};

// ── Preview ──────────────────────────────────────────────────────
export const previewUrl = (id) =>
  `${BASE}/api/orders/${id}/preview?t=${Date.now()}`;

// ── Templates ────────────────────────────────────────────────────
export const listTemplates = () => client.get('/api/templates');

// ── Export ───────────────────────────────────────────────────────
export const exportUrl = (id, format = 'pdf') =>
  `${BASE}/api/orders/${id}/export?format=${format}`;
export const listExports = () => client.get('/api/exports');

// ── Patch and Typography ──────────────────────────────────────────
export const patchOrder = (id, patchPayload) => client.post(`/api/orders/${id}/patch`, patchPayload);
export const measureTypography = (payload) => client.post('/api/typography/measure', payload);

// ── Admin ────────────────────────────────────────────────────────
export const purgeCache = () => client.post('/api/admin/purge');
