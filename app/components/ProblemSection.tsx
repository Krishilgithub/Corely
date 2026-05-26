// ─── Problem Section ──────────────────────────────────────────────────────────

function PainCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="pain-card">
      <div className="pain-card-icon">{icon}</div>
      <div className="pain-card-body">
        <h3 className="pain-card-title">{title}</h3>
        <p className="pain-card-desc">{desc}</p>
      </div>
    </div>
  );
}

function StatItem({
  value,
  label,
  icon,
  orange,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
  orange?: boolean;
}) {
  return (
    <div className="prob-stat-item">
      <div className="prob-stat-icon">{icon}</div>
      <div className="prob-stat-body">
        <span className={`prob-stat-value${orange ? " orange" : ""}`}>{value}</span>
        <span className="prob-stat-label">{label}</span>
      </div>
    </div>
  );
}

// Hand-drawn underline for "Your Intelligence Is Nowhere."
function ProblemUnderline() {
  return (
    <svg
      viewBox="0 0 490 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", maxWidth: "490px", height: "16px", display: "block" }}
      aria-hidden="true"
    >
      <path
        d="M4 11 C70 3, 160 16, 250 9 C340 3, 420 15, 486 10"
        stroke="#ff5c00"
        strokeWidth="3.5"
        strokeLinecap="round"
        style={{
          strokeDasharray: 560,
          strokeDashoffset: 560,
          animation: "draw-underline 1.3s cubic-bezier(0.4,0,0.2,1) 0.4s forwards",
        }}
      />
    </svg>
  );
}

export default function ProblemSection() {
  return (
    <section className="prob-section" id="problem" aria-label="The Problem">
      {/* Decorative dot grids */}
      <span className="prob-dot-grid prob-dot-grid--tl" aria-hidden="true" />
      <span className="prob-dot-grid prob-dot-grid--br" aria-hidden="true" />

      <div className="prob-inner">

        {/* ── HEADER ── */}
        <div className="prob-header">
          <span className="prob-label">The Problem</span>

          <h2 className="prob-heading">
            <span className="prob-heading-black">Your Knowledge Is Everywhere.</span>
            <span className="prob-heading-orange">
              Your Intelligence Is Nowhere.
              <ProblemUnderline />
            </span>
          </h2>

          <p className="prob-desc">
            Modern organizations operate across disconnected tools,
            fragmented conversations, scattered documents, and
            siloed systems — making knowledge impossible to
            access when it matters most.
          </p>
        </div>

        {/* ── PAIN CARDS ── */}
        <div className="pain-cards-row">
          <PainCard
            icon={
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <circle cx="14" cy="14" r="11" stroke="#ff5c00" strokeWidth="1.8" fill="none" />
                <path d="M14 8v6l4 2" stroke="#ff5c00" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            title="Time Lost Searching"
            desc="Teams waste hours searching across tools."
          />
          <PainCard
            icon={
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <circle cx="14" cy="14" r="3" stroke="#ff5c00" strokeWidth="1.8" fill="none" />
                <circle cx="6" cy="8"  r="2" stroke="#ff5c00" strokeWidth="1.6" fill="none" />
                <circle cx="22" cy="8"  r="2" stroke="#ff5c00" strokeWidth="1.6" fill="none" />
                <circle cx="6" cy="20" r="2" stroke="#ff5c00" strokeWidth="1.6" fill="none" />
                <circle cx="22" cy="20" r="2" stroke="#ff5c00" strokeWidth="1.6" fill="none" />
                <line x1="8" y1="9" x2="12" y2="13" stroke="#ff5c00" strokeWidth="1.4" strokeLinecap="round" />
                <line x1="20" y1="9" x2="16" y2="13" stroke="#ff5c00" strokeWidth="1.4" strokeLinecap="round" />
                <line x1="8" y1="19" x2="12" y2="15" stroke="#ff5c00" strokeWidth="1.4" strokeLinecap="round" />
                <line x1="20" y1="19" x2="16" y2="15" stroke="#ff5c00" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            }
            title="Knowledge Silos"
            desc="Critical insights stay trapped in isolated systems."
          />
          <PainCard
            icon={
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <path d="M14 4L25 23H3L14 4z" stroke="#ff5c00" strokeWidth="1.8" fill="none" strokeLinejoin="round" />
                <path d="M14 12v5" stroke="#ff5c00" strokeWidth="2" strokeLinecap="round" />
                <circle cx="14" cy="19.5" r="1" fill="#ff5c00" />
              </svg>
            }
            title="Delayed Decisions"
            desc="Disconnected context slows business execution."
          />
        </div>

        {/* ── STATS ROW ── */}
        <div className="prob-stats-row">
          <StatItem
            icon={
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                <path d="M3 16l5-5 4 4 7-9" stroke="#ff5c00" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            value="30%"
            label="Productivity Lost"
            orange
          />
          <div className="prob-stats-divider" aria-hidden="true" />
          <StatItem
            icon={
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                <rect x="3" y="3" width="6" height="6" rx="1.5" stroke="#ff5c00" strokeWidth="1.7" fill="none" />
                <rect x="13" y="3" width="6" height="6" rx="1.5" stroke="#ff5c00" strokeWidth="1.7" fill="none" />
                <rect x="3" y="13" width="6" height="6" rx="1.5" stroke="#ff5c00" strokeWidth="1.7" fill="none" />
                <rect x="13" y="13" width="6" height="6" rx="1.5" stroke="#ff5c00" strokeWidth="1.7" fill="none" />
              </svg>
            }
            value="8+"
            label="Tools Per Team"
          />
          <div className="prob-stats-divider" aria-hidden="true" />
          <StatItem
            icon={
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="8" stroke="#ff5c00" strokeWidth="1.7" fill="none" />
                <path d="M11 7v4l3 2" stroke="#ff5c00" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            }
            value="Hours"
            label="Wasted Weekly"
            orange
          />
          <div className="prob-stats-divider" aria-hidden="true" />
          <StatItem
            icon={
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                <ellipse cx="11" cy="11" rx="8" ry="5" stroke="#ff5c00" strokeWidth="1.7" fill="none" />
                <line x1="4" y1="4" x2="18" y2="18" stroke="#ff5c00" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            }
            value="Critical"
            label="Context Missing"
            orange
          />
        </div>

        {/* ── BOTTOM CTA ── */}
        <div className="prob-cta">
          <p className="prob-cta-text">This is exactly why Corely exists.</p>
          <a href="#features" className="prob-cta-btn" id="problem-cta-btn">
            See How Corely Connects Everything
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M1 8h14M9 2l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>

      </div>
    </section>
  );
}
