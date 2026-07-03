"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { HoverInfo } from "@/data/constellations";

interface Props {
  hover: HoverInfo | null;
  isMobile: boolean;
}

export default function StarTooltip({ hover, isMobile }: Props) {
  let left = 0;
  let top = 0;
  if (hover && typeof window !== "undefined" && !isMobile) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    left = hover.x + 18;
    if (hover.x > w - 240) left = hover.x - 18 - 220; // flip left near right edge
    top = hover.y - 40;
    if (hover.y < 120) top = hover.y + 24; // flip below near top edge
    top = Math.min(Math.max(top, 16), h - 200);
  }

  const card = (node: NonNullable<Props["hover"]>) => (
    <div
      style={{
        background: "rgba(6, 5, 18, 0.92)",
        border: "0.5px solid rgba(127, 119, 221, 0.35)",
        borderRadius: "12px",
        padding: "14px 18px",
        minWidth: "160px",
        maxWidth: isMobile ? "none" : "210px",
        willChange: "transform",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: "10px",
          color: node.accent,
          letterSpacing: "2px",
          textTransform: "uppercase",
          marginBottom: "5px",
        }}
      >
        {node.node.label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-space-grotesk)",
          fontWeight: 500,
          fontSize: "15px",
          color: "#e8e6ff",
          marginBottom: "4px",
        }}
      >
        {node.node.name}
      </div>
      <div
        style={{
          fontFamily: "var(--font-space-grotesk)",
          fontSize: "12px",
          color: "rgba(255,255,255,0.38)",
          lineHeight: 1.65,
          marginBottom: "10px",
        }}
      >
        {node.node.desc}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
        {node.node.tags.map((t) => (
          <span
            key={t}
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: "10px",
              padding: "2px 8px",
              borderRadius: "99px",
              border: `0.5px solid ${node.accent}44`,
              color: node.accent + "cc",
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {hover &&
        (isMobile ? (
          <motion.div
            key={hover.node.id}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed",
              bottom: "24px",
              left: "50%",
              x: "-50%",
              width: "85vw",
              zIndex: 20,
              pointerEvents: "none",
            }}
          >
            {card(hover)}
          </motion.div>
        ) : (
          <motion.div
            key={hover.node.id}
            initial={{ opacity: 0, scale: 0.9, filter: "blur(8px)", y: 6 }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)", y: -4 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute",
              left,
              top,
              zIndex: 20,
              pointerEvents: "none",
            }}
          >
            {card(hover)}
          </motion.div>
        ))}
    </AnimatePresence>
  );
}
