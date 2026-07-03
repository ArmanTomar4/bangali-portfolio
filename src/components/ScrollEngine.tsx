"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Observer } from "gsap/Observer";

interface Props {
  reduced: boolean;
  onProgress: (p: number) => void;
  registerGoTo: (fn: (i: number) => void) => void;
}

const SECTION_COUNT = 5;
const MAX_P = SECTION_COUNT - 1;

/**
 * Discrete section paging via GSAP Observer — there is no real scrolling.
 * One wheel flick / swipe / keypress advances exactly one section; the camera
 * makes a single committed flight (power2.inOut) and further input is ignored
 * until the destination's arrival animation has played out, so fast scrolling
 * can never skip through sections.
 */
export default function ScrollEngine({ reduced, onProgress, registerGoTo }: Props) {
  const cb = useRef(onProgress);
  cb.current = onProgress;

  useEffect(() => {
    gsap.registerPlugin(Observer);

    const state = { v: 0 };
    let index = 0;
    let tween: gsap.core.Tween | null = null;
    let lockUntil = 0;

    const goTo = (i: number) => {
      const target = Math.max(0, Math.min(MAX_P, i));
      if (target === index) return;
      index = target;
      // synchronous, render-independent hook for e2e tests
      document.documentElement.dataset.section = String(target);
      tween?.kill();
      const dist = Math.abs(target / MAX_P - state.v);
      // ≈1.25s per hop, longer (capped) for multi-section jumps
      const duration = reduced ? 0 : gsap.utils.clamp(1.1, 2.2, 0.7 + dist * 2.2);
      // hold gesture input until travel + arrival animation have played out
      lockUntil = performance.now() + (duration + 1.2) * 1000;
      tween = gsap.to(state, {
        v: target / MAX_P,
        duration,
        ease: "power2.inOut",
        onUpdate: () => cb.current(state.v),
      });
    };

    const step = (dir: 1 | -1) => {
      if (!reduced && performance.now() < lockUntil) return;
      goTo(index + dir);
    };

    // GSAP's canonical fullpage mapping: touch swipe-up accumulates a
    // negative delta (onUp) while wheel-down accumulates a positive one, so
    // wheelSpeed -1 inverts wheel to match touch — advance is always onUp.
    const observer = Observer.create({
      type: "wheel,touch",
      wheelSpeed: -1,
      tolerance: 10,
      debounce: false, // react on the event itself, not the next rAF
      preventDefault: true,
      onDown: () => step(-1),
      onUp: () => step(1),
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "Home") {
        e.preventDefault();
        goTo(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goTo(MAX_P);
      }
    };
    window.addEventListener("keydown", onKey);

    registerGoTo(goTo);
    cb.current(0);

    return () => {
      window.removeEventListener("keydown", onKey);
      observer.kill();
      tween?.kill();
    };
  }, [reduced, registerGoTo]);

  return null;
}
