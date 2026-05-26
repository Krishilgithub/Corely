"use client";
import { motion } from "framer-motion";

// High-fidelity vector logos for integration cards
function SlackLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M5 14.5a2.5 2.5 0 110-5h2.5v5H5zm0-7.5a2.5 2.5 0 012.5 2.5v2.5H5a2.5 2.5 0 110-5zm7.5 5a2.5 2.5 0 110-5h2.5v5h-2.5zm0-7.5a2.5 2.5 0 012.5 2.5v2.5h-2.5a2.5 2.5 0 110-5zm5 12.5a2.5 2.5 0 110-5H20v5h-2.5zm0-7.5a2.5 2.5 0 012.5 2.5v2.5h-2.5a2.5 2.5 0 110-5zm-5 5a2.5 2.5 0 110-5h2.5v5h-2.5zm0 7.5a2.5 2.5 0 012.5-2.5v-2.5h-2.5a2.5 2.5 0 110 5z" fill="#E01E5A" />
      <path d="M5 14.5h2.5v-5H5a2.5 2.5 0 100 5zm5-5h2.5v-5H10a2.5 2.5 0 100 5zm7.5 5H20v-5h-2.5a2.5 2.5 0 100 5zm-5 5h2.5v-5H12a2.5 2.5 0 100 5z" fill="#36C5F0" />
      <path d="M5 7a2.5 2.5 0 002.5 2.5v-2.5A2.5 2.5 0 005 7zm7.5 7.5a2.5 2.5 0 002.5 2.5V14.5a2.5 2.5 0 00-2.5-2.5zm5-7.5H20v2.5h-2.5A2.5 2.5 0 0017.5 7zm-5 5a2.5 2.5 0 002.5 2.5V12a2.5 2.5 0 00-2.5-2.5z" fill="#2EB67D" />
      <path d="M7.5 14.5V12H5a2.5 2.5 0 002.5 2.5zm5-9.5V7H10a2.5 2.5 0 002.5-2.5zm5 9.5V12h-2.5a2.5 2.5 0 002.5 2.5zm-5 5V17H12a2.5 2.5 0 002.5 2.5z" fill="#ECB22E" />
    </svg>
  );
}

function NotionLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M4 3.5a1.5 1.5 0 011.5-1.5h13a1.5 1.5 0 011.5 1.5v17a1.5 1.5 0 01-1.5 1.5h-13a1.5 1.5 0 01-1.5-1.5v-17z" fill="white" stroke="#111111" strokeWidth="2" />
      <path d="M7.5 7.5L8.5 6h7l1 1.5v10.5l-1.5 1.5h-6.5l-1.5-1.5V7.5z" fill="white" />
      <path d="M9 16.5V7.5L14.5 15.5V7.5" stroke="#111111" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DriveLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M8.5 4.5l14 24H3.5l14-24z" fill="#FFC107" />
      <path d="M3.5 28.5L10.5 16h14L17.5 28.5H3.5z" fill="#00796B" />
      <path d="M10.5 16L3.5 28.5h6l7-12.5H10.5z" fill="#3F51B5" />
      <path d="M17.5 4.5L10.5 16h6l7 12.5L17.5 4.5z" fill="#4CAF50" />
      <path d="M8.2 4L1.2 16h7l7-12H8.2z" fill="#2196F3" />
      <path d="M10.5 16L1.2 16h7l7 0-4.7-16h-2.3z" fill="#009688" />
    </svg>
  );
}

function EmailLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="3.5" fill="#4285F4" />
      <path d="M2.5 5.5l9.5 7.5 9.5-7.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CRMLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M19 10.5c0-1.8-1.5-3.2-3.3-3.2-.3 0-.6.1-.9.2C14.1 6 12.2 4.5 10 4.5 6.7 4.5 4 7.2 4 10.5c0 .2 0 .4.1.6C2.3 11.5 1 13.2 1 15.2c0 2.4 1.9 4.3 4.3 4.3h13.4c2.4 0 4.3-1.9 4.3-4.3 0-2.4-1.9-4.3-4.3-4.3" fill="#00A1E0" />
    </svg>
  );
}

function MeetingsLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="1" y="4" width="16" height="16" rx="4" fill="#2D8CFF" />
      <path d="M17 10.2l5.4-3.6c.7-.5 1.6 0 1.6.8v9.2c0 .8-.9 1.3-1.6.8L17 13.8v-3.6z" fill="#2D8CFF" />
    </svg>
  );
}

function AnalyticsLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="13" width="4" height="8" rx="1.5" fill="#FF8F00" />
      <rect x="10" y="8" width="4" height="13" rx="1.5" fill="#FFB300" />
      <rect x="17" y="3" width="4" height="18" rx="1.5" fill="#F4B400" />
    </svg>
  );
}

function ReportsLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#E8F0FE" stroke="#4285F4" strokeWidth="2" />
      <circle cx="12" cy="12" r="6" stroke="#4285F4" strokeWidth="2" fill="none" />
      <path d="M12 12l3.5 3.5" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 12l0-6" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Interactive integration card inside the SVG container
function IntCard({ icon, label, x, y, delay = 0 }: { icon: React.ReactNode; label: string; x: number; y: number; delay?: number }) {
  return (
    <foreignObject x={x} y={y} width="118" height="42" style={{ overflow: "visible" }}>
      <div 
        style={{ animationDelay: `${delay}s` }}
        className="flex items-center gap-2.5 bg-white border border-[#f1f1f1] rounded-[12px] px-3.5 py-2 shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-[12px] font-bold text-[#111111] font-sans hover:border-[#ff6b00]/30 hover:shadow-md hover:scale-[1.02] transition-all duration-300 select-none animate-[float-card_4.5s_ease-in-out_infinite]"
      >
        <div className="shrink-0">{icon}</div>
        <span>{label}</span>
      </div>
    </foreignObject>
  );
}

// Curved pill tag for custom context engine labels
function EngineTag({ label, x, y }: { label: string; x: number; y: number }) {
  return (
    <foreignObject x={x} y={y} width="114" height="26" style={{ overflow: "visible" }}>
      <div className="inline-flex items-center justify-center bg-white border border-[#f1f1f1] rounded-full px-3 py-1 text-[9px] font-black text-[#9ca3af] uppercase tracking-[1px] select-none shadow-[0_1px_3px_rgba(0,0,0,0.01)] hover:border-gray-200 transition-colors">
        {label}
      </div>
    </foreignObject>
  );
}

