import type {
  CartesianPoint,
  Classified,
  MLPArchitecture,
  Point2D,
  Weights,
} from '../types/perceptron';
import { mlpForward } from './perceptronEngine';

/** Visible region of the input plane: [-0.5, 1.5] × [-0.5, 1.5]. */
export const VIEW_MIN = -0.5;
export const VIEW_MAX = 1.5;

/**
 * Square plot area inside the canvas. Using ONE scale for both axes preserves
 * angles, so the normal vector w⃗ is drawn truly perpendicular to the boundary.
 */
export interface PlotLayout {
  ox: number;
  oy: number;
  size: number;
}

export type CrtTheme = 'green' | 'amber';

const THEMES: Record<CrtTheme, { bg: string; grid: string; major: string; axis: string; text: string }> = {
  green: {
    bg: '#031208',
    grid: 'rgba(34, 197, 94, 0.12)',
    major: 'rgba(34, 197, 94, 0.30)',
    axis: 'rgba(74, 222, 128, 0.9)',
    text: '#4ade80',
  },
  amber: {
    bg: '#140b02',
    grid: 'rgba(245, 158, 11, 0.12)',
    major: 'rgba(245, 158, 11, 0.30)',
    axis: 'rgba(251, 191, 36, 0.9)',
    text: '#fbbf24',
  },
};

const FONT = '"Share Tech Mono", "JetBrains Mono", monospace';
const EPS = 1e-9;

export function computeLayout(width: number, height: number, padding = 42): PlotLayout {
  const size = Math.max(40, Math.min(width, height) - 2 * padding);
  return { ox: (width - size) / 2, oy: (height - size) / 2, size };
}

const pixelsPerUnit = (L: PlotLayout): number => L.size / (VIEW_MAX - VIEW_MIN);

export function toCanvas(x: number, y: number, L: PlotLayout): { px: number; py: number } {
  const s = pixelsPerUnit(L);
  return { px: L.ox + (x - VIEW_MIN) * s, py: L.oy + L.size - (y - VIEW_MIN) * s };
}

export function fromCanvas(px: number, py: number, L: PlotLayout): CartesianPoint {
  const s = pixelsPerUnit(L);
  return { x: VIEW_MIN + (px - L.ox) / s, y: VIEW_MIN + (L.oy + L.size - py) / s };
}

export const isInsideView = (p: CartesianPoint): boolean =>
  p.x >= VIEW_MIN && p.x <= VIEW_MAX && p.y >= VIEW_MIN && p.y <= VIEW_MAX;

/** Clips the line w₁x₁ + w₂x₂ + b = 0 to the visible square (handles vertical lines when w₂ → 0). */
export function getBoundarySegment(w: Weights): { a: CartesianPoint; b: CartesianPoint } | null {
  const { w1, w2, bias } = w;
  if (Math.abs(w1) < EPS && Math.abs(w2) < EPS) return null;

  const pts: CartesianPoint[] = [];
  const tol = 1e-7;
  const add = (x: number, y: number) => {
    if (x < VIEW_MIN - tol || x > VIEW_MAX + tol || y < VIEW_MIN - tol || y > VIEW_MAX + tol) return;
    if (pts.some((p) => Math.hypot(p.x - x, p.y - y) < 1e-6)) return;
    pts.push({ x, y });
  };

  if (Math.abs(w2) > EPS) {
    add(VIEW_MIN, -(bias + w1 * VIEW_MIN) / w2);
    add(VIEW_MAX, -(bias + w1 * VIEW_MAX) / w2);
  }
  if (Math.abs(w1) > EPS) {
    add(-(bias + w2 * VIEW_MIN) / w1, VIEW_MIN);
    add(-(bias + w2 * VIEW_MAX) / w1, VIEW_MAX);
  }
  if (pts.length < 2) return null;

  let best: [CartesianPoint, CartesianPoint] = [pts[0], pts[1]];
  let bestDist = -1;
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
      if (d > bestDist) {
        bestDist = d;
        best = [pts[i], pts[j]];
      }
    }
  }
  return { a: best[0], b: best[1] };
}

