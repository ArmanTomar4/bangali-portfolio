"use client";

import { useEffect, useRef, useState } from "react";
import {
  ANCHOR,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  NodeDatum,
  PROJECTS,
  RESEARCH,
  SKILLS,
} from "./data";

type LiveNode = {
  data: NodeDatum;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  hover: number; // 0..1
  dim: number; // 0..1
  color: string;
  rgb: [number, number, number];
};

type Star = {
  x: number;
  y: number;
  r: number;
  base: number;
  phase: number;
  speed: number;
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const v = parseInt(
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h,
    16,
  );
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

const CONNECT_DIST = 140;
const SYNAPSE_DIST = 60;

type Props = {
  onNodeClick: (node: NodeDatum) => void;
  selectedId: string | null;
};

export default function Universe({ onNodeClick, selectedId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<LiveNode[]>([]);
  const starsRef = useRef<Star[]>([]);
  const starCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const mouseRef = useRef({ x: 0, y: 0, hasMoved: false });
  const parallaxRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const hoveredIdRef = useRef<string | null>(null);
  const lastTapIdRef = useRef<string | null>(null);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1, isMobile: false });

  const [tooltipNode, setTooltipNode] = useState<LiveNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{
    x: number;
    y: number;
    flip: boolean;
  }>({ x: 0, y: 0, flip: false });

  // keep latest selectedId accessible inside the rAF loop
  const selectedIdRef = useRef<string | null>(selectedId);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const isMobile =
      typeof window !== "undefined" && window.innerWidth < 768;
    sizeRef.current.isMobile = isMobile;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      sizeRef.current = {
        w,
        h,
        dpr,
        isMobile: w < 768,
      };
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStars();
    };

    // --- build stars (cached to offscreen canvas) ---
    const buildStars = () => {
      const { w, h } = sizeRef.current;
      const count = 150;
      const stars: Star[] = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: rand(0, w),
          y: rand(0, h),
          r: rand(0.2, 1.4),
          base: rand(0.1, 0.7),
          phase: rand(0, Math.PI * 2),
          speed: rand(0.4, 1.4),
        });
      }
      starsRef.current = stars;

      // we don't fully bake here because stars twinkle.
      // instead we redraw stars to an offscreen canvas each frame at low cost (150 dots).
      // but cache the base positions so we skip math.
      const off = document.createElement("canvas");
      off.width = sizeRef.current.w * sizeRef.current.dpr;
      off.height = sizeRef.current.h * sizeRef.current.dpr;
      starCanvasRef.current = off;
    };

    // --- build nodes ---
    const buildNodes = () => {
      const { w, h, isMobile: mobile } = sizeRef.current;
      const targetCount = mobile ? 16 : 24;
      const pool: NodeDatum[] = [...PROJECTS, ...SKILLS, ...RESEARCH];
      const chosen = mobile
        ? // on mobile pick a balanced 16: top 6 projects, 6 skills, 4 research
          [
            ...PROJECTS.slice(0, 6),
            ...SKILLS.slice(0, 6),
            ...RESEARCH.slice(0, 4),
          ]
        : pool;
      const live: LiveNode[] = [];

      // anchor in the middle (50% w, 45% h)
      const anchorColor = CATEGORY_COLORS.anchor;
      live.push({
        data: ANCHOR,
        x: w * 0.5,
        y: h * 0.45,
        vx: 0,
        vy: 0,
        baseRadius: 10,
        hover: 0,
        dim: 0,
        color: anchorColor,
        rgb: hexToRgb(anchorColor),
      });

      for (let i = 0; i < chosen.length && i < targetCount; i++) {
        const data = chosen[i];
        const color = CATEGORY_COLORS[data.category];
        let radius: number;
        if (data.category === "project") radius = rand(5, 7);
        else if (data.category === "skill") radius = rand(3.5, 5);
        else radius = rand(4, 6);

        // spawn somewhere away from the anchor
        let x = 0,
          y = 0;
        for (let tries = 0; tries < 20; tries++) {
          x = rand(40, w - 40);
          y = rand(40, h - 40);
          const dx = x - w * 0.5;
          const dy = y - h * 0.45;
          if (Math.hypot(dx, dy) > 120) break;
        }
        // mass-based speed: larger nodes slower
        const speed = lerp(0.35, 0.15, (radius - 3.5) / (7 - 3.5));
        const angle = rand(0, Math.PI * 2);
        live.push({
          data,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          baseRadius: radius,
          hover: 0,
          dim: 0,
          color,
          rgb: hexToRgb(color),
        });
      }
      nodesRef.current = live;
    };

    resize();
    buildNodes();

    // --- input handlers ---
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.hasMoved = true;
    };
    const onTouch = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current.x = e.touches[0].clientX;
        mouseRef.current.y = e.touches[0].clientY;
        mouseRef.current.hasMoved = true;
      }
    };
    const onClick = (e: MouseEvent) => {
      handleHit(e.clientX, e.clientY, false);
    };
    const onTap = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      if (!t) return;
      handleHit(t.clientX, t.clientY, true);
    };

    const handleHit = (cx: number, cy: number, isTouch: boolean) => {
      const nodes = nodesRef.current;
      // hit detection accounts for parallax offset
      const offX = parallaxRef.current.x;
      const offY = parallaxRef.current.y;
      let bestIdx = -1;
      let bestDist = Infinity;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const dx = cx - (n.x + offX);
        const dy = cy - (n.y + offY);
        const d = Math.hypot(dx, dy);
        const hitR = n.baseRadius * 3.5;
        if (d < hitR && d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
      if (bestIdx === -1) return;
      const hit = nodes[bestIdx];
      if (hit.data.category === "anchor") return;

      if (isTouch) {
        // mobile: tap once to highlight, twice to open
        if (lastTapIdRef.current === hit.data.id) {
          onNodeClick(hit.data);
          lastTapIdRef.current = null;
        } else {
          hoveredIdRef.current = hit.data.id;
          lastTapIdRef.current = hit.data.id;
          // reset after 2.5s
          setTimeout(() => {
            if (lastTapIdRef.current === hit.data.id) {
              lastTapIdRef.current = null;
            }
          }, 2500);
        }
      } else {
        onNodeClick(hit.data);
      }
    };

    const onResize = () => {
      resize();
      buildNodes();
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("touchstart", onTouch, { passive: true });
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("touchend", onTap);
    window.addEventListener("resize", onResize);

    // --- animation loop ---
    let raf = 0;
    let lastT = performance.now();

    const draw = (now: number) => {
      const dt = Math.min(50, now - lastT); // ms, clamp huge gaps
      lastT = now;
      const dtFrames = dt / 16.6667; // normalize to 60fps frames

      const { w, h, isMobile: mobile } = sizeRef.current;
      const nodes = nodesRef.current;
      const stars = starsRef.current;
      const t = now / 1000;

      // --- update parallax target from mouse ---
      if (!mobile) {
        const nx = (mouseRef.current.x / w - 0.5) * -2; // -1..1, inverted
        const ny = (mouseRef.current.y / h - 0.5) * -2;
        parallaxRef.current.tx = nx * 18;
        parallaxRef.current.ty = ny * 18;
      } else {
        // gentle drift on mobile (no device orientation wiring for now)
        parallaxRef.current.tx = 0;
        parallaxRef.current.ty = 0;
      }
      parallaxRef.current.x = lerp(
        parallaxRef.current.x,
        parallaxRef.current.tx,
        0.04 * dtFrames,
      );
      parallaxRef.current.y = lerp(
        parallaxRef.current.y,
        parallaxRef.current.ty,
        0.04 * dtFrames,
      );

      // --- detect hovered node (desktop) ---
      if (!mobile && mouseRef.current.hasMoved) {
        let bestId: string | null = null;
        let bestDist = Infinity;
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          if (n.data.category === "anchor") continue;
          const dx =
            mouseRef.current.x - (n.x + parallaxRef.current.x);
          const dy =
            mouseRef.current.y - (n.y + parallaxRef.current.y);
          const d = Math.hypot(dx, dy);
          const hitR = n.baseRadius * 3.5;
          if (d < hitR && d < bestDist) {
            bestDist = d;
            bestId = n.data.id;
          }
        }
        hoveredIdRef.current = bestId;
      }

      const hoveredId = hoveredIdRef.current;
      const activeId = selectedIdRef.current || hoveredId;

      // --- update nodes ---
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const isHovered = n.data.id === hoveredId;
        const isActive = n.data.id === activeId;
        // smooth hover/dim
        n.hover = lerp(n.hover, isHovered ? 1 : 0, 0.12 * dtFrames);
        const shouldDim = activeId !== null && !isActive;
        n.dim = lerp(n.dim, shouldDim ? 1 : 0, 0.12 * dtFrames);

        if (n.data.category === "anchor") continue;

        // velocity: slow to 20% when hovered
        const speedScale = lerp(1, 0.2, n.hover);
        n.x += n.vx * speedScale * dtFrames;
        n.y += n.vy * speedScale * dtFrames;

        // bounce off edges
        if (n.x < n.baseRadius || n.x > w - n.baseRadius) {
          n.vx = -n.vx;
          n.x = Math.max(n.baseRadius, Math.min(w - n.baseRadius, n.x));
        }
        if (n.y < n.baseRadius || n.y > h - n.baseRadius) {
          n.vy = -n.vy;
          n.y = Math.max(n.baseRadius, Math.min(h - n.baseRadius, n.y));
        }

        // anchor repulsion (within 90px push away gently)
        const ax = w * 0.5;
        const ay = h * 0.45;
        const dx = n.x - ax;
        const dy = n.y - ay;
        const d = Math.hypot(dx, dy);
        if (d < 90 && d > 0.01) {
          const push = (90 - d) / 90;
          n.vx += (dx / d) * push * 0.08;
          n.vy += (dy / d) * push * 0.08;
          // clamp velocity
          const sp = Math.hypot(n.vx, n.vy);
          const maxSp = 0.6;
          if (sp > maxSp) {
            n.vx = (n.vx / sp) * maxSp;
            n.vy = (n.vy / sp) * maxSp;
          }
        }
      }

      // --- DRAW ---
      ctx.fillStyle = "#04040d";
      ctx.fillRect(0, 0, w, h);

      // stars (parallax half-rate)
      const sOffX = parallaxRef.current.x * 0.5;
      const sOffY = parallaxRef.current.y * 0.5;
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const twinkle =
          s.base + Math.sin(t * s.speed + s.phase) * (s.base * 0.5);
        ctx.beginPath();
        ctx.arc(s.x + sOffX, s.y + sOffY, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232, 230, 255, ${Math.max(0.05, twinkle)})`;
        ctx.fill();
      }

      // connections — build spatial grid
      const cell = CONNECT_DIST;
      const cols = Math.ceil(w / cell) + 1;
      const grid: number[][] = [];
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const cx = Math.floor(n.x / cell);
        const cy = Math.floor(n.y / cell);
        const key = cy * cols + cx;
        if (!grid[key]) grid[key] = [];
        grid[key].push(i);
      }

      const checked = new Set<number>();
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        const cx = Math.floor(a.x / cell);
        const cy = Math.floor(a.y / cell);
        for (let oy = -1; oy <= 1; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            const key = (cy + oy) * cols + (cx + ox);
            const bucket = grid[key];
            if (!bucket) continue;
            for (let k = 0; k < bucket.length; k++) {
              const j = bucket[k];
              if (j <= i) continue;
              const pairKey = i * 1000 + j;
              if (checked.has(pairKey)) continue;
              checked.add(pairKey);
              const b = nodes[j];
              const dx = a.x - b.x;
              const dy = a.y - b.y;
              const d = Math.hypot(dx, dy);
              if (d > CONNECT_DIST) continue;

              const isAActive = a.data.id === activeId;
              const isBActive = b.data.id === activeId;
              const involvesActive = isAActive || isBActive;
              const baseAlpha = (1 - d / CONNECT_DIST) * 0.15;
              const boost = involvesActive ? 4 : 1;
              const dimMul = activeId && !involvesActive ? 0.15 : 1;
              const alpha = baseAlpha * boost * dimMul;
              const width = involvesActive ? 1 : 0.4;

              const cr = (a.rgb[0] + b.rgb[0]) / 2;
              const cg = (a.rgb[1] + b.rgb[1]) / 2;
              const cb = (a.rgb[2] + b.rgb[2]) / 2;

              ctx.beginPath();
              ctx.moveTo(
                a.x + parallaxRef.current.x,
                a.y + parallaxRef.current.y,
              );
              ctx.lineTo(
                b.x + parallaxRef.current.x,
                b.y + parallaxRef.current.y,
              );
              ctx.strokeStyle = `rgba(${cr | 0}, ${cg | 0}, ${cb | 0}, ${alpha})`;
              ctx.lineWidth = width;
              ctx.stroke();

              if (d < SYNAPSE_DIST) {
                ctx.beginPath();
                ctx.arc(
                  (a.x + b.x) / 2 + parallaxRef.current.x,
                  (a.y + b.y) / 2 + parallaxRef.current.y,
                  0.75,
                  0,
                  Math.PI * 2,
                );
                ctx.fillStyle = `rgba(${cr | 0}, ${cg | 0}, ${cb | 0}, ${0.2 * dimMul})`;
                ctx.fill();
              }
            }
          }
        }
      }

      // nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const isActive = n.data.id === activeId;
        const opacity = lerp(1, 0.15, n.dim);
        const radius = n.baseRadius * lerp(1, 1.6, n.hover);
        const x = n.x + parallaxRef.current.x;
        const y = n.y + parallaxRef.current.y;

        if (n.data.category === "anchor") {
          // pulsing outer ring
          const pulse = 0.5 + Math.sin(t * 1.4) * 0.5;
          const ringR = radius + 8 + pulse * 4;
          const g = ctx.createRadialGradient(x, y, radius, x, y, ringR);
          g.addColorStop(0, `rgba(232, 230, 255, ${0.35 * opacity})`);
          g.addColorStop(1, "rgba(232, 230, 255, 0)");
          ctx.beginPath();
          ctx.arc(x, y, ringR, 0, Math.PI * 2);
          ctx.fillStyle = g;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(232, 230, 255, ${opacity})`;
          ctx.fill();
          continue;
        }

        // glow when active/hovered
        if (isActive || n.hover > 0.05) {
          const glowR = radius * 3.5;
          const g = ctx.createRadialGradient(x, y, radius * 0.8, x, y, glowR);
          g.addColorStop(
            0,
            `rgba(${n.rgb[0]}, ${n.rgb[1]}, ${n.rgb[2]}, ${0.35 * Math.max(n.hover, isActive ? 1 : 0)})`,
          );
          g.addColorStop(1, `rgba(${n.rgb[0]}, ${n.rgb[1]}, ${n.rgb[2]}, 0)`);
          ctx.beginPath();
          ctx.arc(x, y, glowR, 0, Math.PI * 2);
          ctx.fillStyle = g;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${n.rgb[0]}, ${n.rgb[1]}, ${n.rgb[2]}, ${opacity})`;
        ctx.fill();
      }

      // --- tooltip position update ---
      if (hoveredId) {
        const n = nodes.find((nn) => nn.data.id === hoveredId);
        if (n && n.data.category !== "anchor") {
          const sx = n.x + parallaxRef.current.x;
          const sy = n.y + parallaxRef.current.y;
          const flip = sx > w - 220;
          setTooltipPos((prev) => {
            if (
              Math.abs(prev.x - sx) < 0.5 &&
              Math.abs(prev.y - sy) < 0.5 &&
              prev.flip === flip
            )
              return prev;
            return { x: sx, y: sy, flip };
          });
          setTooltipNode((prev) => (prev?.data.id === n.data.id ? prev : n));
        }
      } else {
        setTooltipNode((prev) => (prev === null ? prev : null));
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("touchend", onTap);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // tooltip render (DOM, not canvas)
  const visible = tooltipNode !== null && selectedId === null;
  const tip = tooltipNode;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-screen h-screen z-0"
      />

      <div
        ref={tooltipRef}
        className="pointer-events-none fixed z-20 transition-[opacity,transform] duration-200"
        style={{
          left: 0,
          top: 0,
          transform: tip
            ? `translate(${
                tooltipPos.flip
                  ? tooltipPos.x - 16 - 200
                  : tooltipPos.x + 16
              }px, ${tooltipPos.y - 40}px) translateY(${visible ? 0 : 8}px)`
            : "translate(-9999px, -9999px)",
          opacity: visible ? 1 : 0,
          maxWidth: 200,
        }}
      >
        {tip && (
          <div
            className="rounded-xl px-[18px] py-[14px]"
            style={{
              background: "#080818",
              border: "0.5px solid rgba(127,119,221,0.4)",
            }}
          >
            <div
              className="font-mono uppercase"
              style={{
                fontSize: 10,
                letterSpacing: 2,
                color: tip.color,
              }}
            >
              {CATEGORY_LABELS[tip.data.category]}
            </div>
            <div
              className="mt-1"
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: "#e8e6ff",
                lineHeight: 1.25,
              }}
            >
              {tip.data.title}
            </div>
            {tip.data.desc && (
              <div
                className="mt-[3px]"
                style={{
                  fontSize: 12,
                  lineHeight: 1.6,
                  color: "rgba(255,255,255,0.38)",
                  fontWeight: 400,
                }}
              >
                {tip.data.desc}
              </div>
            )}
            {tip.data.tags && tip.data.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-[6px]">
                {tip.data.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono px-2 py-[2px] rounded-full"
                    style={{
                      fontSize: 10,
                      color: `${tip.color}b3`,
                      border: `0.5px solid ${tip.color}40`,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
