import React, { memo } from 'react';
import { ShieldCheck, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import useDesignStore from '../../store/useDesignStore';

const QA_LABELS = {
  telugu_validity:      'Telugu Script',
  content_completeness: 'Content',
  phone_validity:       'Phone Number',
  clipping:             'Clipping',
  readability:          'Readability',
  alignment:            'Alignment',
  contrast:             'Contrast',
  image_quality:        'Image Quality',
  asset_integrity:      'Assets',
  safe_zone:            'Safe Zone',
  dpi_check:            'DPI Check',
};

function ScoreBar({ score }) {
  const color =
    score >= 80 ? '#10b981' :
    score >= 60 ? '#F59E0B' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-white/5">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="text-[10px] font-mono" style={{ color }}>{score}</span>
    </div>
  );
}

export const QAInspector = memo(function QAInspector() {
  const { qaScores, qaPassed } = useDesignStore();
  const hardFailures = qaScores?.hard_failures || [];
  const softFailures = qaScores?.failures || [];
  const composite   = qaScores?.composite ?? null;

  return (
    <section className="px-3 py-3">
      <div className="flex items-center gap-2 panel-title mb-3">
        <ShieldCheck size={11} />
        QA Validation
      </div>

      {composite === null ? (
        <p className="text-[11px] text-[#55556a] italic">No QA data yet</p>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Overall score */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#8b8ba3]">Overall Score</span>
            <div className="flex items-center gap-2">
              {qaPassed
                ? <CheckCircle size={13} className="text-emerald-400" />
                : <XCircle size={13} className="text-red-400" />
              }
              <span
                className="text-[16px] font-bold"
                style={{ color: qaPassed ? '#10b981' : composite >= 60 ? '#F59E0B' : '#ef4444' }}
              >
                {composite}
              </span>
            </div>
          </div>

          {/* Individual scores */}
          <div className="flex flex-col gap-2">
            {Object.entries(QA_LABELS).map(([key, label]) => {
              const score = qaScores[key];
              if (score === undefined) return null;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] text-[#8b8ba3]">{label}</span>
                  </div>
                  <ScoreBar score={score} />
                </div>
              );
            })}
          </div>

          {/* Hard failures */}
          {hardFailures.length > 0 && (
            <div>
              <div className="panel-title mb-2 text-red-400">Hard Failures</div>
              {hardFailures.map((f, i) => (
                <div key={i} className="flex items-start gap-2 py-1.5 border-b border-white/5 last:border-0">
                  <XCircle size={12} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[11px] text-red-400 font-medium font-mono">{f.code}</div>
                    <div className="text-[10px] text-[#8b8ba3]">{f.message}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Soft failures */}
          {softFailures.length > 0 && (
            <div>
              <div className="panel-title mb-2 text-amber-400">Warnings</div>
              {softFailures.map((code, i) => (
                <div key={i} className="flex items-center gap-2 py-1">
                  <AlertTriangle size={11} className="text-amber-400 flex-shrink-0" />
                  <span className="text-[10px] text-[#8b8ba3]">{QA_LABELS[code] || code}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
});
