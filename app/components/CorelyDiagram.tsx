"use client";

// ─── SVG integration icons ────────────────────────────────────────────────────
function SlackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="1" y="1" width="20" height="20" rx="5" fill="#4A154B" />
      <path d="M7.5 13.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 0V9m3-3a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 0v4.5m3 6a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 0V13m3-3a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 0v-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function NotionIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="1" y="1" width="20" height="20" rx="5" fill="#ffffff" stroke="#e8e8e8" />
      <text x="11" y="16" textAnchor="middle" fontSize="13" fontWeight="800" fill="#000">N</text>
    </svg>
  );
}

function DriveIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M11 3L20 18H2L11 3z" fill="#0FA958" opacity="0.9"/>
      <path d="M2 18L7.5 8.5L13 18H2z" fill="#4285F4" opacity="0.9"/>
      <path d="M20 18L14.5 8.5L9.5 18H20z" fill="#FBBC04" opacity="0.9"/>
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="1" y="1" width="20" height="20" rx="5" fill="#0078D4" />
      <path d="M4 7l7 5 7-5M4 7h14v10H4V7z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="1" y="1" width="20" height="20" rx="5" fill="#1A73E8" />
      <rect x="5" y="13" width="3" height="5" rx="1" fill="white" opacity="0.9"/>
      <rect x="9.5" y="10" width="3" height="8" rx="1" fill="white"/>
      <rect x="14" y="7" width="3" height="11" rx="1" fill="white" opacity="0.9"/>
    </svg>
  );
}

function CRMIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="1" y="1" width="20" height="20" rx="5" fill="#0F4C8A" />
      <circle cx="11" cy="9" r="3" stroke="white" strokeWidth="1.5" fill="none"/>
      <path d="M4 19c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

function MeetingsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="1" y="1" width="20" height="20" rx="5" fill="#2D8CFF" />
      <rect x="3" y="7" width="11" height="9" rx="2" fill="white" opacity="0.9"/>
      <path d="M14 10.5l5-3v7l-5-3v-1z" fill="white"/>
    </svg>
  );
}

function ReportsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="1" y="1" width="20" height="20" rx="5" fill="#E8F4FD" stroke="#e8e8e8"/>
      <path d="M11 11m-7 0a7 7 0 1014 0A7 7 0 004 11z" stroke="#1A73E8" strokeWidth="1.5" fill="none"/>
      <path d="M11 11L11 4.5" stroke="#1A73E8" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M11 11L16 15" stroke="#34A853" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function DocumentsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="1" y="1" width="20" height="20" rx="5" fill="#F1F3F4" stroke="#e8e8e8"/>
      <rect x="5" y="6" width="12" height="2" rx="1" fill="#5F6368"/>
      <rect x="5" y="10" width="10" height="2" rx="1" fill="#5F6368" opacity="0.7"/>
      <rect x="5" y="14" width="8" height="2" rx="1" fill="#5F6368" opacity="0.5"/>
    </svg>
  );
}

// ─── Integration card ─────────────────────────────────────────────────────────
interface IntegrationCardProps {
  icon: React.ReactNode;
  label: string;
  x: number;
  y: number;
  delay?: number;
}

function IntegrationCard({ icon, label, x, y, delay = 0 }: IntegrationCardProps) {
  return (
    <foreignObject
      x={x}
      y={y}
      width="120"
      height="44"
      style={{ overflow: "visible" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "white",
          border: "1.5px solid #f0f0f0",
          borderRadius: "10px",
          padding: "8px 12px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          fontSize: "13px",
          fontWeight: 600,
          color: "#1a1a1a",
          fontFamily: "Space Grotesk, Helvetica Neue, sans-serif",
          animation: `float-card 4s ease-in-out ${delay}s infinite`,
          whiteSpace: "nowrap",
        }}
      >
        {icon}
        {label}
      </div>
    </foreignObject>
  );
}

// ─── Engine label ─────────────────────────────────────────────────────────────
interface EngineLabelProps {
  label: string;
  x: number;
  y: number;
}

