"use client";

import { AnimatePresence, motion } from "framer-motion";
import { SECTIONS } from "@/data/constellations";

interface Props {
  section: number;
  isMobile: boolean;
  reduced: boolean;
}

/**
 * Star-atlas style nameplate under the current constellation — its name,
 * meaning, and star count. Fades in once the pattern has traced itself.
 */
export default function ConstellationLabel({ section, isMobile, reduced }: Props) {
  const data = SECTIONS[section];
  const c = data.constellation;
  const stars = c ? c.nodes.length - (isMobile ? 2 : 0) : 0;

  // anchor under the constellation cluster (which is centred in the upper
  // third on mobile)
  const left = isMobile ? "50%" : `${(c?.cx ?? 0.5) * 100}%`;
  const top = isMobile
    ? "calc(30% + 105px)"
    : `calc(${(c?.cy ?? 0.5) * 100}% + 138px)`;

  return (
    <AnimatePresence mode="wait">
      {c && (
        <motion.div
          key={data.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { delay: reduced ? 0 : 1.7, duration: reduced ? 0 : 0.7 },
          }}
          exit={{
            opacity: 0,
            transition: { duration: reduced ? 0 : 0.25 },
          }}
          style={{
            position: "absolute",
            left,
            top,
            transform: "translateX(-50%)",
            textAlign: "center",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: "11px",
              letterSpacing: "5px",
              textTransform: "uppercase",
              color: data.palette.textAccent,
              opacity: 0.85,
            }}
          >
            {c.name}
          </div>
          <div
            style={{
              fontFamily: "var(--font-space-grotesk)",
              fontWeight: 300,
              fontSize: "11px",
              letterSpacing: "1px",
              color: "rgba(255,255,255,0.3)",
              marginTop: "5px",
            }}
          >
            “{c.meaning}” &nbsp;·&nbsp; {stars} stars
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
