"use client";

import { Activity, MoreHorizontal, X, GitPullRequest, FileText, UserPlus, Database, Search } from "lucide-react";

const activities = [
  {
    id: 1,
    type: "sync",
    title: "Google Drive synced",
    desc: "450 new documents indexed from /Engineering/Specs",
    time: "2m ago",
    icon: Database,
  },
  {
    id: 2,
    type: "member",
    title: "Sarah Jenkins joined",
    desc: "Added to Workspace 'Product Team'",
    time: "1h ago",
    icon: UserPlus,
  },
  {
    id: 3,
    type: "github",
    title: "New pull request merged",
    desc: "corely/frontend-v2 #492 by @johndoe",
    time: "3h ago",
    icon: GitPullRequest,
  },
  {
    id: 4,
    type: "query",
    title: "Trending Query",
    desc: "Multiple users asking about 'Q3 Roadmap'",
    time: "5h ago",
    icon: Search,
  },
  {
    id: 5,
    type: "document",
    title: "High-value document detected",
    desc: "'Q3 OKRs & Strategy.pdf' added to Notion",
    time: "1d ago",
    icon: FileText,
  }
];

export default function ActivityFeedPanel() {
  return (
    <div className="db-panel">
      {/* Header */}
      <div className="db-panel-header">
        <span className="db-panel-title type-heading">
          <Activity />
          Activity feed
        </span>
        <div className="db-panel-actions">
          <button className="db-panel-icon-btn" aria-label="More options">
            <MoreHorizontal size={16} />
          </button>
          <button className="db-panel-icon-btn" aria-label="Close panel">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Feed Body: one row per event, split by hairline dividers */}
      <div className="db-panel-body db-panel-body--flush">
        <div className="db-feed-list">
          {activities.map((activity) => (
            <div key={activity.id} className="db-feed-row">
              <span className="db-row-icon" aria-hidden="true">
                <activity.icon strokeWidth={2} />
              </span>
              <div className="db-feed-main">
                <div className="db-feed-top">
                  <span className="db-feed-title">{activity.title}</span>
                  <span className="db-feed-time type-caption">{activity.time}</span>
                </div>
                <div className="db-feed-desc">{activity.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="db-panel-footer">
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm ui-btn--block">
          View full activity log
        </button>
      </div>
    </div>
  );
}
