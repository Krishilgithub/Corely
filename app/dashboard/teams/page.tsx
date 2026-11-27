"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../lib/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserX,
  List,
  Grid,
  MoreHorizontal,
  Upload,
  Plus,
  Shield,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
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
  delta?: string;
  accent?: boolean;
}) => (
  <div className="ui-kpi">
    <span className={`ui-icon-well${accent ? " ui-icon-well--accent" : ""}`}>{icon}</span>
    <div className="tm-kpi-text">
      <span className="type-metric">{value}</span>
      <span className="type-caption">{label}</span>
      {delta && <span className="tm-kpi-delta">{delta}</span>}
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

/**
 * Permissions a new role can get. Keep in sync with Permissions in lib/rbac.ts.
 * (lib/rbac.ts imports the database client, so it cannot be imported in this browser page.)
 * The server checks every value against the real list.
 */
const PERMISSION_OPTIONS: { value: string; label: string }[] = [
  { value: "memory:read", label: "View memory" },
  { value: "memory:write", label: "Edit memory" },
  { value: "insights:read", label: "View insights" },
  { value: "insights:write", label: "Edit insights" },
  { value: "teams:read", label: "View teams" },
  { value: "teams:manage", label: "Manage teams, members and roles" },
  { value: "sources:read", label: "View sources" },
  { value: "sources:write", label: "Connect and manage sources" },
  { value: "projects:read", label: "View projects" },
  { value: "projects:manage", label: "Manage projects" },
];

/** Result of an invite, from POST /api/teams/members. */
interface InviteResult {
  email: string;
  emailSent: boolean;
  temporaryPassword: string | null;
}

export default function TeamsPage() {
  const router = useRouter();
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
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Form State
  const [formName, setFormName] = useState("");
  const [formFocus, setFormFocus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [roles, setRoles] = useState<{id: string, name: string}[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null);

  // Add Role Modal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);

  const { hasPermission } = useAuth();
  const canManage = hasPermission("teams:manage");

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── Real numbers only ──
  // Distinct people across all teams (one person can be in several teams).
  const peopleInTeams = useMemo(() => {
    const ids = new Set<string>();
    teams.forEach(t => (t.users || []).forEach((u: { id: string }) => ids.add(u.id)));
    return ids.size;
  }, [teams]);
  const emptyTeams = teams.filter(t => t.members === 0).length;

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

  useEffect(() => {
    if (!canManage) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("invite") === "1") {
      setShowInviteModal(true);
      window.history.replaceState({}, "", "/dashboard/teams");
    }
  }, [canManage]);

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
          focus: formFocus
        })
      });
      if (res.ok) {
        await fetchTeams();
        triggerToast("Team added successfully!");
        setShowAddModal(false);
        setFormName("");
        setFormFocus("");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Could not create team");
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
        const emailSent = Boolean(data.data?.emailSent);
        if (emailSent) {
          triggerToast("Member added. Invitation email sent.");
        } else {
          toast.warning("Member added, but the invitation email could not be sent.");
        }
        // Always show the result screen so the admin sees whether the email went out.
        setInviteResult({
          email: inviteEmail,
          emailSent,
          temporaryPassword: data.data?.temporaryPassword ?? null,
        });
      } else {
        toast.error("Failed: " + (data.error || "Could not invite member"));
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
        body: JSON.stringify({ name: roleName, permissions: rolePermissions })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Could not create role");
        return;
      }
      fetch("/api/teams/roles")
        .then(res => res.json())
        .then(json => {
          const data = json.data || json;
          setRoles(Array.isArray(data) ? data : (data.roles || []));
        });
      triggerToast("Role created successfully!");
      setShowRoleModal(false);
      setRoleName("");
      setRolePermissions([]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (teams.length === 0) return;
    // Only real fields. Quote every value so commas in names do not break the columns.
    const quote = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const headers = ["Name", "Members", "Focus", "Created"];
    const csvContent = [
      headers.join(","),
      ...teams.map(t => [t.name, t.members, t.focus, t.createdAt ? new Date(t.createdAt).toISOString().slice(0, 10) : ""].map(quote).join(","))
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

    return result;
  }, [teams, searchQuery]);

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
              <div className="tm-team-desc">{item.members} member{item.members === 1 ? "" : "s"}</div>
            </div>
          </div>
        );
      },
      size: 300,
    },
    {
      accessorKey: "members",
      header: "Members",
      cell: ({ row }) => <div className="tm-num">{row.original.members}</div>,
      size: 120,
    },
    {
      accessorKey: "focus",
      header: "Key Focus",
      cell: ({ row }) => {
        const item = row.original;
        return <StatusBadge tone="neutral">{item.focus}</StatusBadge>;
      },
      size: 160,
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <div className="tm-text-muted">
          {row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : "—"}
        </div>
      ),
      size: 140,
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
        subtitle="See your teams, who is in them, and invite new members."
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
          label="Teams"
          accent
        />
        <StatTile
          icon={<Users />}
          value={peopleInTeams}
          label="People in teams"
        />
        <StatTile
          icon={<UserX />}
          value={emptyTeams}
          label="Teams with no members"
        />
      </div>

      {/* ── Controls Row ── */}
      <FilterToolbar
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
                        <div className="tm-team-desc">{row.members} member{row.members === 1 ? "" : "s"}</div>
                      </div>
                    </div>
                    <div className="tm-team-card__foot">
                      <StatusBadge tone="neutral">{row.focus}</StatusBadge>
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
          <div className="ui-card tm-side-card">
            <div className="tm-side-header">
              <span className="type-heading">Team metrics</span>
              <span className="ui-badge ui-badge--neutral">Not measured yet</span>
            </div>
            <div className="type-caption">
              Health, knowledge coverage, collaboration and activity scores are not measured yet,
              so they are not shown. Member counts come from the people assigned to each team.
            </div>
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
                  <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                    <legend className="tm-field-label">Permissions</legend>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {PERMISSION_OPTIONS.map((perm) => (
                        <label key={perm.value} className="type-body" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={rolePermissions.includes(perm.value)}
                            onChange={(e) =>
                              setRolePermissions(prev =>
                                e.target.checked ? [...prev, perm.value] : prev.filter(p => p !== perm.value)
                              )
                            }
                          />
                          {perm.label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
                <div className="tm-modal__footer">
                  <button
                    type="submit"
                    className="ui-btn ui-btn--primary"
                    disabled={isSubmitting || rolePermissions.length === 0}
                    title={rolePermissions.length === 0 ? "Pick at least one permission" : undefined}
                  >
                    {isSubmitting ? "Creating..." : "Create role"}
                  </button>
                </div>
              </form>
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
                  setInviteResult(null);
                  setInviteName("");
                  setInviteEmail("");
                  setInviteRoleId("");
                  setSelectedTeamIds([]);
                }}>
                  <X size={16} />
                </button>
              </div>

              {inviteResult ? (
                <>
                  <div className="tm-modal__body">
                    <div className="tm-invite-done">
                      {inviteResult.emailSent ? (
                        <span className="ui-icon-well ui-icon-well--success"><CheckCircle2 /></span>
                      ) : (
                        <span className="ui-icon-well"><AlertTriangle /></span>
                      )}
                      <h3 className="type-heading">Member added</h3>
                      {inviteResult.emailSent ? (
                        <p className="type-body tm-muted">Invitation email sent to {inviteResult.email}.</p>
                      ) : (
                        <p className="type-body tm-muted">
                          The invitation email to {inviteResult.email} could not be sent. Share the sign-in details below with them yourself.
                        </p>
                      )}
                      {inviteResult.temporaryPassword && (
                        <>
                          <div className="tm-password">
                            {inviteResult.temporaryPassword}
                          </div>
                          <p className="type-caption tm-muted" style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                            <Info size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                            {inviteResult.emailSent
                              ? "Temporary password, shown only in development. It is shown once and cannot be seen again."
                              : "Temporary password. It is shown once and cannot be seen again. Copy it now and ask them to change it after signing in."}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="tm-modal__footer">
                    <button className="ui-btn ui-btn--primary" onClick={() => {
                      setShowInviteModal(false);
                      setInviteResult(null);
                      setInviteName("");
                      setInviteEmail("");
                      setInviteRoleId("");
                      setSelectedTeamIds([]);
                    }}>
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
