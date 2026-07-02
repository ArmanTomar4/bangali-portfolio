# Aranya Chatterjee — Neural Network Portfolio

An interactive single-page portfolio for an AI/ML engineer. The whole page is a fullscreen dark canvas — no navbar, no footer, no sections. Visitors explore a drifting neural network of nodes; hovering reveals a tooltip, clicking opens a slide-in detail panel.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Animation | GSAP (panel transitions) + raw `requestAnimationFrame` (canvas) |
| Icons | `@tabler/icons-react` |
| Fonts | Space Grotesk + Space Mono (Google Fonts via `next/font`) |
| Rendering | Single `<canvas>` for the world; React DOM for tooltip, panel, overlay |

No external state library, no backend, no database. Everything is client-side.

---

## File map

```
src/app/
├── layout.tsx        Root layout — loads fonts, sets <body> background to #04040d
├── globals.css       Tailwind import, CSS variables, hint-bounce keyframes
├── page.tsx          Top-level composition — owns `selected` node state
├── data.ts           All portfolio content (anchor, projects, skills, research)
├── Universe.tsx      The canvas world — stars, nodes, connections, hover, tooltip
├── Panel.tsx         Slide-in detail panel (GSAP-driven)
└── Overlay.tsx       Top-left name/role, bottom-right socials, one-time hint
```

Other files of note:

```
.claude/launch.json   Dev-server config consumed by Claude Code's preview tools
package.json          Scripts and deps
```

---

## How a frame renders

`Universe.tsx` mounts one canvas covering the viewport and one `requestAnimationFrame` loop. Every frame, in order:

1. **Update parallax.** The node field eases toward `(±18px)` opposite the mouse. Stars parallax at half rate, creating depth.
2. **Detect hover.** Walk all 24 content nodes, find the one whose centre is within `radius × 3.5` of the cursor. That id becomes the *active* id (or, if a node is selected, the selected id wins).
3. **Step physics.** Each non-anchor node moves by `velocity * dtFrames * (1 - hover * 0.8)` — hovered nodes slow to 20%. Nodes bounce off viewport edges. Within 90px of the centre they're gently repelled away from the anchor.
4. **Draw stars.** 150 sin-twinkled dots, each with its own phase and frequency.
5. **Draw connections.** Spatial grid (cell size = 140px) groups nodes into buckets; for every node we only check the 3×3 neighbourhood. Lines within 140px get drawn with opacity proportional to distance; pairs within 60px also get a tiny "synaptic" midpoint dot. Active nodes' connections get boosted 4× alpha and 2.5× width.
6. **Draw nodes.** Active nodes render with a radial-gradient glow halo. Dimmed nodes fade to 15% opacity (lerp-eased per frame, so transitions feel soft, not instant). The anchor has a pulsing outer ring driven by `sin(t * 1.4)`.
7. **Sync tooltip position.** A React state push updates the tooltip's DOM position to follow the hovered node, but only when the screen-space delta exceeds 0.5px — avoids flooding React.

The loop runs at the browser's natural refresh rate via `requestAnimationFrame`. `dt` is clamped to 50ms so a tab-switch doesn't produce a giant teleport on resume.

---

## Interaction states

### Hover (desktop)
Cursor enters a node's hit zone (`radius × 3.5`):
- Node radius grows 1.6× (lerp-smoothed, ~300ms feel)
- Node's velocity scales to 20%
- Connections from this node go bright + 1px wide
- Other nodes fade to 15% opacity
- DOM tooltip fades in next to the node

Cursor leaves: everything reverses with the same easing.

### Click (desktop)
- `onNodeClick` callback in `page.tsx` sets `selected` state
- `Panel.tsx` mounts and GSAP slides it in from the right (`xPercent: 100 → 0`, 380ms, `expo.out`)
- The active dim/glow state persists while the panel is open
- Close: click the backdrop, hit Escape, or use the `×` button — GSAP plays the exit timeline and `onComplete` clears `selected`

### Tap (mobile, `width < 768px`)
- First tap on a node: behaves like hover (tooltip appears)
- Second tap on the same node within 2.5s: opens the panel
- Panel slides up from the *bottom* instead of the right (65vh tall, rounded top corners, drag-handle bar)
- Mouse parallax is disabled; the parallax target stays at 0

---

## Data shape

Everything visible in tooltips and panels comes from `src/app/data.ts`. The full type:

```ts
type Category = "anchor" | "project" | "skill" | "research";

type NodeDatum = {
  id: string;          // unique, used for React keys and hover state
  category: Category;  // drives colour + label
  title: string;       // shown in tooltip + panel heading
  desc?: string;       // tooltip and panel body
  tags?: string[];     // tag pills in tooltip + panel
  link?: string;       // anchor for the panel CTA
};
```

Three arrays + one anchor:

```ts
export const ANCHOR: NodeDatum     // the central white node — Aranya
export const PROJECTS: NodeDatum[] // 8 entries, purple (#7f77dd)
export const SKILLS:   NodeDatum[] // 10 entries, teal   (#1d9e75)
export const RESEARCH: NodeDatum[] // 6 entries, pink   (#d4537e)
```

Plus colour and label lookup tables:

```ts
CATEGORY_COLORS  // category → hex string
CATEGORY_LABELS  // category → tooltip pill text ("project", "skill", ...)
CTA_LABELS       // category → panel CTA text ("view project →", etc.)
```

The mobile layout picks a balanced subset: top 6 projects + 6 skills + 4 research (= 16 nodes including the anchor).

