"use client";

import { Cloud, RefreshCw, MessageSquare, type LucideIcon } from "lucide-react";
import * as React from "react";
import type { RecentAction } from "../dashboard-data";
import { formatTimeAgo } from "./time-ago";

// All action icons sit on the same neutral tile.
const iconMap: Record<string, LucideIcon> = {
  Cloud,
  RefreshCw,
  MessageSquare,
};

// Real recent syncs and chats, built on the server in dashboard-data.ts.
export default function AutonomousActions({ data }: { data?: RecentAction[] }) {
  const actions = data || [];
  const loading = !data;

  return (
    <div className="db-actions-section">
      {/* Header */}
      <div className="db-actions-header">
        <span className="type-heading">Recent actions</span>
      </div>

      {/* Actions Grid */}
      <div className="db-actions-body">
        <div className="db-actions-grid">
          {loading ? (
            <div className="db-panel-empty">Loading actions...</div>
          ) : actions.length === 0 ? (
            <div className="db-panel-empty">No syncs or chats yet.</div>
          ) : (
            actions.map((action, i) => {
              const Icon = iconMap[action.iconType] || Cloud;

              return (
                <div key={action.id || i} className="db-action-card">
                  <div className="db-action-top">
                    <span className="db-action-icon db-row-icon" aria-hidden="true">
                      <Icon strokeWidth={2} />
                    </span>
                    <span className="db-action-time type-caption">{formatTimeAgo(action.createdAt)}</span>
                  </div>
                  <div className="db-action-desc">{action.description}</div>
                  <div className="db-action-footer">
                    <span className="db-action-source type-caption">{action.source}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
