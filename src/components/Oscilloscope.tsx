import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import type {
  CartesianPoint,
  Classified,
  GateType,
  Language,
  MLPArchitecture,
  Point2D,
  Weights,
} from '../types/perceptron';
import { TRANSLATIONS } from '../constants/translations';
import {
  computeLayout,
  drawBeacons,
  drawBoundary,
  drawGrid,
  drawMLPRegion,
  drawNormalVector,
  drawPolygon,
  drawProbe,
  drawTrail,
  fromCanvas,
  getPositiveHalfSpacePolygon,
  isInsideView,
  toCanvas,
} from '../utils/canvas';
import { computeNetInput, formatNumber, formatSigned, heavisideStep, mlpForward } from '../utils/perceptronEngine';
import { audioSynth } from '../utils/audio';

interface OscilloscopeProps {
  gateType: GateType;
  weights: Weights;
  points: Point2D[];
  classified: Classified[];
  selectedPoint: Point2D;
  onSelectPoint: (pt: Point2D) => void;
  isMLPMode: boolean;
  mlpArchitecture: MLPArchitecture | null;
  isCrisis: boolean;
  trail: Weights[];
  accuracy: number;
  language: Language;
}

interface DrawState {
  weights: Weights;
  points: Point2D[];
  classified: Classified[];
  selectedPoint: Point2D;
  mlp: MLPArchitecture | null;
  isCrisis: boolean;
  trail: Weights[];
  probe: CartesianPoint | null;
}

