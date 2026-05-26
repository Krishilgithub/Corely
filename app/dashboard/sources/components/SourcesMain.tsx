"use client";

import { motion } from "framer-motion";
import {
  Plus,
  RefreshCw,
  Database,
  FileText,
  Clock,
  Activity,
  Search,
  Filter,
  List,
  MoreHorizontal,
} from "lucide-react";

// Inline brand SVGs for exact matching without external assets
const BrandIcons = {
  Slack: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2.5a2.5 2.5 0 0 0-2.5 2.5 2.5 2.5 0 0 0 2.5 2.5h2.5V5A2.5 2.5 0 0 0 10 2.5z" fill="#e01e5a" stroke="none" />
      <path d="M14 2.5a2.5 2.5 0 0 0-2.5 2.5v6.5a2.5 2.5 0 1 0 5 0V5A2.5 2.5 0 0 0 14 2.5z" fill="#36c5f0" stroke="none" />
      <path d="M2.5 14A2.5 2.5 0 0 0 5 16.5a2.5 2.5 0 0 0 2.5-2.5v-2.5H5A2.5 2.5 0 0 0 2.5 14z" fill="#2eb67d" stroke="none" />
      <path d="M2.5 10A2.5 2.5 0 0 0 5 12.5h6.5a2.5 2.5 0 1 0 0-5H5A2.5 2.5 0 0 0 2.5 10z" fill="#ecb22e" stroke="none" />
    </svg>
  ),
  Notion: () => (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#000" />
      <path d="M15 17l-4-6v6H9V7h2l4 6V7h2v10h-2z" fill="#fff" />
    </svg>
  ),
  GoogleDrive: () => (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <path d="M15 2L7 16h8l8-14H15z" fill="#FFC107" />
      <path d="M7 16L3 9l8-14-4 7z" fill="#4CAF50" />
      <path d="M15 2l8 14H7L15 2z" fill="#2196F3" opacity="0.8"/>
    </svg>
  ),
  Salesforce: () => (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <path d="M16 8A5 5 0 0 0 7 9a4 4 0 0 0-1 7h12a4 4 0 0 0 2-7.5A4.5 4.5 0 0 0 16 8z" fill="#00a1e0" />
      <path d="M9 12h6v1H9z" fill="#fff" />
    </svg>
  ),
  Gmail: () => (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <path d="M2 6l10 7 10-7v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z" fill="#ea4335" />
      <path d="M22 6l-10 7L2 6l10-7 10 7z" fill="#4285f4" />
    </svg>
  ),
  MSTeams: () => (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <rect x="2" y="4" width="12" height="16" rx="2" fill="#5059c9" />
      <path d="M6 10h4v2H6zM6 14h2v2H6z" fill="#fff" />
      <path d="M16 6a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" fill="#5059c9" />
    </svg>
  ),
  Zoom: () => (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <circle cx="12" cy="12" r="12" fill="#2D8CFF" />
      <path d="M7 9h6a2 2 0 0 1 2 2v2l4-3v8l-4-3v2a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z" fill="#fff" />
    </svg>
  ),
  Snowflake: () => (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19" stroke="#29b5e8" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  HubSpot: () => (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <circle cx="12" cy="12" r="5" fill="#ff7a59" />
      <circle cx="19" cy="6" r="3" fill="#ff7a59" />
      <circle cx="5" cy="18" r="3" fill="#ff7a59" />
      <circle cx="5" cy="6" r="3" fill="#ff7a59" />
      <path d="M16.5 8L15 9.5M7.5 16l1.5-1.5M7.5 8l1.5 1.5" stroke="#ff7a59" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

const tableData = [
  { icon: BrandIcons.Slack, name: "Slack", url: "corely-enterprise.slack.com", type: "Collaboration", typeBg: "#f3e8ff", typeCol: "#9333ea", conn: "Connected", method: "OAuth", sync: "2 min ago", syncDate: "May 12, 9:41 AM", items: "248,532", itemType: "Messages", status: "Healthy" },
  { icon: BrandIcons.Notion, name: "Notion", url: "Corely Workspace", type: "Documentation", typeBg: "#e0f2fe", typeCol: "#0ea5e9", conn: "Connected", method: "OAuth", sync: "5 min ago", syncDate: "May 12, 9:38 AM", items: "124,853", itemType: "Pages", status: "Healthy" },
  { icon: BrandIcons.GoogleDrive, name: "Google Drive", url: "corely@corely.com", type: "Storage", typeBg: "#dcfce7", typeCol: "#16a34a", conn: "Connected", method: "OAuth", sync: "8 min ago", syncDate: "May 12, 9:35 AM", items: "532,421", itemType: "Files", status: "Healthy" },
  { icon: BrandIcons.Salesforce, name: "Salesforce", url: "Corely Production", type: "CRM", typeBg: "#fef3c7", typeCol: "#d97706", conn: "Connected", method: "OAuth", sync: "12 min ago", syncDate: "May 12, 9:31 AM", items: "315,672", itemType: "Records", status: "Healthy" },
  { icon: BrandIcons.Gmail, name: "Gmail", url: "krishil@corely.com", type: "Email", typeBg: "#fce7f3", typeCol: "#db2777", conn: "Connected", method: "IMAP", sync: "3 min ago", syncDate: "May 12, 9:40 AM", items: "186,421", itemType: "Emails", status: "Healthy" },
  { icon: BrandIcons.MSTeams, name: "Microsoft Teams", url: "Corely Enterprise", type: "Collaboration", typeBg: "#f3e8ff", typeCol: "#9333ea", conn: "Connected", method: "OAuth", sync: "7 min ago", syncDate: "May 12, 9:36 AM", items: "93,673", itemType: "Messages", status: "Healthy" },
  { icon: BrandIcons.Zoom, name: "Zoom", url: "corely.zoom.us", type: "Meetings", typeBg: "#e0e7ff", typeCol: "#4f46e5", conn: "Connected", method: "OAuth", sync: "15 min ago", syncDate: "May 12, 9:28 AM", items: "12,842", itemType: "Meetings", status: "Healthy" },
  { icon: BrandIcons.Snowflake, name: "Snowflake", url: "Corely Analytics", type: "Data Warehouse", typeBg: "#e0f2fe", typeCol: "#0ea5e9", conn: "Connected", method: "Key Pair", sync: "20 min ago", syncDate: "May 12, 9:23 AM", items: "1.2M", itemType: "Rows", status: "Healthy" },
  { icon: BrandIcons.HubSpot, name: "HubSpot", url: "Corely Marketing Hub", type: "Marketing", typeBg: "#ffedd5", typeCol: "#ea580c", conn: "Connected", method: "OAuth", sync: "25 min ago", syncDate: "May 12, 9:18 AM", items: "73,291", itemType: "Records", status: "Healthy" },
];

export default function SourcesMain() {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Header */}
      <motion.div
        className="src-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="src-title">Sources</h1>
          <p className="src-subtitle">Connect, manage, and monitor all your data sources.</p>
        </div>
        <div className="src-header-actions">
          <button className="src-btn-primary">
            <Plus size={16} strokeWidth={2.5} /> Add Source
          </button>
          <button className="src-btn-secondary">
            <RefreshCw size={14} /> Refresh All
          </button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        className="src-kpi-grid"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="src-kpi-card">
          <div className="src-kpi-icon-wrap">
            <div className="src-kpi-icon-inner">
              <Database size={16} style={{ color: "#ff6b00" }} />
            </div>
          </div>
          <div>
            <div className="src-kpi-val">9</div>
            <div className="src-kpi-label">Connected Sources</div>
            <div className="src-kpi-trend src-trend-good">
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a" }} />
              All systems operational
            </div>
          </div>
        </div>
        <div className="src-kpi-card">
          <div className="src-kpi-icon-wrap">
            <div className="src-kpi-icon-inner">
              <FileText size={16} style={{ color: "#ff6b00" }} />
            </div>
          </div>
          <div>
            <div className="src-kpi-val">2.4 <span style={{ fontSize: 18 }}>TB</span></div>
            <div className="src-kpi-label">Data Ingested</div>
            <div className="src-kpi-trend src-trend-up">
              <ArrowUpRightIcon size={12} strokeWidth={3} />
              +18% vs last 7 days
            </div>
          </div>
        </div>
        <div className="src-kpi-card">
          <div className="src-kpi-icon-wrap">
            <div className="src-kpi-icon-inner">
              <Clock size={16} style={{ color: "#ff6b00" }} />
            </div>
          </div>
          <div>
            <div className="src-kpi-val">98.6<span style={{ fontSize: 18 }}>%</span></div>
            <div className="src-kpi-label">Sync Success Rate</div>
            <div className="src-kpi-trend src-trend-good">
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a" }} />
              Excellent
            </div>
          </div>
        </div>
        <div className="src-kpi-card">
          <div className="src-kpi-icon-wrap">
            <div className="src-kpi-icon-inner">
              <Activity size={16} style={{ color: "#ff6b00" }} />
            </div>
          </div>
          <div>
            <div className="src-kpi-val">1.2<span style={{ fontSize: 18 }}>M</span></div>
            <div className="src-kpi-label">Items Indexed</div>
            <div className="src-kpi-trend src-trend-up">
              <ArrowUpRightIcon size={12} strokeWidth={3} />
              +240K vs last 7 days
            </div>
          </div>
        </div>
      </motion.div>

      {/* Table Section */}
      <motion.div
        className="src-table-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="src-table-header">
          <div className="src-tabs">
            <div className="src-tab active">
              All Sources <span className="src-tab-count">9</span>
            </div>
            <div className="src-tab">
              Connected <span className="src-tab-count">9</span>
            </div>
            <div className="src-tab">
              Syncing <span className="src-tab-count">0</span>
            </div>
            <div className="src-tab">
              Issues <span className="src-tab-count">0</span>
            </div>
            <div className="src-tab">
              Disabled <span className="src-tab-count">0</span>
            </div>
          </div>
          <div className="src-table-actions">
            <div className="src-search">
              <Search size={14} style={{ color: "#71717a" }} />
              <input type="text" className="src-search-input" placeholder="Search sources..." />
            </div>
            <button className="src-filter-btn">
              <Filter size={14} /> Filter
            </button>
            <button className="src-list-btn">
              <List size={14} />
            </button>
          </div>
        </div>

        <table className="src-table">
          <thead>
            <tr>
              <th className="src-th">Source</th>
              <th className="src-th">Type</th>
              <th className="src-th">Connection</th>
              <th className="src-th">Last Sync</th>
              <th className="src-th">Data Items</th>
              <th className="src-th">Status</th>
              <th className="src-th" style={{ textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, i) => (
              <tr key={i} className="src-tr">
                <td className="src-td">
                  <div className="src-source-cell">
                    <div className="src-source-icon">
                      <row.icon />
                    </div>
                    <div>
                      <div className="src-source-name">{row.name}</div>
                      <div className="src-source-url">{row.url}</div>
                    </div>
                  </div>
                </td>
                <td className="src-td">
                  <span className="src-type-pill" style={{ background: row.typeBg, color: row.typeCol }}>
                    {row.type}
                  </span>
                </td>
                <td className="src-td">
                  <div className="src-conn-status">
                    <div className="src-conn-dot" />
                    {row.conn}
                  </div>
                  <div className="src-conn-method">{row.method}</div>
                </td>
                <td className="src-td">
                  <div className="src-sync-time">{row.sync}</div>
                  <div className="src-sync-date">{row.syncDate}</div>
                </td>
                <td className="src-td">
                  <div className="src-data-num">{row.items}</div>
                  <div className="src-data-type">{row.itemType}</div>
                </td>
                <td className="src-td">
                  <span className="src-status-badge">{row.status}</span>
                </td>
                <td className="src-td">
                  <div className="src-action-cell">
                    <MoreHorizontal size={16} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="src-table-footer">
          Showing 1 to 9 of 9 sources
        </div>
      </motion.div>
    </div>
  );
}

// Inline custom icon for arrow up right since standard lucide arrowupright is slightly different stroke
function ArrowUpRightIcon({ size = 24, strokeWidth = 2, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17l9.2-9.2M17 17V7H7" />
    </svg>
  );
}
