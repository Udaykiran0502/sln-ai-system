import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const client = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Single retry on timeout
client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const cfg = err.config;
    if ((err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK') && !cfg._retry) {
      cfg._retry = true;
      return client(cfg);
    }
    return Promise.reject(err);
  }
);

export default client;
