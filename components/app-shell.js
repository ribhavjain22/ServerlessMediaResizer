"use client";

import { useState } from "react";
import { Hero } from "@/components/hero";
import { ImageConverter } from "@/components/image-converter";
import { PdfCompressor } from "@/components/pdf-compressor";

const tabs = [
  { id: "image", label: "Image Studio" },
  { id: "pdf", label: "PDF Lab" }
];

export function AppShell() {
  const [activeTab, setActiveTab] = useState("image");

  return (
    <main className="page-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <header className="topbar">
        <div className="brand-mark">
          <span className="brand-dot" />
          <span>ConvertEase</span>
        </div>
        <nav className="segmented-nav" aria-label="Primary">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={tab.id === activeTab ? "nav-pill is-active" : "nav-pill"}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <section className="workspace-grid">
        <div className="workspace-main">
          <Hero activeTab={activeTab} setActiveTab={setActiveTab} />

          <div className="tool-stack">
            {activeTab === "image" ? <ImageConverter /> : <PdfCompressor />}
          </div>
        </div>

        <aside className="glass-panel capability-panel">
          <p className="eyebrow">Why this rebuild</p>
          <h2>Cleaner stack, calmer UI, sharper boundaries</h2>
          <ul className="feature-list">
            <li>Image conversion stays local in the browser.</li>
            <li>PDF compression is rebuilt behind a single Next.js API contract.</li>
            <li>The old Vue, Flask, and Ghostscript baggage is gone.</li>
          </ul>
        </aside>
      </section>
    </main>
  );
}
