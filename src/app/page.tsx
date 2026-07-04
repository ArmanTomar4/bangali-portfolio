"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import ScrollEngine from "@/components/ScrollEngine";
import SectionText from "@/components/SectionText";
import ConstellationLabel from "@/components/ConstellationLabel";
import StarTooltip from "@/components/StarTooltip";
import ProgressDots from "@/components/ProgressDots";
import UIOverlay from "@/components/UIOverlay";
import FallbackUniverse from "@/components/FallbackUniverse";
import { progressToSection, type HoverInfo } from "@/data/constellations";

const UniverseCanvas = dynamic(() => import("@/components/UniverseCanvas"), {
  ssr: false,
  loading: () => (
    <div style={{ background: "#03030a", width: "100vw", height: "100vh" }} />
  ),
});

const HINT_KEY = "ac-scrolled";

function Experience() {
  const progressRef = useRef(0);
  const sectionRef = useRef(0);
  const [section, setSection] = useState(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const hintDismissed = useRef(true);
  const goToFn = useRef<(i: number) => void>(() => {});
  const vignetteRef = useRef<HTMLDivElement>(null);
  const firstSection = useRef(true);

  const onProgress = useCallback((p: number) => {
    progressRef.current = p;
    if (!hintDismissed.current && p > 0.02) {
      hintDismissed.current = true;
      try {
        sessionStorage.setItem(HINT_KEY, "1");
      } catch {}
      setHintVisible(false);
    }
    const idx = progressToSection(p);
    const cur = sectionRef.current;
    if (idx !== cur) {
      // hysteresis: commit only once the boundary is crossed by a margin,
      // so slow scrolling near a boundary can't flip sections back and forth
      const boundary = idx > cur ? cur / 4 + 0.125 : cur / 4 - 0.125;
      if (Math.abs(p - boundary) > 0.012) {
        sectionRef.current = idx;
        setSection(idx);
      }
    }
  }, []);

  const registerGoTo = useCallback((fn: (i: number) => void) => {
    goToFn.current = fn;
  }, []);

  const goTo = useCallback((i: number) => {
    goToFn.current(Math.max(0, Math.min(4, i)));
  }, []);

  // environment: mobile, reduced motion, hint flag, input listeners
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const rmq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMobile = () => setIsMobile(mq.matches);
    const syncReduced = () => setReduced(rmq.matches);
    syncMobile();
    syncReduced();
    mq.addEventListener("change", syncMobile);
    rmq.addEventListener("change", syncReduced);

    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(HINT_KEY) === "1";
    } catch {}
    hintDismissed.current = dismissed;
    setHintVisible(!dismissed);

    const onMouse = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", onMouse);

    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      mouseRef.current.x = Math.max(-1, Math.min(1, e.gamma / 30));
      mouseRef.current.y = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
    };
    window.addEventListener("deviceorientation", onOrient);

    return () => {
      mq.removeEventListener("change", syncMobile);
      rmq.removeEventListener("change", syncReduced);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("deviceorientation", onOrient);
    };
  }, []);

  // travel vignette + clear any hover when leaving a section
  useEffect(() => {
    setHover(null);
    if (firstSection.current) {
      firstSection.current = false;
      return;
    }
    if (reduced || !vignetteRef.current) return;
    const tl = gsap.timeline();
    tl.to(vignetteRef.current, { opacity: 0.3, duration: 0.4, delay: 0.5 });
    tl.to(vignetteRef.current, { opacity: 0, duration: 0.5 });
    return () => {
      tl.kill();
    };
  }, [section, reduced]);

  return (
    <div
      id="scroll-container"
      style={{ height: "100svh", overflow: "hidden" }}
    >
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <UniverseCanvas
          section={section}
          progressRef={progressRef}
          mouseRef={mouseRef}
          onHover={setHover}
          isMobile={isMobile}
          reduced={reduced}
        />
      </div>

      {/* travel vignette */}
      <div
        ref={vignetteRef}
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 5,
          pointerEvents: "none",
          opacity: 0,
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0) 100%)",
        }}
      />

      <UIOverlay
        section={section}
        goTo={goTo}
        isMobile={isMobile}
        reduced={reduced}
        hintVisible={hintVisible}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <SectionText section={section} isMobile={isMobile} reduced={reduced} />
        <ConstellationLabel
          section={section}
          isMobile={isMobile}
          reduced={reduced}
        />
        <StarTooltip hover={hover} isMobile={isMobile} />
      </div>
      <ProgressDots section={section} goTo={goTo} isMobile={isMobile} />

      <ScrollEngine
        reduced={reduced}
        onProgress={onProgress}
        registerGoTo={registerGoTo}
      />
    </div>
  );
}

export default function Page() {
  const [webgl, setWebgl] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      setWebgl(!!(c.getContext("webgl2") || c.getContext("webgl")));
    } catch {
      setWebgl(false);
    }
  }, []);

  if (webgl === null) {
    return (
      <div style={{ background: "#03030a", width: "100vw", height: "100vh" }} />
    );
  }
  if (!webgl) return <FallbackUniverse />;
  return <Experience />;
}
