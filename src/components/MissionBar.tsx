import { useState } from 'react';
import { Award, Check, ChevronDown, ChevronUp, ClipboardList, Play, RotateCcw } from 'lucide-react';
import type { Language, MissionId } from '../types/perceptron';
import { MISSIONS } from '../constants/missions';
import { TRANSLATIONS } from '../constants/translations';
import { audioSynth } from '../utils/audio';

interface MissionBarProps {
  activeMission: MissionId | null;
  completed: Record<MissionId, boolean>;
  onStartMission: (id: MissionId) => void;
  onResetMissions: () => void;
  language: Language;
}

export function MissionBar({ activeMission, completed, onStartMission, onResetMissions, language }: MissionBarProps) {
  const [open, setOpen] = useState(true);
  const t = TRANSLATIONS[language];
  const doneCount = MISSIONS.filter((m) => completed[m.id]).length;
  const allDone = doneCount === MISSIONS.length;
  const current = MISSIONS.find((m) => m.id === activeMission) ?? MISSIONS.find((m) => !completed[m.id]) ?? MISSIONS[0];

  return (
    <section className="relative rounded-xl brushed-aluminum p-4 mb-6">
      <div className="vintage-screw absolute top-3 left-3" />
      <div className="vintage-screw absolute top-3 right-3" />

      <div className="flex flex-wrap items-center justify-between gap-2 px-4">
        <div className="flex items-center gap-2.5">
          {allDone ? <Award className="w-5 h-5 text-amber-400" /> : <ClipboardList className="w-4 h-4 text-crt-green" />}
          <div>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
              {t.missionsTitle} · <span className="text-crt-green">{doneCount}/{MISSIONS.length}</span>
            </h2>
            <p className="text-[10px] font-mono text-zinc-400">{allDone ? t.missionsComplete : t.missionsSubtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {doneCount > 0 && (
            <button
              onClick={() => {
                audioSynth.playClick();
                onResetMissions();
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-[10px] font-mono text-zinc-400 hover:text-white"
            >
              <RotateCcw className="w-3 h-3" />
              {t.missionsReset}
            </button>
          )}
          <button
            onClick={() => {
              audioSynth.playClick();
              setOpen(!open);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-[10px] font-mono text-zinc-300"
          >
            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {open ? t.hide : t.show}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-3 px-2 space-y-2.5">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {MISSIONS.map((m, idx) => {
              const isDone = completed[m.id];
              const isActive = current.id === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    audioSynth.playClick();
                    onStartMission(m.id);
                  }}
                  className={`text-left p-2.5 rounded-lg border font-mono transition-all ${
                    isDone
                      ? 'bg-green-950/40 border-green-700/60 text-green-200'
                      : isActive
                        ? 'bg-zinc-800 border-amber-500/80 text-white shadow-crt-amber'
                        : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="font-bold">#{idx + 1} · {m.gate}</span>
                    {isDone ? <Check className="w-3.5 h-3.5 text-crt-green" /> : <Play className="w-3 h-3 opacity-60" />}
                  </div>
                  <div className="text-[11px] font-bold leading-snug line-clamp-2">{m.title[language]}</div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800 font-mono text-xs">
            <div>
              <span className="text-amber-400 font-bold mr-2">[{current.title[language]}]</span>
              <span className="text-zinc-300">{current.hint[language]}</span>
            </div>
            <button
              onClick={() => {
                audioSynth.playClick();
                onStartMission(current.id);
              }}
              className="shrink-0 px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-[11px] uppercase tracking-wider"
            >
              {t.missionGo}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

