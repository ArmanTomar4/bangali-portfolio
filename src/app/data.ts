export type Category = "project" | "skill" | "research" | "anchor";

export type NodeDatum = {
  id: string;
  category: Category;
  title: string;
  desc?: string;
  tags?: string[];
  link?: string;
};

export const ANCHOR: NodeDatum = {
  id: "anchor",
  category: "anchor",
  title: "Aranya Chatterjee",
  desc: "AI / ML Engineer",
};

export const PROJECTS: NodeDatum[] = [
  {
    id: "p1",
    category: "project",
    title: "LLM fine-tuner",
    desc: "LoRA-based fine-tuning pipeline with eval dashboard and model comparison UI.",
    tags: ["PyTorch", "LoRA", "Transformers"],
    link: "#",
  },
  {
    id: "p2",
    category: "project",
    title: "CV pipeline",
    desc: "Real-time object detection on edge devices via ONNX runtime export.",
    tags: ["YOLO", "ONNX", "FastAPI"],
    link: "#",
  },
  {
    id: "p3",
    category: "project",
    title: "RL agent",
    desc: "Multi-task reinforcement learning agent trained on custom sparse-reward Gym environments.",
    tags: ["PPO", "Gym", "NumPy"],
    link: "#",
  },
  {
    id: "p4",
    category: "project",
    title: "Semantic search",
    desc: "Dense retrieval system with FAISS indexing over 500k academic paper abstracts.",
    tags: ["FAISS", "BERT", "Flask"],
    link: "#",
  },
  {
    id: "p5",
    category: "project",
    title: "Diffusion explorer",
    desc: "Interactive latent space explorer for Stable Diffusion with real-time interpolation.",
    tags: ["Diffusers", "Gradio", "CUDA"],
    link: "#",
  },
  {
    id: "p6",
    category: "project",
    title: "Data pipeline",
    desc: "Scalable ETL pipeline for ML feature engineering on tabular datasets.",
    tags: ["Spark", "Airflow", "Pandas"],
    link: "#",
  },
  {
    id: "p7",
    category: "project",
    title: "NER system",
    desc: "Named entity recognition fine-tuned on legal documents with custom label schema.",
    tags: ["spaCy", "BERT", "Python"],
    link: "#",
  },
  {
    id: "p8",
    category: "project",
    title: "AutoML dashboard",
    desc: "Automated hyperparameter search dashboard with experiment tracking.",
    tags: ["Optuna", "MLflow", "React"],
    link: "#",
  },
];

export const SKILLS: NodeDatum[] = [
  {
    id: "s1",
    category: "skill",
    title: "PyTorch",
    desc: "Primary deep learning framework — custom training loops, mixed precision, DDP.",
  },
  {
    id: "s2",
    category: "skill",
    title: "HuggingFace",
    desc: "Transformers, Datasets, PEFT — fine-tuning and inference pipelines.",
  },
  {
    id: "s3",
    category: "skill",
    title: "LangChain",
    desc: "LLM orchestration, RAG pipelines, tool-calling agents.",
  },
  {
    id: "s4",
    category: "skill",
    title: "FastAPI",
    desc: "ML model serving, async endpoints, automatic OpenAPI docs.",
  },
  {
    id: "s5",
    category: "skill",
    title: "Docker",
    desc: "Containerized ML environments, multi-stage builds, Compose stacks.",
  },
  {
    id: "s6",
    category: "skill",
    title: "AWS",
    desc: "EC2, S3, Lambda, SageMaker — cloud training and deployment.",
  },
  {
    id: "s7",
    category: "skill",
    title: "React",
    desc: "Frontend for ML dashboards and demo UIs — hooks, context, Vite.",
  },
  {
    id: "s8",
    category: "skill",
    title: "ONNX",
    desc: "Cross-framework model export and edge deployment optimization.",
  },
  {
    id: "s9",
    category: "skill",
    title: "NumPy / Pandas",
    desc: "Numerical computing, data manipulation, feature engineering foundations.",
  },
  {
    id: "s10",
    category: "skill",
    title: "Kubernetes",
    desc: "Orchestrating containerized inference services at scale.",
  },
];

export const RESEARCH: NodeDatum[] = [
  {
    id: "r1",
    category: "research",
    title: "RL sparse rewards",
    desc: "Novel reward shaping approach for multi-task RL, 94.2% benchmark — NeurIPS submission.",
    tags: ["NeurIPS", "2024"],
    link: "#",
  },
  {
    id: "r2",
    category: "research",
    title: "LLM calibration",
    desc: "Studying overconfidence in instruction-tuned models across factual QA tasks.",
    tags: ["EMNLP", "2024"],
    link: "#",
  },
  {
    id: "r3",
    category: "research",
    title: "Edge CV survey",
    desc: "Survey of compression techniques for computer vision on constrained hardware.",
    tags: ["Survey", "IEEE"],
    link: "#",
  },
  {
    id: "r4",
    category: "research",
    title: "RLHF analysis",
    desc: "Empirical analysis of reward model collapse in RLHF training pipelines.",
    tags: ["ICLR", "2025"],
    link: "#",
  },
  {
    id: "r5",
    category: "research",
    title: "Continual learning",
    desc: "Catastrophic forgetting mitigation using elastic weight consolidation variants.",
    tags: ["Workshop", "ICML"],
    link: "#",
  },
  {
    id: "r6",
    category: "research",
    title: "Attention patterns",
    desc: "Visualizing and interpreting attention head specialization in BERT variants.",
    tags: ["Interpretability"],
    link: "#",
  },
];

export const CATEGORY_COLORS: Record<Category, string> = {
  anchor: "#e8e6ff",
  project: "#7f77dd",
  skill: "#1d9e75",
  research: "#d4537e",
};

export const CATEGORY_LABELS: Record<Category, string> = {
  anchor: "you",
  project: "project",
  skill: "skill",
  research: "research",
};

export const CTA_LABELS: Record<Category, string> = {
  anchor: "",
  project: "view project →",
  skill: "see repo →",
  research: "read paper →",
};
