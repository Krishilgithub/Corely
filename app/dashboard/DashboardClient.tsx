"use client";

import StatsCards from "./components/StatsCards";
import ActivityFeedPanel from "./components/ActivityFeedPanel";
import InsightsPanel from "./components/InsightsPanel";
import AutonomousActions from "./components/AutonomousActions";
import { Calendar, ChevronDown, ArrowRight, Check, Database, MessageSquare, Users } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
}

// ── Onboarding Progress Strip ──────────────────────────────────────────────────
function OnboardingStrip({ sourcesConnected }: { sourcesConnected: number }) {
  const steps = [
    {
      number: 1,
      icon: Database,
      label: "Connect a data source",
      desc: "Link Notion, Google Drive, Slack, or GitHub",
      done: sourcesConnected >= 1,
      href: "/dashboard/sources",
    },
    {
      number: 2,
      icon: MessageSquare,
      label: "Ask your first question",
      desc: "Let Corely search across all your knowledge",
      done: false,
      href: "/dashboard/ask-corely",
    },
    {
      number: 3,
      icon: Users,
      label: "Invite your team",
      desc: "Collaborate with teammates on shared memory",
      done: false,
      href: "/dashboard/settings/members",
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const progressPct = (completedCount / steps.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        background: "var(--db-panel)",
        border: "1px solid rgba(0,0,0,0.06)",
        borderRadius: 16,
        padding: "20px 24px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--db-text)" }}>Get started with Corely</span>
          <span style={{ fontSize: 13, color: "var(--db-text-muted)", marginLeft: 10 }}>{completedCount} of {steps.length} steps complete</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 120, height: 6, background: "#f4f4f5", borderRadius: 100, overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              style={{ height: "100%", background: "#ff6b00", borderRadius: 100 }}
            />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#ff6b00" }}>{Math.round(progressPct)}%</span>
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <Link key={step.number} href={step.href} style={{ textDecoration: "none" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: step.done ? "1px solid #bbf7d0" : "1px solid rgba(0,0,0,0.06)",
                  background: step.done ? "#f0fdf4" : "var(--db-bg)",
                  transition: "all 0.15s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => { if (!step.done) (e.currentTarget as HTMLDivElement).style.borderColor = "#ff6b00"; }}
                onMouseLeave={(e) => { if (!step.done) (e.currentTarget as HTMLDivElement).style.borderColor = "var(--db-border-light)"; }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: step.done ? "#10b981" : "var(--db-panel)",
                  border: step.done ? "none" : "1.5px solid #e4e4e7",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, boxShadow: step.done ? "0 2px 8px rgba(16,185,129,0.2)" : "none"
                }}>
                  {step.done ? <Check size={14} color="var(--db-panel)" strokeWidth={3} /> : <Icon size={14} color="#a1a1aa" />}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: step.done ? "#15803d" : "var(--db-text)", margin: "0 0 2px" }}>
                    {step.label}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--db-text-muted)", margin: 0, lineHeight: 1.4 }}>{step.desc}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Dashboard Client ──────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DashboardClient({ initialData, dateRange }: { initialData: any; dateRange: string }) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const router = useRouter();

  if (initialData?.stats?.sourcesConnected === 0) {
    return (
      <main className="db-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ maxWidth: 640, width: "100%", background: "var(--db-panel)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 24, padding: "56px 48px", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.04)" }}
        >
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#fff3ee", margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 38 }}>👋</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--db-text)", marginBottom: 12, letterSpacing: "-0.02em" }}>
            Welcome to Corely, {initialData?.user?.name?.split(" ")[0] || "there"}!
          </h1>
          <p style={{ fontSize: 15, color: "#52525b", lineHeight: 1.7, marginBottom: 40, maxWidth: 480, margin: "0 auto 40px" }}>
            Your institutional memory starts here. Connect your first data source and Corely will automatically build your organization&apos;s knowledge graph.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 32, textAlign: "left" }}>
            {[
              { step: "1", title: "Connect Data", desc: "Link Notion, Slack, or GitHub" },
              { step: "2", title: "Auto-Sync", desc: "We build your knowledge graph" },
              { step: "3", title: "Ask Anything", desc: "Query your institutional memory" },
            ].map((s) => (
              <div key={s.step} style={{ padding: 16, border: "1px solid rgba(0,0,0,0.06)", borderRadius: 12, background: "var(--db-bg)" }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#ff6b00", color: "var(--db-panel)", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>{s.step}</div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--db-text)", margin: "0 0 4px" }}>{s.title}</p>
                <p style={{ fontSize: 12, color: "var(--db-text-muted)", margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
          <Link href="/dashboard/sources" style={{ textDecoration: "none" }}>
            <button style={{ background: "#ff6b00", color: "var(--db-panel)", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 4px 16px rgba(255,107,0,0.25)", transition: "all 0.2s" }}>
              Connect First Source <ArrowRight size={16} />
            </button>
          </Link>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="db-content">
      {/* ── Greeting Row ── */}
      <div className="db-greeting-row">
        <div>
          <h1 className="db-greeting-title">{getTimeGreeting()}, {initialData?.user?.name?.split(" ")[0] || "there"} 👋</h1>
          <p className="db-greeting-sub">Here&apos;s what Corely discovered across your organization today.</p>
        </div>
        <div style={{ position: "relative" }}>
          <button
            className="db-date-btn"
            aria-label="Select date range"
            onClick={() => setShowDatePicker(!showDatePicker)}
          >
            <Calendar size={13} style={{ color: "var(--db-text-muted)" }} />
            <span>{dateRange}</span>
            <ChevronDown size={13} style={{ color: "#a1a1aa" }} />
          </button>
          {showDatePicker && (
            <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 8, background: "var(--db-panel)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", zIndex: 20, width: 150, overflow: "hidden" }}>
              {["Today", "This Week", "This Month", "All Time"].map((option) => (
                <button
                  key={option}
                  onClick={() => { setShowDatePicker(false); router.push(`/dashboard?dateRange=${encodeURIComponent(option)}`); }}
                  style={{ padding: "10px 16px", width: "100%", textAlign: "left", background: dateRange === option ? "#fff3ee" : "transparent", border: "none", fontSize: 13.5, color: dateRange === option ? "#ff6b00" : "#3f3f46", cursor: "pointer", fontWeight: dateRange === option ? 600 : 400 }}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Onboarding Strip (shown when < 3 sources) ── */}
      {initialData?.stats?.sourcesConnected < 3 && (
        <OnboardingStrip sourcesConnected={initialData.stats.sourcesConnected} />
      )}

      {/* ── Stats Cards ── */}
      <StatsCards data={initialData?.stats} />

      {/* ── Main Grid ── */}
      <div className="db-main-grid">
        <ActivityFeedPanel />
        <InsightsPanel data={initialData?.insights} systemHealth={initialData?.systemHealth} />
      </div>

      {/* ── Autonomous Actions ── */}
      <AutonomousActions data={initialData?.actions} />
    </main>
  );
}
