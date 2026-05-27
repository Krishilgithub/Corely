"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
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



const pieData = [
  { name: "Critical", value: 12, color: "#ef4444" },
  { name: "High", value: 28, color: "#ff6b00" },
  { name: "Medium", value: 78, color: "#eab308" },
  { name: "Low", value: 38, color: "#22c55e" },
];

const lineData = [
  { date: "May 1", val: 20 },
  { date: "May 8", val: 28 },
  { date: "May 15", val: 24 },
  { date: "May 22", val: 40 },
  { date: "May 29", val: 38 },
  { date: "May 30", val: 50 },
];

const categoryProgress = [
  { name: "Operational", value: 42, color: "#ff6b00", iconBg: "#eff6ff", iconColor: "#3b82f6" },
  { name: "Customer", value: 38, color: "#ff6b00", iconBg: "#fef2f2", iconColor: "#ef4444" },
  { name: "Financial", value: 28, color: "#ff6b00", iconBg: "#f0fdf4", iconColor: "#16a34a" },
  { name: "People", value: 24, color: "#8b5cf6", iconBg: "#f5f3ff", iconColor: "#8b5cf6" },
  { name: "Product", value: 14, color: "#22c55e", iconBg: "#ecfeff", iconColor: "#0891b2" },
  { name: "Risk", value: 10, color: "#ef4444", iconBg: "#fef2f2", iconColor: "#ef4444" },
];

// ── Components ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IconMap: Record<string, any> = { Activity, Code2, DollarSign, Users, ShieldAlert, Sparkles };

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState("All Insights");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    "Strategic",
    "Operational",
    "Financial",
    "People",
    "Customer",
    "Risk",
    "Product",
  ];

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
          <button className="in-btn-secondary">
            <Upload size={14} />
            Export
          </button>
          <button className="in-btn-primary">
            <Sparkles size={14} />
            Ask about insights
          </button>
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
            <div className="in-stat-val">12</div>
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
            <div className="in-stat-val">28</div>
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
            <div className="in-stat-val">156</div>
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
            <div className="in-stat-val">94%</div>
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
          <input type="text" placeholder="Search insights..." />
        </div>
        <div className="in-dropdown">
          All Priority <ChevronDown size={14} color="#a1a1aa" />
        </div>
        <div className="in-dropdown">
          All Categories <ChevronDown size={14} color="#a1a1aa" />
        </div>
        <div className="in-dropdown">
          All Sources <ChevronDown size={14} color="#a1a1aa" />
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
          ) : insights.map((row) => {
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
                  {row.id % 2 === 0 ? (
                    <>
                      <div className="in-source-avatar" style={{ background: "#4a154b" }}>S</div>
                      <div className="in-source-avatar" style={{ background: "#111" }}>N</div>
                    </>
                  ) : (
                    <>
                      <div className="in-source-avatar" style={{ background: "#0ea5e9" }}>S</div>
                      <div className="in-source-avatar" style={{ background: "#10b981" }}>G</div>
                    </>
                  )}
                </div>

                <div style={{ textAlign: "right" }}>
                  <button className="in-actions-btn">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="in-table-footer">
            <span>Showing 1 to 6 of 156 insights</span>
            <button className="in-load-more">
              Load more <ChevronDown size={14} />
            </button>
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
                      data={pieData}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
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
                    156
                  </div>
                  <div style={{ fontSize: 11, color: "#71717a", fontWeight: 500 }}>
                    Total
                  </div>
                </div>
              </div>
              <div className="in-legend">
                {pieData.map((d) => (
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
                <LineChart data={lineData}>
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
              {categoryProgress.map((cat) => (
                <div className="in-progress-row" key={cat.name}>
                  <div className="in-progress-label">
                    <div
                      className="in-progress-label-icon"
                      style={{ backgroundColor: cat.iconBg, color: cat.iconColor }}
                    >
                      {cat.name === "Operational" && <Code2 size={10} />}
                      {cat.name === "Customer" && <Activity size={10} />}
                      {cat.name === "Financial" && <DollarSign size={10} />}
                      {cat.name === "People" && <Users size={10} />}
                      {cat.name === "Product" && <Sparkles size={10} />}
                      {cat.name === "Risk" && <ShieldAlert size={10} />}
                    </div>
                    {cat.name}
                  </div>
                  <div className="in-progress-bg">
                    <div
                      className="in-progress-fill"
                      style={{ width: `${(cat.value / 42) * 100}%`, backgroundColor: cat.color }}
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
