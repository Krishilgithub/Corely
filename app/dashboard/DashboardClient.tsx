"use client";

import StatsCards from "./components/StatsCards";
import ActivityFeedPanel from "./components/ActivityFeedPanel";
import InsightsPanel from "./components/InsightsPanel";
import AutonomousActions from "./components/AutonomousActions";
import { Calendar, ChevronDown, ArrowRight, Check, Database, MessageSquare, Users } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/ui/page-header";
import type { DashboardData } from "./dashboard-data";

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
}

// ── Onboarding Progress Strip ──────────────────────────────────────────────────
// Every "done" flag comes from real workspace data (see dashboard-data.ts).
function OnboardingStrip({
  sourcesConnected,
  hasAskedQuestion,
  hasInvitedTeam,
}: {
  sourcesConnected: number;
  hasAskedQuestion: boolean;
  hasInvitedTeam: boolean;
}) {
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
      done: hasAskedQuestion,
      href: "/dashboard/ask-corely",
    },
    {
      number: 3,
      icon: Users,
      label: "Invite your team",
      desc: "Collaborate with teammates on shared memory",
      done: hasInvitedTeam,
      href: "/dashboard/settings/members",
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const progressPct = (completedCount / steps.length) * 100;
  // The first step that is not done yet is the "current" step (orange highlight).
  const currentNumber = steps.find((s) => !s.done)?.number;

  return (
    <div className="db-onboard">
      {/* Header row */}
      <div className="db-onboard-head">
        <div className="db-onboard-heading">
          <span className="type-heading">Get started with Corely</span>
          <span className="type-caption">{completedCount} of {steps.length} steps complete</span>
        </div>
        <div className="db-onboard-progress">
          <div className="db-onboard-bar">
            <div className="db-onboard-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="db-onboard-pct">{Math.round(progressPct)}%</span>
        </div>
      </div>

      {/* Steps */}
      <div className="db-onboard-steps">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <Link
              key={step.number}
              href={step.href}
              className="db-onboard-step"
              data-done={step.done ? "true" : "false"}
              data-current={step.number === currentNumber ? "true" : "false"}
            >
              <span className="db-row-icon" aria-hidden="true">
                {step.done ? <Check strokeWidth={2.5} /> : <Icon />}
              </span>
              <span className="db-onboard-step-text">
                <span className="db-onboard-step-title">{step.label}</span>
                <span className="type-caption">{step.desc}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── Dashboard Client ──────────────────────────────────────────────────────────
export default function DashboardClient({ initialData, dateRange }: { initialData: DashboardData; dateRange: string }) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const router = useRouter();

  if (initialData?.stats?.sourcesConnected === 0) {
    return (
      <main className="db-content db-welcome">
        <div className="db-welcome-inner">
          <span className="ui-icon-well ui-icon-well--lg ui-icon-well--accent" aria-hidden="true">
            <Database />
          </span>
          <h1 className="type-title">
            Welcome to Corely, {initialData?.user?.name?.split(" ")[0] || "there"}
          </h1>
          <p className="type-subtitle db-welcome-text">
            Your institutional memory starts here. Connect your first data source and Corely will automatically build your organization&apos;s knowledge graph.
          </p>
          <div className="db-welcome-steps">
            {[
              { step: "1", title: "Connect data", desc: "Link Notion, Slack, or GitHub" },
              { step: "2", title: "Auto-sync", desc: "We build your knowledge graph" },
              { step: "3", title: "Ask anything", desc: "Query your institutional memory" },
            ].map((s) => (
              <div key={s.step} className="db-welcome-step">
                <span className="db-step-num">{s.step}</span>
                <span className="db-onboard-step-title">{s.title}</span>
                <span className="type-caption">{s.desc}</span>
              </div>
            ))}
          </div>
          <Link href="/dashboard/sources" style={{ textDecoration: "none" }}>
            <button className="ui-btn ui-btn--primary ui-btn--lg">
              Connect first source <ArrowRight />
            </button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="db-content">
      {/* ── Page header: greeting on the left, date range on the right ── */}
      <PageHeader
        title={<>{getTimeGreeting()}, {initialData?.user?.name?.split(" ")[0] || "there"}</>}
        subtitle={<>Here&apos;s what is happening across your organization.</>}
        actions={
          <div className="db-popover-anchor">
            <button
              className="db-date-btn ui-btn ui-btn--secondary"
              aria-label="Select date range"
              title="Filters the Chats Started and Documents Indexed tiles"
              aria-expanded={showDatePicker}
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              <Calendar />
              <span>{dateRange}</span>
              <ChevronDown />
            </button>
            <AnimatePresence>
              {showDatePicker && (
                <motion.div
                  className="db-date-menu ui-popover"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  {["Today", "This Week", "This Month", "All Time"].map((option) => (
                    <button
                      key={option}
                      className="ui-menu-item db-date-option"
                      data-active={dateRange === option ? "true" : "false"}
                      onClick={() => { setShowDatePicker(false); router.push(`/dashboard?dateRange=${encodeURIComponent(option)}`); }}
                    >
                      {option}
                      {dateRange === option && <Check className="db-date-check" aria-hidden="true" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        }
      />

      {/* ── Onboarding Strip (shown when < 3 sources) ── */}
      {initialData.stats.sourcesConnected < 3 && (
        <OnboardingStrip
          sourcesConnected={initialData.stats.sourcesConnected}
          hasAskedQuestion={initialData.onboarding.hasAskedQuestion}
          hasInvitedTeam={initialData.onboarding.hasInvitedTeam}
        />
      )}

      {/* ── Stats Cards ── */}
      <StatsCards data={initialData?.stats} dateWindow={initialData.dateWindow} />

      {/* ── Main Grid ── */}
      <div className="db-main-grid">
        <ActivityFeedPanel data={initialData?.activity} />
        <InsightsPanel
          data={initialData?.insights}
          systemHealth={initialData?.systemHealth}
          lastSyncedAt={initialData?.lastSyncedAt}
        />
      </div>

      {/* ── Recent actions (real syncs and chats) ── */}
      <AutonomousActions data={initialData?.actions} />
    </main>
  );
}
