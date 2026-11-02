import { AlertTriangle, BookOpen, CheckCircle, Cpu, Radio, Volume2, VolumeX, Zap } from 'lucide-react';
import type { AudioSettings, Language } from '../types/perceptron';
import { TRANSLATIONS } from '../constants/translations';
import { audioSynth } from '../utils/audio';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  audioSettings: AudioSettings;
  onAudioChange: (settings: AudioSettings) => void;
  accuracy: number;
  allPassed: boolean;
  isCrisis: boolean;
  isMLPMode: boolean;
  epoch: number;
  onOpenProof: () => void;
}

const LANGUAGES: Language[] = ['AZ', 'EN', 'RU'];

export function Header({
  language,
  onLanguageChange,
  audioSettings,
  onAudioChange,
  accuracy,
  allPassed,
  isCrisis,
  isMLPMode,
  epoch,
  onOpenProof,
}: HeaderProps) {
  const t = TRANSLATIONS[language];

  const toggleMute = () => {
    const muted = !audioSettings.muted;
    audioSynth.setMuted(muted);
    if (!muted) {
      audioSynth.playClick();
      if (audioSettings.crtHum) audioSynth.startCrtHum();
    }
    onAudioChange({ ...audioSettings, muted });
  };

  const toggleHum = () => {
    audioSynth.playClick();
    const crtHum = !audioSettings.crtHum;
    if (crtHum && !audioSettings.muted) audioSynth.startCrtHum();
    else audioSynth.stopCrtHum();
    onAudioChange({ ...audioSettings, crtHum });
  };

  let status: { tone: 'red' | 'amber' | 'green'; text: string; blink: boolean };
  if (isCrisis) status = { tone: 'red', text: t.statusCrisis, blink: true };
  else if (isMLPMode) status = allPassed ? { tone: 'amber', text: t.statusMLPActive, blink: false } : { tone: 'red', text: t.statusMLPMiswired, blink: true };
  else if (allPassed) status = { tone: 'green', text: t.statusConverged, blink: false };
  else status = { tone: 'red', text: `${t.statusMisclassified} · ${accuracy}% ${t.accuracyLabel}`, blink: true };

  const toneClass = {
    red: 'bg-red-950/70 border-red-600/60 crt-red-text',
    amber: 'bg-amber-950/50 border-amber-500/50 crt-amber-text',
    green: 'bg-green-950/50 border-green-500/50 crt-green-text',
  }[status.tone];

  return (
    <header className="relative w-full brushed-aluminum rounded-xl p-4 mb-6 overflow-hidden">
      <div className="vintage-screw absolute top-3 left-3" />
      <div className="vintage-screw absolute top-3 right-3" />
      <div className="vintage-screw absolute bottom-3 left-3" />
      <div className="vintage-screw absolute bottom-3 right-3" />

      <div className="flex flex-col xl:flex-row items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-4 text-center xl:text-left">
          <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-lg bg-zinc-800 border border-zinc-600 shadow-inner">
            <Cpu className="w-7 h-7 text-crt-green animate-pulse-slow" />
          </div>
          <div>
            <p className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">{t.labDesignation}</p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{t.appTitle}</h1>
            <p className="text-xs text-zinc-400 font-tech">{t.appSubtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 bg-zinc-950/80 px-3 py-2 rounded-lg border border-zinc-800 shadow-inner">
          <div className={`flex items-center gap-2 px-3 py-1 rounded border ${toneClass} ${status.blink ? 'animate-alarm-flash' : ''}`}>
            {status.tone === 'red' ? (
              <AlertTriangle className="w-4 h-4" />
            ) : status.tone === 'amber' ? (
              <Zap className="w-4 h-4" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase">{status.text}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-zinc-900 border border-zinc-700">
            <span className="text-[10px] font-mono text-zinc-400">{t.epochsLabel}</span>
            <span className="font-display text-xl text-nixie-orange tracking-widest" style={{ textShadow: '0 0 8px #ff7700' }}>
              {String(epoch).padStart(4, '0')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              audioSynth.playClick();
              onOpenProof();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-amber-700/60 bg-zinc-800/80 text-amber-300 hover:bg-amber-950/50 text-xs font-mono transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.proofShortcut}</span>
          </button>
          <button
            onClick={toggleHum}
            title={t.humLabel}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-mono transition-all ${
              audioSettings.crtHum
                ? 'bg-amber-950/60 border-amber-600 text-amber-300 shadow-crt-amber'
                : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.humLabel}</span>
          </button>
          <button
            onClick={toggleMute}
            title={audioSettings.muted ? t.audioMuted : t.audioOn}
            className={`p-2 rounded-md border transition-all ${
              audioSettings.muted
                ? 'bg-zinc-800/80 border-zinc-700 text-zinc-500 hover:text-zinc-300'
                : 'bg-green-950/60 border-green-600 text-green-300 shadow-crt-green'
            }`}
          >
            {audioSettings.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <div className="flex items-center p-1 rounded-md bg-zinc-950 border border-zinc-700/80 shadow-inner">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  audioSynth.playClick();
                  onLanguageChange(lang);
                }}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-colors ${
                  language === lang ? 'bg-crt-green text-zinc-950 shadow-crt-green' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
