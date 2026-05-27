import React, { useState, useEffect, useMemo } from 'react';
import { LayoutGrid, Search, Filter, Palette, Sparkles, Loader2 } from 'lucide-react';
import { listTemplates } from '../api/orders';
import useDesignStore from '../store/useDesignStore';

export function TemplatesPage() {
  const { setRoute } = useDesignStore();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    async function load() {
      try {
        const res = await listTemplates();
        setTemplates(res.data.templates || []);
      } catch (err) {
        console.error('Failed to load templates:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const categories = useMemo(() => {
    const list = new Set(templates.map(t => t.category).filter(Boolean));
    return ['All', ...Array.from(list).sort()];
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
      
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        (t.template_id && t.template_id.toLowerCase().includes(searchLower)) ||
        (t.category && t.category.toLowerCase().includes(searchLower)) ||
        (t.style && t.style.toLowerCase().includes(searchLower)) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(searchLower)));

      return matchesCategory && matchesSearch;
    });
  }, [templates, selectedCategory, searchQuery]);

  const handleUseTemplate = (tmpl) => {
    // Redirect to the create wizard with prefilled template parameters
    // The create wizard will pick this up in its useEffect
    setRoute('create-wizard', {
      prefill: 'true',
      category: tmpl.category || 'general',
      primary: tmpl.colors?.primary || '#FF9933',
      accent: tmpl.colors?.accent || '#008000',
      heading: tmpl.default_heading || ''
    });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#07080c] py-8 px-6 flex justify-center scrollbar-thin scrollbar-thumb-white/10">
      <div className="w-full max-w-6xl flex flex-col">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Design Templates</h1>
            <p className="text-[11px] text-[#8b8ba3] mt-1">Browse and apply default structures from our canonical design template library</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[10px] text-[#D4AF37] font-semibold font-mono">
            <LayoutGrid size={11} />
            <span>{templates.length} Active Templates</span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-[#09090e] border border-white/5 p-4 rounded-xl">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-3 text-[#55556a]" />
            <input
              className="sln-input w-full pl-9"
              placeholder="Search templates by style, tags or categories..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 items-center">
            <Filter size={12} className="text-[#8b8ba3]" />
            <select
              className="sln-input bg-[#050508] text-xs font-semibold py-1.5 min-w-[150px]"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid and States */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={32} className="text-[#D4AF37] animate-spin" />
            <span className="text-[11px] text-[#8b8ba3] font-medium font-mono">Loading templates data...</span>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl py-24 px-4 bg-white/[0.01]">
            <span className="text-4xl mb-4 select-none">🎨</span>
            <h3 className="text-sm font-semibold text-white">No templates found</h3>
            <p className="text-[10px] text-[#55556a] mt-1 text-center max-w-xs">Try clearing search keywords or choosing a different design category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((tmpl, idx) => {
              const themePrimary = tmpl.colors?.primary || '#FF9933';
              const themeAccent = tmpl.colors?.accent || '#008000';
              return (
                <div
                  key={tmpl.template_id || idx}
                  className="bg-[#09090e] border border-white/5 rounded-xl overflow-hidden shadow-lg transition-all hover:scale-[1.01] hover:border-white/10 flex flex-col relative group"
                >
                  {/* Color strip accent */}
                  <div className="h-1 w-full flex">
                    <div className="flex-grow" style={{ backgroundColor: themePrimary }} />
                    <div className="flex-grow" style={{ backgroundColor: themeAccent }} />
                  </div>

                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <div>
                      {/* Badge / Meta */}
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[9px] font-semibold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded uppercase tracking-wider">
                          {tmpl.category || 'general'}
                        </span>
                        <span className="text-[9px] text-[#55556a] font-mono uppercase tracking-widest leading-none">
                          {tmpl.style || 'modern'}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-xs font-bold text-white mb-2 font-sans truncate">
                        {tmpl.template_id ? tmpl.template_id.replace(/_/g, ' ').toUpperCase() : 'TEMPLATE'}
                      </h3>

                      {/* Default text indicator */}
                      {tmpl.default_heading && (
                        <div className="text-[10px] text-[#8b8ba3] bg-white/[0.01] border border-white/5 rounded-md p-2.5 mb-4 italic font-sans break-words line-clamp-2">
                          "{tmpl.default_heading}"
                        </div>
                      )}
                    </div>

                    <div>
                      {/* Tags */}
                      {tmpl.tags && tmpl.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {tmpl.tags.map(tag => (
                            <span key={tag} className="text-[8px] bg-white/5 text-[#8b8ba3] px-1.5 py-0.5 rounded font-mono">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Swatch display */}
                      <div className="flex items-center gap-3 mb-5 pb-3 border-b border-white/[0.02]">
                        <div className="flex items-center gap-1.5">
                          <Palette size={11} className="text-[#55556a]" />
                          <span className="text-[9px] text-[#55556a] font-semibold uppercase tracking-wider">Theme Colors</span>
                        </div>
                        <div className="flex gap-1.5">
                          <div className="w-5 h-5 rounded-full border border-white/15" style={{ backgroundColor: themePrimary }} title={`Primary: ${themePrimary}`} />
                          <div className="w-5 h-5 rounded-full border border-white/15" style={{ backgroundColor: themeAccent }} title={`Accent: ${themeAccent}`} />
                        </div>
                      </div>

                      {/* Use template btn */}
                      <button
                        onClick={() => handleUseTemplate(tmpl)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[10px] font-bold bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all hover:scale-[1.01]"
                      >
                        <Sparkles size={11} />
                        <span>Use Template Layout</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
