"use client";

import {
  Activity,
  Bell,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  UserPlus,
  Database,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { SourceLogo } from "@/components/ui/source-logo";
import type { ActivityItem } from "../dashboard-data";
import { formatTimeAgo } from "./time-ago";

// Icon names come from Notification.iconType (see lib/notifications.ts) and dashboard-data.ts.
const iconMap: Record<string, LucideIcon> = {
  Bell,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  UserPlus,
  Database,
};

// Real recent events, built on the server from notifications, indexed documents and new members.
export default function ActivityFeedPanel({ data }: { data?: ActivityItem[] }) {
  const items = data || [];

  return (
    <div className="db-panel">
      {/* Header */}
      <div className="db-panel-header">
        <span className="db-panel-title type-heading">
          <Activity />
          Activity feed
        </span>
      </div>

      {/* Feed Body: one row per event, split by hairline dividers */}
      <div className="db-panel-body db-panel-body--flush">
        {items.length === 0 ? (
          <div className="db-panel-empty">No recent activity yet.</div>
        ) : (
          <div className="db-feed-list">
            {items.map((activity) => {
              const Icon = activity.iconType ? iconMap[activity.iconType] || Bell : Bell;
              return (
                <Link key={activity.id} href={activity.href} className="db-feed-row db-row-link">
                  {activity.source ? (
                    <SourceLogo type={activity.source} size={18} tileSize={32} />
                  ) : (
                    <span className="db-row-icon" aria-hidden="true">
                      <Icon strokeWidth={2} />
                    </span>
                  )}
                  <div className="db-feed-main">
                    <div className="db-feed-top">
                      <span className="db-feed-title">{activity.title}</span>
                      <span className="db-feed-time type-caption">{formatTimeAgo(activity.time)}</span>
                    </div>
                    <div className="db-feed-desc">{activity.desc}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
