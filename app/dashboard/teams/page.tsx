"use client";

import { useState, useEffect, useMemo } from "react";
import { Skeleton } from "../components/Skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Activity,
  GraduationCap,
  Target,
  Zap,
  Search,
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
  X,
  CheckCircle2,
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



// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IconMap: Record<string, any> = { Users, Activity, GraduationCap, Target, Zap, BarChart2, ShieldAlert };

export default function TeamsPage() {
  const [activeTab, setActiveTab] = useState("All Teams");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Layout State
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  
  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  
  // Form State
  const [formName, setFormName] = useState("");
  const [formMembers, setFormMembers] = useState("");
  const [formFocus, setFormFocus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Compare State
  const [compareTeam1, setCompareTeam1] = useState("");
  const [compareTeam2, setCompareTeam2] = useState("");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchTeams = () => {
    setLoading(true);
    fetch("/api/teams")
      .then(res => res.json())
      .then(data => {
        setTeams(data.data || data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          members: formMembers,
          focus: formFocus
        })
      });
      if (res.ok) {
        await fetchTeams();
        triggerToast("Team added successfully!");
        setShowAddModal(false);
        setFormName("");
        setFormMembers("");
        setFormFocus("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (teams.length === 0) return;
    const headers = ["Name", "Members", "Health", "Collaboration", "Knowledge", "Actions", "Focus"];
    const csvContent = [
      headers.join(","),
      ...teams.map(t => [t.name, t.members, t.health, t.collab, t.know, t.actions, t.focus].join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "corely_teams_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("CSV Exported!");
  };

  const filteredTeams = useMemo(() => {
    let result = teams;

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(q));
    }

    // Tabs
    if (activeTab === "Performance") {
      result = result.filter(t => t.health >= 80);
    } else if (activeTab === "Collaboration") {
      result = result.filter(t => t.collab === "Excellent" || t.collab === "Good");
    } else if (activeTab === "Knowledge") {
      result = result.filter(t => t.know >= 85);
    } else if (activeTab === "At Risk") {
      result = result.filter(t => t.health < 75 || t.collab === "Needs attention" || t.collab === "Poor");
    }

    return result;
  }, [teams, searchQuery, activeTab]);

  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage) || 1;
  const paginatedTeams = filteredTeams.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
          <button className="tm-btn-secondary" onClick={handleExportCSV}>
            <Upload size={14} />
            Export
          </button>
          <button className="tm-btn-primary" onClick={() => setShowAddModal(true)}>
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
            <div className="tm-stat-val">{teams.length}</div>
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
            <div className="tm-stat-val">{Math.round(teams.reduce((acc, t) => acc + t.health, 0) / (teams.length || 1))}</div>
            <div className="tm-stat-label">Avg Health Score</div>
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
            <div className="tm-stat-val">{Math.round(teams.reduce((acc, t) => acc + t.know, 0) / (teams.length || 1))}%</div>
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
            <div className="tm-stat-val">{teams.filter(t => t.health < 75).length}</div>
            <div className="tm-stat-label">Teams at Risk</div>
            <div className="tm-stat-trend" style={{ color: "#16a34a" }}>
              ↓ 1 vs last month
            </div>
          </div>
        </div>

        <div className="tm-stat-card">
          <div className="tm-stat-icon-wrapper" style={{ backgroundColor: "#eff6ff", color: "#3b82f6" }}>
            <Zap size={20} />
          </div>
          <div>
            <div className="tm-stat-val">{teams.reduce((acc, t) => acc + t.actions, 0).toLocaleString()}</div>
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
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
            >
              {tab}
            </div>
          ))}
        </div>
        <div className="tm-filters">
          <div className="tm-search-box">
            <Search size={14} color="#a1a1aa" />
            <input 
              type="text" 
              placeholder="Search teams..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="tm-view-toggles">
            <button 
              className={`tm-view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <List size={16} />
            </button>
            <button 
              className={`tm-view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <Grid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="tm-main-grid">
        {/* Left Side Table/Grid */}
        <div className="tm-table-container" style={viewMode === "grid" ? { background: "transparent", border: "none" } : {}}>
          {viewMode === "list" && (
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
          )}

          {loading ? (
            viewMode === "list" ? (
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
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={`skel-g-${i}`} height={200} borderRadius="16px" />
                ))}
              </div>
            )
          ) : viewMode === "list" ? (
            paginatedTeams.map((row) => {
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
            })
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {paginatedTeams.map((row) => {
                const IconCmp = IconMap[row.icon] || Users;
                return (
                  <div key={row.id} style={{ background: "#fff", borderRadius: 16, border: "1px solid #f4f4f5", padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <div
                        className="tm-team-icon"
                        style={{ backgroundColor: row.iconBg, color: row.iconColor }}
                      >
                        <IconCmp size={18} strokeWidth={2.5} />
                      </div>
                      <div>
                        <div className="tm-team-title" style={{ fontSize: 16 }}>{row.name}</div>
                        <div className="tm-team-desc">{row.members} members</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 12, color: '#71717a', marginBottom: 8 }}>Health</div>
                        <CircularProgress score={row.health} color={row.healthColor} size={48} />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 12, color: '#71717a', marginBottom: 8 }}>Knowledge</div>
                        <CircularProgress score={row.know} color={row.knowColor} size={48} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f4f4f5', paddingTop: 16 }}>
                      <span
                        className="tm-badge"
                        style={{ backgroundColor: row.focusBg, color: row.focusColor }}
                      >
                        {row.focus}
                      </span>
                      <div className="tm-actions-trend" style={{ color: row.isUp ? "#16a34a" : "#ef4444" }}>
                        {row.isUp ? "↑" : "↓"} {Math.abs(row.actionsTrend)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="tm-table-footer" style={viewMode === "grid" ? { background: "#fff", borderRadius: 16, marginTop: 16, border: "1px solid #f4f4f5" } : {}}>
            <span>Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTeams.length)} of {filteredTeams.length} teams</span>
            <div className="tm-pagination">
              <button 
                className="tm-page-btn border"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button 
                  key={idx}
                  className={`tm-page-btn ${currentPage === idx + 1 ? 'active' : ''}`}
                  onClick={() => setCurrentPage(idx + 1)}
                >
                  {idx + 1}
                </button>
              ))}
              <button 
                className="tm-page-btn border"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
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
                    {Math.round(teams.reduce((acc, t) => acc + t.health, 0) / (teams.length || 1))}
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
                  <span style={{ fontWeight: 700, textAlign: "right" }}>{teams.filter(t => t.health >= 80).length}</span>
                </div>
                <div className="tm-legend-item">
                  <div className="tm-legend-dot" style={{ backgroundColor: "#3b82f6" }} />
                  <span>Good (60-79)</span>
                  <span style={{ fontWeight: 700, textAlign: "right" }}>{teams.filter(t => t.health >= 60 && t.health < 80).length}</span>
                </div>
                <div className="tm-legend-item">
                  <div className="tm-legend-dot" style={{ backgroundColor: "#f59e0b" }} />
                  <span>Fair (40-59)</span>
                  <span style={{ fontWeight: 700, textAlign: "right" }}>{teams.filter(t => t.health >= 40 && t.health < 60).length}</span>
                </div>
                <div className="tm-legend-item">
                  <div className="tm-legend-dot" style={{ backgroundColor: "#ef4444" }} />
                  <span>Poor (0-39)</span>
                  <span style={{ fontWeight: 700, textAlign: "right" }}>{teams.filter(t => t.health < 40).length}</span>
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
              {teams.filter(t => t.health < 75).slice(0, 3).map((team) => {
                const IconCmp = IconMap[team.icon] || ShieldAlert;
                return (
                  <div className="tm-attention-item" key={team.id}>
                    <div className="tm-attention-icon">
                      <IconCmp size={16} />
                    </div>
                    <div className="tm-attention-content">
                      <div className="tm-attention-title">{team.name}</div>
                      <div className="tm-attention-desc">{team.collab === "Poor" ? "Poor collaboration score" : "Low health score"}</div>
                    </div>
                    <div className="tm-attention-score" style={{ color: team.healthColor }}>{team.health}</div>
                  </div>
                );
              })}
              {teams.filter(t => t.health < 75).length === 0 && (
                <div style={{ textAlign: "center", padding: "16px 0", color: "#a1a1aa", fontSize: 13 }}>
                  No teams currently need attention! 🎉
                </div>
              )}
            </div>
          </div>

          {/* Compare Teams CTA */}
          <div className="tm-side-card tm-compare-card">
            <div className="tm-side-title" style={{ marginBottom: 4 }}>Compare Teams</div>
            <div className="tm-compare-desc">Compare performance metrics across teams.</div>
            <button className="tm-compare-btn" onClick={() => setShowCompareModal(true)}>
              <BarChart2 size={14} /> Compare Teams
            </button>
          </div>
        </div>
      </div>

      {/* ── Add Team Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="tm-modal-overlay">
            <motion.div
              className="tm-modal-card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Add New Team</h2>
                <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#71717a" }}>
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleAddSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#3f3f46" }}>Team Name</label>
                  <input
                    type="text"
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #e4e4e7", borderRadius: 8, fontSize: 14 }}
                    placeholder="e.g. Design Operations"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#3f3f46" }}>Number of Members</label>
                  <input
                    type="number"
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #e4e4e7", borderRadius: 8, fontSize: 14 }}
                    placeholder="e.g. 12"
                    value={formMembers}
                    onChange={(e) => setFormMembers(e.target.value)}
                    required
                    min={1}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#3f3f46" }}>Key Focus Area</label>
                  <input
                    type="text"
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #e4e4e7", borderRadius: 8, fontSize: 14 }}
                    placeholder="e.g. User Research"
                    value={formFocus}
                    onChange={(e) => setFormFocus(e.target.value)}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="tm-btn-primary" 
                  style={{ width: "100%", justifyContent: "center", padding: "12px", marginTop: 8 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create Team"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Compare Teams Modal ── */}
      <AnimatePresence>
        {showCompareModal && (
          <div className="tm-modal-overlay">
            <motion.div
              className="tm-modal-card"
              style={{ maxWidth: 600 }}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Compare Teams</h2>
                <button onClick={() => setShowCompareModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#71717a" }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#3f3f46" }}>Team 1</label>
                  <select 
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #e4e4e7", borderRadius: 8, fontSize: 14 }}
                    value={compareTeam1}
                    onChange={(e) => setCompareTeam1(e.target.value)}
                  >
                    <option value="">Select a team...</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#3f3f46" }}>Team 2</label>
                  <select 
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #e4e4e7", borderRadius: 8, fontSize: 14 }}
                    value={compareTeam2}
                    onChange={(e) => setCompareTeam2(e.target.value)}
                  >
                    <option value="">Select a team...</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              {compareTeam1 && compareTeam2 && (
                <div style={{ background: "#fafafa", borderRadius: 12, padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid #e4e4e7" }}>
                    <div style={{ flex: 1 }}>{teams.find(t => t.id === compareTeam1)?.name}</div>
                    <div style={{ width: 120, textAlign: "center", color: "#71717a", fontSize: 12, fontWeight: 600 }}>METRIC</div>
                    <div style={{ flex: 1, textAlign: "right" }}>{teams.find(t => t.id === compareTeam2)?.name}</div>
                  </div>
                  
                  {[
                    { label: "Health Score", key: "health" },
                    { label: "Knowledge", key: "know" },
                    { label: "Actions (30d)", key: "actions" },
                    { label: "Members", key: "members" },
                  ].map((metric) => {
                    const t1 = teams.find(t => t.id === compareTeam1) as Record<string, string | number>;
                    const t2 = teams.find(t => t.id === compareTeam2) as Record<string, string | number>;
                    if (!t1 || !t2) return null;
                    return (
                      <div key={metric.key} style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
                        <div style={{ flex: 1, fontWeight: 600, color: t1[metric.key] >= t2[metric.key] ? "#16a34a" : "#71717a" }}>
                          {t1[metric.key]}
                        </div>
                        <div style={{ width: 120, textAlign: "center", fontSize: 13, color: "#52525b" }}>{metric.label}</div>
                        <div style={{ flex: 1, textAlign: "right", fontWeight: 600, color: t2[metric.key] >= t1[metric.key] ? "#16a34a" : "#71717a" }}>
                          {t2[metric.key]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating System Toasts */}
      <AnimatePresence>
        {toastMessage && (
          <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999 }}>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              style={{ background: "#111", color: "#fff", padding: "12px 20px", borderRadius: 8, display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 500, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)" }}
            >
              <CheckCircle2 size={16} style={{ color: "#10b981" }} />
              <span>{toastMessage}</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
