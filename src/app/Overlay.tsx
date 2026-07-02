"use client";

import { useEffect, useState } from "react";
import {
  IconBrandGithub,
  IconBrandLinkedin,
  IconMail,
  IconChevronUp,
} from "@tabler/icons-react";

export default function Overlay() {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const flag = sessionStorage.getItem("aranya-hint-seen");
    if (flag) return;
    setShowHint(true);
    const t = setTimeout(() => {
      setShowHint(false);
      sessionStorage.setItem("aranya-hint-seen", "1");
    }, 3200);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {/* top-left identity */}
      <div className="fixed top-6 left-6 md:top-8 md:left-8 z-10 select-none">
        <div
          style={{
            fontFamily: "var(--font-space-grotesk)",
            fontWeight: 500,
            color: "rgba(255,255,255,0.75)",
          }}
          className="text-[12px] md:text-[14px]"
        >
          Aranya Chatterjee
        </div>
        <div
          className="mt-[3px] uppercase text-[10px] md:text-[11px]"
          style={{
            fontFamily: "var(--font-space-mono)",
            color: "rgba(127,119,221,0.6)",
            letterSpacing: 1.5,
          }}
        >
          AI / ML Engineer
        </div>
      </div>

      {/* socials — bottom-right on desktop, bottom-left on mobile */}
      <div className="fixed bottom-6 md:bottom-8 right-6 md:right-8 hidden md:flex z-10 items-center gap-5">
        <SocialLinks />
      </div>
      <div className="fixed bottom-6 left-6 flex md:hidden z-10 items-center gap-5">
        <SocialLinks />
      </div>

      {/* one-time hint */}
      {showHint && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none"
          style={{
            bottom: 80,
            animation: "fadeOut 3s ease 0s forwards",
          }}
        >
          <div
            className="uppercase"
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 11,
              color: "rgba(255,255,255,0.25)",
              letterSpacing: 2,
            }}
          >
            explore the network
          </div>
          <div className="hint-bounce mt-2 flex justify-center">
            <IconChevronUp
              size={16}
              stroke={1.2}
              color="rgba(255,255,255,0.25)"
            />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeOut {
          0%,
          70% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}

function SocialLinks() {
  const links: { href: string; label: string; Icon: typeof IconMail }[] = [
    { href: "https://github.com/", label: "GitHub", Icon: IconBrandGithub },
    {
      href: "https://www.linkedin.com/",
      label: "LinkedIn",
      Icon: IconBrandLinkedin,
    },
    { href: "mailto:aranya@example.com", label: "Email", Icon: IconMail },
  ];
  return (
    <>
      {links.map(({ href, label, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="transition-all duration-300 hover:scale-110"
          style={{ color: "rgba(255,255,255,0.2)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "rgba(127,119,221,0.8)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "rgba(255,255,255,0.2)")
          }
        >
          <Icon size={18} stroke={1.5} />
        </a>
      ))}
    </>
  );
}
