import React, { useEffect, useRef, useState, useCallback } from 'react';
import useDesignStore from '../../store/useDesignStore';

// ── Level config ────────────────────────────────────────────────────────────
const LEVELS = {
  INFO:    { color: '#8b8ba3', bg: 'transparent',          icon: 'ℹ',  label: 'INFO'  },
  WARNING: { color: '#F59E0B', bg: 'rgba(245,158,11,0.06)', icon: '⚠',  label: 'WARN'  },
  ERROR:   { color: '#EF4444', bg: 'rgba(239,68,68,0.08)',  icon: '✕',  label: 'ERROR' },
  DEBUG:   { color: '#6366F1', bg: 'transparent',           icon: '◆',  label: 'DEBUG' },
};

const LEVEL_ORDER = ['INFO', 'DEBUG', 'WARNING', 'ERROR'];

// ── Timestamp helper ────────────────────────────────────────────────────────
function ts() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}.${String(d.getMilliseconds()).padStart(3,'0')}`;
}

// ── LogConsole component ─────────────────────────────────────────────────────
export function LogConsole() {
  const runtimeLogs    = useDesignStore(s => s.runtimeLogs);
  const logSearchQuery = useDesignStore(s => s.logSearchQuery);
  const clearLogs      = useDesignStore(s => s.clearLogs);
  const setLogSearch   = useDesignStore(s => s.setLogSearchQuery);

  const [collapsed, setCollapsed]     = useState(false);
  const [autoScroll, setAutoScroll]   = useState(true);
  const [filterLevel, setFilterLevel] = useState('ALL');

  const bottomRef = useRef(null);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [runtimeLogs, autoScroll]);

  // Pause auto-scroll when user scrolls up manually
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 32);
  }, []);

  // Filter & search
  const visible = runtimeLogs.filter(log => {
    const levelOk  = filterLevel === 'ALL' || log.level === filterLevel;
    const searchOk = !logSearchQuery ||
      log.message?.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      log.node?.toLowerCase().includes(logSearchQuery.toLowerCase());
    return levelOk && searchOk;
  });

  const errorCount   = runtimeLogs.filter(l => l.level === 'ERROR').length;
  const warningCount = runtimeLogs.filter(l => l.level === 'WARNING').length;

  return (
    <div
      style={{
        flexShrink: 0,
        height: collapsed ? 32 : 180,
        transition: 'height 0.2s ease',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: '#080910',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
        fontSize: 11,
      }}
    >
      {/* ── Header bar ─────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '0 10px',
          height: 32,
          flexShrink: 0,
          borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.05)',
          background: '#0a0b12',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setCollapsed(c => !c)}
      >
        {/* Title */}
        <span style={{ color: '#D4AF37', fontWeight: 700, fontSize: 10, letterSpacing: '0.08em' }}>
          ▸ CONSOLE
        </span>

        {/* Badge counts */}
        {errorCount > 0 && (
          <span style={{
            background: 'rgba(239,68,68,0.2)', color: '#EF4444',
            borderRadius: 3, padding: '0 5px', fontSize: 10, fontWeight: 700,
          }}>
            {errorCount} ERR
          </span>
        )}
        {warningCount > 0 && (
          <span style={{
            background: 'rgba(245,158,11,0.15)', color: '#F59E0B',
            borderRadius: 3, padding: '0 5px', fontSize: 10, fontWeight: 700,
          }}>
            {warningCount} WARN
          </span>
        )}

        <span style={{ flex: 1 }} />

        {/* Log count */}
        <span style={{ color: '#55556a', fontSize: 10 }}>
          {visible.length}/{runtimeLogs.length} entries
        </span>

        {/* Collapse toggle */}
        <span style={{ color: '#55556a', fontSize: 12, marginLeft: 4 }}>
          {collapsed ? '▲' : '▼'}
        </span>
      </div>

      {/* ── Toolbar (hidden when collapsed) ───────────────────────── */}
      {!collapsed && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            flexShrink: 0,
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Level filter buttons */}
          {['ALL', ...LEVEL_ORDER].map(lvl => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              style={{
                background: filterLevel === lvl ? 'rgba(212,175,55,0.15)' : 'transparent',
                border: `1px solid ${filterLevel === lvl ? '#D4AF37' : 'rgba(255,255,255,0.08)'}`,
                color: filterLevel === lvl ? '#D4AF37' : '#55556a',
                borderRadius: 3,
                padding: '1px 7px',
                fontSize: 10,
                cursor: 'pointer',
                fontFamily: 'inherit',
                letterSpacing: '0.05em',
              }}
            >
              {lvl}
            </button>
          ))}

          {/* Search */}
          <input
            placeholder="search logs…"
            value={logSearchQuery}
            onChange={e => setLogSearch(e.target.value)}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 3,
              color: '#c8c8d8',
              fontSize: 10,
              padding: '2px 8px',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />

          {/* Auto-scroll indicator */}
          <button
            onClick={() => setAutoScroll(a => !a)}
            title="Toggle auto-scroll"
            style={{
              background: autoScroll ? 'rgba(99,102,241,0.2)' : 'transparent',
              border: `1px solid ${autoScroll ? '#6366F1' : 'rgba(255,255,255,0.08)'}`,
              color: autoScroll ? '#6366F1' : '#55556a',
              borderRadius: 3,
              padding: '1px 7px',
              fontSize: 10,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            ↓ AUTO
          </button>

          {/* Clear */}
          <button
            onClick={clearLogs}
            title="Clear all logs"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#55556a',
              borderRadius: 3,
              padding: '1px 7px',
              fontSize: 10,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            ⌫ CLR
          </button>
        </div>
      )}

      {/* ── Log entries ───────────────────────────────────────────── */}
      {!collapsed && (
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '4px 0',
          }}
        >
          {visible.length === 0 ? (
            <div style={{ color: '#3a3a52', padding: '12px 14px', fontSize: 11 }}>
              No log entries {logSearchQuery ? 'matching your search' : 'yet'}.
            </div>
          ) : (
            visible.map((log, i) => {
              const cfg = LEVELS[log.level] || LEVELS.INFO;
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 8,
                    padding: '1px 10px',
                    background: cfg.bg,
                    borderLeft: log.level === 'ERROR'
                      ? '2px solid #EF4444'
                      : log.level === 'WARNING'
                        ? '2px solid #F59E0B'
                        : '2px solid transparent',
                  }}
                >
                  {/* Timestamp */}
                  <span style={{ color: '#3a3a52', flexShrink: 0, fontSize: 10 }}>
                    {log.timestamp || ts()}
                  </span>

                  {/* Level badge */}
                  <span style={{
                    color: cfg.color,
                    flexShrink: 0,
                    width: 40,
                    fontSize: 10,
                    fontWeight: 700,
                  }}>
                    {cfg.icon} {cfg.label}
                  </span>

                  {/* Node tag */}
                  {log.node && (
                    <span style={{
                      color: '#6366F1',
                      flexShrink: 0,
                      fontSize: 10,
                      background: 'rgba(99,102,241,0.1)',
                      borderRadius: 2,
                      padding: '0 4px',
                    }}>
                      [{log.node}]
                    </span>
                  )}

                  {/* Message */}
                  <span style={{ color: cfg.color, wordBreak: 'break-word', lineHeight: 1.5 }}>
                    {log.message}
                  </span>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
