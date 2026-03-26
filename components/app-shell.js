"use client";

import { useEffect, useMemo, useState } from "react";
import { Hero } from "@/components/hero";
import { ImageConverter } from "@/components/image-converter";
import { PdfCompressor } from "@/components/pdf-compressor";

const tabs = [
  {
    id: "image",
    label: "Image Studio",
    shortLabel: "Images",
    summary: "Resize and reduce photos locally.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 6.5A1.5 1.5 0 0 1 6.5 5h11A1.5 1.5 0 0 1 19 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 17.5z" />
        <path d="M8 15.5 11 12l2.5 3 1.5-2 2 2.5" />
        <path d="M9 9.5h.01" />
      </svg>
    )
  },
  {
    id: "pdf",
    label: "PDF Lab",
    shortLabel: "PDF",
    summary: "Background compression with target-size control.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 4.5h6l4 4v10A1.5 1.5 0 0 1 16.5 20h-9A1.5 1.5 0 0 1 6 18.5v-12A1.5 1.5 0 0 1 7.5 5z" />
        <path d="M14 4.5v4h4" />
        <path d="M8.5 15.5h7" />
        <path d="M8.5 12.5h5" />
      </svg>
    )
  }
];

export function AppShell() {
  const [activeTab, setActiveTab] = useState("image");
  const [installEvent, setInstallEvent] = useState(null);
  const [installStatus, setInstallStatus] = useState("");

  const activeTabMeta = useMemo(
    () => tabs.find((tab) => tab.id === activeTab) ?? tabs[0],
    [activeTab]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextTool = params.get("tool");
    if (tabs.some((tab) => tab.id === nextTool)) {
      setActiveTab(nextTool);
    }
  }, []);

  useEffect(() => {
    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      setInstallEvent(event);
    }

    function handleInstalled() {
      setInstallEvent(null);
      setInstallStatus("Installed");
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!installEvent) {
      setInstallStatus("Use Chrome's Add to Home screen if the install prompt is not available yet.");
      return;
    }

    installEvent.prompt();
    const result = await installEvent.userChoice;
    if (result.outcome === "accepted") {
      setInstallStatus("App install started.");
      setInstallEvent(null);
    } else {
      setInstallStatus("Install dismissed for now.");
    }
  }

  return (
    <main className="page-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <div className="content-frame">
        <header className="topbar">
          <div className="brand-wrap">
            <div className="brand-mark">
              <span className="brand-dot" />
              <span>ConvertEase</span>
            </div>
            <p className="brand-subtitle">Mobile-first media tools, tuned for quick touch workflows.</p>
          </div>

          <nav className="segmented-nav desktop-nav" aria-label="Primary">
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
            <Hero activeTab={activeTab} setActiveTab={setActiveTab} activeTabMeta={activeTabMeta} />

            <div className="mobile-tab-strip" aria-label="Tool switcher">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={tab.id === activeTab ? "tool-chip is-active" : "tool-chip"}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="tool-stack">
              {activeTab === "image" ? <ImageConverter /> : <PdfCompressor />}
            </div>
          </div>

          <aside className="sidebar-stack">
            <section className="glass-panel install-panel">
              <div>
                <p className="eyebrow">Install App</p>
                <h2>Pin ConvertEase to your home screen</h2>
                <p className="panel-text">
                  Open faster in standalone mode on mobile Chrome, with the same image and PDF tools.
                </p>
              </div>
              <button type="button" className="cta-primary install-button" onClick={handleInstall}>
                Install app
              </button>
              <p className="install-hint">
                {installStatus || "If the prompt does not appear, open Chrome menu and choose Add to Home screen."}
              </p>
            </section>

            <aside className="glass-panel capability-panel">
              <p className="eyebrow">Why this rebuild</p>
              <h2>Cleaner stack, calmer UI, sharper boundaries</h2>
              <ul className="feature-list">
                <li>Image conversion stays local in the browser.</li>
                <li>PDF compression now runs as an async background job on Render.</li>
                <li>The app can be installed from Chrome with a standalone mobile shell.</li>
              </ul>
            </aside>
          </aside>
        </section>
      </div>

      <nav className="bottom-nav" aria-label="Bottom navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={tab.id === activeTab ? "bottom-nav-item is-active" : "bottom-nav-item"}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="bottom-nav-icon">{tab.icon}</span>
            <span>{tab.shortLabel}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}
