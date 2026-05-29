"use client";

import { useState, useEffect, useMemo } from "react";
import { Skeleton } from "../components/Skeleton";
import {
  Sparkles,
  Upload,
  Zap,
  AlertTriangle,
  CheckCircle,
  Eye,
  Search,
  ChevronDown,
  Calendar,
  Filter,
  MoreHorizontal,
  TrendingUp,
  Activity,
  Code2,
  DollarSign,
  Users,
  ShieldAlert,
  ArrowRight,
  Database,
  Clock,
  CheckCircle2,
  FileText,
  UserPlus
} from "lucide-react";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import "./insights.css";




// ── Components ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IconMap: Record<string, any> = { Activity, Code2, DollarSign, Users, ShieldAlert, Sparkles, Database, AlertTriangle, Clock, CheckCircle2, FileText, UserPlus };

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState("All Insights");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("All Priority");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedSource, setSelectedSource] = useState("All Sources");
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    fetch("/api/insights")
      .then(res => res.json())
      .then(data => {
        setInsights(data.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const tabs = [
    "All Insights",
    "Operational",
    "Activity",
    "Product",
    "People",
    "Risk",
  ];

  // ── Computed Stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const critical = insights.filter((i) => i.priority === "Critical").length;
    const high = insights.filter((i) => i.priority === "High").length;
    return {
      critical,
      high,
      newThisMonth: insights.length,
      actionedRate: Math.max(70, Math.min(99, 70 + critical * 2)),
    };
  }, [insights]);

  // ── Dynamic Pie Data ──────────────────────────────────────────────────────
  const dynamicPieData = useMemo(() => {
    const critical = insights.filter((i) => i.priority === "Critical").length;
    const high = insights.filter((i) => i.priority === "High").length;
    const medium = insights.filter((i) => i.priority === "Medium").length;
    const low = insights.filter((i) => i.priority === "Low").length;

    return [
      { name: "Critical", value: critical, color: "#ef4444" },
      { name: "High", value: high, color: "#ff6b00" },
      { name: "Medium", value: medium, color: "#eab308" },
      { name: "Low", value: low, color: "#22c55e" },
    ].filter(d => d.value > 0);
  }, [insights]);

  // ── Dynamic Category Progress ─────────────────────────────────────────────
  const dynamicCategoryProgress = useMemo(() => {
    const counts: Record<string, number> = {};
    insights.forEach((i) => {
      counts[i.category] = (counts[i.category] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => {
        let color = "#ff6b00", iconBg = "#eff6ff", iconColor = "#3b82f6";
        if (name === "Activity") { color = "#16a34a"; iconBg = "#f0fdf4"; iconColor = "#16a34a"; }
        else if (name === "Operational") { color = "#8b5cf6"; iconBg = "#f5f3ff"; iconColor = "#8b5cf6"; }
        else if (name === "People") { color = "#ea580c"; iconBg = "#fff7ed"; iconColor = "#ea580c"; }
        else if (name === "Product") { color = "#0891b2"; iconBg = "#ecfeff"; iconColor = "#0891b2"; }
        else if (name === "Risk") { color = "#ef4444"; iconBg = "#fef2f2"; iconColor = "#ef4444"; }
        return { name, value, color, iconBg, iconColor };
      })
      .sort((a, b) => b.value - a.value);
  }, [insights]);

  const maxCategoryValue = Math.max(...dynamicCategoryProgress.map((c) => c.value), 1);

  // ── Dynamic Line Data ─────────────────────────────────────────────────────
  const dynamicLineData = useMemo(() => {
    const base = insights.length > 0 ? insights.length : 1;
    return [
      { date: "May 1", val: 20 + base * 2 },
      { date: "May 8", val: 28 + base },
      { date: "May 15", val: 24 + base * 1.5 },
      { date: "May 22", val: 40 + base * 2.5 },
      { date: "May 29", val: 38 + base },
      { date: "May 30", val: 50 + base * 3 },
    ];
  }, [insights]);

  // ── Filtering Logic ───────────────────────────────────────────────────────
  const filteredInsights = useMemo(() => {
    return insights.filter((item) => {
      if (activeTab !== "All Insights" && item.category !== activeTab) return false;
      if (selectedPriority !== "All Priority" && item.priority !== selectedPriority) return false;
      if (selectedCategory !== "All Categories" && item.category !== selectedCategory) return false;
      if (selectedSource !== "All Sources" && item.source !== selectedSource) return false;
      
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(query) ||
          item.desc.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [insights, activeTab, selectedPriority, selectedCategory, selectedSource, searchQuery]);

  const visibleInsights = filteredInsights.slice(0, visibleCount);

  const handleExport = () => {
    const headers = ["Title", "Category", "Priority", "Impact", "Source", "Time"];
    const rows = filteredInsights.map(row => 
      `"${row.title.replace(/"/g, '""')}","${row.category}","${row.priority}","${row.impact}","${row.source || ''}","${row.time}"`
    );
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'insights_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="in-container">
      {/* ── Header ── */}
      <div className="in-header-row">
        <div className="in-title-wrapper">
          <h1 className="in-title">
            <Sparkles size={24} color="#ff6b00" /> Insights
          </h1>
          <p className="in-subtitle">
            AI-generated insights from across your organization.
          </p>
        </div>
        <div className="in-header-actions">
          <button className="in-btn-secondary" onClick={handleExport}>
            <Upload size={14} />
            Export
          </button>
          <Link href="/dashboard/ask-corely?q=Analyze+my+recent+insights" style={{ textDecoration: "none" }}>
            <button className="in-btn-primary">
              <Sparkles size={14} />
              Ask about insights
            </button>
          </Link>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="in-tabs">
        {tabs.map((tab) => (
          <div
            key={tab}
            className={`in-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* ── Stat Cards ── */}
      <div className="in-stats-grid">
        <div className="in-stat-card">
          <div
            className="in-stat-icon-wrapper"
            style={{ backgroundColor: "#fff3ee", color: "#ff6b00" }}
          >
            <Zap size={20} />
          </div>
          <div>
            <div className="in-stat-val">{stats.critical}</div>
            <div className="in-stat-label">Critical Insights</div>
            <div className="in-stat-trend" style={{ color: "#16a34a" }}>
              <TrendingUp size={12} /> 20% vs last month
            </div>
          </div>
        </div>

        <div className="in-stat-card">
          <div
            className="in-stat-icon-wrapper"
            style={{ backgroundColor: "#fffbeb", color: "#d97706" }}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="in-stat-val">{stats.high}</div>
            <div className="in-stat-label">High Priority</div>
            <div className="in-stat-trend" style={{ color: "#16a34a" }}>
              <TrendingUp size={12} /> 12% vs last month
            </div>
          </div>
        </div>

        <div className="in-stat-card">
          <div
            className="in-stat-icon-wrapper"
            style={{ backgroundColor: "#f0fdf4", color: "#16a34a" }}
          >
            <CheckCircle size={20} />
          </div>
          <div>
            <div className="in-stat-val">{stats.newThisMonth}</div>
            <div className="in-stat-label">New This Month</div>
            <div className="in-stat-trend" style={{ color: "#16a34a" }}>
              <TrendingUp size={12} /> 34% vs last month
            </div>
          </div>
        </div>

        <div className="in-stat-card">
          <div
            className="in-stat-icon-wrapper"
            style={{ backgroundColor: "#f5f3ff", color: "#8b5cf6" }}
          >
            <Eye size={20} />
          </div>
          <div>
            <div className="in-stat-val">{stats.actionedRate}%</div>
            <div className="in-stat-label">Actioned Rate</div>
            <div className="in-stat-trend" style={{ color: "#16a34a" }}>
              <TrendingUp size={12} /> 18% vs last month
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="in-filters-bar">
        <div className="in-search-box">
          <Search size={14} color="#a1a1aa" />
          <input type="text" placeholder="Search insights..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="in-dropdown" style={{ position: "relative" }}>
          <select value={selectedPriority} onChange={e => setSelectedPriority(e.target.value)} style={{ position: "absolute", opacity: 0, width: "100%", height: "100%", cursor: "pointer", top: 0, left: 0 }}>
            <option>All Priority</option>
            <option>Critical</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          {selectedPriority} <ChevronDown size={14} color="#a1a1aa" />
        </div>
        <div className="in-dropdown" style={{ position: "relative" }}>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={{ position: "absolute", opacity: 0, width: "100%", height: "100%", cursor: "pointer", top: 0, left: 0 }}>
            <option>All Categories</option>
            <option>Operational</option>
            <option>Activity</option>
            <option>Product</option>
            <option>People</option>
            <option>Risk</option>
          </select>
          {selectedCategory} <ChevronDown size={14} color="#a1a1aa" />
        </div>
        <div className="in-dropdown" style={{ position: "relative" }}>
          <select value={selectedSource} onChange={e => setSelectedSource(e.target.value)} style={{ position: "absolute", opacity: 0, width: "100%", height: "100%", cursor: "pointer", top: 0, left: 0 }}>
            <option>All Sources</option>
            <option>Salesforce</option>
            <option>GitHub</option>
            <option>Google Drive</option>
            <option>Slack</option>
            <option>Corely AI</option>
          </select>
          {selectedSource} <ChevronDown size={14} color="#a1a1aa" />
        </div>
        <div className="in-dropdown" style={{ marginLeft: "auto" }}>
          <Calendar size={14} color="#3f3f46" /> This Month{" "}
          <ChevronDown size={14} color="#a1a1aa" />
        </div>
        <div className="in-dropdown">
          <Filter size={14} color="#3f3f46" /> Filters
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="in-main-grid">
        {/* Left Side Table */}
        <div className="in-table-container">
          <div className="in-table-header">
            <div>Insight</div>
            <div>Category</div>
            <div>Priority</div>
            <div>Impact</div>
            <div>Detected</div>
            <div>Source</div>
            <div></div>
          </div>

          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div className="in-table-row" key={`skel-${i}`}>
                <div className="in-insight-col" style={{ gap: 16 }}>
                  <Skeleton width={32} height={32} borderRadius="8px" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                    <Skeleton width="80%" height={16} />
                    <Skeleton width="95%" height={12} />
                  </div>
                </div>
                <div><Skeleton width={80} height={24} borderRadius="12px" /></div>
                <div><Skeleton width={80} height={24} borderRadius="12px" /></div>
                <div><Skeleton width={60} height={16} /></div>
                <div><Skeleton width={60} height={16} /></div>
                <div><Skeleton width={60} height={24} /></div>
                <div style={{ textAlign: "right" }}><Skeleton width={24} height={24} style={{ display: 'inline-block' }} /></div>
              </div>
            ))
          ) : visibleInsights.length > 0 ? (
            visibleInsights.map((row) => {
            const IconCmp = IconMap[row.icon] || Sparkles;
            return (
              <div className="in-table-row" key={row.id}>
                <div className="in-insight-col">
                  <div
                    className="in-insight-icon"
                    style={{ backgroundColor: row.iconBg, color: row.iconColor }}
                  >
                    <IconCmp size={16} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="in-insight-title">{row.title}</div>
                    <div className="in-insight-desc">{row.desc}</div>
                  </div>
                </div>

                <div>
                  <span
                    className="in-badge"
                    style={{ backgroundColor: row.catBg, color: row.catColor }}
                  >
                    {row.category}
                  </span>
                </div>

                <div>
                  <span
                    className="in-badge"
                    style={{ backgroundColor: row.priBg, color: row.priColor }}
                  >
                    <span style={{ marginRight: 4 }}>●</span> {row.priority}
                  </span>
                </div>

                <div className="in-impact" style={{ color: row.priColor }}>
                  {row.impact} {row.trend === "up" ? "↑" : "↓"}
                </div>

                <div className="in-time">{row.time}</div>

                <div className="in-sources">
                  <div className="in-source-avatar" style={{ background: "#4a154b" }}>{row.source ? row.source[0] : "S"}</div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <button className="in-actions-btn">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>
            );
          })
          ) : (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#71717a" }}>
              No insights found for these filters.
            </div>
          )}

          <div className="in-table-footer">
            <span>Showing {Math.min(visibleInsights.length, visibleCount)} of {filteredInsights.length} insights</span>
            {visibleCount < filteredInsights.length && (
              <button className="in-load-more" onClick={() => setVisibleCount(v => v + 5)}>
                Load more <ChevronDown size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Right Side Sidebar */}
        <div className="in-sidebar">
          {/* Donut Chart */}
          <div className="in-side-card">
            <div className="in-side-header">
              <span className="in-side-title">Insights Overview</span>
              <a href="#" className="in-side-link">
                View all
              </a>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ position: "relative", width: 140, height: 140 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dynamicPieData}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {dynamicPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1 }}>
                    {insights.length}
                  </div>
                  <div style={{ fontSize: 11, color: "#71717a", fontWeight: 500 }}>
                    Total
                  </div>
                </div>
              </div>
              <div className="in-legend">
                {dynamicPieData.map((d) => (
                  <div className="in-legend-item" key={d.name}>
                    <div
                      className="in-legend-dot"
                      style={{ backgroundColor: d.color }}
                    />
                    <span style={{ width: 16, fontWeight: 700 }}>{d.value}</span>
                    <span style={{ color: "#71717a" }}>{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Line Chart */}
          <div className="in-side-card">
            <div className="in-side-header">
              <span className="in-side-title">Insights Trend</span>
              <a href="#" className="in-side-link">
                View analytics
              </a>
            </div>
            <div
              className="in-dropdown"
              style={{ width: "fit-content", marginBottom: 16, height: 28, fontSize: 12 }}
            >
              This Month <ChevronDown size={14} color="#a1a1aa" />
            </div>
            <div style={{ width: "100%", height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dynamicLineData}>
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#a1a1aa" }}
                    dy={10}
                  />
                  <YAxis
                    hide
                    domain={[0, "dataMax + 10"]}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                    itemStyle={{ color: "#18181b", fontWeight: 600 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="val"
                    stroke="#ff6b00"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#ff6b00", stroke: "#fff", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="in-side-card">
            <div className="in-side-header">
              <span className="in-side-title">Top Insight Categories</span>
              <a href="#" className="in-side-link">
                View all
              </a>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {dynamicCategoryProgress.map((cat) => (
                <div className="in-progress-row" key={cat.name}>
                  <div className="in-progress-label">
                    <div
                      className="in-progress-label-icon"
                      style={{ backgroundColor: cat.iconBg, color: cat.iconColor }}
                    >
                      {cat.name === "Operational" && <Code2 size={10} />}
                      {cat.name === "Activity" && <Activity size={10} />}
                      {cat.name === "People" && <Users size={10} />}
                      {cat.name === "Product" && <Sparkles size={10} />}
                      {cat.name === "Risk" && <ShieldAlert size={10} />}
                    </div>
                    {cat.name}
                  </div>
                  <div className="in-progress-bg">
                    <div
                      className="in-progress-fill"
                      style={{ width: `${(cat.value / maxCategoryValue) * 100}%`, backgroundColor: cat.color }}
                    />
                  </div>
                  <div style={{ textAlign: "right", fontWeight: 700 }}>{cat.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Card */}
          <div className="in-cta-card">
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div className="in-cta-icon">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="in-cta-title">Want deeper insights?</div>
                <div className="in-cta-desc">Ask Corely anything about these insights</div>
              </div>
            </div>
            <button className="in-cta-btn" style={{ marginTop: 4 }}>
              Ask Corely <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
