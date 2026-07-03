"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, useTexture } from "@react-three/drei";
import { gsap } from "gsap";
import ConstellationSystem from "./ConstellationSystem";
import { SECTIONS, TOTAL_TRAVEL, type HoverInfo } from "@/data/constellations";

interface TravelState {
  streak: number;
}

interface CanvasProps {
  section: number;
  progressRef: React.MutableRefObject<number>;
  mouseRef: React.MutableRefObject<{ x: number; y: number }>;
  onHover: (h: HoverInfo | null) => void;
  isMobile: boolean;
  reduced: boolean;
}

function SceneBackground({ section, reduced }: { section: number; reduced: boolean }) {
  const { scene } = useThree();
  useEffect(() => {
    if (!(scene.background instanceof THREE.Color)) {
      scene.background = new THREE.Color(SECTIONS[0].palette.bg);
    }
    const bg = scene.background as THREE.Color;
    const target = new THREE.Color(SECTIONS[section].palette.bg);
    if (reduced) {
      bg.copy(target);
      return;
    }
    const tween = gsap.to(bg, {
      r: target.r,
      g: target.g,
      b: target.b,
      duration: 1.6,
      ease: "sine.inOut",
    });
    return () => {
      tween.kill();
    };
  }, [section, scene, reduced]);
  return null;
}

function NebulaBg() {
  const tex = useTexture("/nebula_bg.webp");
  const ref = useRef<THREE.Mesh>(null);
  const { camera, size } = useThree();

  useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
  }, [tex]);

  // sized to cover the frustum at 800 units, with overscan for parallax drift
  const scale = useMemo(() => {
    const h = 2 * Math.tan((37.5 * Math.PI) / 180) * 800;
    const w = h * (size.width / size.height);
    const planeAspect = 32 / 18;
    const sh = Math.max(h, w / planeAspect) * 1.18;
    return [(sh * planeAspect) / 32, sh / 18, 1] as [number, number, number];
  }, [size.width, size.height]);

  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.set(
      camera.position.x * 0.85,
      camera.position.y * 0.85,
      camera.position.z - 800
    );
  });

  return (
    <mesh ref={ref} scale={scale} frustumCulled={false}>
      <planeGeometry args={[32, 18]} />
      <meshBasicMaterial map={tex} transparent opacity={0.78} depthWrite={false} />
    </mesh>
  );
}

let starTexture: THREE.Texture | null = null;
function getStarTexture(): THREE.Texture {
  if (starTexture) return starTexture;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.8)");
  grad.addColorStop(0.7, "rgba(255,255,255,0.25)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  starTexture = new THREE.CanvasTexture(c);
  return starTexture;
}

