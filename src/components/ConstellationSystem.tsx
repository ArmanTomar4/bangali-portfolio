"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { gsap } from "gsap";
import {
  SECTIONS,
  type Constellation,
  type HoverInfo,
  type StarNode,
} from "@/data/constellations";

const FOV = 75;
const NODE_DIST = 100; // constellation plane sits 100 units beyond the section camera stop

const EDGE_BASE_OPACITY = 0.5;

let glowTexture: THREE.Texture | null = null;
function getGlowTexture(): THREE.Texture {
  if (glowTexture) return glowTexture;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,0.9)");
  grad.addColorStop(0.25, "rgba(255,255,255,0.35)");
  grad.addColorStop(0.6, "rgba(255,255,255,0.08)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  glowTexture = new THREE.CanvasTexture(c);
  return glowTexture;
}

interface GroupApi {
  prep: () => void;
  arrive: (tl: gsap.core.Timeline, at: number) => void;
  depart: (tl: gsap.core.Timeline, at: number) => void;
  showInstant: () => void;
  hideInstant: () => void;
}

interface GroupProps {
  sectionIndex: number;
  isMobile: boolean;
  onHover: (h: HoverInfo | null) => void;
}

/** Filter out the 2 smallest nodes on mobile and remap edges. */
function adaptForMobile(c: Constellation, isMobile: boolean) {
  if (!isMobile) return { nodes: c.nodes, edges: c.edges };
  const smallest = [...c.nodes]
    .sort((a, b) => a.r - b.r)
    .slice(0, 2)
    .map((n) => n.id);
  const keepIdx: number[] = [];
  const nodes = c.nodes.filter((n, i) => {
    const keep = !smallest.includes(n.id);
    if (keep) keepIdx.push(i);
    return keep;
  });
  const remap = new Map(keepIdx.map((old, next) => [old, next]));
  const edges = c.edges
    .filter(([a, b]) => remap.has(a) && remap.has(b))
    .map(([a, b]) => [remap.get(a)!, remap.get(b)!] as [number, number]);
  return { nodes, edges };
}

