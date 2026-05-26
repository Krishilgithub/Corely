import StatsCards from "./components/StatsCards";
import AskCorelyPanel from "./components/AskCorelyPanel";
import InsightsPanel from "./components/InsightsPanel";
import AutonomousActions from "./components/AutonomousActions";
import { Calendar, ChevronDown } from "lucide-react";

export default function DashboardPage() {
  return (
    <main className="db-content">
      {/* ── Greeting Row ── */}
      <div className="db-greeting-row">
        <div>
          <h1 className="db-greeting-title">Good morning, Krishil 👋</h1>
          <p className="db-greeting-sub">
            Here&apos;s what Corely discovered across your organization today.
          </p>
        </div>
        <button className="db-date-btn" aria-label="Select date">
          <Calendar size={13} style={{ color: "#71717a" }} />
          <span>May 26, 2025</span>
          <ChevronDown size={13} style={{ color: "#a1a1aa" }} />
        </button>
      </div>

      {/* ── Stats Cards ── */}
      <StatsCards />

      {/* ── Main Grid ── */}
      <div className="db-main-grid">
        <AskCorelyPanel />
        <InsightsPanel />
      </div>

      {/* ── Autonomous Actions ── */}
      <AutonomousActions />
    </main>
  );
}