---

## Swapping in real content

Open `src/app/data.ts` and replace each placeholder. **Required fields per node**: `id`, `category`, `title`. Everything else (`desc`, `tags`, `link`) is optional but recommended — if `link` is `"#"` the CTA still renders but doesn't go anywhere. Strip the link block from `Panel.tsx` if you'd rather hide it entirely for items with no real URL.

Things to update:
- `data.ts` — all the actual portfolio entries
- `Overlay.tsx` — GitHub / LinkedIn / email URLs (currently placeholders)
- `layout.tsx` — `metadata.title` and `metadata.description` for SEO / social previews
- `package.json` — change `"name"` from `bangali` to whatever you'd like

To add more categories:
1. Add the new key to `Category` in `data.ts`
2. Add entries in `CATEGORY_COLORS`, `CATEGORY_LABELS`, `CTA_LABELS`
3. Push the new array into the `pool` array inside `Universe.tsx`'s `buildNodes`
4. Add a radius branch in the `if (data.category === ...)` chain

---

## Theming knobs

All sized in `src/app/Universe.tsx` near the top:

| Constant | Default | Meaning |
|---|---|---|
| `CONNECT_DIST` | `140` | Max distance for two nodes to draw a line between them |
| `SYNAPSE_DIST` | `60`  | Threshold for the midpoint "firing" dot |
| Star count | `150` (hardcoded in `buildStars`) | Reduce on low-end devices if needed |
| Node count | `24` desktop / `16` mobile | Set in `buildNodes` via `targetCount` |
| Parallax max | `±18px` desktop | Search for `* 18` in the parallax block |
| Anchor repulsion | `90px` | Search for `if (d < 90` |
| Node velocity | `0.15–0.35 px/frame` | Search for `lerp(0.35, 0.15` |

Colours: change `CATEGORY_COLORS` in `data.ts` and they propagate through canvas, tooltips, panel badges, and CTAs automatically.

Background colour `#04040d` lives in three places (intentionally — Tailwind purges what it doesn't see):
- `layout.tsx` body class
- `globals.css` `--bg` variable
- `Universe.tsx` `ctx.fillStyle = "#04040d"` in the draw loop

Tooltip/panel borders use `rgba(127,119,221,0.x)` — match this if you change the project purple.

---

## Performance notes

- Connection checks use a **spatial grid** (cell = `CONNECT_DIST`). For 24 nodes you only check ~9 buckets per node instead of all 24, dropping the per-frame work from O(n²) to roughly O(n).
- Tooltip position updates go through React state, but the loop short-circuits identical updates (`Math.abs(prev.x - sx) < 0.5`) so React only re-renders when the position actually changes.
- `dt` is normalized to 60fps frames (`dt / 16.6667`) so physics speed is independent of refresh rate — looks the same on a 60Hz laptop and a 144Hz monitor.
- The panel has `will-change: transform, opacity` (`.panel-will-change` in `globals.css`) so the GSAP slide is composited on the GPU.
- The mouse parallax offset is stored in a ref, not React state — moving the mouse doesn't trigger a re-render, only the canvas draws.
- `dt` is also clamped (`Math.min(50, ...)`) so a backgrounded tab doesn't fast-forward physics when refocused.

If you ever profile and need more headroom:
- Drop star count from 150 → 80
- Drop node count from 24 → 18
- Skip the synaptic midpoint dots (most expensive per-frame draw besides connections)

---

## Running locally

```bash
npm install
npm run dev   # → http://localhost:3000
```

If port 3000 is taken, set `PORT=<something>` in front:

```bash
PORT=3217 npm run dev
```

Other scripts:

```bash
npm run build   # production build — also runs TypeScript checks
npm start       # serve the production build (after `next build`)
npm run lint    # eslint
```

---

## Deployment

Stock Next.js 16 app with no API routes. Easiest paths:

- **Vercel** — push to GitHub, import the repo, accept defaults. Zero config needed.
- **Netlify** — works the same way with the official Next.js plugin.
- **Static export** — not currently configured. The page is interactive but uses no SSR data, so adding `output: "export"` to `next.config.ts` would make it shippable as plain static files (GitHub Pages, S3, etc.).

The page is a single client component (`page.tsx` is `"use client"`), so static export is fully viable.

---

## Known limitations / things to leave alone

- **Device-orientation parallax on mobile**: not wired up. The spec called for it; I left the call site as a no-op so adding it later is straightforward (`window.addEventListener("deviceorientation", ...)` inside the existing effect, then write to `parallaxRef.current.tx/ty`). It needs `DeviceOrientationEvent.requestPermission()` on iOS, which is a UX flow worth thinking through.
- **SSR / hydration**: all randomness (star positions, node positions, velocities) is generated inside `useEffect`, so there's no server-vs-client mismatch. Don't move that initialization out of the effect.
- **Touch vs click distinction**: the canvas listens to both `click` and `touchend` and uses a single-tap / double-tap state machine on mobile. A hybrid touchscreen laptop will fire both events for a touch — current behaviour is acceptable because `touchend` fires first and sets `lastTapId`. If a particular device misbehaves, call `e.preventDefault()` in the `touchend` handler.
- **Reload reshuffles layout**: positions and velocities are not seeded — every reload looks different. If you want a stable layout for screenshots, replace `rand()` with a tiny seeded PRNG.

---

## Credit

Built for **Aranya Chatterjee**. Fonts loaded from Google Fonts at runtime. No third-party assets are bundled.
