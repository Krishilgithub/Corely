"use client";

import { Cloud, GitBranch, Mail, Cpu, ChevronRight, type LucideIcon } from "lucide-react";
import * as React from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";

// All action icons sit on the same neutral tile.
const iconMap: Record<string, LucideIcon> = {
  Cloud,
  GitBranch,
  Mail,
  Cpu,
};

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface Action {
  id: string;
  iconType: string;
  createdAt: string;
  description: string;
  source: string;
}

export default function AutonomousActions({ data }: { data?: Action[] }) {
  const actions = data || [];
  const loading = !data;

  return (
    <div className="db-actions-section">
      {/* Header */}
      <div className="db-actions-header">
        <span className="type-heading">Autonomous actions</span>
        <Link href="/dashboard/workflows" className="db-panel-link">
          View all actions
          <ChevronRight />
        </Link>
      </div>

      {/* Actions Grid */}
      <div className="db-actions-body">
        <div className="db-actions-grid">
          {loading ? (
            <div className="db-panel-empty">Loading actions...</div>
          ) : actions.length === 0 ? (
            <div className="db-panel-empty">No actions found.</div>
          ) : (
            actions.map((action, i) => {
              const Icon = iconMap[action.iconType] || Cloud;

              return (
                <div key={action.id || i} className="db-action-card">
                  <div className="db-action-top">
                    <span className="db-action-icon db-row-icon" aria-hidden="true">
                      <Icon strokeWidth={2} />
                    </span>
                    <span className="db-action-time type-caption">{formatTime(action.createdAt)}</span>
                  </div>
                  <div className="db-action-desc">{action.description}</div>
                  <div className="db-action-footer">
                    <span className="db-action-source type-caption">{action.source}</span>
                    <StatusBadge tone="success" className="db-action-completed">Completed</StatusBadge>
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
