"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CTA_LABELS,
  NodeDatum,
} from "./data";

type Props = {
  node: NodeDatum | null;
  onClose: () => void;
};

export default function Panel({ node, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isMobileRef = useRef(false);

  // open animation when node becomes non-null
  useEffect(() => {
    if (!node || !panelRef.current || !overlayRef.current) return;

    isMobileRef.current =
      typeof window !== "undefined" && window.innerWidth < 768;
    const mobile = isMobileRef.current;
    const fromVar = mobile ? { yPercent: 100 } : { xPercent: 100 };
    const toVar = mobile ? { yPercent: 0 } : { xPercent: 0 };

    gsap.set(panelRef.current, fromVar);
    gsap.set(overlayRef.current, { opacity: 0, pointerEvents: "auto" });

    const tl = gsap.timeline();
    tl.to(overlayRef.current, {
      opacity: 1,
      duration: 0.25,
      ease: "power2.out",
    });
    tl.to(
      panelRef.current,
      {
        ...toVar,
        duration: 0.38,
        ease: "expo.out",
      },
      "<",
    );
  }, [node]);

  // escape key + outside click handled via overlay
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    if (!panelRef.current || !overlayRef.current) {
      onClose();
      return;
    }
    const mobile = isMobileRef.current;
    const exitVar = mobile ? { yPercent: 100 } : { xPercent: 100 };
    const tl = gsap.timeline({
      onComplete: () => {
        onClose();
      },
    });
    tl.to(panelRef.current, {
      ...exitVar,
      duration: 0.3,
      ease: "expo.out",
    });
    tl.to(
      overlayRef.current,
      {
        opacity: 0,
        duration: 0.2,
        ease: "power2.in",
      },
      "<",
    );
  };

  if (!node) return null;

  const color = CATEGORY_COLORS[node.category];
  const catLabel = CATEGORY_LABELS[node.category];
  const cta = CTA_LABELS[node.category];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-30"
      style={{ pointerEvents: "none" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        ref={panelRef}
        className="panel-will-change fixed
          md:right-0 md:top-0 md:bottom-0 md:w-[300px] md:h-full md:rounded-none
          right-0 bottom-0 w-full h-[65vh] rounded-t-2xl md:rounded-t-none
          flex flex-col"
        style={{
          background: "#06060f",
          borderLeft: "0.5px solid rgba(127,119,221,0.2)",
          borderTop: "0.5px solid rgba(127,119,221,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* mobile drag handle */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div
            className="rounded-full"
            style={{
              width: 32,
              height: 3,
              background: "rgba(255,255,255,0.15)",
            }}
          />
        </div>

        <div className="panel-scroll flex-1 overflow-y-auto px-8 py-8 md:py-10">
          <div className="flex items-center justify-between">
            <span
              className="font-mono uppercase rounded-full"
              style={{
                background: `${color}1A`,
                color: `${color}CC`,
                fontSize: 10,
                letterSpacing: 1.5,
                padding: "4px 10px",
              }}
            >
              {catLabel}
            </span>
            <button
              type="button"
              onClick={handleClose}
              aria-label="close"
              className="text-white/30 hover:text-white/80 transition-colors"
              style={{ fontSize: 18, lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          <h2
            className="mt-4"
            style={{
              fontSize: 22,
              fontWeight: 300,
              color: "#e8e6ff",
              lineHeight: 1.2,
            }}
          >
            {node.title}
          </h2>

          <div
            className="my-4"
            style={{
              height: 1,
              background: "rgba(127,119,221,0.12)",
            }}
          />

          {node.desc && (
            <p
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.8,
                fontWeight: 400,
              }}
            >
              {node.desc}
            </p>
          )}

          {node.tags && node.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-[6px]">
              {node.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono px-2 py-[2px] rounded-full"
                  style={{
                    fontSize: 10,
                    color: `${color}b3`,
                    border: `0.5px solid ${color}40`,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {node.link && cta && (
            <div className="mt-10">
              <a
                href={node.link}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono inline-block"
                style={{
                  color,
                  fontSize: 11,
                  letterSpacing: 1,
                  borderBottom: `0.5px dotted ${color}66`,
                  paddingBottom: 2,
                }}
              >
                {cta}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
