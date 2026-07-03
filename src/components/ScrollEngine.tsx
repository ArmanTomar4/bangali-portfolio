"use client";

import { useEffect, useRef } from "react";
import Lenis from "@studio-freight/lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface Props {
  reduced: boolean;
  onProgress: (p: number) => void;
  registerGoTo: (fn: (i: number) => void) => void;
}

export default function ScrollEngine({ reduced, onProgress, registerGoTo }: Props) {
  const progressCb = useRef(onProgress);
  progressCb.current = onProgress;

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    let lenis: Lenis | null = null;
    let raf: ((time: number) => void) | null = null;

    if (!reduced) {
      lenis = new Lenis({
        duration: 1.4,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 0.7,
        touchMultiplier: 1.2,
      });
      lenis.on("scroll", ScrollTrigger.update);
      raf = (time: number) => lenis!.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
    }

    const st = ScrollTrigger.create({
      trigger: "#scroll-container",
      start: "top top",
      end: "bottom bottom",
      scrub: reduced ? true : 1.4,
      snap: reduced
        ? undefined
        : {
            snapTo: [0, 0.25, 0.5, 0.75, 1.0],
            duration: { min: 0.9, max: 1.5 },
            delay: 0.08,
            ease: "power3.inOut",
          },
      onUpdate: (self) => progressCb.current(self.progress),
    });

    registerGoTo((i: number) => {
      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      const y = (i / 4) * max;
      if (lenis) {
        lenis.scrollTo(y, {
          duration: 1.8,
          easing: (t) => 1 - Math.pow(1 - t, 3),
        });
      } else {
        window.scrollTo({ top: y });
      }
    });

    const onVisibility = () => {
      if (!lenis) return;
      if (document.hidden) lenis.stop();
      else lenis.start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      st.kill();
      if (raf) gsap.ticker.remove(raf);
      lenis?.destroy();
    };
  }, [reduced, registerGoTo]);

  return null;
}