/** Sutherland–Hodgman clip of the half-plane {z ≥ 0} against the visible square. */
export function getPositiveHalfSpacePolygon(w: Weights): CartesianPoint[] {
  const square: CartesianPoint[] = [
    { x: VIEW_MIN, y: VIEW_MIN },
    { x: VIEW_MAX, y: VIEW_MIN },
    { x: VIEW_MAX, y: VIEW_MAX },
    { x: VIEW_MIN, y: VIEW_MAX },
  ];
  const z = (p: CartesianPoint) => w.w1 * p.x + w.w2 * p.y + w.bias;
  if (Math.abs(w.w1) < EPS && Math.abs(w.w2) < EPS) return w.bias >= 0 ? square : [];

  const out: CartesianPoint[] = [];
  for (let i = 0; i < square.length; i++) {
    const cur = square[i];
    const prev = square[(i + square.length - 1) % square.length];
    const zc = z(cur);
    const zp = z(prev);
    const cross = (): CartesianPoint => {
      const t = zp / (zp - zc);
      return { x: prev.x + t * (cur.x - prev.x), y: prev.y + t * (cur.y - prev.y) };
    };
    if (zc >= 0) {
      if (zp < 0) out.push(cross());
      out.push(cur);
    } else if (zp >= 0) {
      out.push(cross());
    }
  }
  return out;
}

export function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, L: PlotLayout, theme: CrtTheme): void {
  const c = THEMES[theme];
  ctx.save();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.6);
  glow.addColorStop(0, theme === 'green' ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  const topLeft = toCanvas(VIEW_MIN, VIEW_MAX, L);
  const bottomRight = toCanvas(VIEW_MAX, VIEW_MIN, L);

  for (let i = 0; i <= 8; i++) {
    const v = VIEW_MIN + i * 0.25;
    const major = Math.abs(v - Math.round(v * 2) / 2) < 1e-6;
    ctx.strokeStyle = major ? c.major : c.grid;
    ctx.lineWidth = major ? 1 : 0.7;
    ctx.setLineDash(major ? [] : [2, 4]);
    const { px } = toCanvas(v, 0, L);
    const { py } = toCanvas(0, v, L);
    ctx.beginPath();
    ctx.moveTo(px, topLeft.py);
    ctx.lineTo(px, bottomRight.py);
    ctx.moveTo(topLeft.px, py);
    ctx.lineTo(bottomRight.px, py);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Unit square — the Boolean world
  const u0 = toCanvas(0, 0, L);
  const u1 = toCanvas(1, 1, L);
  ctx.strokeStyle = c.major;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(u0.px, u1.py, u1.px - u0.px, u0.py - u1.py);
  ctx.setLineDash([]);

  // Axes
  const o = toCanvas(0, 0, L);
  ctx.strokeStyle = c.axis;
  ctx.fillStyle = c.axis;
  ctx.lineWidth = 1.6;
  ctx.shadowColor = c.axis;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(topLeft.px, o.py);
  ctx.lineTo(bottomRight.px + 12, o.py);
  ctx.moveTo(o.px, bottomRight.py);
  ctx.lineTo(o.px, topLeft.py - 12);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bottomRight.px + 16, o.py);
  ctx.lineTo(bottomRight.px + 8, o.py - 4);
  ctx.lineTo(bottomRight.px + 8, o.py + 4);
  ctx.moveTo(o.px, topLeft.py - 16);
  ctx.lineTo(o.px - 4, topLeft.py - 8);
  ctx.lineTo(o.px + 4, topLeft.py - 8);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = c.text;
  ctx.font = `10px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  [0.5, 1].forEach((v) => ctx.fillText(v.toFixed(1), toCanvas(v, 0, L).px, o.py + 5));
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  [0.5, 1].forEach((v) => ctx.fillText(v.toFixed(1), o.px - 6, toCanvas(0, v, L).py));
  ctx.font = `bold 13px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText('x₁', bottomRight.px + 4, o.py - 14);
  ctx.fillText('x₂', o.px + 8, topLeft.py - 10);
  ctx.restore();
}

