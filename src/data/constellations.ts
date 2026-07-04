import type { Palette } from "./palette";

export interface StarNode {
  id: string;
  ox: number;
  oy: number;
  r: number;
  label: string;
  name: string;
  desc: string;
  tags: string[];
}

export interface Constellation {
  /** star-atlas identity, e.g. "Origo" */
  name: string;
  /** English reading of the name, e.g. "the origin" */
  meaning: string;
  cx: number;
  cy: number;
  nodes: StarNode[];
  edges: [number, number][];
}

export interface SectionText {
  label: string;
  title: string;
  body: string;
}

export interface HoverInfo {
  node: StarNode;
  accent: string;
  x: number;
  y: number;
}

export interface Section {
  id: string;
  cameraZ: number;
  side?: "left" | "right" | "center";
  palette: Palette;
  constellation: Constellation | null;
  text?: SectionText;
}

export const SECTIONS: Section[] = [
  {
    id: "home",
    cameraZ: 0,
    palette: {
      bg: "#03030a",
      nodeColor: "#7F77DD",
      edgeColor: "#534AB7",
      textAccent: "#AFA9EC",
    },
    constellation: null, // home has no constellation — just ambient stars
  },
  {
    id: "about",
    cameraZ: -180,
    side: "left", // constellation on LEFT, text on RIGHT
    palette: {
      bg: "#02060f",
      nodeColor: "#378ADD",
      edgeColor: "#185FA5",
      textAccent: "#85B7EB",
    },
    constellation: {
      name: "Origo",
      meaning: "the origin",
      cx: 0.22,
      cy: 0.48,
      nodes: [
        {
          id: "n1", ox: -90, oy: -70, r: 2.8,
          label: "origin",
          name: "Aranya Chatterjee",
          desc: "AI/ML engineer and researcher based in India",
          tags: ["AI", "ML", "Research"],
        },
        {
          id: "n2", ox: 20, oy: -100, r: 2.2,
          label: "education",
          name: "B.Tech AI & ML",
          desc: "Final year at MITS Gwalior — graduating 2025",
          tags: ["MITS", "Gwalior"],
        },
        {
          id: "n3", ox: 100, oy: -30, r: 1.8,
          label: "experience",
          name: "4 internships",
          desc: "Full-stack and AI roles across India before graduation",
          tags: ["Full-stack", "AI"],
        },
        {
          id: "n4", ox: 70, oy: 60, r: 1.6,
          label: "open source",
          name: "Active contributor",
          desc: "PRs merged to gepa-ai and NousResearch projects",
          tags: ["GitHub", "OSS"],
        },
        {
          id: "n5", ox: -30, oy: 85, r: 1.5,
          label: "focus",
          name: "LLMs + CV + RL",
          desc: "Research interest across three deep learning domains",
          tags: ["Transformers", "Vision", "RL"],
        },
        {
          id: "n6", ox: -100, oy: 20, r: 1.4,
          label: "currently",
          name: "Building ClarityMed",
          desc: "Clinical note simplification system using DSPy + GEPA",
          tags: ["DSPy", "GEPA", "FastAPI"],
        },
        {
          id: "n7", ox: -40, oy: -20, r: 1.3,
          label: "chess",
          name: "Chess player",
          desc: "Intermediate level on Chess.com — attacking style",
          tags: ["Chess.com", "Tactics"],
        },
      ],
      edges: [
        [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0], [0, 3], [1, 4],
      ],
    },
    text: {
      label: "// about",
      title: "Building minds\nthat learn.",
      body: "Final-year AI&ML student. Researcher at heart, engineer by practice. Obsessed with LLMs, computer vision, and the space where math meets meaning.",
    },
  },
  {
    id: "projects",
    cameraZ: -360,
    side: "right", // constellation on RIGHT, text on LEFT
    palette: {
      bg: "#030a06",
      nodeColor: "#1D9E75",
      edgeColor: "#0F6E56",
      textAccent: "#5DCAA5",
    },
    constellation: {
      name: "Fabrica",
      meaning: "the forge",
      cx: 0.78,
      cy: 0.46,
      nodes: [
        {
          id: "p1", ox: -80, oy: -80, r: 2.6,
          label: "project",
          name: "LLM fine-tuner",
          desc: "LoRA-based fine-tuning pipeline with eval dashboard and model comparison UI",
          tags: ["PyTorch", "LoRA", "HuggingFace"],
        },
        {
          id: "p2", ox: 30, oy: -100, r: 2.2,
          label: "project",
          name: "CV pipeline",
          desc: "Real-time object detection on edge devices via ONNX runtime export",
          tags: ["YOLO", "ONNX", "FastAPI"],
        },
        {
          id: "p3", ox: 100, oy: -10, r: 2.0,
          label: "project",
          name: "RL agent",
          desc: "Multi-task reinforcement learning trained on custom sparse-reward Gym environments using PPO",
          tags: ["PPO", "Gym", "NumPy"],
        },
        {
          id: "p4", ox: 60, oy: 80, r: 1.8,
          label: "project",
          name: "Semantic search",
          desc: "Dense retrieval over 500k academic abstracts with FAISS indexing",
          tags: ["FAISS", "BERT", "Flask"],
        },
        {
          id: "p5", ox: -40, oy: 90, r: 1.6,
          label: "project",
          name: "Diffusion explorer",
          desc: "Interactive latent space explorer for Stable Diffusion with real-time interpolation",
          tags: ["Diffusers", "Gradio", "CUDA"],
        },
        {
          id: "p6", ox: -100, oy: 10, r: 1.5,
          label: "project",
          name: "WhatsApp platform",
          desc: "Full WhatsApp Business messaging platform — Next.js, BullMQ, Socket.io, Railway",
          tags: ["Next.js", "Socket.io", "PostgreSQL"],
        },
        {
          id: "p7", ox: -20, oy: -10, r: 1.4,
          label: "project",
          name: "ClarityMed",
          desc: "Clinical note simplification for patients using DSPy + GEPA + FastAPI",
          tags: ["DSPy", "GEPA", "FastAPI"],
        },
        {
          id: "p8", ox: 40, oy: 20, r: 1.3,
          label: "project",
          name: "Kheeladi platform",
          desc: "Sports commerce frontend — React, Tailwind, GSAP slot-machine animations",
          tags: ["React", "GSAP", "Tailwind"],
        },
      ],
      edges: [
        [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 3], [1, 4], [2, 6], [6, 7],
      ],
    },
    text: {
      label: "// projects",
      title: "Things I've\nshipped.",
      body: "LLM pipelines, RL agents, CV systems, full-stack platforms. Each one a real problem with a real solution.",
    },
  },
  {
    id: "skills",
    cameraZ: -540,
    side: "left", // constellation on LEFT, text on RIGHT
    palette: {
      bg: "#0a0414",
      nodeColor: "#9F7AEA",
      edgeColor: "#6B46C1",
      textAccent: "#C4B5FD",
    },
    constellation: {
      name: "Machina",
      meaning: "the machine",
      cx: 0.22,
      cy: 0.5,
      nodes: [
        {
          id: "sk1", ox: -70, oy: -90, r: 2.6,
          label: "framework",
          name: "PyTorch",
          desc: "Primary deep learning framework — custom training loops, mixed precision, DDP",
          tags: ["Deep Learning", "Primary"],
        },
        {
          id: "sk2", ox: 40, oy: -100, r: 2.3,
          label: "ecosystem",
          name: "HuggingFace",
          desc: "Transformers, Datasets, PEFT — fine-tuning and inference pipelines",
          tags: ["Transformers", "PEFT"],
        },
        {
          id: "sk3", ox: 110, oy: -20, r: 2.0,
          label: "orchestration",
          name: "LangChain + DSPy",
          desc: "LLM orchestration, RAG pipelines, and programmatic prompt optimization",
          tags: ["RAG", "Agents", "DSPy"],
        },
        {
          id: "sk4", ox: 80, oy: 70, r: 1.8,
          label: "backend",
          name: "FastAPI + Node.js",
          desc: "ML model serving, async endpoints, real-time systems with Socket.io",
          tags: ["FastAPI", "Express", "Socket.io"],
        },
        {
          id: "sk5", ox: -20, oy: 95, r: 1.7,
          label: "frontend",
          name: "Next.js + React",
          desc: "Full-stack React apps — App Router, RSC, Tailwind, GSAP, Framer Motion",
          tags: ["Next.js", "GSAP", "Tailwind"],
        },
        {
          id: "sk6", ox: -100, oy: 40, r: 1.5,
          label: "infra",
          name: "Docker + AWS",
          desc: "Containerized ML environments, EC2, S3, Lambda, SageMaker deployments",
          tags: ["Docker", "AWS", "CI/CD"],
        },
        {
          id: "sk7", ox: -90, oy: -40, r: 1.4,
          label: "data",
          name: "Python ecosystem",
          desc: "NumPy, Pandas, scikit-learn, Matplotlib — the full data science stack",
          tags: ["NumPy", "Pandas", "sklearn"],
        },
        {
          id: "sk8", ox: 10, oy: -10, r: 1.3,
          label: "vision",
          name: "OpenCV + ONNX",
          desc: "Computer vision pipelines, model export, and edge device deployment",
          tags: ["OpenCV", "ONNX", "Edge"],
        },
        {
          id: "sk9", ox: 40, oy: -45, r: 1.2,
          label: "database",
          name: "PostgreSQL + Redis",
          desc: "Relational data with Prisma ORM, caching layers with Redis + Upstash",
          tags: ["PostgreSQL", "Prisma", "Redis"],
        },
      ],
      edges: [
        [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0], [0, 3], [1, 5], [2, 7], [7, 8],
      ],
    },
    text: {
      label: "// skills",
      title: "The stack\nI live in.",
      body: "From transformer fine-tuning to production deployments. Full-stack across the ML and web worlds.",
    },
  },
  {
    id: "contact",
    cameraZ: -720,
    side: "center",
    palette: {
      bg: "#0a0305",
      nodeColor: "#D4537E",
      edgeColor: "#993556",
      textAccent: "#ED93B1",
    },
    constellation: {
      name: "Nexus",
      meaning: "the meeting point",
      cx: 0.5,
      cy: 0.38,
      nodes: [
        {
          id: "c1", ox: 0, oy: -60, r: 2.4,
          label: "reach out",
          name: "Email",
          desc: "aranya@example.com — best for research collabs and opportunities",
          tags: ["Primary"],
        },
        {
          id: "c2", ox: 80, oy: 20, r: 2.0,
          label: "code",
          name: "GitHub",
          desc: "github.com/aranya — open source contributions and project repos",
          tags: ["OSS", "Projects"],
        },
        {
          id: "c3", ox: -80, oy: 20, r: 2.0,
          label: "connect",
          name: "LinkedIn",
          desc: "linkedin.com/in/aranya — professional network and research updates",
          tags: ["Professional"],
        },
        {
          id: "c4", ox: 40, oy: 80, r: 1.5,
          label: "research",
          name: "Google Scholar",
          desc: "Academic papers and citation profile",
          tags: ["Papers"],
        },
        {
          id: "c5", ox: -40, oy: 80, r: 1.5,
          label: "writing",
          name: "Blog",
          desc: "Technical writing on LLMs, RL, and AI systems",
          tags: ["Writing"],
        },
      ],
      edges: [
        [0, 1], [0, 2], [1, 3], [2, 4], [3, 4], [0, 3], [0, 4],
      ],
    },
    text: {
      label: "// contact",
      title: "Let's build\nsomething real.",
      body: "Open to research collaborations, full-time roles, and interesting problems. Based in India, working globally.",
    },
  },
];

export const SECTION_IDS = SECTIONS.map((s) => s.id);

/** Map scroll progress (0–1) to a section index (0–4). */
export function progressToSection(progress: number): number {
  if (progress < 0.125) return 0;
  if (progress < 0.375) return 1;
  if (progress < 0.625) return 2;
  if (progress < 0.875) return 3;
  return 4;
}

export const TOTAL_TRAVEL = -720;
