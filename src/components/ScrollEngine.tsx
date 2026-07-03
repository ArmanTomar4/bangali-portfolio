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
        duration: 1.1,
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
      scrub: reduced ? true : 1.1,
      snap: reduced
        ? undefined
        : {
            snapTo: [0, 0.25, 0.5, 0.75, 1.0],
            duration: { min: 0.7, max: 1.1 },
            delay: 0.06,
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

    // Note: no explicit visibilitychange pause — the browser suspends rAF in
    // hidden tabs, which stops the gsap ticker (and with it lenis) already.
    // An explicit lenis.stop() here can wedge scrolling if the tab is hidden
    // during load and the matching start() never fires.

    return () => {
      st.kill();
      if (raf) gsap.ticker.remove(raf);
      lenis?.destroy();
    };
  }, [reduced, registerGoTo]);

  return null;
}