function EngineLabel({ label, x, y }: EngineLabelProps) {
  return (
    <foreignObject x={x} y={y} width="110" height="26" style={{ overflow: "visible" }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "white",
          border: "1px solid #e0e0e0",
          borderRadius: "100px",
          padding: "3px 10px",
          fontSize: "9px",
          fontWeight: 700,
          color: "#6b7280",
          fontFamily: "Space Grotesk, Helvetica Neue, sans-serif",
          letterSpacing: "0.8px",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        {label}
      </div>
    </foreignObject>
  );
}

// ─── Main diagram ─────────────────────────────────────────────────────────────
export default function CorelyDiagram() {
  // Center of diagram in SVG viewBox (0 0 580 580)
  const cx = 290;
  const cy = 290;
  const orbR = 82;

  // Connection endpoints — where lines end (near cards)
  const connections = [
    // Left cards
    { x1: cx, y1: cy, x2: 124, y2: 108, mx: cx - 60, my: cy - 100 },  // Slack
    { x1: cx, y1: cy, x2: 124, y2: 188, mx: cx - 80, my: cy - 60 },  // Notion
    { x1: cx, y1: cy, x2: 124, y2: 268, mx: cx - 90, my: cy },       // Google Drive
    { x1: cx, y1: cy, x2: 124, y2: 352, mx: cx - 80, my: cy + 60 },  // Email
    { x1: cx, y1: cy, x2: 124, y2: 430, mx: cx - 60, my: cy + 100 }, // Analytics
    // Right cards
    { x1: cx, y1: cy, x2: 354, y2: 108, mx: cx + 60, my: cy - 100 }, // CRM
    { x1: cx, y1: cy, x2: 354, y2: 188, mx: cx + 80, my: cy - 60 },  // Meetings
    { x1: cx, y1: cy, x2: 354, y2: 268, mx: cx + 90, my: cy },       // Reports
    { x1: cx, y1: cy, x2: 354, y2: 352, mx: cx + 80, my: cy + 60 },  // Documents
  ];

  // Dot positions along the lines (t=0..1)
  const dotPositions = [0.25, 0.5, 0.75];

  return (
    <div className="diagram-wrapper">
      <svg
        viewBox="0 0 580 580"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%" }}
      >
        {/* Background glow */}
        <defs>
          <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff3ee" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="orbGrad" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#ff8a47" />
            <stop offset="60%" stopColor="#ff5c00" />
            <stop offset="100%" stopColor="#cc3a00" />
          </radialGradient>
          <radialGradient id="ringGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff5c00" stopOpacity="0" />
            <stop offset="85%" stopColor="#ff5c00" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ff5c00" stopOpacity="0" />
          </radialGradient>
          <filter id="orbShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feColorMatrix in="blur" type="matrix"
              values="1 0.3 0 0 0  0.3 0.1 0 0 0  0 0 0 0 0  0 0 0 0.35 0" />
          </filter>
          <filter id="lineShadow">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
        </defs>

        {/* Background radial glow */}
        <ellipse cx="290" cy="290" rx="280" ry="280" fill="url(#bgGlow)" />

        {/* Pulsing rings */}
        <circle cx={cx} cy={cy} r={orbR + 40} stroke="#ff5c00" strokeWidth="1" fill="none" strokeDasharray="4 8" opacity="0.18" className="orb-ring-1" />
        <circle cx={cx} cy={cy} r={orbR + 75} stroke="#ff5c00" strokeWidth="0.8" fill="none" strokeDasharray="3 12" opacity="0.12" className="orb-ring-2" />
        <circle cx={cx} cy={cy} r={orbR + 115} stroke="#ff5c00" strokeWidth="0.5" fill="none" strokeDasharray="2 16" opacity="0.08" className="orb-ring-3" />

        {/* Circuit connection lines */}
        {connections.map((c, i) => (
          <g key={i}>
            {/* Glowing shadow line */}
            <path
              d={`M ${c.x1} ${c.y1} Q ${c.mx} ${c.my} ${c.x2 + 60} ${c.y2 + 22}`}
              stroke="#ff5c00"
              strokeWidth="4"
              opacity="0.08"
              filter="url(#lineShadow)"
            />
            {/* Main line */}
            <path
              d={`M ${c.x1} ${c.y1} Q ${c.mx} ${c.my} ${c.x2 + 60} ${c.y2 + 22}`}
              stroke="#ff5c00"
              strokeWidth="1.5"
              opacity="0.35"
              strokeLinecap="round"
              className="circuit-line"
            />
            {/* Traveling dots */}
            {dotPositions.map((t, j) => {
              // Quadratic bezier point at t
              const bx = (1 - t) * (1 - t) * c.x1 + 2 * (1 - t) * t * c.mx + t * t * (c.x2 + 60);
              const by = (1 - t) * (1 - t) * c.y1 + 2 * (1 - t) * t * c.my + t * t * (c.y2 + 22);
              return (
                <circle
                  key={j}
                  cx={bx}
                  cy={by}
                  r="2.5"
                  fill="#ff5c00"
                  opacity="0.6"
                />
              );
            })}
          </g>
        ))}

        {/* Orb glow shadow */}
        <circle cx={cx} cy={cy} r={orbR + 10} fill="#ff5c00" opacity="0.15" filter="url(#orbShadow)" />

        {/* Main orb */}
        <circle cx={cx} cy={cy} r={orbR} fill="url(#orbGrad)" />

        {/* Orb inner highlight */}
        <ellipse cx={cx - 20} cy={cy - 24} rx="32" ry="22" fill="white" opacity="0.12" />

        {/* Orb text: C */}
        <text
          x={cx}
          y={cy - 18}
          textAnchor="middle"
          fill="white"
          fontSize="28"
          fontWeight="800"
          fontFamily="Space Grotesk, Helvetica Neue, sans-serif"
          letterSpacing="-1"
        >
          C
        </text>

        {/* Orb text: CORELY */}
        <text
          x={cx}
          y={cy + 8}
          textAnchor="middle"
          fill="white"
          fontSize="13"
          fontWeight="800"
          fontFamily="Space Grotesk, Helvetica Neue, sans-serif"
          letterSpacing="2"
        >
          CORELY
        </text>

        {/* Orb text: subtitle */}
        <text
          x={cx}
          y={cy + 26}
          textAnchor="middle"
          fill="rgba(255,255,255,0.75)"
          fontSize="7.5"
          fontWeight="500"
          fontFamily="Space Grotesk, Helvetica Neue, sans-serif"
          letterSpacing="0.3"
        >
          Enterprise Intelligence Layer
        </text>

        {/* ── LEFT CARDS ── */}
        <IntegrationCard icon={<SlackIcon />} label="Slack"        x={4}   y={86}  delay={0}   />
        <IntegrationCard icon={<NotionIcon />} label="Notion"      x={4}   y={166} delay={0.4} />
        <IntegrationCard icon={<DriveIcon />}  label="Google Drive" x={4}  y={246} delay={0.8} />
        <IntegrationCard icon={<EmailIcon />}  label="Email"       x={4}   y={330} delay={1.2} />
        <IntegrationCard icon={<AnalyticsIcon />} label="Analytics" x={4}  y={410} delay={1.6} />

        {/* ── RIGHT CARDS ── */}
        <IntegrationCard icon={<CRMIcon />}      label="CRM"       x={454} y={86}  delay={0.2} />
        <IntegrationCard icon={<MeetingsIcon />} label="Meetings"  x={454} y={166} delay={0.6} />
        <IntegrationCard icon={<ReportsIcon />}  label="Reports"   x={454} y={246} delay={1.0} />
        <IntegrationCard icon={<DocumentsIcon />} label="Documents" x={454} y={330} delay={1.4} />

        {/* ── ENGINE LABELS ── */}
        <EngineLabel label="Context Engine"  x={218} y={48}  />
        <EngineLabel label="Memory Layer"    x={348} y={178} />
        <EngineLabel label="Reasoning Core"  x={348} y={328} />
        <EngineLabel label="Action Engine"   x={218} y={488} />
      </svg>
    </div>
  );
}