export default function IntelligenceCore() {
  const cx = 270, cy = 240, orbR = 60;

  const connections = [
    { x2: 104, y2: 80,  mx: cx - 60, my: cy - 90 },
    { x2: 104, y2: 150, mx: cx - 80, my: cy - 50 },
    { x2: 104, y2: 220, mx: cx - 90, my: cy },
    { x2: 104, y2: 290, mx: cx - 80, my: cy + 50 },
    { x2: 336, y2: 80,  mx: cx + 60, my: cy - 90 },
    { x2: 336, y2: 150, mx: cx + 80, my: cy - 50 },
    { x2: 336, y2: 220, mx: cx + 90, my: cy },
    { x2: 336, y2: 290, mx: cx + 80, my: cy + 50 },
  ];

  return (
    <motion.div
      className="bg-white border border-[#f1f1f1] rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col h-[480px] p-6 font-sans relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.02)] transition-all duration-300"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
    >
      {/* Dynamic float keyframes */}
      <style>{`
        @keyframes float-card {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
          100% { transform: translateY(0px); }
        }
        @keyframes orb-pulse {
          0% { transform: scale(1); filter: drop-shadow(0 0 15px rgba(255, 107, 0, 0.25)); }
          50% { transform: scale(1.03); filter: drop-shadow(0 0 25px rgba(255, 107, 0, 0.4)); }
          100% { transform: scale(1); filter: drop-shadow(0 0 15px rgba(255, 107, 0, 0.25)); }
        }
        @keyframes ring-spin-cw {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes ring-spin-ccw {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-center pb-4 border-b border-[#f1f1f1] mb-2">
        <span className="text-[10px] font-black tracking-[1.5px] uppercase text-[#ff6b00]">
          Corely Intelligence Core
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center relative overflow-hidden select-none">
        <svg viewBox="0 0 540 460" fill="none" className="w-full h-full max-h-[380px]">
          <defs>
            <radialGradient id="diagram-radial-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff3ee" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            
            <radialGradient id="orb-gradient" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ff8a47" />
              <stop offset="55%" stopColor="#ff6b00" />
              <stop offset="100%" stopColor="#d34e00" />
            </radialGradient>

            <filter id="shadow-blur">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background orange radial glow */}
          <ellipse cx="270" cy="230" rx="230" ry="200" fill="url(#diagram-radial-glow)" />

          {/* Animated concentric dotted rings around the center */}
          <g style={{ transformOrigin: "270px 230px" }} className="animate-[ring-spin-cw_30s_linear_infinite]">
            <circle cx="270" cy="230" r="92" stroke="#ff6b00" strokeWidth="0.8" strokeDasharray="3 8" fill="none" opacity="0.18" />
          </g>
          <g style={{ transformOrigin: "270px 230px" }} className="animate-[ring-spin-ccw_40s_linear_infinite]">
            <circle cx="270" cy="230" r="122" stroke="#ff6b00" strokeWidth="0.6" strokeDasharray="2 12" fill="none" opacity="0.12" />
          </g>

          {/* Curved connection lines */}
          {connections.map((c, i) => (
            <g key={i}>
              <path
                d={`M 270 230 Q ${c.mx} ${c.my} ${c.x2 + 59} ${c.y2 + 21}`}
                stroke="#ff6b00"
                strokeWidth="1.2"
                opacity="0.32"
                strokeLinecap="round"
              />
              {/* Traveling light dots on the lines */}
              <circle cx={c.x2 + 59} cy={c.y2 + 21} r="2.5" fill="#ff6b00" opacity="0.6" />
              <circle cx={cx - (cx - c.x2)*0.5} cy={cy - (cy - c.y2)*0.5} r="1.5" fill="#ff6b00" opacity="0.5" />
            </g>
          ))}

          {/* Central orb */}
          <g style={{ transformOrigin: "270px 230px" }} className="animate-[orb-pulse_5s_ease-in-out_infinite]">
            {/* Orb background blur shadow */}
            <circle cx="270" cy="230" r={orbR + 8} fill="#ff6b00" opacity="0.15" filter="url(#shadow-blur)" />
            {/* Orb */}
            <circle cx="270" cy="230" r={orbR} fill="url(#orb-gradient)" />
            {/* Glossy top highlight */}
            <ellipse cx="254" cy="214" rx="20" ry="12" fill="white" opacity="0.15" />
            
            {/* Orb text */}
            <text x="270" y="222" textAnchor="middle" fill="white" fontSize="24" fontWeight="900" fontFamily="var(--font-sans), sans-serif">C</text>
            <text x="270" y="242" textAnchor="middle" fill="white" fontSize="10" fontWeight="900" fontFamily="var(--font-sans), sans-serif" letterSpacing="2.5">CORELY</text>
            <text x="270" y="254" textAnchor="middle" fill="rgba(255,255,255,0.72)" fontSize="6.5" fontWeight="700" fontFamily="var(--font-sans), sans-serif" letterSpacing="0.5">Intelligence Core</text>
          </g>

          {/* Left Integration Cards */}
          <IntCard icon={<SlackLogo />}   label="Slack"        x={1}   y={60}  delay={0}   />
          <IntCard icon={<NotionLogo />}  label="Notion"       x={1}   y={130} delay={0.4} />
          <IntCard icon={<DriveLogo />}   label="Google Drive" x={1}   y={200} delay={0.8} />
          <IntCard icon={<EmailLogo />}   label="Email"        x={1}   y={270} delay={1.2} />

          {/* Right Integration Cards */}
          <IntCard icon={<CRMLogo />}       label="CRM"       x={420} y={60}  delay={0.2} />
          <IntCard icon={<MeetingsLogo />}  label="Meetings"  x={420} y={130} delay={0.6} />
          <IntCard icon={<AnalyticsLogo />} label="Analytics" x={420} y={200} delay={1.0} />
          <IntCard icon={<ReportsLogo />}   label="Reports"   x={420} y={270} delay={1.4} />

          {/* Core Engines Pills */}
          <EngineTag label="Context Engine"  x={213} y={12}  />
          <EngineTag label="Memory Layer"    x={110} y={350} />
          <EngineTag label="Reasoning Core"  x={318} y={350} />
          <EngineTag label="Action Engine"   x={213} y={420} />
        </svg>
      </div>
    </motion.div>
  );
}
