"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../lib/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Activity,
  GraduationCap,
  Target,
  Zap,
  List,
  Grid,
  MoreHorizontal,
  Upload,
  Plus,
  RefreshCw,
  BarChart2,
  Shield,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../components/DataTable";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { FilterToolbar } from "@/components/ui/filter-toolbar";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import "./teams.css";

// ── Components ───────────────────────────────────────────────────────────────

/** Two-letter initials for the team tile, e.g. "Design Operations" → "DO". */
const initialsOf = (name?: string) => {
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "T";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

/** Neutral initials tile that stands for a team. 8px squircle, never round. */
const TeamTile = ({ name, size }: { name?: string; size?: "sm" | "lg" | "xl" }) => (
  <span className={`tm-tile${size ? ` tm-tile--${size}` : ""}`} aria-hidden="true">
    {initialsOf(name)}
  </span>
);

/** Score as a number with a short neutral bar next to it. */
const MetricBar = ({ score }: { score: number }) => (
  <div className="tm-metric">
    <span className="tm-metric__val">{score}</span>
    <span className="tm-bar">
      <span className="tm-bar__fill" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
    </span>
  </div>
);

/** KPI tile: icon well, big number, label, and the change under the label. */
const StatTile = ({
  icon,
  value,
  label,
  delta,
  accent = false,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  delta: string;
  accent?: boolean;
}) => (
  <div className="ui-kpi">
    <span className={`ui-icon-well${accent ? " ui-icon-well--accent" : ""}`}>{icon}</span>
    <div className="tm-kpi-text">
      <span className="type-metric">{value}</span>
      <span className="type-caption">{label}</span>
      <span className="tm-kpi-delta">{delta}</span>
    </div>
  </div>
);

/** Loading placeholder that works in light and dark mode. */
const Skel = ({
  w = "100%",
  h = 16,
  r = 6,
  style,
}: {
  w?: number | string;
  h?: number | string;
  r?: number | string;
  style?: React.CSSProperties;
}) => <div className="ui-skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} />;

const Sparkline = () => {
  return (
    <svg className="tm-sparkline" viewBox="0 0 60 24" aria-hidden="true">
      <path
        d="M0,20 L10,14 L20,18 L30,8 L40,12 L50,4 L60,8"
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const SparklineDown = () => {
  return (
    <svg className="tm-sparkline tm-sparkline--down" viewBox="0 0 60 24" aria-hidden="true">
      <path
        d="M0,4 L10,10 L20,6 L30,16 L40,12 L50,20 L60,16"
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/** Shows a filter tab value in sentence case ("At Risk" → "At risk"). */
const tabLabel = (tab: string) => tab.charAt(0) + tab.slice(1).toLowerCase();

export default function TeamsPage() {
  const router = useRouter();
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
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Form State
  const [formName, setFormName] = useState("");
  const [formMembers, setFormMembers] = useState("");
  const [formFocus, setFormFocus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [roles, setRoles] = useState<{id: string, name: string}[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [inviteDevPassword, setInviteDevPassword] = useState<string | null>(null);

  // Add Role Modal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleName, setRoleName] = useState("");

  const { hasPermission } = useAuth();

  // Compare State
  const [compareTeam1, setCompareTeam1] = useState("");
  const [compareTeam2, setCompareTeam2] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Slice colours are grayscale tokens defined in teams.css (they flip in dark mode).
  const dynamicPieData = useMemo(() => {
    let excellent = 0, good = 0, fair = 0, poor = 0;
    teams.forEach(t => {
      if (t.health >= 90) excellent++;
      else if (t.health >= 80) good++;
      else if (t.health >= 70) fair++;
      else poor++;
    });
    return [
      { name: "Excellent", value: excellent, color: "var(--tm-pie-excellent)" },
      { name: "Good", value: good, color: "var(--tm-pie-good)" },
      { name: "Fair", value: fair, color: "var(--tm-pie-fair)" },
      { name: "Poor", value: poor, color: "var(--tm-pie-poor)" },
    ].filter(d => d.value > 0);
  }, [teams]);

  const dynamicStrengths = useMemo(() => {
    const avgKnow = teams.length ? Math.round(teams.reduce((acc, t) => acc + t.know, 0) / teams.length) : 0;
    const avgHealth = teams.length ? Math.round(teams.reduce((acc, t) => acc + t.health, 0) / teams.length) : 0;
    const avgCollab = teams.filter(t => t.collab === "Excellent" || t.collab === "Good").length / (teams.length || 1);

    return [
      { name: "Knowledge Sharing", val: avgKnow, color: "var(--accent-fill)", icon: GraduationCap, bg: "var(--surface-secondary)", icColor: "var(--icon-primary)" },
      { name: "Execution Velocity", val: avgHealth, color: "var(--accent-fill)", icon: Zap, bg: "var(--surface-secondary)", icColor: "var(--icon-primary)" },
      { name: "Cross-team Collaboration", val: Math.round(avgCollab * 100), color: "var(--accent-fill)", icon: Users, bg: "var(--surface-secondary)", icColor: "var(--icon-primary)" },
      { name: "Adaptability", val: 72, color: "var(--accent-fill)", icon: RefreshCw, bg: "var(--surface-secondary)", icColor: "var(--icon-primary)" },
    ];
  }, [teams]);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/teams");
      const json = await res.json();
      const data = json.data || json;
      setTeams(data.teams || data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
    // Always fetch roles so the invite dropdown is populated
    fetch("/api/teams/roles")
      .then(res => res.json())
      .then(json => {
        // successResponse wraps data directly; roles is the array itself
        const data = json.data || json;
        // data could be an array or an object with a roles key
        const rolesArr = Array.isArray(data) ? data : (data.roles || []);
        setRoles(rolesArr);
      })
      .catch(err => console.error("Failed to fetch roles", err));
  }, []);

  const triggerToast = (msg: string) => {
    toast.success(msg);
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

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/teams/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inviteName,
          email: inviteEmail,
          roleId: inviteRoleId,
          teamIds: selectedTeamIds,
        })
      });
      const data = await res.json();
      if (res.ok) {
        await fetchTeams();
        triggerToast("Member invited successfully!");
        if (data.data && data.data._devPassword) {
          setInviteDevPassword(data.data._devPassword);
        } else {
          setShowInviteModal(false);
          setInviteName("");
          setInviteEmail("");
          setInviteRoleId("");
          setSelectedTeamIds([]);
        }
      } else {
        alert("Failed: " + data.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/teams/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: roleName })
      });
      if (res.ok) {
        fetch("/api/teams/roles")
          .then(res => res.json())
          .then(json => {
            const data = json.data || json;
            setRoles(Array.isArray(data) ? data : (data.roles || []));
          });
        triggerToast("Role created successfully!");
        setShowRoleModal(false);
        setRoleName("");
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

  // ── Table Columns ─────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = useMemo<ColumnDef<any, any>[]>(() => [
    {
      accessorKey: "name",
      header: "Team",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="tm-team-col" style={{ cursor: "pointer" }} onClick={() => router.push(`/dashboard/teams/${item.id}`)}>
            <TeamTile name={item.name} />
            <div style={{ minWidth: 0 }}>
              <div className="tm-team-title">{item.name}</div>
              <div className="tm-team-desc">{item.members} members</div>
            </div>
          </div>
        );
      },
      size: 300,
    },
    {
      accessorKey: "health",
      header: "Health Score",
      cell: ({ row }) => <MetricBar score={row.original.health} />,
      size: 150,
    },
    {
      accessorKey: "collab",
      header: "Collaboration",
      cell: ({ getValue }) => <div className="tm-text-muted">{getValue<string>()}</div>,
      size: 150,
    },
    {
      accessorKey: "know",
      header: "Knowledge Coverage",
      cell: ({ row }) => <MetricBar score={row.original.know} />,
      size: 150,
    },
    {
      accessorKey: "actions",
      header: "Actions (30D)",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="tm-actions-col">
            <div className="tm-num">{item.actions}</div>
            <div className={`tm-trend ${item.isUp ? "is-up" : "is-down"}`}>
              {item.isUp ? "↑" : "↓"} {Math.abs(item.actionsTrend)}%
            </div>
          </div>
        );
      },
      size: 150,
    },
    {
      accessorKey: "focus",
      header: "Key Focus",
      cell: ({ row }) => {
        const item = row.original;
        return <StatusBadge tone="neutral">{item.focus}</StatusBadge>;
      },
      size: 120,
    },
    {
      id: "trend",
      header: "Trend",
      cell: ({ row }) => {
        const item = row.original;
        return item.isUp ? <Sparkline /> : <SparklineDown />;
      },
      size: 100,
    },
    {
      id: "actions-menu",
      header: "",
      cell: ({ row }) => (
        <div className="tm-row-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="ui-icon-btn ui-icon-btn--sm tm-ghost-icon"
            aria-label="Open team"
            onClick={() => router.push(`/dashboard/teams/${row.original.id}`)}
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      ),
      size: 60,
    },
  ], [router]);

  const tabs = ["All Teams", "Performance", "Collaboration", "Knowledge", "At Risk"];

  const modalMotion = {
    initial: { scale: 0.98, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.98, opacity: 0 },
    transition: { duration: 0.15, ease: "easeOut" as const },
  };

  return (
    <main className="db-content tm-page">
      {/* ── Header ── */}
      <PageHeader
        title="Teams"
        subtitle="Understand team performance, collaboration health, and knowledge coverage."
        actions={
          <>
            <button className="ui-btn ui-btn--secondary" onClick={handleExportCSV}>
              <Upload size={16} />
              Export
            </button>
            {hasPermission("teams:manage") && (
              <>
                <button className="ui-btn ui-btn--secondary" onClick={() => setShowRoleModal(true)}>
                  <Shield size={16} />
                  Add role
                </button>
                <button className="ui-btn ui-btn--secondary" onClick={() => setShowInviteModal(true)}>
                  <Users size={16} />
                  Invite member
                </button>
                <button className="ui-btn ui-btn--primary" onClick={() => setShowAddModal(true)}>
                  <Plus size={16} />
                  Add team
                </button>
              </>
            )}
          </>
        }
      />

      {/* ── Stat Cards ── */}
      <div className="tm-stats-grid">
        <StatTile
          icon={<Users />}
          value={teams.length}
          label="Active teams"
          delta="↑ 9% vs last month"
          accent
        />
        <StatTile
          icon={<Activity />}
          value={Math.round(teams.reduce((acc, t) => acc + t.health, 0) / (teams.length || 1))}
          label="Avg health score"
          delta="↑ 6 pts vs last month"
        />
        <StatTile
          icon={<GraduationCap />}
          value={`${Math.round(teams.reduce((acc, t) => acc + t.know, 0) / (teams.length || 1))}%`}
          label="Knowledge coverage"
          delta="↑ 7% vs last month"
        />
        <StatTile
          icon={<Target />}
          value={teams.filter(t => t.health < 75).length}
          label="Teams at risk"
          delta="↓ 1 vs last month"
        />
        <StatTile
          icon={<Zap />}
          value={teams.reduce((acc, t) => acc + t.actions, 0).toLocaleString()}
          label="Actions executed"
          delta="↑ 24% vs last month"
        />
      </div>

      {/* ── Controls Row ── */}
      <FilterToolbar
        leading={
          <SegmentedControl
            label="Filter teams"
            size="sm"
            value={activeTab}
            onChange={(tab) => {
              setActiveTab(tab);
              setCurrentPage(1);
            }}
            segments={tabs.map((tab) => ({ value: tab, label: tabLabel(tab) }))}
          />
        }
        search={{
          value: searchQuery,
          onChange: (v) => {
            setSearchQuery(v);
            setCurrentPage(1);
          },
          placeholder: "Search teams",
        }}
        actions={
          <SegmentedControl
            label="View"
            size="sm"
            value={viewMode}
            onChange={setViewMode}
            segments={[
              { value: "list", label: <span className="sr-only">List view</span>, icon: <List size={16} aria-hidden="true" /> },
              { value: "grid", label: <span className="sr-only">Grid view</span>, icon: <Grid size={16} aria-hidden="true" /> },
            ]}
          />
        }
      />

      {/* ── Main Layout ── */}
      <div className="tm-main-grid">
        {/* Left Side Table/Grid */}
        <div className={`tm-table-container ${viewMode === "grid" ? "is-grid" : ""}`}>
          {loading ? (
            viewMode === "list" ? (
              <div className="tm-skel-list">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div className="tm-skel-row" key={`skel-${i}`}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 2 }}>
                      <Skel w={36} h={36} r={8} />
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                        <Skel w="60%" h={14} />
                        <Skel w="40%" h={12} />
                      </div>
                    </div>
                    <div style={{ flex: 1 }}><Skel w={88} h={12} /></div>
                    <div style={{ flex: 1 }}><Skel w={64} h={12} /></div>
                    <div style={{ flex: 1 }}><Skel w={88} h={12} /></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="tm-card-grid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skel key={`skel-g-${i}`} h={200} r={16} />
                ))}
              </div>
            )
          ) : viewMode === "list" ? (
            <DataTable columns={columns} data={paginatedTeams} />
          ) : (
            <div className="tm-card-grid">
              {paginatedTeams.map((row) => {
                return (
                  <div
                    key={row.id}
                    className="tm-team-card"
                    onClick={() => router.push(`/dashboard/teams/${row.id}`)}
                  >
                    <div className="tm-team-card__head">
                      <TeamTile name={row.name} size="lg" />
                      <div style={{ minWidth: 0 }}>
                        <div className="type-heading">{row.name}</div>
                        <div className="tm-team-desc">{row.members} members</div>
                      </div>
                    </div>
                    <div className="tm-team-card__metrics">
                      <div className="tm-stat-row">
                        <div className="tm-stat-row__top">
                          <span className="type-caption">Health</span>
                          <span className="tm-stat-row__val">{row.health}</span>
                        </div>
                        <span className="tm-bar">
                          <span className="tm-bar__fill" style={{ width: `${Math.max(0, Math.min(100, row.health))}%` }} />
                        </span>
                      </div>
                      <div className="tm-stat-row">
                        <div className="tm-stat-row__top">
                          <span className="type-caption">Knowledge</span>
                          <span className="tm-stat-row__val">{row.know}</span>
                        </div>
                        <span className="tm-bar">
                          <span className="tm-bar__fill" style={{ width: `${Math.max(0, Math.min(100, row.know))}%` }} />
                        </span>
                      </div>
                    </div>
                    <div className="tm-team-card__foot">
                      <StatusBadge tone="neutral">{row.focus}</StatusBadge>
                      <div className={`tm-trend ${row.isUp ? "is-up" : "is-down"}`}>
                        {row.isUp ? "↑" : "↓"} {Math.abs(row.actionsTrend)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="tm-table-footer">
            <span>Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTeams.length)} of {filteredTeams.length} teams</span>
            <div className="tm-pagination">
              <button
                className="tm-page-btn tm-page-btn--nav"
                aria-label="Previous page"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft size={16} />
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
                className="tm-page-btn tm-page-btn--nav"
                aria-label="Next page"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side Sidebar */}
        <div className="tm-sidebar">
          {/* Health Overview Chart */}
          <div className="ui-card tm-side-card">
            <div className="tm-side-header">
              <span className="type-heading">Team health overview</span>
              <a href="#" className="tm-side-link">
                View analytics
              </a>
            </div>
            <div className="tm-donut-row">
              <div className="tm-donut">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dynamicPieData}
                      innerRadius={48}
                      outerRadius={64}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {dynamicPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="tm-donut__center">
                  <span className="type-metric">
                    {Math.round(teams.reduce((acc, t) => acc + t.health, 0) / (teams.length || 1))}
                  </span>
                  <span className="type-caption">Avg. health score</span>
                </div>
              </div>
              <div className="tm-legend">
                <div className="tm-legend-item">
                  <div className="tm-legend-dot" style={{ backgroundColor: "var(--tm-pie-excellent)" }} />
                  <span>Excellent (80-100)</span>
                  <span className="tm-num">{teams.filter(t => t.health >= 80).length}</span>
                </div>
                <div className="tm-legend-item">
                  <div className="tm-legend-dot" style={{ backgroundColor: "var(--tm-pie-good)" }} />
                  <span>Good (60-79)</span>
                  <span className="tm-num">{teams.filter(t => t.health >= 60 && t.health < 80).length}</span>
                </div>
                <div className="tm-legend-item">
                  <div className="tm-legend-dot" style={{ backgroundColor: "var(--tm-pie-fair)" }} />
                  <span>Fair (40-59)</span>
                  <span className="tm-num">{teams.filter(t => t.health >= 40 && t.health < 60).length}</span>
                </div>
                <div className="tm-legend-item">
                  <div className="tm-legend-dot" style={{ backgroundColor: "var(--tm-pie-poor)" }} />
                  <span>Poor (0-39)</span>
                  <span className="tm-num">{teams.filter(t => t.health < 40).length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Strengths Progress */}
          <div className="ui-card tm-side-card">
            <div className="tm-side-header">
              <span className="type-heading">Top strengths across teams</span>
              <a href="#" className="tm-side-link">
                View all
              </a>
            </div>
            <div className="tm-strengths">
              {dynamicStrengths.map((str) => (
                <div key={str.name} className="tm-stat-row">
                  <div className="tm-stat-row__top">
                    <span className="tm-stat-row__label">
                      <span
                        className="tm-mini-tile"
                        style={{ backgroundColor: str.bg, color: str.icColor }}
                      >
                        <str.icon size={14} />
                      </span>
                      {str.name}
                    </span>
                    <span className="tm-stat-row__val">{str.val}/100</span>
                  </div>
                  <span className="tm-bar">
                    <span
                      className="tm-bar__fill"
                      style={{ width: `${str.val}%`, backgroundColor: str.color }}
                    />
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Teams Needing Attention */}
          <div className="ui-card tm-side-card">
            <div className="tm-side-header">
              <span className="type-heading">Teams needing attention</span>
              <a href="#" className="tm-side-link">
                View all
              </a>
            </div>
            <div className="tm-list">
              {teams.filter(t => t.health < 75).slice(0, 3).map((team) => {
                return (
                  <div className="tm-list-item" key={team.id}>
                    <TeamTile name={team.name} size="sm" />
                    <div className="tm-list-item__body">
                      <div className="tm-team-title">{team.name}</div>
                      <div className="tm-team-desc">{team.collab === "Poor" ? "Poor collaboration score" : "Low health score"}</div>
                    </div>
                    <StatusBadge tone="warning">{team.health}</StatusBadge>
                  </div>
                );
              })}
              {teams.filter(t => t.health < 75).length === 0 && (
                <div className="tm-list-empty">
                  No teams currently need attention.
                </div>
              )}
            </div>
          </div>

          {/* Compare Teams CTA */}
          <div className="ui-card tm-side-card">
            <div className="type-heading">Compare teams</div>
            <div className="type-caption tm-compare-desc">Compare performance metrics across teams.</div>
            <button className="ui-btn ui-btn--secondary ui-btn--block" onClick={() => setShowCompareModal(true)}>
              <BarChart2 size={16} /> Compare teams
            </button>
          </div>
        </div>
      </div>

      {/* ── Add Team Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="tm-modal-overlay">
            <motion.div className="ui-popover tm-modal" {...modalMotion}>
              <div className="tm-modal__header">
                <h2 className="type-heading">Add new team</h2>
                <button className="ui-icon-btn ui-icon-btn--sm tm-ghost-icon" aria-label="Close" onClick={() => setShowAddModal(false)}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="tm-modal__form">
                <div className="tm-modal__body">
                  <div>
                    <label className="tm-field-label">Team name</label>
                    <input
                      type="text"
                      className="ui-input"
                      placeholder="e.g. Design Operations"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="tm-field-label">Number of members</label>
                    <input
                      type="number"
                      className="ui-input"
                      placeholder="e.g. 12"
                      value={formMembers}
                      onChange={(e) => setFormMembers(e.target.value)}
                      required
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="tm-field-label">Key focus area</label>
                    <input
                      type="text"
                      className="ui-input"
                      placeholder="e.g. User Research"
                      value={formFocus}
                      onChange={(e) => setFormFocus(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="tm-modal__footer">
                  <button
                    type="submit"
                    className="ui-btn ui-btn--primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating..." : "Create team"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Add Role Modal ── */}
      <AnimatePresence>
        {showRoleModal && (
          <div className="tm-modal-overlay">
            <motion.div className="ui-popover tm-modal" {...modalMotion}>
              <div className="tm-modal__header">
                <h2 className="type-heading">Create role</h2>
                <button className="ui-icon-btn ui-icon-btn--sm tm-ghost-icon" aria-label="Close" onClick={() => setShowRoleModal(false)}>
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleRoleSubmit} className="tm-modal__form">
                <div className="tm-modal__body">
                  <div>
                    <label className="tm-field-label">Role name</label>
                    <input
                      type="text"
                      className="ui-input"
                      placeholder="e.g. Editor"
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="tm-modal__footer">
                  <button
                    type="submit"
                    className="ui-btn ui-btn--primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating..." : "Create role"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Compare Teams Modal ── */}
      <AnimatePresence>
        {showCompareModal && (
          <div className="tm-modal-overlay">
            <motion.div className="ui-popover tm-modal tm-modal--wide" {...modalMotion}>
              <div className="tm-modal__header">
                <h2 className="type-heading">Compare teams</h2>
                <button className="ui-icon-btn ui-icon-btn--sm tm-ghost-icon" aria-label="Close" onClick={() => setShowCompareModal(false)}>
                  <X size={16} />
                </button>
              </div>

              <div className="tm-modal__body">
                <div className="tm-compare-fields">
                  <div>
                    <label className="tm-field-label">Team 1</label>
                    <Select
                      aria-label="Team 1"
                      value={compareTeam1}
                      onChange={setCompareTeam1}
                      placeholder="Select a team"
                      options={teams.map(t => ({ value: String(t.id), label: t.name }))}
                    />
                  </div>
                  <div>
                    <label className="tm-field-label">Team 2</label>
                    <Select
                      aria-label="Team 2"
                      value={compareTeam2}
                      onChange={setCompareTeam2}
                      placeholder="Select a team"
                      options={teams.map(t => ({ value: String(t.id), label: t.name }))}
                    />
                  </div>
                </div>

                {compareTeam1 && compareTeam2 && (
                  <div className="tm-compare-table">
                    <div className="tm-compare-row tm-compare-row--head">
                      <div>{teams.find(t => t.id === compareTeam1)?.name}</div>
                      <div className="tm-compare-metric type-label">Metric</div>
                      <div className="tm-compare-end">{teams.find(t => t.id === compareTeam2)?.name}</div>
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
                        <div key={metric.key} className="tm-compare-row">
                          <div className={`tm-compare-val ${t1[metric.key] >= t2[metric.key] ? "is-lead" : ""}`}>
                            {t1[metric.key]}
                          </div>
                          <div className="tm-compare-metric">{metric.label}</div>
                          <div className={`tm-compare-val tm-compare-end ${t2[metric.key] >= t1[metric.key] ? "is-lead" : ""}`}>
                            {t2[metric.key]}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating System Toasts */}
      <AnimatePresence>
        {toastMessage && (
          <div className="tm-toast-wrap">
            <motion.div
              className="tm-toast"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <CheckCircle2 size={16} />
              <span>{toastMessage}</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Invite Member Modal ── */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="tm-modal-overlay">
            <motion.div className="ui-popover tm-modal" {...modalMotion}>
              <div className="tm-modal__header">
                <h2 className="type-heading">Invite member</h2>
                <button className="ui-icon-btn ui-icon-btn--sm tm-ghost-icon" aria-label="Close" onClick={() => {
                  setShowInviteModal(false);
                  setInviteDevPassword(null);
                  setInviteName("");
                  setInviteEmail("");
                  setInviteRoleId("");
                }}>
                  <X size={16} />
                </button>
              </div>

              {inviteDevPassword ? (
                <>
                  <div className="tm-modal__body">
                    <div className="tm-invite-done">
                      <span className="ui-icon-well ui-icon-well--success"><CheckCircle2 /></span>
                      <h3 className="type-heading">Member invited</h3>
                      <p className="type-body tm-muted">An invitation email was &quot;sent&quot; (mocked) to {inviteEmail}. For development purposes, here is the generated password:</p>
                      <div className="tm-password">
                        {inviteDevPassword}
                      </div>
                    </div>
                  </div>
                  <div className="tm-modal__footer">
                    <button className="ui-btn ui-btn--primary" onClick={() => { setShowInviteModal(false); setInviteDevPassword(null); }}>
                      Done
                    </button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleInviteSubmit} className="tm-modal__form">
                  <div className="tm-modal__body">
                    <div>
                      <label className="tm-field-label">Name</label>
                      <input type="text" className="ui-input"
                             value={inviteName} onChange={(e) => setInviteName(e.target.value)} required placeholder="e.g. Jane Doe" />
                    </div>
                    <div>
                      <label className="tm-field-label">Email</label>
                      <input type="email" className="ui-input"
                             value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required placeholder="jane@example.com" />
                    </div>
                    <div>
                      <label className="tm-field-label">Role</label>
                      <Select
                        aria-label="Role"
                        value={inviteRoleId}
                        onChange={setInviteRoleId}
                        placeholder="Select a role"
                        required
                        options={roles.map(r => ({ value: String(r.id), label: r.name }))}
                      />
                    </div>
                    <div>
                      <label className="tm-field-label">Assign to teams <span className="tm-field-hint">(optional)</span></label>
                      <div className="tm-chips">
                        {teams.map(t => {
                          const isSelected = selectedTeamIds.includes(t.id);
                          return (
                            <div
                              key={t.id}
                              className={`tm-chip ${isSelected ? "is-selected" : ""}`}
                              onClick={() => {
                                setSelectedTeamIds(prev =>
                                  isSelected ? prev.filter(id => id !== t.id) : [...prev, t.id]
                                );
                              }}
                            >
                              {t.name}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="tm-modal__footer">
                    <button type="submit" className="ui-btn ui-btn--primary" disabled={isSubmitting}>
                      {isSubmitting ? "Inviting..." : "Send invite"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
