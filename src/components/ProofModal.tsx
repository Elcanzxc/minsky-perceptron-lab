import { useEffect } from 'react';
import { AlertTriangle, BookOpen, Clock, Compass, X } from 'lucide-react';
import type { Language } from '../types/perceptron';
import { TRANSLATIONS } from '../constants/translations';
import { audioSynth } from '../utils/audio';

interface ProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export function ProofModal({ isOpen, onClose, language }: ProofModalProps) {
  const t = TRANSLATIONS[language];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        audioSynth.playClick();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const close = () => {
    audioSynth.playClick();
    onClose();
  };

  const timeline = [
    { year: '1943', text: t.t1943 },
    { year: '1958', text: t.t1958 },
    { year: '1960', text: t.t1960 },
    { year: '1969', text: t.t1969 },
    { year: '1986', text: t.t1986 },
    { year: '2012', text: t.t2012 },
  ];

  return (
    <div
      onClick={close}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto brushed-aluminum rounded-2xl border-2 border-amber-600/60 shadow-2xl p-6 text-zinc-100"
      >
        <div className="vintage-screw absolute top-4 left-4" />
        <div className="vintage-screw absolute top-4 right-4" />
        <div className="vintage-screw absolute bottom-4 left-4" />
        <div className="vintage-screw absolute bottom-4 right-4" />

        <div className="flex items-start justify-between pb-4 mb-4 border-b border-zinc-700/80 px-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-950/70 border border-amber-500/50">
              <BookOpen className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-bold">
                MIT PRESS · PERCEPTRONS · 1969
              </span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">{t.proofModalTitle}</h2>
            </div>
          </div>
          <button
            onClick={close}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 px-2 font-mono text-xs text-zinc-300 leading-relaxed">
          {/* Algebraic proof */}
          <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-600/40">
            <div className="font-bold text-amber-300 text-sm mb-1">{t.proofTheorem}</div>
            <p className="text-zinc-200">{t.proofStep1}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 text-red-300 font-bold">
              (1) &nbsp; (0, 0) → 0 &nbsp; ⟹ &nbsp; b &lt; 0
            </div>
            <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 text-emerald-300 font-bold">
              (2) &nbsp; (1, 0) → 1 &nbsp; ⟹ &nbsp; w₁ + b ≥ 0
            </div>
            <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 text-emerald-300 font-bold">
              (3) &nbsp; (0, 1) → 1 &nbsp; ⟹ &nbsp; w₂ + b ≥ 0
            </div>
            <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 text-red-300 font-bold">
              (4) &nbsp; (1, 1) → 0 &nbsp; ⟹ &nbsp; w₁ + w₂ + b &lt; 0
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
            <div>
              <div className="text-zinc-400 mb-1">{t.proofStep3}</div>
              <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-sky-300 font-bold">
                (w₁ + b) + (w₂ + b) ≥ 0 &nbsp; ⟹ &nbsp; w₁ + w₂ + 2b ≥ 0
              </div>
            </div>
            <div>
              <div className="text-zinc-400 mb-1">{t.proofStep4}</div>
              <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-sky-300 font-bold">
                <span className="text-red-300">(w₁ + w₂ + b)</span> + <span className="text-red-300">b</span> ≥ 0
              </div>
            </div>
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-600/70 text-red-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-crt-red shrink-0 mt-0.5" />
              <span className="font-bold">{t.proofStep5}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-700 font-bold text-white">{t.proofConclusion}</div>

          {/* Geometric convexity proof with diagram */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div className="sm:col-span-2 space-y-1.5">
              <div className="flex items-center gap-2 text-sky-400 font-bold">
                <Compass className="w-4 h-4" />
                <span>{t.geometricTitle}</span>
              </div>
              <p className="text-zinc-300 text-[11px] leading-relaxed">{t.geometricBody}</p>
            </div>
            <svg viewBox="0 0 140 140" className="w-32 h-32 mx-auto">
              <rect x="25" y="25" width="90" height="90" fill="none" stroke="#3f3f46" strokeDasharray="3 3" />
              <line x1="25" y1="25" x2="115" y2="115" stroke="#22c55e" strokeWidth="2" />
              <line x1="25" y1="115" x2="115" y2="25" stroke="#ef4444" strokeWidth="2" />
              <circle cx="70" cy="70" r="5" fill="#fbbf24" />
              <circle cx="25" cy="25" r="5" fill="#22c55e" />
              <circle cx="115" cy="115" r="5" fill="#22c55e" />
              <circle cx="25" cy="115" r="5" fill="#ef4444" />
              <circle cx="115" cy="25" r="5" fill="#ef4444" />
              <text x="70" y="90" textAnchor="middle" fill="#fbbf24" fontSize="9">
                (0.5, 0.5)
              </text>
            </svg>
          </div>

          {/* Historical nuance */}
          <div className="p-3 rounded-lg bg-zinc-900/90 border border-zinc-800">
            <div className="font-bold text-amber-400 mb-1">{t.nuanceTitle}</div>
            <p className="text-[11px] text-zinc-300">{t.nuanceBody}</p>
          </div>

          {/* Timeline */}
          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
            <div className="flex items-center gap-2 font-bold text-zinc-200 mb-2">
              <Clock className="w-4 h-4 text-crt-green" />
              <span>{t.timelineTitle}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              {timeline.map((item) => (
                <div key={item.year} className="flex items-start gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-amber-400 font-bold shrink-0">
                    {item.year}
                  </span>
                  <span className="text-zinc-400">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-zinc-700/80 flex justify-end px-2">
          <button
            onClick={close}
            className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono text-xs font-bold uppercase tracking-wider"
          >
            {t.proofModalClose}
          </button>
        </div>
      </div>
    </div>
  );
}
