import { Check, Table2, X } from 'lucide-react';
import type { Language, MLPResult, PerceptronResult, Point2D } from '../types/perceptron';
import { TRANSLATIONS } from '../constants/translations';
import { formatSigned } from '../utils/perceptronEngine';
import { audioSynth } from '../utils/audio';

interface TruthTablePanelProps {
  points: Point2D[];
  results: PerceptronResult[];
  mlpResults: MLPResult[] | null;
  selectedPoint: Point2D;
  onSelectPoint: (pt: Point2D) => void;
  language: Language;
}

const Bit = ({ v }: { v: number }) => (
  <span className="inline-block w-6 text-center py-0.5 rounded bg-zinc-900 border border-zinc-700 font-bold text-zinc-200">{v}</span>
);

export function TruthTablePanel({ points, results, mlpResults, selectedPoint, onSelectPoint, language }: TruthTablePanelProps) {
  const t = TRANSLATIONS[language];
  const mlp = mlpResults !== null;

  return (
    <section id="truth-table" className="relative rounded-xl brushed-aluminum p-4">
      <div className="vintage-screw absolute top-3 left-3" />
      <div className="vintage-screw absolute top-3 right-3" />
      <div className="vintage-screw absolute bottom-3 left-3" />
      <div className="vintage-screw absolute bottom-3 right-3" />

      <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-700/80 px-4">
        <div className="flex items-center gap-2">
          <Table2 className="w-4 h-4 text-crt-green" />
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">{t.truthTableTitle}</h3>
            <p className="text-[10px] font-mono text-zinc-400">{t.truthTableSubtitle}</p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-zinc-500 italic hidden sm:inline">{t.clickRowToInspect}</span>
      </div>

      <div className="overflow-x-auto px-2">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400 text-[11px] bg-zinc-950/60">
              <th className="py-2 px-2">{t.colX1}</th>
              <th className="py-2 px-2">{t.colX2}</th>
              <th className="py-2 px-2 text-zinc-200">{t.colTarget}</th>
              {mlp ? (
                <>
                  <th className="py-2 px-2 text-sky-400">{t.colH1}</th>
                  <th className="py-2 px-2 text-amber-400">{t.colH2}</th>
                  <th className="py-2 px-2 text-emerald-400">{t.colOut}</th>
                </>
              ) : (
                <>
                  <th className="py-2 px-2 text-sky-400">{t.colNetInput}</th>
                  <th className="py-2 px-2 text-emerald-400">{t.colActivation}</th>
                </>
              )}
              <th className="py-2 px-2 text-right">{t.colStatus}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((pt) => {
              const res = results.find((r) => r.x1 === pt.x1 && r.x2 === pt.x2);
              const mres = mlpResults?.find((r) => r.x1 === pt.x1 && r.x2 === pt.x2);
              const ok = mlp ? (mres?.isCorrect ?? false) : (res?.isCorrect ?? false);
              const selected = selectedPoint.x1 === pt.x1 && selectedPoint.x2 === pt.x2;
              return (
                <tr
                  key={`${pt.x1}${pt.x2}`}
                  onClick={() => {
                    audioSynth.playClick();
                    onSelectPoint(pt);
                  }}
                  className={`border-b border-zinc-800/60 cursor-pointer transition-colors ${
                    selected ? 'bg-zinc-800/90 outline outline-1 outline-crt-green/50' : ok ? 'hover:bg-zinc-800/40' : 'bg-red-950/20 hover:bg-red-950/40'
                  }`}
                >
                  <td className="py-2 px-2">
                    <Bit v={pt.x1} />
                  </td>
                  <td className="py-2 px-2">
                    <Bit v={pt.x2} />
                  </td>
                  <td className="py-2 px-2">
                    <span
                      className={`px-2 py-0.5 rounded font-bold border ${
                        pt.target === 1 ? 'bg-green-950/80 text-crt-green border-green-700/60' : 'bg-red-950/80 text-crt-red border-red-700/60'
                      }`}
                    >
                      {pt.target}
                    </span>
                  </td>
                  {mlp && mres ? (
                    <>
                      <td className="py-2 px-2 text-sky-300">{mres.h1_out}</td>
                      <td className="py-2 px-2 text-amber-300">{mres.h2_out}</td>
                      <td className="py-2 px-2 font-bold text-emerald-400">{mres.predicted}</td>
                    </>
                  ) : (
                    <>
                      <td className={`py-2 px-2 ${res && res.netInput >= 0 ? 'text-sky-300' : 'text-zinc-400'}`}>
                        {res ? formatSigned(res.netInput) : '—'}
                      </td>
                      <td className="py-2 px-2 font-bold text-emerald-400">{res?.predicted ?? '—'}</td>
                    </>
                  )}
                  <td className="py-2 px-2 text-right">
                    {ok ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-950/70 border border-green-600/50 text-[10px] font-bold text-crt-green">
                        <Check className="w-3 h-3" />
                        {t.statusPass}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-950/70 border border-red-600/50 text-[10px] font-bold text-crt-red animate-pulse">
                        <X className="w-3 h-3" />
                        {t.statusFail}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
