export function Hero({ activeTab, setActiveTab }) {
  return (
    <section className="hero hero-compact glass-panel">
      <div className="hero-copy compact-copy">
        <p className="eyebrow">Media utility, redesigned</p>
        <h1>Use the tool first. Read the pitch later.</h1>
        <p className="hero-text">
          The active converter is right below. Images stay local, and PDFs run through a
          cleaner service path with explicit modes.
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
          <span className="hero-stat-value">2</span>
          <span className="hero-stat-label">Focused workflows</span>
        </div>
        <div className="hero-stat">
          <span className="hero-stat-value">{activeTab === "image" ? "Local" : "API"}</span>
          <span className="hero-stat-label">Current processing path</span>
        </div>
        <div className="hero-stat">
          <span className="hero-stat-value">Fresh</span>
          <span className="hero-stat-label">UI and service architecture</span>
        </div>
      </div>
    </section>
  );
}
