"use client";

import { useEffect, useState } from "react";
import { SECTIONS } from "@/data/constellations";

/**
 * No-WebGL fallback: static nebula render + CSS box-shadow starfield,
 * with the section content as a normal scrolling page.
 */
export default function FallbackUniverse() {
  const [shadows, setShadows] = useState<{ small: string; big: string }>({
    small: "",
    big: "",
  });

  useEffect(() => {
    const make = (n: number, color: string) => {
      const parts: string[] = [];
      for (let i = 0; i < n; i++) {
        parts.push(
          `${Math.floor(Math.random() * 100)}vw ${Math.floor(
            Math.random() * 100
          )}vh 0 ${color}`
        );
      }
      return parts.join(", ");
    };
    setShadows({
      small: make(180, "rgba(255,255,255,0.7)"),
      big: make(50, "rgba(204,232,255,0.9)"),
    });
  }, []);

  return (
    <div style={{ background: "#03030a", minHeight: "100vh" }}>
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: "url(/nebula_bg.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.9,
        }}
      />
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "1px",
          height: "1px",
          borderRadius: "50%",
          boxShadow: shadows.small,
          animation: "star-twinkle 3.2s ease-in-out infinite",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "2px",
          height: "2px",
          borderRadius: "50%",
          boxShadow: shadows.big,
          animation: "star-twinkle 4.6s ease-in-out infinite 1s",
        }}
      />

      <main style={{ position: "relative", zIndex: 1 }}>
        <section
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "0 24px",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-space-grotesk)",
              fontWeight: 300,
              fontSize: "clamp(22px, 4vw, 32px)",
              color: "#e8e6ff",
              letterSpacing: "5px",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            Aranya Chatterjee
          </h1>
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: "12px",
              color: "rgba(127,119,221,0.55)",
              letterSpacing: "3px",
              marginTop: "18px",
            }}
          >
            AI / ML Engineer&nbsp;&nbsp;·&nbsp;&nbsp;Researcher
          </p>
        </section>

        {SECTIONS.filter((s) => s.text).map((s) => (
          <section
            key={s.id}
            style={{
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              maxWidth: "560px",
              margin: "0 auto",
              padding: "80px 24px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: "10px",
                color: s.palette.textAccent,
                letterSpacing: "3px",
                textTransform: "uppercase",
                marginBottom: "14px",
              }}
            >
              {s.text!.label}
              {s.constellation && (
                <span style={{ color: "rgba(255,255,255,0.3)" }}>
                  &nbsp;·&nbsp;{s.constellation.name}, “{s.constellation.meaning}”
                </span>
              )}
            </div>
            <h2
              style={{
                fontFamily: "var(--font-space-grotesk)",
                fontWeight: 300,
                fontSize: "26px",
                color: "#e8e6ff",
                lineHeight: 1.2,
                whiteSpace: "pre-line",
                margin: 0,
              }}
            >
              {s.text!.title}
            </h2>
            <p
              style={{
                fontFamily: "var(--font-space-grotesk)",
                fontSize: "13px",
                color: "rgba(255,255,255,0.32)",
                lineHeight: 1.85,
                margin: "16px 0 28px",
              }}
            >
              {s.text!.body}
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {s.constellation?.nodes.map((n) => (
                <li
                  key={n.id}
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-space-grotesk)",
                      fontWeight: 500,
                      fontSize: "14px",
                      color: "#e8e6ff",
                    }}
                  >
                    {n.name}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-space-grotesk)",
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.38)",
                      marginLeft: "10px",
                    }}
                  >
                    {n.desc}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}
