"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  IconBrandGithub,
  IconBrandLinkedin,
  IconMail,
} from "@tabler/icons-react";
import { SECTION_IDS } from "@/data/constellations";

interface Props {
  section: number;
  goTo: (i: number) => void;
  isMobile: boolean;
  reduced: boolean;
  hintVisible: boolean;
}

const mono = "var(--font-space-mono)";
const grotesk = "var(--font-space-grotesk)";

function HomeIntro({ section, reduced }: { section: number; reduced: boolean }) {
  return (
    <AnimatePresence>
      {section === 0 && (
        <motion.div
          key="home-intro"
          exit={{
            opacity: 0,
            filter: "blur(12px)",
            y: -20,
            transition: { duration: reduced ? 0 : 0.5, ease: "easeIn" },
          }}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <motion.h1
            initial={{ opacity: 0, filter: "blur(20px)" }}
            animate={{
              opacity: 1,
              filter: "blur(0px)",
              transition: { duration: reduced ? 0 : 1.4, ease: "easeOut" },
            }}
            style={{
              fontFamily: grotesk,
              fontWeight: 300,
              fontSize: "clamp(22px, 4vw, 32px)",
              color: "#e8e6ff",
              letterSpacing: "5px",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            Aranya Chatterjee
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{
              opacity: 1,
              filter: "blur(0px)",
              transition: {
                delay: reduced ? 0 : 0.4,
                duration: reduced ? 0 : 1.2,
                ease: "easeOut",
              },
            }}
            style={{
              fontFamily: mono,
              fontSize: "12px",
              color: "rgba(127,119,221,0.55)",
              letterSpacing: "3px",
              marginTop: "18px",
            }}
          >
            AI / ML Engineer&nbsp;&nbsp;·&nbsp;&nbsp;Researcher
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ScrollHint({ visible, reduced }: { visible: boolean; reduced: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="scroll-hint"
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            transition: { delay: reduced ? 0 : 1.8, duration: 0.8 },
          }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          style={{
            position: "absolute",
            bottom: "32px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              fontFamily: mono,
              fontSize: "10px",
              color: "rgba(255,255,255,0.18)",
              letterSpacing: "2px",
            }}
          >
            scroll to explore
          </span>
          <span className={reduced ? "" : "hint-bounce"} aria-hidden>
            <span className="hint-chevron" />
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function UIOverlay({
  section,
  goTo,
  isMobile,
  reduced,
  hintVisible,
}: Props) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10,
        pointerEvents: "none",
      }}
    >
      <HomeIntro section={section} reduced={reduced} />
      <ScrollHint visible={section === 0 && hintVisible} reduced={reduced} />

      {/* top-left monogram */}
      <div
        style={{
          position: "absolute",
          top: "24px",
          left: "28px",
          fontFamily: mono,
          fontSize: "12px",
          color: "rgba(127,119,221,0.4)",
          letterSpacing: "3px",
        }}
      >
        AC
      </div>

      {/* top-right navigation */}
      {!isMobile && (
        <nav
          style={{
            position: "absolute",
            top: "24px",
            right: "28px",
            display: "flex",
            gap: "22px",
            pointerEvents: "auto",
          }}
        >
          {SECTION_IDS.map((id, i) => (
            <button
              key={id}
              onClick={() => goTo(i)}
              className="nav-link"
              style={{
                fontFamily: mono,
                fontSize: "10px",
                letterSpacing: "1px",
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                color:
                  i === section
                    ? "rgba(175,169,236,0.75)"
                    : "rgba(255,255,255,0.18)",
                transition: "color 0.3s",
              }}
            >
              {id}
            </button>
          ))}
        </nav>
      )}

      {/* social links */}
      <div
        style={{
          position: "absolute",
          bottom: "18px",
          display: "flex",
          gap: "16px",
          pointerEvents: "auto",
          ...(isMobile ? { left: "16px" } : { right: "28px" }),
        }}
      >
        {[
          {
            href: "https://github.com/aranya",
            label: "GitHub",
            Icon: IconBrandGithub,
          },
          {
            href: "https://linkedin.com/in/aranya",
            label: "LinkedIn",
            Icon: IconBrandLinkedin,
          },
          { href: "mailto:aranya@example.com", label: "Email", Icon: IconMail },
        ].map(({ href, label, Icon }) => (
          <a
            key={label}
            href={href}
            target={href.startsWith("mailto") ? undefined : "_blank"}
            rel="noreferrer"
            aria-label={label}
            className="social-link"
          >
            <Icon size={18} stroke={1.5} />
          </a>
        ))}
      </div>
    </div>
  );
}
