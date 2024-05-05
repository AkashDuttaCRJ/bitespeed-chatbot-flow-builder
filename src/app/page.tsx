"use client";

import { Flow } from "@/components/flow";
import { ReactFlowProvider } from "reactflow";

export default function Home() {
  return (
    <main>
      <ReactFlowProvider>
        <Flow />
      </ReactFlowProvider>
    </main>
  );
}
