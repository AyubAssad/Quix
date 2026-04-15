export default function HeroVisual() {
  return (
    <div className="hero-visual">
      <div className="hero-glow hero-glow-one" />
      <div className="hero-glow hero-glow-two" />

      <div className="hero-device">
        <div className="hero-device-top">
          <div className="hero-device-badge">Q</div>
          <div>
            <strong>Quix</strong>
            <div className="muted">Master your subjects through play</div>
          </div>
        </div>

        <div className="hero-mini-card">
          <div className="hero-line short" />
          <div className="hero-line" />
          <div className="hero-line" />
        </div>

        <div className="hero-mini-card">
          <div className="hero-mini-grid">
            <div className="hero-mini-tile active">Stage</div>
            <div className="hero-mini-tile">Block</div>
            <div className="hero-mini-tile">Module</div>
          </div>
        </div>
      </div>
      <div className="hero-books">
        <div className="hero-book hero-book-one" />
        <div className="hero-book hero-book-two" />
        <div className="hero-book hero-book-three" />
      </div>
    </div>
  );
}
