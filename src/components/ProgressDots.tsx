"use client";

import { motion } from "framer-motion";
import { SECTIONS } from "@/data/constellations";

interface Props {
  section: number;
  goTo: (i: number) => void;
  isMobile: boolean;
}

export default function ProgressDots({ section, goTo, isMobile }: Props) {
  return (
    <div
      style={{
        position: "fixed",
        zIndex: 10,
        display: "flex",
        pointerEvents: "auto",
        ...(isMobile
          ? {
              right: "16px",
              bottom: "18px",
              flexDirection: "row",
              gap: "14px",
            }
          : {
              left: "28px",
              top: "50%",
              transform: "translateY(-50%)",
              flexDirection: "column",
              gap: "16px",
            }),
      }}
    >
      {SECTIONS.map((s, i) => {
        const active = i === section;
        return (
          <motion.button
            key={s.id}
            aria-label={`Go to ${s.id}`}
            onClick={() => goTo(i)}
            whileHover={{ scale: 1.2 }}
            animate={{ scale: active ? 1.3 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            style={{
              width: active ? "6px" : "5px",
              height: active ? "6px" : "5px",
              borderRadius: "50%",
              background: active
                ? "rgba(127,119,221,0.75)"
                : "rgba(255,255,255,0.12)",
              border: "none",
              padding: 0,
              cursor: "pointer",
              transition: "background 0.4s",
            }}
          />
        );
      })}
    </div>
  );
}
