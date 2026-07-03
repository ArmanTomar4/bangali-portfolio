# Aranya Chatterjee — Constellation Universe Portfolio

A scroll-driven 3D portfolio for an AI/ML engineer. The whole site is one
continuous camera flight through a starfield: five sections (home, about,
projects, skills, contact), each a constellation of stars floating in front
of a Blender-rendered nebula. Scrolling travels the camera along -Z with
hyperspace star streaks between stops; every star is hoverable and tells a
story via a tooltip.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| 3D | Three.js via `@react-three/fiber` + `@react-three/drei` |
| Navigation | GSAP Observer — discrete section paging (wheel / touch / keys) |
| Animation | GSAP (constellations, camera, streaks) + Framer Motion (text, tooltip, UI) |
| Styling | Tailwind CSS v4 + inline styles |
| Fonts | Space Grotesk + Space Mono via `next/font/google` |

---

## File map

```
src/
├── app/
│   ├── layout.tsx            Fonts, metadata, body
│   ├── globals.css           Tailwind, hint chevron, fallback star twinkle
│   └── page.tsx              Root composition — webgl detect, state, wiring
├── components/
│   ├── UniverseCanvas.tsx    R3F Canvas: nebula, starfield, streaks, camera rig
│   ├── ConstellationSystem.tsx  Nodes, fat-line edges, hover, transitions
│   ├── ScrollEngine.tsx      GSAP Observer paging + input lock
│   ├── SectionText.tsx       Per-section text reveals (Framer Motion)
│   ├── StarTooltip.tsx       Hover tooltip / mobile bottom sheet
│   ├── ProgressDots.tsx      Section indicator dots
│   ├── UIOverlay.tsx         Home intro, nav, monogram, socials, scroll hint
│   └── FallbackUniverse.tsx  No-WebGL static fallback
└── data/
    ├── constellations.ts     All sections, stars, edges, palettes, copy
    └── palette.ts            Palette type
public/
└── nebula_bg.webp            Blender volume-scatter nebula render (2560×1440)
```

---

## How it works

**Gesture → camera.** There is no real scrolling: the page is a fixed
viewport and GSAP Observer captures wheel flicks, touch swipes, and arrow /
page keys. Each gesture advances exactly one section — a single committed
camera flight (`power2.inOut`, ~1.25s) — and further input is ignored until
the destination's arrival animation has played out, so fast scrolling can
never skip sections. Camera Z is damped toward `progress × −720`; mouse
(desktop) or device orientation (mobile) adds parallax on X/Y.

**Transitions are velocity-aware, not timer-based.** A GSAP ticker watches
scroll progress every frame:

- *Departure* — the moment the camera pulls >0.05 progress away from the
  displayed section's stop, its nodes stagger-shrink and edges fade, so you
  never fly through a full-scale constellation.
- *Travel* — foreground star streaks are driven by actual camera Z velocity
  (direction-aware), so the hyperspace effect tracks any scroll, either way.
- *Arrival* — only when the camera is within 0.03 of the stop **and**
  decelerating do nodes materialise (elastic overshoot, staggered), then
  edges draw in sequentially (fat-line `dashOffset` animation), then text
  reveals. Multi-section jumps never flash intermediate constellations.

**Stars.** drei `<Stars>` (9000/5000 mobile) parallaxes at 0.8× camera; 300
custom foreground stars in 3 size classes (white / blue-white / warm) follow
at 0.95× with slow rotation and double as streak lines during travel.

**Hover.** Invisible hit spheres at 3× node radius; hovered node scales 1.5×
and brightens to white, connected edges light up, everything else dims, and
a Framer Motion tooltip (viewport-clamped, edge-flipping) shows the star's
label, name, description, and tags. On mobile it's a tap + bottom sheet.

**Edge cases.** No WebGL → static nebula + CSS starfield + normal scroll
sections. `prefers-reduced-motion` → instant section swaps, no streaks,
parallax, or input lock. Mobile (<768px) → swipe paging via the same
Observer, 2 fewest-important nodes dropped per constellation, constellation
top / text bottom layout.

---

## Run

```bash
npm install
npm run dev     # http://localhost:3000
```

All content lives in `src/data/constellations.ts` — stars, edges, palettes,
and copy are plain data.
