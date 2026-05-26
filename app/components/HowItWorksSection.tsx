"use client";

// ─── Engine icons ─────────────────────────────────────────────────────────────
function ContextEngineIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="13" r="5" stroke="#ff5c00" strokeWidth="1.8" fill="none" />
      <path d="M13 2v4M13 20v4M2 13h4M20 13h4" stroke="#ff5c00" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5.05 5.05l2.83 2.83M18.12 18.12l2.83 2.83M5.05 20.95l2.83-2.83M18.12 7.88l2.83-2.83" stroke="#ff5c00" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MemoryLayerIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <ellipse cx="13" cy="7" rx="9" ry="3.5" stroke="#ff5c00" strokeWidth="1.8" fill="none" />
      <path d="M4 7v5c0 1.933 4.03 3.5 9 3.5s9-1.567 9-3.5V7" stroke="#ff5c00" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M4 12v5c0 1.933 4.03 3.5 9 3.5s9-1.567 9-3.5v-5" stroke="#ff5c00" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function ReasoningCoreIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="13" r="4" stroke="#ff5c00" strokeWidth="1.8" fill="none" />
      <circle cx="5" cy="7"  r="2" stroke="#ff5c00" strokeWidth="1.5" fill="none" />
      <circle cx="21" cy="7"  r="2" stroke="#ff5c00" strokeWidth="1.5" fill="none" />
      <circle cx="5" cy="19" r="2" stroke="#ff5c00" strokeWidth="1.5" fill="none" />
      <circle cx="21" cy="19" r="2" stroke="#ff5c00" strokeWidth="1.5" fill="none" />
      <line x1="7" y1="8.5" x2="10" y2="11" stroke="#ff5c00" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="19" y1="8.5" x2="16" y2="11" stroke="#ff5c00" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="7" y1="17.5" x2="10" y2="15" stroke="#ff5c00" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="19" y1="17.5" x2="16" y2="15" stroke="#ff5c00" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ActionEngineIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <path d="M14 3L5 15h8l-1 8 9-13h-8l1-7z" stroke="#ff5c00" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// ─── Bottom feature icons ─────────────────────────────────────────────────────
function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M11 2l7 3v5c0 4.5-3 8-7 9C7 18 4 14.5 4 10V5l7-3z" stroke="#ff5c00" strokeWidth="1.7" fill="none" strokeLinejoin="round" />
      <path d="M8 11l2 2 4-4" stroke="#ff5c00" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M11 4c-1.5 0-3 1-3 2.5 0 .4.1.8.3 1.1C7.5 8 7 8.7 7 9.5c0 .6.3 1.2.7 1.6C7.3 11.5 7 12.2 7 13c0 1.5 1.5 2.5 3 2.5V4z" stroke="#ff5c00" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
      <path d="M11 4c1.5 0 3 1 3 2.5 0 .4-.1.8-.3 1.1.8.4 1.3 1.1 1.3 1.9 0 .6-.3 1.2-.7 1.6.4.4.7 1.1.7 1.9 0 1.5-1.5 2.5-3 2.5V4z" stroke="#ff5c00" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
      <line x1="11" y1="7" x2="11" y2="15.5" stroke="#ff5c00" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8 18h6" stroke="#ff5c00" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11" y1="15.5" x2="11" y2="18" stroke="#ff5c00" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M11 2l2 6h6l-5 4 2 6-5-3.5L6 18l2-6-5-4h6l2-6z" stroke="#ff5c00" strokeWidth="1.6" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M13 2L5 12h7l-3 8 10-11h-7l3-7z" stroke="#ff5c00" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="4" y="10" width="14" height="10" rx="2.5" stroke="#ff5c00" strokeWidth="1.7" fill="none" />
      <path d="M7.5 10V7a3.5 3.5 0 017 0v3" stroke="#ff5c00" strokeWidth="1.7" strokeLinecap="round" fill="none" />
      <circle cx="11" cy="15" r="1.5" fill="#ff5c00" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="8" cy="7" r="3" stroke="#ff5c00" strokeWidth="1.7" fill="none" />
      <path d="M2 19c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="#ff5c00" strokeWidth="1.7" strokeLinecap="round" fill="none" />
      <circle cx="16" cy="7" r="2.5" stroke="#ff5c00" strokeWidth="1.5" fill="none" />
      <path d="M14 19c.3-2.5 2-4.5 4-5" stroke="#ff5c00" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// ─── Engine Card ─────────────────────────────────────────────────────────────
function EngineCard({
  icon,
  title,
  desc,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent?: boolean;
}) {
  return (
    <div className={`engine-card${accent ? " engine-card--accent" : ""}`}>
      <div className="engine-card-icon">{icon}</div>
      <div className="engine-card-body">
        <h3 className="engine-card-title">{title}</h3>
        <p className="engine-card-desc">{desc}</p>
      </div>
    </div>
  );
}