export function drawPolygon(ctx: CanvasRenderingContext2D, poly: CartesianPoint[], L: PlotLayout, fill: string): void {
  if (poly.length < 3) return;
  ctx.save();
  ctx.beginPath();
  poly.forEach((p, i) => {
    const c = toCanvas(p.x, p.y, L);
    if (i === 0) ctx.moveTo(c.px, c.py);
    else ctx.lineTo(c.px, c.py);
  });
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

export function drawBoundary(
  ctx: CanvasRenderingContext2D,
  w: Weights,
  L: PlotLayout,
  color: string,
  label: string | null,
  lineWidth = 2.6,
): void {
  const seg = getBoundarySegment(w);
  if (!seg) return;
  const a = toCanvas(seg.a.x, seg.a.y, L);
  const b = toCanvas(seg.b.x, seg.b.y, L);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(a.px, a.py);
  ctx.lineTo(b.px, b.py);
  ctx.stroke();
  // second pass = hot phosphor core
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = Math.max(0.8, lineWidth / 3);
  ctx.stroke();

  if (label) {
    const lx = a.px + (b.px - a.px) * 0.18;
    const ly = a.py + (b.py - a.py) * 0.18;
    ctx.font = `bold 11px ${FONT}`;
    ctx.fillStyle = color;
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(label, lx + 6, ly - 6);
  }
  ctx.restore();
}

/** Faded previous boundaries — makes the learning dynamics visible. */
export function drawTrail(ctx: CanvasRenderingContext2D, trail: Weights[], L: PlotLayout, color: string): void {
  const n = trail.length;
  trail.forEach((w, i) => {
    const seg = getBoundarySegment(w);
    if (!seg) return;
    const a = toCanvas(seg.a.x, seg.a.y, L);
    const b = toCanvas(seg.b.x, seg.b.y, L);
    ctx.save();
    ctx.globalAlpha = 0.06 + 0.32 * ((i + 1) / n);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(a.px, a.py);
    ctx.lineTo(b.px, b.py);
    ctx.stroke();
    ctx.restore();
  });
}

/**
 * Normal vector w⃗ drawn from the midpoint of the visible boundary segment,
 * with a right-angle marker proving w⃗ ⟂ boundary.
 */
export function drawNormalVector(ctx: CanvasRenderingContext2D, w: Weights, L: PlotLayout): void {
  const seg = getBoundarySegment(w);
  const mag = Math.hypot(w.w1, w.w2);
  if (!seg || mag < EPS) return;

  const ux = w.w1 / mag;
  const uy = w.w2 / mag;
  const mx = (seg.a.x + seg.b.x) / 2;
  const my = (seg.a.y + seg.b.y) / 2;
  const len = 0.34;
  const start = toCanvas(mx, my, L);
  const end = toCanvas(mx + ux * len, my + uy * len, L);
  const color = '#38bdf8';

  ctx.save();
  // right-angle marker
  const m = 0.055;
  const tx = -uy;
  const ty = ux;
  const p1 = toCanvas(mx + tx * m, my + ty * m, L);
  const p2 = toCanvas(mx + tx * m + ux * m, my + ty * m + uy * m, L);
  const p3 = toCanvas(mx + ux * m, my + uy * m, L);
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.85)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(p1.px, p1.py);
  ctx.lineTo(p2.px, p2.py);
  ctx.lineTo(p3.px, p3.py);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.6;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(start.px, start.py);
  ctx.lineTo(end.px, end.py);
  ctx.stroke();

  const angle = Math.atan2(end.py - start.py, end.px - start.px);
  const head = 11;
  ctx.beginPath();
  ctx.moveTo(end.px, end.py);
  ctx.lineTo(end.px - head * Math.cos(angle - Math.PI / 7), end.py - head * Math.sin(angle - Math.PI / 7));
  ctx.lineTo(end.px - head * Math.cos(angle + Math.PI / 7), end.py - head * Math.sin(angle + Math.PI / 7));
  ctx.closePath();
  ctx.fill();

  ctx.shadowColor = '#000';
  ctx.shadowBlur = 4;
  ctx.font = `bold 12px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('w⃗', end.px + Math.cos(angle) * 14, end.py + Math.sin(angle) * 14);
  ctx.restore();
}

/** Raster shading of the region where the 2-2-1 network outputs 1. */
export function drawMLPRegion(ctx: CanvasRenderingContext2D, arch: MLPArchitecture, L: PlotLayout, fill: string): void {
  const step = 4;
  ctx.save();
  ctx.fillStyle = fill;
  for (let py = L.oy; py < L.oy + L.size; py += step) {
    for (let px = L.ox; px < L.ox + L.size; px += step) {
      const p = fromCanvas(px + step / 2, py + step / 2, L);
      if (mlpForward(arch, p.x, p.y).predicted === 1) ctx.fillRect(px, py, step, step);
    }
  }
  ctx.restore();
}

export function drawBeacons(
  ctx: CanvasRenderingContext2D,
  points: Point2D[],
  classified: Classified[],
  selected: Point2D | null,
  L: PlotLayout,
  time: number,
): void {
  points.forEach((pt, index) => {
    const c = toCanvas(pt.x1, pt.x2, L);
    const ok = classified.find((r) => r.x1 === pt.x1 && r.x2 === pt.x2)?.isCorrect ?? true;
    const isSel = selected !== null && selected.x1 === pt.x1 && selected.x2 === pt.x2;
    const core = pt.target === 1 ? '#22c55e' : '#ef4444';
    const ring = ok ? '#22c55e' : '#f59e0b';
    const pulse = Math.sin(time * 0.005 + index * 1.5);

    ctx.save();
    // Classification ring: solid & calm when correct, dashed & rotating when wrong
    ctx.strokeStyle = isSel ? '#ffffff' : ring;
    ctx.shadowColor = ring;
    ctx.shadowBlur = isSel ? 18 : 10;
    ctx.lineWidth = isSel ? 2.5 : ok ? 1.5 : 2.2;
    if (!ok) {
      ctx.setLineDash([4, 4]);
      ctx.lineDashOffset = -time * 0.02;
    }
    const r = (isSel ? 21 : 15) + (ok ? pulse * 1.5 : pulse * 4);
    ctx.beginPath();
    ctx.arc(c.px, c.py, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    if (isSel) {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(c.px, c.py, r + 7, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = core;
    ctx.shadowColor = core;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(c.px, c.py, isSel ? 8 : 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(c.px, c.py, 2.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `${isSel ? 'bold ' : ''}11px ${FONT}`;
    ctx.fillStyle = '#e4e4e7';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.textAlign = pt.x1 === 1 ? 'left' : 'right';
    ctx.textBaseline = 'middle';
    const dx = pt.x1 === 1 ? 20 : -20;
    const dy = pt.x2 === 1 ? -14 : 14;
    ctx.fillText(`(${pt.x1},${pt.x2}) y*=${pt.target}`, c.px + dx, c.py + dy);
    ctx.restore();
  });
}

export function drawProbe(
  ctx: CanvasRenderingContext2D,
  probe: CartesianPoint,
  output: 0 | 1,
  L: PlotLayout,
): void {
  const c = toCanvas(probe.x, probe.y, L);
  const tl = toCanvas(VIEW_MIN, VIEW_MAX, L);
  const br = toCanvas(VIEW_MAX, VIEW_MIN, L);
  const color = output === 1 ? 'rgba(134, 239, 172, 0.55)' : 'rgba(252, 165, 165, 0.55)';
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.moveTo(tl.px, c.py);
  ctx.lineTo(br.px, c.py);
  ctx.moveTo(c.px, tl.py);
  ctx.lineTo(c.px, br.py);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = output === 1 ? '#86efac' : '#fca5a5';
  ctx.beginPath();
  ctx.arc(c.px, c.py, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