const ConstellationGroup = forwardRef<GroupApi, GroupProps>(
  function ConstellationGroup({ sectionIndex, isMobile, onHover }, apiRef) {
    const section = SECTIONS[sectionIndex];
    const constellation = section.constellation!;
    const palette = section.palette;
    const { size, camera, gl } = useThree();

    const rootRef = useRef<THREE.Group>(null);
    const nodeGroups = useRef<(THREE.Group | null)[]>([]);
    const nodeMats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
    const glowMats = useRef<(THREE.SpriteMaterial | null)[]>([]);
    const shownRef = useRef(false);
    const hoverIdx = useRef(-1);

    const { nodes, edges } = useMemo(
      () => adaptForMobile(constellation, isMobile),
      [constellation, isMobile]
    );

    // screen-space layout → world coordinates on the section's node plane.
    // On mobile the constellation is centred in the upper third (text moves
    // to the bottom) and the spread is compressed to fit narrow screens.
    const positions = useMemo(() => {
      const vh = 2 * Math.tan(((FOV / 2) * Math.PI) / 180) * NODE_DIST;
      const vw = vh * (size.width / size.height);
      const offScale = (vw / size.width) * (isMobile ? 0.75 : 1);
      const cx = isMobile ? 0.5 : constellation.cx;
      const cy = isMobile ? 0.3 : constellation.cy;
      const cxW = (cx - 0.5) * vw;
      const cyW = (0.5 - cy) * vh;
      const z = section.cameraZ - NODE_DIST;
      return nodes.map(
        (n) =>
          [cxW + n.ox * offScale, cyW - n.oy * offScale, z] as [
            number,
            number,
            number
          ]
      );
    }, [nodes, constellation, section.cameraZ, size.width, size.height, isMobile]);

    const baseColor = useMemo(() => new THREE.Color(palette.nodeColor), [palette.nodeColor]);
    const hoverColor = useMemo(
      () => baseColor.clone().lerp(new THREE.Color("#ffffff"), 0.65),
      [baseColor]
    );

    // edge lines: screen-space fat lines whose dash offset animates the
    // draw-in from node A toward node B
    const lines = useMemo(() => {
      return edges.map(([a, b]) => {
        const g = new LineGeometry();
        g.setPositions([...positions[a], ...positions[b]]);
        const len = new THREE.Vector3(...positions[a]).distanceTo(
          new THREE.Vector3(...positions[b])
        );
        const m = new LineMaterial({
          color: new THREE.Color(palette.edgeColor).getHex(),
          linewidth: 1.6,
          transparent: true,
          opacity: shownRef.current ? EDGE_BASE_OPACITY : 0,
          dashed: true,
          dashSize: len,
          gapSize: len,
          depthWrite: false,
        });
        m.blending = THREE.AdditiveBlending;
        m.dashOffset = shownRef.current ? 0 : len;
        m.resolution.set(gl.domElement.width, gl.domElement.height);
        const line = new Line2(g, m);
        line.computeLineDistances();
        line.userData.len = len;
        return line;
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [edges, positions, palette.edgeColor, gl]);

    useEffect(() => {
      return () => {
        lines.forEach((l) => {
          l.geometry.dispose();
          (l.material as THREE.Material).dispose();
        });
      };
    }, [lines]);

    const edgeMat = (j: number) => lines[j].material as LineMaterial;

    const setAll = (visible: boolean, scale: number, opacity: number) => {
      if (rootRef.current) rootRef.current.visible = visible;
      nodeGroups.current.forEach((g) => g?.scale.setScalar(scale));
      nodeMats.current.forEach((m) => m && (m.opacity = opacity));
      glowMats.current.forEach((m) => m && (m.opacity = opacity * 0.35));
      lines.forEach((l) => {
        const m = l.material as LineMaterial;
        m.dashOffset = visible ? 0 : (l.userData.len as number);
        m.opacity = visible ? EDGE_BASE_OPACITY : 0;
      });
    };

    useImperativeHandle(
      apiRef,
      (): GroupApi => ({
        prep() {
          shownRef.current = true;
          if (rootRef.current) rootRef.current.visible = true;
          nodeGroups.current.forEach((g) => g?.scale.setScalar(0));
          nodeMats.current.forEach((m) => m && (m.opacity = 0));
          glowMats.current.forEach((m) => m && (m.opacity = 0));
          lines.forEach((l) => {
            const m = l.material as LineMaterial;
            m.dashOffset = l.userData.len as number;
            m.opacity = EDGE_BASE_OPACITY;
          });
        },
        arrive(tl, at) {
          const groups = nodeGroups.current.filter(Boolean) as THREE.Group[];
          tl.to(
            groups.map((g) => g.scale),
            {
              x: 1, y: 1, z: 1,
              duration: 0.9,
              ease: "elastic.out(1, 0.5)",
              stagger: 0.08,
              overwrite: "auto",
            },
            at
          );
          tl.to(
            nodeMats.current.filter(Boolean),
            { opacity: 1, duration: 0.3, stagger: 0.08, overwrite: "auto" },
            at
          );
          tl.to(
            glowMats.current.filter(Boolean),
            { opacity: 0.35, duration: 0.3, stagger: 0.08, overwrite: "auto" },
            at
          );
          lines.forEach((l, j) => {
            tl.fromTo(
              edgeMat(j),
              { dashOffset: l.userData.len as number },
              {
                dashOffset: 0,
                duration: 0.4,
                ease: "power2.out",
                overwrite: "auto",
              },
              at + 0.4 + j * 0.06
            );
          });
        },
        depart(tl, at) {
          hoverIdx.current = -1;
          shownRef.current = false;
          const groups = nodeGroups.current.filter(Boolean) as THREE.Group[];
          tl.to(
            groups.map((g) => g.scale),
            {
              x: 0, y: 0, z: 0,
              duration: 0.45,
              ease: "power2.in",
              stagger: 0.04,
              overwrite: "auto",
            },
            at
          );
          tl.to(
            [...nodeMats.current, ...glowMats.current].filter(Boolean),
            { opacity: 0, duration: 0.4, overwrite: "auto" },
            at
          );
          lines.forEach((_, j) => {
            tl.to(
              edgeMat(j),
              { opacity: 0, duration: 0.4, overwrite: "auto" },
              at
            );
          });
          tl.call(
            () => {
              if (rootRef.current) rootRef.current.visible = false;
            },
            [],
            at + 0.75
          );
        },
        showInstant() {
          shownRef.current = true;
          setAll(true, 1, 1);
        },
        hideInstant() {
          shownRef.current = false;
          setAll(false, 0, 0);
        },
      }),
      [lines] // eslint-disable-line react-hooks/exhaustive-deps
    );

    const toScreen = (i: number) => {
      const g = nodeGroups.current[i];
      const v = new THREE.Vector3();
      if (g) g.getWorldPosition(v);
      v.project(camera);
      return {
        x: (v.x * 0.5 + 0.5) * size.width,
        y: (-v.y * 0.5 + 0.5) * size.height,
      };
    };

    const connectedEdges = (i: number) =>
      edges
        .map((e, j) => ({ e, j }))
        .filter(({ e }) => e[0] === i || e[1] === i)
        .map(({ j }) => j);

    const highlight = (i: number) => {
      const g = nodeGroups.current[i];
      if (!g) return;
      gsap.to(g.scale, { x: 1.5, y: 1.5, z: 1.5, duration: 0.3, ease: "power2.out", overwrite: "auto" });
      const mat = nodeMats.current[i];
      if (mat)
        gsap.to(mat.color, { r: hoverColor.r, g: hoverColor.g, b: hoverColor.b, duration: 0.3, overwrite: "auto" });
      const glow = glowMats.current[i];
      if (glow) gsap.to(glow, { opacity: 0.7, duration: 0.3, overwrite: "auto" });
      const conn = connectedEdges(i);
      lines.forEach((_, j) => {
        gsap.to(edgeMat(j), {
          opacity: conn.includes(j) ? 0.9 : 0.12,
          duration: 0.3,
          overwrite: "auto",
        });
      });
      nodes.forEach((_, k) => {
        if (k === i) return;
        const m = nodeMats.current[k];
        const gm = glowMats.current[k];
        if (m) gsap.to(m, { opacity: 0.35, duration: 0.3, overwrite: "auto" });
        if (gm) gsap.to(gm, { opacity: 0.12, duration: 0.3, overwrite: "auto" });
      });
    };

    const unhighlight = (i: number) => {
      const g = nodeGroups.current[i];
      if (g) gsap.to(g.scale, { x: 1, y: 1, z: 1, duration: 0.2, ease: "power2.out", overwrite: "auto" });
      const mat = nodeMats.current[i];
      if (mat)
        gsap.to(mat.color, { r: baseColor.r, g: baseColor.g, b: baseColor.b, duration: 0.2, overwrite: "auto" });
      lines.forEach((_, j) => {
        gsap.to(edgeMat(j), { opacity: EDGE_BASE_OPACITY, duration: 0.2, overwrite: "auto" });
      });
      nodes.forEach((_, k) => {
        const m = nodeMats.current[k];
        const gm = glowMats.current[k];
        if (m) gsap.to(m, { opacity: 1, duration: 0.2, overwrite: "auto" });
        if (gm) gsap.to(gm, { opacity: 0.35, duration: 0.2, overwrite: "auto" });
      });
    };

    const enter = (i: number, node: StarNode) => {
      if (!shownRef.current || hoverIdx.current === i) return;
      if (hoverIdx.current >= 0) unhighlight(hoverIdx.current);
      hoverIdx.current = i;
      document.body.style.cursor = "pointer";
      highlight(i);
      const p = toScreen(i);
      onHover({ node, accent: palette.nodeColor, x: p.x, y: p.y });
    };

    const leave = (i: number) => {
      if (hoverIdx.current !== i) return;
      hoverIdx.current = -1;
      document.body.style.cursor = "";
      unhighlight(i);
      onHover(null);
    };

    return (
      <group
        ref={(el) => {
          rootRef.current = el;
          if (el && !el.userData.init) {
            el.visible = false;
            el.userData.init = true;
          }
        }}
      >
        {nodes.map((node, i) => (
          <group
            key={node.id}
            position={positions[i]}
            ref={(el) => {
              nodeGroups.current[i] = el;
              if (el && !el.userData.init) {
                el.scale.setScalar(0);
                el.userData.init = true;
              }
            }}
          >
            <mesh>
              <sphereGeometry args={[node.r, 20, 20]} />
              <meshBasicMaterial
                ref={(m) => {
                  nodeMats.current[i] = m;
                }}
                color={palette.nodeColor}
                transparent
                opacity={0}
              />
            </mesh>
            <sprite scale={[node.r * 8, node.r * 8, 1]}>
              <spriteMaterial
                ref={(m) => {
                  glowMats.current[i] = m;
                  if (m && !m.map) m.map = getGlowTexture();
                }}
                color={palette.nodeColor}
                transparent
                opacity={0}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </sprite>
            {/* generous invisible hit target — 3× the visual radius */}
            <mesh
              onPointerOver={(e: ThreeEvent<PointerEvent>) => {
                e.stopPropagation();
                if (!isMobile) enter(i, node);
              }}
              onPointerOut={() => {
                if (!isMobile) leave(i);
              }}
              onClick={(e: ThreeEvent<MouseEvent>) => {
                e.stopPropagation();
                if (!isMobile) return;
                if (hoverIdx.current === i) leave(i);
                else enter(i, node);
              }}
            >
              <sphereGeometry args={[node.r * 3, 8, 8]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          </group>
        ))}
        {lines.map((l, j) => (
          <primitive key={`e${j}`} object={l} />
        ))}
      </group>
    );
  }
);

interface SystemProps {
  section: number;
  progressRef: React.MutableRefObject<number>;
  isMobile: boolean;
  reduced: boolean;
  onHover: (h: HoverInfo | null) => void;
}

/**
 * Transition orchestration is driven by the *actual* camera progress, not a
 * fixed timer: the old constellation departs as soon as the camera pulls away
 * from its section stop, and the new one materialises only once the camera is
 * close to its stop AND has decelerated — so arrival always lands on a settled
 * camera, in either scroll direction, even across multi-section jumps.
 */
export default function ConstellationSystem({
  section,
  progressRef,
  isMobile,
  reduced,
  onHover,
}: SystemProps) {
  const apis = useRef<(GroupApi | null)[]>([]);
  const displayed = useRef<number | null>(null);
  const sectionRef = useRef(section);
  sectionRef.current = section;
  const departTl = useRef<gsap.core.Timeline | null>(null);
  const arriveTl = useRef<gsap.core.Timeline | null>(null);

  // reduced motion: hard swap on section change, no ticker
  useEffect(() => {
    if (!reduced) return;
    const prev = displayed.current;
    if (prev === section) return;
    if (prev != null) apis.current[prev]?.hideInstant();
    apis.current[section]?.showInstant();
    displayed.current = SECTIONS[section].constellation ? section : null;
    onHover(null);
  }, [section, reduced, onHover]);

  useEffect(() => {
    if (reduced) return;
    let prevP = progressRef.current;
    let vel = 0;

    const tick = (_time: number, deltaMS: number) => {
      const dt = Math.min(Math.max(deltaMS, 1), 100) / 1000;
      const p = progressRef.current;
      vel += ((p - prevP) / dt - vel) * Math.min(1, dt * 12);
      prevP = p;

      // Phase 1 — departure: camera has left the displayed section's stop
      const d = displayed.current;
      if (d != null && Math.abs(p - d / 4) > 0.05) {
        displayed.current = null;
        onHover(null);
        document.body.style.cursor = "";
        arriveTl.current?.kill();
        departTl.current?.kill();
        const tl = gsap.timeline();
        departTl.current = tl;
        apis.current[d]?.depart(tl, 0);
      }

      // Phase 3 — arrival: camera near the current section's stop and slowing
      const s = sectionRef.current;
      if (
        displayed.current == null &&
        SECTIONS[s].constellation &&
        Math.abs(p - s / 4) < 0.03 &&
        Math.abs(vel) < 0.055
      ) {
        displayed.current = s;
        arriveTl.current?.kill();
        const api = apis.current[s];
        if (api) {
          api.prep();
          const tl = gsap.timeline();
          arriveTl.current = tl;
          api.arrive(tl, 0.12);
        }
      }
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      departTl.current?.kill();
      arriveTl.current?.kill();
    };
  }, [reduced, onHover, progressRef]);

  return (
    <>
      {SECTIONS.map((s, i) =>
        s.constellation ? (
          <ConstellationGroup
            key={s.id}
            sectionIndex={i}
            isMobile={isMobile}
            onHover={onHover}
            ref={(api) => {
              apis.current[i] = api;
            }}
          />
        ) : null
      )}
    </>
  );
}