/** 300 foreground stars in 3 size classes + hyperspace streak lines. */
function ForegroundStars({ travel }: { travel: React.MutableRefObject<TravelState> }) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const lineMatRef = useRef<THREE.LineBasicMaterial>(null);
  const rotY = useRef(0);
  const prevStreak = useRef(0);

  const data = useMemo(() => {
    const rand = mulberry32(1337);
    const classes: { size: number; pts: number[]; cols: number[] }[] = [
      { size: 0.8, pts: [], cols: [] },
      { size: 1.6, pts: [], cols: [] },
      { size: 2.8, pts: [], cols: [] },
    ];
    const all: number[] = [];
    const allCols: number[] = [];
    const white = new THREE.Color("#ffffff");
    const blue = new THREE.Color("#cce8ff");
    const warm = new THREE.Color("#ffd4a0");
    for (let i = 0; i < 300; i++) {
      const a = rand() * Math.PI * 2;
      const rr = Math.sqrt(rand()) * 80;
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr * 0.7;
      const z = -50 + rand() * 100;
      const cr = rand();
      const col = cr < 0.6 ? white : cr < 0.85 ? blue : warm;
      const sr = rand();
      const cls = sr < 0.8 ? 0 : sr < 0.95 ? 1 : 2;
      classes[cls].pts.push(x, y, z);
      classes[cls].cols.push(col.r, col.g, col.b);
      all.push(x, y, z);
      allCols.push(col.r, col.g, col.b, col.r, col.g, col.b);
    }
    const linePos = new Float32Array(300 * 6);
    for (let i = 0; i < 300; i++) {
      linePos[i * 6] = all[i * 3];
      linePos[i * 6 + 1] = all[i * 3 + 1];
      linePos[i * 6 + 2] = all[i * 3 + 2];
      linePos[i * 6 + 3] = all[i * 3];
      linePos[i * 6 + 4] = all[i * 3 + 1];
      linePos[i * 6 + 5] = all[i * 3 + 2];
    }
    return { classes, all, linePos, lineCols: new Float32Array(allCols) };
  }, []);

  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1;

  useFrame((_, dt) => {
    const g = groupRef.current;
    if (!g) return;
    rotY.current += Math.min(dt, 0.05) * 0.048; // ≈ 0.0008 rad/frame @60fps
    g.rotation.y = rotY.current;
    g.position.z = camera.position.z * 0.95;

    const streak = travel.current.streak;
    const lines = linesRef.current;
    if (!lines) return;
    if (streak > 0.001 || prevStreak.current > 0.001) {
      // streak direction = world -Z expressed in the group's rotated local space
      const ry = rotY.current;
      const dx = -Math.sin(ry);
      const dz = -Math.cos(ry);
      const len = streak * 22;
      const attr = lines.geometry.getAttribute("position") as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      for (let i = 0; i < 300; i++) {
        arr[i * 6 + 3] = data.all[i * 3] + dx * len;
        arr[i * 6 + 5] = data.all[i * 3 + 2] + dz * len;
      }
      attr.needsUpdate = true;
      lines.visible = streak > 0.001;
      if (lineMatRef.current) lineMatRef.current.opacity = Math.min(1, streak) * 0.85;
      prevStreak.current = streak;
    }
  });

  return (
    <group ref={groupRef}>
      {data.classes.map((c, i) => (
        <points key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array(c.pts), 3]}
            />
            <bufferAttribute
              attach="attributes-color"
              args={[new Float32Array(c.cols), 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            ref={(m) => {
              if (m && !m.map) {
                m.map = getStarTexture();
                m.needsUpdate = true;
              }
            }}
            size={c.size * dpr * 2.2}
            sizeAttenuation={false}
            vertexColors
            transparent
            opacity={0.95}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      ))}
      <lineSegments ref={linesRef} visible={false} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.linePos, 3]} />
          <bufferAttribute attach="attributes-color" args={[data.lineCols, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          ref={lineMatRef}
          vertexColors
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function StarField({
  travel,
  isMobile,
}: {
  travel: React.MutableRefObject<TravelState>;
  isMobile: boolean;
}) {
  const bgRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  useFrame(() => {
    // background stars follow at 80% → gentle parallax during travel
    if (bgRef.current) bgRef.current.position.z = camera.position.z * 0.8;
  });
  return (
    <>
      <group ref={bgRef}>
        <Stars
          radius={400}
          depth={120}
          count={isMobile ? 5000 : 9000}
          factor={5}
          saturation={0.25}
          fade
          speed={0.15}
        />
      </group>
      <ForegroundStars travel={travel} />
    </>
  );
}

function CameraRig({
  progressRef,
  mouseRef,
  isMobile,
  reduced,
}: {
  progressRef: React.MutableRefObject<number>;
  mouseRef: React.MutableRefObject<{ x: number; y: number }>;
  isMobile: boolean;
  reduced: boolean;
}) {
  const { camera } = useThree();
  useFrame((_, dt) => {
    const targetZ = progressRef.current * TOTAL_TRAVEL;
    camera.position.z = reduced
      ? targetZ
      : THREE.MathUtils.damp(camera.position.z, targetZ, 8, Math.min(dt, 0.05));
    const px = isMobile ? 8 : 3;
    const py = isMobile ? 8 : 2;
    const k = reduced ? 0 : 0.02;
    camera.position.x += (mouseRef.current.x * px - camera.position.x) * k;
    camera.position.y += (mouseRef.current.y * py - camera.position.y) * k;
    camera.lookAt(0, 0, camera.position.z - 100);
  });
  return null;
}

export default function UniverseCanvas({
  section,
  progressRef,
  mouseRef,
  onHover,
  isMobile,
  reduced,
}: CanvasProps) {
  const travel = useRef<TravelState>({ streak: 0 });
  const mounted = useRef(false);

  // Phase 2 — hyperspace streaks while the camera travels between sections
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (reduced) return;
    const tl = gsap.timeline({ delay: 0.45 });
    tl.to(travel.current, { streak: 1, duration: 0.4, ease: "power2.in" });
    tl.to(travel.current, { streak: 0, duration: 0.45, ease: "power2.out" });
    return () => {
      tl.kill();
      travel.current.streak = 0; // eslint-disable-line react-hooks/exhaustive-deps
    };
  }, [section, reduced]);

  return (
    <Canvas
      camera={{ position: [0, 0, 0], fov: 75, near: 0.1, far: 2000 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      dpr={[1, 2]}
      style={{ background: "#03030a" }}
      onPointerMissed={() => onHover(null)}
    >
      <SceneBackground section={section} reduced={reduced} />
      <Suspense fallback={null}>
        <NebulaBg />
      </Suspense>
      <StarField travel={travel} isMobile={isMobile} />
      <ConstellationSystem
        section={section}
        isMobile={isMobile}
        reduced={reduced}
        onHover={onHover}
      />
      <CameraRig
        progressRef={progressRef}
        mouseRef={mouseRef}
        isMobile={isMobile}
        reduced={reduced}
      />
    </Canvas>
  );
}