export function Oscilloscope({
  gateType,
  weights,
  points,
  classified,
  selectedPoint,
  onSelectPoint,
  isMLPMode,
  mlpArchitecture,
  isCrisis,
  trail,
  accuracy,
  language,
}: OscilloscopeProps) {
  const t = TRANSLATIONS[language];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [probe, setProbe] = useState<CartesianPoint | null>(null);
  const activeMlp = isMLPMode ? mlpArchitecture : null;

  const drawRef = useRef<DrawState>({
    weights,
    points,
    classified,
    selectedPoint,
    mlp: activeMlp,
    isCrisis,
    trail,
    probe,
  });

  useEffect(() => {
    drawRef.current = { weights, points, classified, selectedPoint, mlp: activeMlp, isCrisis, trail, probe };
  });

  // One persistent animation loop; it always reads the latest state from the ref.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let frame = 0;
    const t0 = performance.now();

    const render = (now: number) => {
      const s = drawRef.current;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const L = computeLayout(w, h);

      drawGrid(ctx, w, h, L, s.isCrisis ? 'amber' : 'green');

      if (s.mlp) {
        drawMLPRegion(ctx, s.mlp, L, 'rgba(34, 197, 94, 0.16)');
        drawBoundary(ctx, s.mlp.hidden1.weights, L, '#38bdf8', `H₁ · ${s.mlp.hidden1.gateType}`);
        drawBoundary(ctx, s.mlp.hidden2.weights, L, '#f59e0b', `H₂ · ${s.mlp.hidden2.gateType}`);
      } else {
        const lineColor = s.isCrisis ? '#ef4444' : '#22c55e';
        drawPolygon(ctx, getPositiveHalfSpacePolygon(s.weights), L, s.isCrisis ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.13)');
        drawTrail(ctx, s.trail, L, lineColor);
        drawBoundary(ctx, s.weights, L, lineColor, 'w⃗·x⃗ + b = 0');
        drawNormalVector(ctx, s.weights, L);
      }

      if (s.probe) {
        const out = s.mlp
          ? mlpForward(s.mlp, s.probe.x, s.probe.y).predicted
          : heavisideStep(computeNetInput(s.probe.x, s.probe.y, s.weights));
        drawProbe(ctx, s.probe, out, L);
      }

      drawBeacons(ctx, s.points, s.classified, s.selectedPoint, L, now - t0);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, []);

  const eventToCartesian = (e: MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const L = computeLayout(rect.width, rect.height);
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    return { L, px, py, p: fromCanvas(px, py, L) };
  };

  const handleMove = (e: MouseEvent<HTMLCanvasElement>) => {
    const { p } = eventToCartesian(e);
    setProbe(isInsideView(p) ? p : null);
  };

  const handleClick = (e: MouseEvent<HTMLCanvasElement>) => {
    const { L, px, py } = eventToCartesian(e);
    let nearest: Point2D | null = null;
    let best = 30;
    for (const pt of points) {
      const c = toCanvas(pt.x1, pt.x2, L);
      const d = Math.hypot(c.px - px, c.py - py);
      if (d < best) {
        best = d;
        nearest = pt;
      }
    }
    if (nearest) {
      audioSynth.playClick();
      onSelectPoint(nearest);
    }
  };

  // Telemetry values
  const norm = Math.hypot(weights.w1, weights.w2);
  const slope = Math.abs(weights.w2) < 1e-9 ? t.verticalLine : formatNumber(-weights.w1 / weights.w2, 2);
  let probeText = t.hudProbeIdle;
  if (probe) {
    if (activeMlp) {
      const f = mlpForward(activeMlp, probe.x, probe.y);
      probeText = `(${formatNumber(probe.x)}, ${formatNumber(probe.y)})  h=(${f.h1_out},${f.h2_out}) → y=${f.predicted}`;
    } else {
      const z = computeNetInput(probe.x, probe.y, weights);
      probeText = `(${formatNumber(probe.x)}, ${formatNumber(probe.y)})  z=${formatSigned(z)} → f=${heavisideStep(z)}`;
    }
  }

  return (
    <section className="relative flex flex-col rounded-xl overflow-hidden brushed-aluminum">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-700">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${isCrisis ? 'bg-crt-red shadow-crt-red' : 'bg-crt-green shadow-crt-green'}`} />
          <h2 className="text-xs font-mono font-bold tracking-wider text-zinc-300 uppercase">{t.oscilloscopeTitle}</h2>
        </div>
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest hidden md:block">{t.oscilloscopeModel}</span>
      </div>

      <div className="p-3 bg-zinc-950">
        <div className="relative w-full max-w-[560px] mx-auto aspect-square rounded-[28px] border-[6px] border-zinc-800 shadow-[inset_0_0_30px_rgba(0,0,0,0.9),0_0_0_2px_#3f3f46] overflow-hidden bg-black">
          <canvas
            ref={canvasRef}
            onMouseMove={handleMove}
            onMouseLeave={() => setProbe(null)}
            onClick={handleClick}
            className={`w-full h-full cursor-crosshair ${isCrisis ? 'animate-flicker' : ''}`}
          />
          <div className="crt-screen-overlay absolute inset-0" />
          <div className="crt-vignette absolute inset-0 rounded-[22px]" />
          {isCrisis && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded bg-red-950/85 border border-red-600 text-[10px] font-mono font-bold crt-red-text animate-alarm-flash pointer-events-none whitespace-nowrap">
              ⚠ {t.statusCrisis}
            </div>
          )}
        </div>
      </div>

      {/* Telemetry strip — kept outside the screen so it never hides the beacons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-zinc-800 border-t border-zinc-700 font-mono text-[11px]">
        <div className="bg-zinc-900 px-3 py-2">
          <div className="text-[9px] text-zinc-500">{t.hudGate}</div>
          <div className="text-crt-green font-bold">
            {gateType} · {accuracy}%
          </div>
        </div>
        {activeMlp ? (
          <div className="bg-zinc-900 px-3 py-2 col-span-1 md:col-span-2">
            <div className="text-[9px] text-zinc-500">{t.hudNetwork}</div>
            <div className="text-amber-300 font-bold truncate">{activeMlp.formula}</div>
          </div>
        ) : (
          <>
            <div className="bg-zinc-900 px-3 py-2">
              <div className="text-[9px] text-zinc-500">{t.hudLine}</div>
              <div className="text-zinc-200 truncate">
                {norm < 1e-9
                  ? t.noLine
                  : `${formatNumber(weights.w1, 1)}x₁ ${formatSigned(weights.w2, 1)}x₂ ${formatSigned(weights.bias, 1)} = 0`}
              </div>
            </div>
            <div className="bg-zinc-900 px-3 py-2">
              <div className="text-[9px] text-zinc-500">
                {t.hudSlope} · {t.hudNormal}
              </div>
              <div>
                <span className="text-amber-400">{slope}</span>
                <span className="text-zinc-600"> · </span>
                <span className="text-sky-400">{formatNumber(norm)}</span>
              </div>
            </div>
          </>
        )}
        <div className="bg-zinc-900 px-3 py-2 col-span-2 md:col-span-1">
          <div className="text-[9px] text-zinc-500">{t.hudProbe}</div>
          <div className={`truncate ${probe ? 'text-white' : 'text-zinc-600'}`}>{probeText}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-2 bg-zinc-900/90 border-t border-zinc-800 text-[10px] font-mono text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-crt-green" />
          {t.legendTarget1}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-crt-red" />
          {t.legendTarget0}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border-2 border-dashed border-amber-500" />
          {t.legendWrong}
        </span>
        {activeMlp ? (
          <span>▦ {t.legendRegion}</span>
        ) : (
          <>
            <span className="text-sky-400">→ {t.legendNormal}</span>
            <span>▨ {t.legendHalf}</span>
            {trail.length > 0 && <span>┄ {t.legendTrail}</span>}
          </>
        )}
      </div>
      <p className="px-4 pb-2 bg-zinc-900/90 text-[10px] font-mono text-zinc-500">{t.oscilloscopeHint}</p>
    </section>
  );
}
