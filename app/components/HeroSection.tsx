import CorelyDiagram from "./CorelyDiagram";

// ─── Stat item ────────────────────────────────────────────────────────────────
interface StatProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}

function StatItem({ icon, value, label }: StatProps) {
  return (
    <div className="hero-stat">
      <div className="hero-stat-icon">{icon}</div>
      <div className="hero-stat-content">
        <span className="hero-stat-value">{value}</span>
        <span className="hero-stat-label">{label}</span>
      </div>
    </div>
  );
}

// ─── Trust logo ───────────────────────────────────────────────────────────────
interface TrustLogoProps {
  icon: React.ReactNode;
  name: string;
}

function TrustLogo({ icon, name }: TrustLogoProps) {
  return (
    <span className="hero-logo-item">
      {icon}
      {name}
    </span>
  );
}

// ─── Hand-drawn underline SVG ─────────────────────────────────────────────────
function Underline() {
  return (
    <svg
      viewBox="0 0 520 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="hero-heading-underline"
      style={{ width: "100%", maxWidth: "520px", height: "18px" }}
      aria-hidden="true"
    >
      <path
        d="M4 12 C60 4, 140 16, 220 10 C300 4, 380 16, 460 8 C490 5, 510 12, 516 11"
        stroke="#ff5c00"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 600,
          strokeDashoffset: 600,
          animation: "draw-underline 1.2s cubic-bezier(0.4,0,0.2,1) 0.7s forwards",
        }}
      />
      <style>{`
        @keyframes draw-underline {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </svg>
  );
}

// ─── Main Hero Section ────────────────────────────────────────────────────────
export default function HeroSection() {
  return (
    <section className="hero-section" aria-label="Hero">
      <div className="hero-inner">

        {/* ── LEFT CONTENT ── */}
        <div className="hero-left">

          {/* Badge */}
          <div className="hero-badge animate-fade-up">
            <span className="hero-badge-dot" aria-hidden="true" />
            <span className="hero-badge-text">Introducing the Future of Organizational Intelligence</span>
          </div>

          {/* Heading */}
          <h1 className="hero-heading animate-fade-up-delay-1">
            <span className="hero-heading-line">Your Company Has Data.</span>
            <span className="hero-heading-line">Now Give It</span>
            <span className="hero-heading-line orange-italic">
              INTELLIGENCE.
              <Underline />
            </span>
          </h1>

          {/* Description */}
          <p className="hero-desc animate-fade-up-delay-2">
            Corely transforms fragmented company knowledge into a unified
            intelligence layer that understands context, remembers what
            matters, and acts across your organization.
          </p>

          {/* CTAs */}
          <div className="hero-ctas animate-fade-up-delay-3">
            <a href="#" className="btn-primary" id="hero-cta-primary">
              See Corely in Action
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                <path d="M1 7.5h13M8 2l6 5.5L8 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a href="#architecture" className="btn-secondary" id="hero-cta-secondary">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <path d="M11.5 9v6M9 11.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Explore Architecture
            </a>
          </div>

          {/* Trust signals */}
          <div className="hero-trust animate-fade-up-delay-4">
            <div className="hero-trust-label">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M7 1l1.545 3.13L12 4.635l-2.5 2.435.59 3.44L7 8.865l-3.09 1.645.59-3.44L2 4.635l3.455-.505L7 1z" stroke="#9ca3af" strokeWidth="1.2" fill="none"/>
              </svg>
              Built for modern enterprise teams
            </div>
            <div className="hero-logos">
              <TrustLogo
                icon={
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6" stroke="#9ca3af" strokeWidth="1.3"/>
                    <path d="M4 7h6M7 4v6" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                }
                name="Linear"
              />
              <TrustLogo
                icon={
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 12L7 2l5 10H2z" stroke="#9ca3af" strokeWidth="1.3" fill="none"/>
                  </svg>
                }
                name="Vercel"
              />
              <TrustLogo
                icon={
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 12l3-8 2 5 2-3 3 6" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                }
                name="Ramp"
              />
              <TrustLogo
                icon={
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="2" y="2" width="10" height="10" rx="2" stroke="#9ca3af" strokeWidth="1.3" fill="none"/>
                    <path d="M5 5h4M5 7h4M5 9h2" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                }
                name="Notion"
              />
              <TrustLogo
                icon={
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="5.5" stroke="#9ca3af" strokeWidth="1.2" fill="none"/>
                    <path d="M4.5 7c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5" stroke="#9ca3af" strokeWidth="1.1" strokeLinecap="round" fill="none"/>
                  </svg>
                }
                name="HubSpot"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="hero-stats animate-fade-up-delay-5">
            <StatItem
              icon={
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <ellipse cx="9" cy="5" rx="7" ry="3" stroke="#ff5c00" strokeWidth="1.5" fill="none"/>
                  <path d="M2 5v4c0 1.657 3.134 3 7 3s7-1.343 7-3V5" stroke="#ff5c00" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                  <path d="M2 9v4c0 1.657 3.134 3 7 3s7-1.343 7-3V9" stroke="#ff5c00" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                </svg>
              }
              value="100+"
              label={"Data Sources\nConnected"}
            />
            <StatItem
              icon={
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M9 2l2 5h5l-4 3 1.5 5L9 12l-4.5 3L6 10 2 7h5L9 2z" stroke="#ff5c00" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
                </svg>
              }
              value="95%"
              label={"Faster Knowledge\nRetrieval"}
            />
            <StatItem
              icon={
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <circle cx="9" cy="8" r="5" stroke="#ff5c00" strokeWidth="1.5" fill="none"/>
                  <path d="M6 14.5c0-1.657 1.343-3 3-3s3 1.343 3 3" stroke="#ff5c00" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                  <path d="M9 5.5v3l2 1" stroke="#ff5c00" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
                </svg>
              }
              value="Persistent"
              label={"Organizational\nMemory"}
            />
            <StatItem
              icon={
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <rect x="3" y="3" width="12" height="12" rx="3" stroke="#ff5c00" strokeWidth="1.5" fill="none"/>
                  <path d="M9 6.5V9m0 2.5h.01" stroke="#ff5c00" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              }
              value="Enterprise"
              label={"Grade Security\n& Compliance"}
            />
          </div>
        </div>

        {/* ── RIGHT DIAGRAM ── */}
        <div className="hero-right animate-fade-in-right">
          <CorelyDiagram />
        </div>

      </div>
    </section>
  );
}
