"use client";

import {
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Code2,
  DollarSign,
  Users,
  UserPlus,
  CheckCircle2,
  RefreshCw,
  Database,
  AlertTriangle,
  Clock,
  FileText,
  Activity,
  MessageSquare,
  Sparkles,
  ThumbsDown,
  Zap,
  Plug,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { SourceLogo, normaliseSourceType } from "@/components/ui/source-logo";
import * as React from "react";
import { formatTimeAgo } from "./time-ago";

// Insight "source" can be a connected source name or a word like "System".
// Only real source names get a logo.
const KNOWN_SOURCES = new Set(["google_drive", "gmail", "github", "slack", "notion", "linear", "manual_upload"]);

// Icon names come from the insights generator. All tiles are neutral.
const iconMap: Record<string, LucideIcon> = {
  TrendingDown,
  TrendingUp,
  Code2,
  DollarSign,
  Users,
  UserPlus,
  Database,
  AlertTriangle,
  Clock,
  RefreshCw,
  CheckCircle2,
  FileText,
  Activity,
  MessageSquare,
  Sparkles,
  ThumbsDown,
  Zap,
  Plug,
};

// Badge colour for a priority word. The generator sends "Critical" / "High" /
// "Medium" / "Low", so compare without case.
function priorityTone(priority?: string): StatusTone {
  const p = (priority || "").toLowerCase();
  if (p === "critical" || p === "high") return "error";
  if (p === "medium") return "warning";
  return "neutral";
}

interface Insight {
  id: string;
  iconType: string;
  priority: string;
  title: string;
  description: string;
  source: string;
  // Time of the real event behind the insight. Null when there is no single event.
  createdAt: string | null;
  // Page that lets the user act on the insight.
  href: string;
}

export default function InsightsPanel({
  data,
  systemHealth,
  lastSyncedAt,
}: {
  data?: Insight[];
  systemHealth?: string;
  lastSyncedAt?: string | null;
}) {
  const insights = data || [];
  const loading = !data;
  const healthy = systemHealth === "Operational";
  const healthColor = healthy ? "var(--success)" : "var(--error)";

  return (
    <div className="db-panel">
      {/* Header */}
      <div className="db-panel-header">
        <span className="db-panel-title type-heading">Insights</span>
        <Link href="/dashboard/insights" className="db-panel-link">
          View all
          <ChevronRight />
        </Link>
      </div>

      {/* Insights List */}
      <div className="db-panel-body db-panel-body--flush">
        {loading ? (
          <div className="db-panel-empty">Loading insights...</div>
        ) : insights.length === 0 ? (
          <div className="db-panel-empty">No insights found.</div>
        ) : (
          insights.map((ins, i) => {
            const Icon = iconMap[ins.iconType] || TrendingDown;
            return (
              <Link key={ins.id || i} href={ins.href || "/dashboard/insights"} className="db-insight-card db-row-link">
                <div className="db-insight-icon db-row-icon">
                  <Icon strokeWidth={2} />
                </div>
                <div className="db-insight-body">
                  <div className="db-insight-title">{ins.title}</div>
                  <div className="db-insight-desc">{ins.description}</div>
                  <div className="db-insight-meta type-caption">
                    <StatusBadge tone={priorityTone(ins.priority)}>{ins.priority}</StatusBadge>
                    <span className="db-insight-source" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      {KNOWN_SOURCES.has(normaliseSourceType(ins.source)) && (
                        <SourceLogo type={ins.source} size={14} tile={false} />
                      )}
                      {ins.source}
                    </span>
                    {ins.createdAt && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{formatTimeAgo(ins.createdAt)}</span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} className="db-insight-chevron" aria-hidden="true" />
              </Link>
            );
          })
        )}
      </div>

      {/* System Status: opens Sources, where sync errors and sync times live */}
      <Link href="/dashboard/sources" className="db-system-status db-row-link" aria-label="System status: open Sources">
        <div className="db-status-title type-label">System status</div>
        <div className="db-status-rows">
          <div className="db-status-row">
            <CheckCircle2 style={{ color: healthColor }} />
            <span className="db-status-text" style={{ color: healthColor }}>
              {healthy ? "All systems operational" : "System degraded"}
            </span>
          </div>
          <div className="db-status-row">
            <RefreshCw style={{ color: "var(--icon-secondary)" }} />
            <span className="type-caption">
              {/* Real newest Source.lastSyncedAt */}
              {lastSyncedAt ? `Last sync ${formatTimeAgo(lastSyncedAt)}` : "No sync has finished yet"}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
