"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import * as THREE from "three";
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

const EDGE_VERT = /* glsl */ `
  attribute float aT;
  varying float vT;
  void main() {
    vT = aT;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const EDGE_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uProgress;
  varying float vT;
  void main() {
    if (vT > uProgress) discard;
    gl_FragColor = vec4(uColor, uOpacity);
  }
`;

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
    const { size, camera } = useThree();

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

    // screen-space layout → world coordinates on the section's node plane
    const positions = useMemo(() => {
      const vh = 2 * Math.tan(((FOV / 2) * Math.PI) / 180) * NODE_DIST;
      const vw = vh * (size.width / size.height);
      const offScale = vw / size.width; // design px → world units
      const cxW = (constellation.cx - 0.5) * vw;
      const cyW = (0.5 - constellation.cy) * vh;
      const z = section.cameraZ - NODE_DIST;
      return nodes.map(
        (n) =>
          [cxW + n.ox * offScale, cyW - n.oy * offScale, z] as [
            number,
            number,
            number
          ]
      );
    }, [nodes, constellation, section.cameraZ, size.width, size.height]);

    const baseColor = useMemo(() => new THREE.Color(palette.nodeColor), [palette.nodeColor]);
    const hoverColor = useMemo(
      () => baseColor.clone().lerp(new THREE.Color("#ffffff"), 0.65),
      [baseColor]
    );

    // edge lines: 2-vertex geometry + draw-progress shader per edge
    const lines = useMemo(() => {
      return edges.map(([a, b]) => {
        const g = new THREE.BufferGeometry();
        const pa = positions[a];
        const pb = positions[b];
        g.setAttribute(
          "position",
          new THREE.Float32BufferAttribute([...pa, ...pb], 3)
        );
        g.setAttribute("aT", new THREE.Float32BufferAttribute([0, 1], 1));
        const m = new THREE.ShaderMaterial({
          uniforms: {
            uColor: { value: new THREE.Color(palette.edgeColor) },
            uOpacity: { value: shownRef.current ? 0.3 : 0 },
            uProgress: { value: shownRef.current ? 1 : 0 },
          },
          vertexShader: EDGE_VERT,
          fragmentShader: EDGE_FRAG,
          transparent: true,
          depthWrite: false,
        });
        return new THREE.Line(g, m);
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [edges, positions, palette.edgeColor]);

    useEffect(() => {
      return () => {
        lines.forEach((l) => {
          l.geometry.dispose();
          (l.material as THREE.Material).dispose();
        });
      };
    }, [lines]);

    const edgeMat = (j: number) => lines[j].material as THREE.ShaderMaterial;

    const setAll = (visible: boolean, scale: number, opacity: number) => {
      if (rootRef.current) rootRef.current.visible = visible;
      nodeGroups.current.forEach((g) => g?.scale.setScalar(scale));
      nodeMats.current.forEach((m) => m && (m.opacity = opacity));
      glowMats.current.forEach((m) => m && (m.opacity = opacity * 0.35));
      lines.forEach((l) => {
        const m = l.material as THREE.ShaderMaterial;
        m.uniforms.uProgress.value = visible ? 1 : 0;
        m.uniforms.uOpacity.value = visible ? 0.3 : 0;
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
            const m = l.material as THREE.ShaderMaterial;
            m.uniforms.uProgress.value = 0;
            m.uniforms.uOpacity.value = 0.3;
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
              edgeMat(j).uniforms.uProgress,
              { value: 0 },
              { value: 1, duration: 0.4, ease: "power2.out", overwrite: "auto" },
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
          lines.forEach((l, j) => {
            tl.to(
              edgeMat(j).uniforms.uOpacity,
              { value: 0, duration: 0.4, overwrite: "auto" },
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
        gsap.to(edgeMat(j).uniforms.uOpacity, {
          value: conn.includes(j) ? 0.7 : 0.12,
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
        gsap.to(edgeMat(j).uniforms.uOpacity, { value: 0.3, duration: 0.2, overwrite: "auto" });
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
  isMobile: boolean;
  reduced: boolean;
  onHover: (h: HoverInfo | null) => void;
}

export default function ConstellationSystem({
  section,
  isMobile,
  reduced,
  onHover,
}: SystemProps) {
  const apis = useRef<(GroupApi | null)[]>([]);
  const displayed = useRef(0);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    const prev = displayed.current;
    if (!mounted.current) {
      mounted.current = true;
      // arriving on a reload mid-page: show current section directly
      if (section !== 0) apis.current[section]?.showInstant();
      displayed.current = section;
      return;
    }
    if (prev === section) return;
    displayed.current = section;
    tlRef.current?.kill();
    onHover(null);
    document.body.style.cursor = "";

    const prevApi = apis.current[prev];
    const nextApi = apis.current[section];

    if (reduced) {
      prevApi?.hideInstant();
      nextApi?.showInstant();
      return;
    }

    const tl = gsap.timeline();
    tlRef.current = tl;
    // Phase 1 — departure of the old constellation
    if (prevApi) prevApi.depart(tl, 0);
    // Phase 3 — arrival after the camera has settled (travel ≈ 0.6–1.2s)
    if (nextApi) {
      tl.call(() => nextApi.prep(), [], prevApi ? 1.35 : 0.9);
      nextApi.arrive(tl, prevApi ? 1.4 : 0.95);
    }
  }, [section, reduced, onHover]);

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
