"use client";

import { AnimatePresence, motion } from "framer-motion";
import { SECTIONS } from "@/data/constellations";

interface Props {
  section: number;
  isMobile: boolean;
  reduced: boolean;
}

const EXPO_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function SectionText({ section, isMobile, reduced }: Props) {
  const data = SECTIONS[section];
  const base = reduced ? 0 : 1.3; // reveal after the constellation starts materialising
  const d = (extra: number) => (reduced ? 0 : base + extra);
  const dur = (v: number) => (reduced ? 0 : v);

  const side = data.side ?? "center";
  const wrapperStyle: React.CSSProperties = isMobile
    ? {
        // mobile: constellation occupies the upper third, text sits low
        position: "absolute",
        left: "24px",
        right: "24px",
        bottom: "14%",
        textAlign:
          side === "left" ? "right" : side === "right" ? "left" : "center",
      }
    : side === "left"
      ? {
          position: "absolute",
          right: "8%",
          top: "50%",
          transform: "translateY(-50%)",
          textAlign: "right",
          maxWidth: "300px",
        }
      : side === "right"
      ? {
          position: "absolute",
          left: "8%",
          top: "50%",
          transform: "translateY(-50%)",
          textAlign: "left",
          maxWidth: "300px",
        }
      : {
          position: "absolute",
          left: "50%",
          bottom: "15%",
          transform: "translateX(-50%)",
          textAlign: "center",
          maxWidth: "340px",
          width: "max-content",
        };

  return (
    <AnimatePresence mode="wait">
      {data.text && (
        <div key={data.id} style={{ ...wrapperStyle, pointerEvents: "none" }}>
          <motion.div
            exit={{
              opacity: 0,
              filter: "blur(12px)",
              y: -20,
              transition: { duration: dur(0.5), ease: "easeIn" },
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { delay: d(0), duration: dur(0.5) },
              }}
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: "10px",
                color: data.palette.textAccent,
                letterSpacing: "3px",
                textTransform: "uppercase",
                marginBottom: "14px",
              }}
            >
              {data.text.label}
            </motion.div>
            {data.text.title.split("\n").map((line, i) => (
              <motion.div
                key={line}
                initial={{
                  opacity: 0,
                  filter: "blur(12px)",
                  y: 16,
                  letterSpacing: "4px",
                }}
                animate={{
                  opacity: 1,
                  filter: "blur(0px)",
                  y: 0,
                  letterSpacing: "-0.5px",
                  transition: {
                    delay: d(0.08 + i * 0.08),
                    duration: dur(0.7),
                    ease: EXPO_OUT,
                  },
                }}
                style={{
                  fontFamily: "var(--font-space-grotesk)",
                  fontWeight: 300,
                  fontSize: isMobile ? "22px" : "26px",
                  color: "#e8e6ff",
                  lineHeight: 1.2,
                }}
              >
                {line}
              </motion.div>
            ))}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { delay: d(0.28), duration: dur(0.6) },
              }}
              style={{
                fontFamily: "var(--font-space-grotesk)",
                fontWeight: 400,
                fontSize: isMobile ? "12px" : "13px",
                color: "rgba(255,255,255,0.32)",
                lineHeight: 1.85,
                marginTop: "16px",
              }}
            >
              {data.text.body}
            </motion.p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
