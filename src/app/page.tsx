"use client";

import { useState } from "react";
import Universe from "./Universe";
import Panel from "./Panel";
import Overlay from "./Overlay";
import { NodeDatum } from "./data";

export default function Home() {
  const [selected, setSelected] = useState<NodeDatum | null>(null);

  return (
    <main className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#04040d]">
      <Universe
        onNodeClick={(node) => setSelected(node)}
        selectedId={selected?.id ?? null}
      />
      <Overlay />
      <Panel node={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
