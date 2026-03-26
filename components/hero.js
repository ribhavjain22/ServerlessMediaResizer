export function Hero({ activeTab, setActiveTab, activeTabMeta }) {
  return (
    <section className="hero hero-compact glass-panel">
      <div className="hero-copy compact-copy">
        <p className="eyebrow">Media utility, redesigned</p>
        <h1>Open fast, tap comfortably, finish quickly.</h1>
        <p className="hero-text">
          The active workflow sits directly below. Images stay local, while PDFs run through a
          background service built to survive longer jobs on mobile networks.
        </p>
        <div className="hero-actions">
          <button type="button" className="cta-primary" onClick={() => setActiveTab("image")}>
            Open Image Studio
          </button>
          <button type="button" className="cta-secondary" onClick={() => setActiveTab("pdf")}>
            Open PDF Lab
          </button>
        </div>
      </div>

      <div className="hero-card compact-stats">
        <div className="hero-stat">
          <span className="hero-stat-value">{activeTabMeta.shortLabel}</span>
          <span className="hero-stat-label">Current tool</span>
        </div>
        <div className="hero-stat">
          <span className="hero-stat-value">{activeTab === "image" ? "Local" : "API"}</span>
          <span className="hero-stat-label">Current processing path</span>
        </div>
        <div className="hero-stat">
          <span className="hero-stat-value">Ready</span>
          <span className="hero-stat-label">{activeTabMeta.summary}</span>
        </div>
      </div>
    </section>
  );
}
