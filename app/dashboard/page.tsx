"use client";

import StatsCards from "./components/StatsCards";
import AskCorelyPanel from "./components/AskCorelyPanel";
import InsightsPanel from "./components/InsightsPanel";
import AutonomousActions from "./components/AutonomousActions";
import { Calendar, ChevronDown, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const [userName, setUserName] = useState("Loading...");
  const [dateRange, setDateRange] = useState("Today");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch(`/api/dashboard?dateRange=${dateRange}`);
        if (res.ok) {
          const data = await res.json();
          if (data.user?.name) {
            setUserName(data.user.name);
          }
          setDashboardData(data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      }
    };
    fetchDashboard();
  }, [dateRange]);



  return (
    <main className="db-content">
      {/* ── Greeting Row ── */}
      <div className="db-greeting-row">
        <div>
          <h1 className="db-greeting-title">Good morning, {userName} 👋</h1>
          <p className="db-greeting-sub">
            Here&apos;s what Corely discovered across your organization today.
          </p>
        </div>
        <div style={{ position: "relative" }}>
          <button 
            className="db-date-btn" 
            aria-label="Select date"
            onClick={() => setShowDatePicker(!showDatePicker)}
          >
            <Calendar size={13} style={{ color: "#71717a" }} />
            <span>{dateRange}</span>
            <ChevronDown size={13} style={{ color: "#a1a1aa" }} />
          </button>
          
          {showDatePicker && (
            <div style={{
              position: "absolute", top: "100%", right: 0, marginTop: 8,
              background: "#fff", border: "1px solid #e4e4e7", borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)", zIndex: 10, width: 140,
              display: "flex", flexDirection: "column", overflow: "hidden"
            }}>
              {["Today", "This Week", "This Month", "All Time"].map(option => (
                <button
                  key={option}
                  onClick={() => { setDateRange(option); setShowDatePicker(false); }}
                  style={{
                    padding: "8px 12px", textAlign: "left", background: dateRange === option ? "#fafafa" : "transparent",
                    border: "none", fontSize: 13, color: dateRange === option ? "#ff6b00" : "#3f3f46", cursor: "pointer"
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Stats Cards ── */}
      {/* ── Onboarding Checklist ── */}
      {dashboardData && dashboardData.stats?.sourcesConnected < 3 && (
        <div style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 12, padding: 20, marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#18181b", display: "flex", alignItems: "center", gap: 8 }}>
              Getting Started <span style={{ padding: "2px 8px", background: "#fef3c7", color: "#d97706", fontSize: 11, borderRadius: 12 }}>{dashboardData.stats?.sourcesConnected}/3 Sources</span>
            </h3>
            <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#71717a" }}>Connect at least 3 sources to unlock the full power of Corely AI.</p>
          </div>
          <Link href="/dashboard/sources" style={{ textDecoration: "none" }}>
            <button className="db-btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              Connect Sources <ArrowRight size={14} />
            </button>
          </Link>
        </div>
      )}

      {/* ── Stats Cards ── */}
      <StatsCards data={dashboardData?.stats} />

      {/* ── Main Grid ── */}
      <div className="db-main-grid">
        <AskCorelyPanel />
        <InsightsPanel data={dashboardData?.insights} systemHealth={dashboardData?.systemHealth} />
      </div>

      {/* ── Autonomous Actions ── */}
      <AutonomousActions data={dashboardData?.actions} />
    </main>
  );
}
