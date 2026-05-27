import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, FileText, Calendar, User, Layers, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { listExports, exportUrl } from '../api/orders';

export default function ExportsCenter() {
  const [exports, setExports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchExports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listExports();
      if (res.data && res.data.exports) {
        setExports(res.data.exports);
      } else {
        setExports([]);
      }
    } catch (err) {
      console.error('Failed to load exports:', err);
      setError('Could not load exports list. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExports();
  }, []);

  const filteredExports = exports.filter(item => {
    const search = searchTerm.toLowerCase();
    return (
      (item.order_id || '').toLowerCase().includes(search) ||
      (item.client_name || '').toLowerCase().includes(search) ||
      (item.banner_type || '').toLowerCase().includes(search)
    );
  });

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#07080c] text-white p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] tracking-tight">
            Print Export Registry
          </h1>
          <p className="text-[12px] text-[#8b8ba3] mt-1">
            Historical archive of print-ready outputs written directly to database logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by Order ID, Client..."
            className="sln-input w-full sm:w-64 !text-[12px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={fetchExports}
            disabled={loading}
            className="btn btn-ghost !p-2"
            title="Refresh Registry"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-[#D4AF37]' : ''} />
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-lg bg-red-950/20 border border-red-800/40 text-red-300 flex items-start gap-3">
          <AlertCircle className="flex-shrink-0 mt-0.5" size={16} />
          <div>
            <div className="text-[12px] font-semibold">Database Sync Error</div>
            <div className="text-[11px] text-red-300/80 mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {/* Loaded Content */}
      {loading && exports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
          <span className="text-[12px] text-[#8b8ba3]">Reading SQLite log registry...</span>
        </div>
      ) : filteredExports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
          <FileText size={32} className="text-[#55556a] mb-2" />
          <span className="text-[12px] text-[#8b8ba3]">
            {searchTerm ? 'No matching print records found' : 'No recorded print exports found'}
          </span>
          <p className="text-[10px] text-[#55556a] mt-1">
            Ensure designs have been completed and fully compiled in the Workspace.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredExports.map((item) => (
            <div
              key={item.id || item.order_id}
              className="relative p-5 rounded-xl bg-[#09090e]/60 border border-white/5 hover:border-[#D4AF37]/30 transition-all group overflow-hidden flex flex-col justify-between"
            >
              {/* Gold glass background hint */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 blur-3xl rounded-full -mr-6 -mt-6 pointer-events-none group-hover:bg-[#D4AF37]/10 transition-colors" />

              <div className="space-y-4">
                {/* Meta Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-wider bg-[#D4AF37]/10 px-2 py-0.5 rounded-full">
                      {item.banner_type || 'General'}
                    </span>
                    <h3 className="text-[14px] font-bold text-white/95 mt-1 font-mono tracking-tight">
                      {item.order_id}
                    </h3>
                  </div>
                  <span className="text-[10px] text-[#55556a] flex items-center gap-1 font-mono">
                    <Calendar size={10} />
                    {formatDate(item.created_at)}
                  </span>
                </div>

                {/* Details Section */}
                <div className="space-y-2 border-t border-b border-white/5 py-3">
                  <div className="flex items-center text-[12px]">
                    <User size={12} className="text-[#8b8ba3] mr-2" />
                    <span className="text-[#8b8ba3] mr-1">Client:</span>
                    <span className="font-semibold text-white/90">{item.client_name}</span>
                  </div>

                  {item.metadata && (
                    <div className="flex items-start text-[11px] text-[#8b8ba3]">
                      <Layers size={11} className="mr-2 mt-0.5 text-[#8b8ba3]" />
                      <div className="flex-1">
                        <span className="text-[#8b8ba3]">Specs: </span>
                        <span className="text-white/80 font-mono text-[10px]">
                          {(() => {
                            try {
                              const meta = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata;
                              const w = meta.dimensions?.width_inches || meta.width_inches || '?';
                              const h = meta.dimensions?.height_inches || meta.height_inches || '?';
                              const dpi = meta.dpi || '?';
                              return `${w}" x ${h}" Flex @ ${dpi} DPI`;
                            } catch {
                              return item.metadata;
                            }
                          })()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-2 flex flex-col gap-2">
                {/* PDF Option */}
                {item.pdf_path ? (
                  <a
                    href={exportUrl(item.order_id, 'pdf')}
                    download
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded leading-none">
                        PDF
                      </span>
                      <span className="text-[11px] text-[#8b8ba3]">Print Document</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <span className="text-[10px] text-[#55556a] font-mono">{item.pdf_size || 'Available'}</span>
                      <Download size={12} className="text-[#D4AF37]" />
                    </div>
                  </a>
                ) : (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.01] border border-dashed border-white/5 opacity-50">
                    <span className="text-[11px] text-[#55556a]">PDF unavailable</span>
                  </div>
                )}

                {/* TIFF Option */}
                {item.tiff_path ? (
                  <a
                    href={exportUrl(item.order_id, 'tiff')}
                    download
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded leading-none">
                        TIFF
                      </span>
                      <span className="text-[11px] text-[#8b8ba3]">Lossless Image</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <span className="text-[10px] text-[#55556a] font-mono">{item.tiff_size || 'Available'}</span>
                      <Download size={12} className="text-[#D4AF37]" />
                    </div>
                  </a>
                ) : (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.01] border border-dashed border-white/5 opacity-50">
                    <span className="text-[11px] text-[#55556a]">TIFF unavailable</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
