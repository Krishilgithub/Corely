"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "../components/Skeleton";
import {
  Users,
  Activity,
  GraduationCap,
  Target,
  Zap,
  Search,
  Filter,
  List,
  Grid,
  MoreHorizontal,
  Upload,
  Plus,
  RefreshCw,
  BarChart2,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import "./teams.css";

// ── Components ───────────────────────────────────────────────────────────────

const CircularProgress = ({
  score,
  color,
  size = 36,
  strokeWidth = 3,
}: {
  score: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="tm-score-ring-wrapper" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          stroke="#f4f4f5"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className="tm-score-text" style={{ color }}>
        {score}
      </div>
    </div>
  );
};

const Sparkline = ({ color }: { color: string }) => {
  return (
    <svg className="tm-sparkline" viewBox="0 0 60 24">
      <path
        d="M0,20 L10,14 L20,18 L30,8 L40,12 L50,4 L60,8"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const SparklineDown = ({ color }: { color: string }) => {
  return (
    <svg className="tm-sparkline" viewBox="0 0 60 24">
      <path
        d="M0,4 L10,10 L20,6 L30,16 L40,12 L50,20 L60,16"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};



const pieData = [
  { name: "Excellent", value: 8, color: "#10b981" },
  { name: "Good", value: 10, color: "#3b82f6" },
  { name: "Fair", value: 4, color: "#f59e0b" },
  { name: "Poor", value: 2, color: "#ef4444" },
];

const strengths = [
  { name: "Knowledge Sharing", val: 84, color: "#10b981", icon: GraduationCap, bg: "#eff6ff", icColor: "#3b82f6" },
  { name: "Execution Velocity", val: 81, color: "#10b981", icon: Zap, bg: "#f0fdf4", icColor: "#16a34a" },
  { name: "Cross-team Collaboration", val: 76, color: "#10b981", icon: Users, bg: "#fff3ee", icColor: "#ff6b00" },
  { name: "Adaptability", val: 72, color: "#f59e0b", icon: RefreshCw, bg: "#eff6ff", icColor: "#3b82f6" },
];

const attentionTeams = [
  { name: "People Operations", desc: "Low knowledge coverage", score: 68 },
  { name: "Legal", desc: "Low collaboration score", score: 60 },
  { name: "Finance", desc: "Declining action completion", score: 72 },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IconMap: Record<string, any> = { Users, Activity, GraduationCap, Target, Zap, BarChart2, ShieldAlert };

export default function TeamsPage() {
  const [activeTab, setActiveTab] = useState("All Teams");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/teams")
      .then(res => res.json())
      .then(data => {
        setTeams(data.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);
  const tabs = ["All Teams", "Performance", "Collaboration", "Knowledge", "At Risk"];

  return (
    <main className="tm-container">
      {/* ── Header ── */}
      <div className="tm-header-row">
        <div className="tm-title-wrapper">
          <h1 className="tm-title">
            <Users size={24} color="#ff6b00" /> Teams
          </h1>
          <p className="tm-subtitle">
            Understand team performance, collaboration health, and knowledge coverage.
          </p>
        </div>
        <div className="tm-header-actions">
          <button className="tm-btn-secondary">
            <Upload size={14} />
            Export
          </button>
          <button className="tm-btn-primary">
            <Plus size={14} />
            Add Team
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="tm-stats-grid">
        <div className="tm-stat-card">
          <div className="tm-stat-icon-wrapper" style={{ backgroundColor: "#fff3ee", color: "#ff6b00" }}>
            <Users size={20} />
          </div>
          <div>
            <div className="tm-stat-val">24</div>
            <div className="tm-stat-label">Active Teams</div>
            <div className="tm-stat-trend" style={{ color: "#16a34a" }}>
              ↑ 9% vs last month
            </div>
          </div>
        </div>

        <div className="tm-stat-card">
          <div className="tm-stat-icon-wrapper" style={{ backgroundColor: "#f5f3ff", color: "#8b5cf6" }}>
            <Activity size={20} />
          </div>
          <div>
            <div className="tm-stat-val">78</div>
            <div className="tm-stat-label">Collaboration Score</div>
            <div className="tm-stat-trend" style={{ color: "#16a34a" }}>
              ↑ 6 pts vs last month
            </div>
          </div>
        </div>

        <div className="tm-stat-card">
          <div className="tm-stat-icon-wrapper" style={{ backgroundColor: "#f0fdf4", color: "#16a34a" }}>
            <GraduationCap size={20} />
          </div>
          <div>
            <div className="tm-stat-val">92%</div>
            <div className="tm-stat-label">Knowledge Coverage</div>
            <div className="tm-stat-trend" style={{ color: "#16a34a" }}>
              ↑ 7% vs last month
            </div>
          </div>
        </div>

        <div className="tm-stat-card">
          <div className="tm-stat-icon-wrapper" style={{ backgroundColor: "#fff3ee", color: "#ff6b00" }}>
            <Target size={20} />
          </div>
          <div>
            <div className="tm-stat-val">18</div>
            <div className="tm-stat-label">Teams at Risk</div>
            <div className="tm-stat-trend" style={{ color: "#ef4444" }}>
              ↓ 3 vs last month
            </div>
          </div>
        </div>

        <div className="tm-stat-card">
          <div className="tm-stat-icon-wrapper" style={{ backgroundColor: "#eff6ff", color: "#3b82f6" }}>
            <Zap size={20} />
          </div>
          <div>
            <div className="tm-stat-val">1,248</div>
            <div className="tm-stat-label">Actions Executed</div>
            <div className="tm-stat-trend" style={{ color: "#16a34a" }}>
              ↑ 24% vs last month
            </div>
          </div>
        </div>
      </div>

      {/* ── Controls Row ── */}
      <div className="tm-controls-row">
        <div className="tm-tabs">
          {tabs.map((tab) => (
            <div
              key={tab}
              className={`tm-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </div>
          ))}
        </div>
        <div className="tm-filters">
          <div className="tm-search-box">
            <Search size={14} color="#a1a1aa" />
            <input type="text" placeholder="Search teams..." />
          </div>
          <button className="tm-btn-filter">
            <Filter size={14} /> Filters
          </button>
          <div className="tm-view-toggles">
            <button className="tm-view-btn active">
              <List size={16} />
            </button>
            <button className="tm-view-btn">
              <Grid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="tm-main-grid">
        {/* Left Side Table */}
        <div className="tm-table-container">
          <div className="tm-table-header">
            <div>Team</div>
            <div>Health Score</div>
            <div>Collaboration</div>
            <div>Knowledge Coverage</div>
            <div>Actions (30D)</div>
            <div>Key Focus</div>
            <div>Trend</div>
            <div></div>
          </div>

          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div className="tm-table-row" key={`skel-${i}`}>
                <div className="tm-team-col" style={{ gap: 16 }}>
                  <Skeleton width={36} height={36} borderRadius="8px" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                    <Skeleton width="60%" height={16} />
                    <Skeleton width="40%" height={12} />
                  </div>
                </div>
                <div><Skeleton width={36} height={36} borderRadius="50%" style={{ margin: '0 auto' }} /></div>
                <div className="tm-text-center"><Skeleton width={60} height={16} style={{ display: 'inline-block' }} /></div>
                <div><Skeleton width={36} height={36} borderRadius="50%" style={{ margin: '0 auto' }} /></div>
                <div className="tm-actions-col">
                  <Skeleton width={30} height={16} />
                  <Skeleton width={40} height={12} />
                </div>
                <div><Skeleton width={70} height={24} borderRadius="12px" /></div>
                <div><Skeleton width={60} height={24} /></div>
                <div style={{ textAlign: "right" }}><Skeleton width={24} height={24} style={{ display: 'inline-block' }} /></div>
              </div>
            ))
          ) : teams.map((row) => {
            const IconCmp = IconMap[row.icon] || Users;
            return (
              <div className="tm-table-row" key={row.id}>
                <div className="tm-team-col">
                  <div
                    className="tm-team-icon"
                    style={{ backgroundColor: row.iconBg, color: row.iconColor }}
                  >
                    <IconCmp size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="tm-team-title">{row.name}</div>
                    <div className="tm-team-desc">{row.members} members</div>
                  </div>
                </div>

                <div>
                  <CircularProgress score={row.health} color={row.healthColor} />
                </div>

                <div className="tm-text-center">{row.collab}</div>

                <div>
                  <CircularProgress score={row.know} color={row.knowColor} />
                </div>

                <div className="tm-actions-col">
                  <div className="tm-actions-val">{row.actions}</div>
                  <div
                    className="tm-actions-trend"
                    style={{ color: row.isUp ? "#16a34a" : "#ef4444" }}
                  >
                    {row.isUp ? "↑" : "↓"} {Math.abs(row.actionsTrend)}%
                  </div>
                </div>

                <div>
                  <span
                    className="tm-badge"
                    style={{ backgroundColor: row.focusBg, color: row.focusColor }}
                  >
                    {row.focus}
                  </span>
                </div>

                <div>
                  {row.isUp ? <Sparkline color="#10b981" /> : <SparklineDown color="#ff6b00" />}
                </div>

                <div>
                  <button className="tm-actions-btn">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="tm-table-footer">
            <span>Showing 1 to 8 of 24 teams</span>
            <div className="tm-pagination">
              <button className="tm-page-btn border">
                <ChevronLeft size={14} />
              </button>
              <button className="tm-page-btn active">1</button>
              <button className="tm-page-btn">2</button>
              <button className="tm-page-btn">3</button>
              <button className="tm-page-btn">
                <MoreHorizontal size={14} />
              </button>
              <button className="tm-page-btn border">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side Sidebar */}
        <div className="tm-sidebar">
          {/* Health Overview Chart */}
          <div className="tm-side-card">
            <div className="tm-side-header">
              <span className="tm-side-title">Team Health Overview</span>
              <a href="#" className="tm-side-link">
                View analytics
              </a>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ position: "relative", width: 130, height: 130 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={45}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                      startAngle={90}
                      endAngle={-270}
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
                    78
                  </div>
                  <div style={{ fontSize: 10, color: "#71717a", fontWeight: 500 }}>
                    Avg. Health Score
                  </div>
                </div>
              </div>
              <div className="tm-legend">
                <div className="tm-legend-item">
                  <div className="tm-legend-dot" style={{ backgroundColor: "#10b981" }} />
                  <span>Excellent (80-100)</span>
                  <span style={{ fontWeight: 700, textAlign: "right" }}>8</span>
                </div>
                <div className="tm-legend-item">
                  <div className="tm-legend-dot" style={{ backgroundColor: "#3b82f6" }} />
                  <span>Good (60-79)</span>
                  <span style={{ fontWeight: 700, textAlign: "right" }}>10</span>
                </div>
                <div className="tm-legend-item">
                  <div className="tm-legend-dot" style={{ backgroundColor: "#f59e0b" }} />
                  <span>Fair (40-59)</span>
                  <span style={{ fontWeight: 700, textAlign: "right" }}>4</span>
                </div>
                <div className="tm-legend-item">
                  <div className="tm-legend-dot" style={{ backgroundColor: "#ef4444" }} />
                  <span>Poor (0-39)</span>
                  <span style={{ fontWeight: 700, textAlign: "right" }}>2</span>
                </div>
              </div>
            </div>
          </div>

          {/* Strengths Progress */}
          <div className="tm-side-card">
            <div className="tm-side-header">
              <span className="tm-side-title">Top Strengths Across Teams</span>
              <a href="#" className="tm-side-link">
                View all
              </a>
            </div>
            <div>
              {strengths.map((str) => (
                <div key={str.name}>
                  <div className="tm-progress-row">
                    <div className="tm-progress-label">
                      <div
                        className="tm-progress-icon"
                        style={{ backgroundColor: str.bg, color: str.icColor }}
                      >
                        <str.icon size={12} strokeWidth={2.5} />
                      </div>
                      {str.name}
                    </div>
                    <div>{str.val}/100</div>
                  </div>
                  <div className="tm-progress-bg">
                    <div
                      className="tm-progress-fill"
                      style={{ width: `${str.val}%`, backgroundColor: str.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Teams Needing Attention */}
          <div className="tm-side-card">
            <div className="tm-side-header">
              <span className="tm-side-title">Teams Needing Attention</span>
              <a href="#" className="tm-side-link">
                View all
              </a>
            </div>
            <div>
              {attentionTeams.map((team) => (
                <div className="tm-attention-item" key={team.name}>
                  <div className="tm-attention-icon">
                    {team.name === "People Operations" && <Users size={16} />}
                    {team.name === "Legal" && <ShieldAlert size={16} />}
                    {team.name === "Finance" && <Target size={16} />}
                  </div>
                  <div className="tm-attention-content">
                    <div className="tm-attention-title">{team.name}</div>
                    <div className="tm-attention-desc">{team.desc}</div>
                  </div>
                  <div className="tm-attention-score">{team.score}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Compare Teams CTA */}
          <div className="tm-side-card tm-compare-card">
            <div className="tm-side-title" style={{ marginBottom: 4 }}>Compare Teams</div>
            <div className="tm-compare-desc">Compare performance metrics across teams.</div>
            <button className="tm-compare-btn">
              <BarChart2 size={14} /> Compare Teams
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