// ─── Bottom Feature ───────────────────────────────────────────────────────────
function FeatureItem({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="how-feature-item">
      <div className="how-feature-icon">{icon}</div>
      <div className="how-feature-body">
        <span className="how-feature-title">{title}</span>
        <span className="how-feature-desc">{desc}</span>
      </div>
    </div>
  );
}

// ─── Section Heading underline ─────────────────────────────────────────────────
function HowUnderline() {
  return (
    <svg
      viewBox="0 0 380 16"
      fill="none"
      style={{ width: "380px", maxWidth: "100%", height: "14px", display: "block" }}
      aria-hidden="true"
    >
      <path
        d="M4 10 C60 3, 140 14, 220 8 C300 3, 350 13, 376 9"
        stroke="#ff5c00"
        strokeWidth="3"
        strokeLinecap="round"
        style={{
          strokeDasharray: 480,
          strokeDashoffset: 480,
          animation: "draw-underline 1.2s cubic-bezier(0.4,0,0.2,1) 0.5s forwards",
        }}
      />
    </svg>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function HowItWorksSection() {
  return (
    <section className="how-section" id="features" aria-label="How Corely Works">
      {/* Subtle background texture */}
      <div className="how-bg-gradient" aria-hidden="true" />

      <div className="how-inner">

        {/* ── SECTION LABEL ── */}
        <div className="how-label-row">
          <span className="how-label-line" aria-hidden="true" />
          <span className="how-label">How Corely Works</span>
          <span className="how-label-line" aria-hidden="true" />
        </div>

        {/* ── MAIN HEADING ── */}
        <div className="how-heading-wrap">
          <h2 className="how-heading">
            <span className="how-heading-black">One Layer.&nbsp;</span>
            <span className="how-heading-orange">
              Infinite Intelligence.
            </span>
          </h2>
          <div className="how-heading-underline-wrap">
            <HowUnderline />
          </div>
        </div>

        {/* ── SUBTEXT ── */}
        <p className="how-subtext">
          Corely connects your data, understands your context, builds memory that lasts,<br />
          and powers intelligent action across your organization.
        </p>

        {/* ── INTELLIGENCE LAYER LABEL ── */}
        <div className="how-layer-label-wrap">
          <span className="how-layer-label">Corely Intelligence Layer</span>
        </div>

        {/* ── ENGINE CARDS 2×2 ── */}
        <div className="engine-cards-grid">
          <EngineCard
            icon={<ContextEngineIcon />}
            title="Context Engine"
            desc="Understands people, teams, projects and workflows across your entire organization."
          />
          <EngineCard
            icon={<MemoryLayerIcon />}
            title="Memory Layer"
            desc="Retains knowledge that matters across time and tools — nothing gets lost."
            accent
          />
          <EngineCard
            icon={<ReasoningCoreIcon />}
            title="Reasoning Core"
            desc="Synthesizes insights from complex, fragmented data to surface what matters most."
            accent
          />
          <EngineCard
            icon={<ActionEngineIcon />}
            title="Action Engine"
            desc="Takes action across tools and systems on your behalf — automatically."
          />
        </div>

        {/* ── BOTTOM FEATURES STRIP ── */}
        <div className="how-features-strip">
          <FeatureItem
            icon={<ShieldIcon />}
            title="Unified Context"
            desc="Brings all your data and teams into one understanding."
          />
          <div className="how-features-divider" aria-hidden="true" />
          <FeatureItem
            icon={<BrainIcon />}
            title="Persistent Memory"
            desc="Remembers what matters across time, projects, and people."
          />
          <div className="how-features-divider" aria-hidden="true" />
          <FeatureItem
            icon={<StarIcon />}
            title="Intelligent Reasoning"
            desc="Understands relationships, patterns, and what's really important."
          />
          <div className="how-features-divider" aria-hidden="true" />
          <FeatureItem
            icon={<BoltIcon />}
            title="Action at Scale"
            desc="Executes across systems so your team can move faster."
          />
          <div className="how-features-divider" aria-hidden="true" />
          <FeatureItem
            icon={<LockIcon />}
            title="Enterprise Grade"
            desc="Built with security, privacy, and compliance at every layer."
          />
          <div className="how-features-divider" aria-hidden="true" />
          <FeatureItem
            icon={<PeopleIcon />}
            title="People Amplified"
            desc="AI that empowers people — not replaces them."
          />
        </div>

        {/* ── TAGLINE ── */}
        <div className="how-tagline">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 1l1.2 4.8H14L10.4 8.6l1.4 4.8L8 11l-3.8 2.4 1.4-4.8L2 5.8h4.8L8 1z" fill="#ff5c00" />
          </svg>
          <p className="how-tagline-text">
            Corely turns fragmented knowledge into your organization&apos;s{" "}
            <span className="how-tagline-orange">unfair advantage.</span>
          </p>
        </div>

      </div>
    </section>
  );
}
