"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../lib/auth-context";
import {
  Users,
  ArrowLeft,
  Trash2,
  Info,
  Mail,
  Shield,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import "../teams.css";

/** Two-letter initials, e.g. "Design Operations" → "DO". */
const initialsOf = (name?: string) => {
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "T";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

export default function TeamDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { hasPermission, user: currentUser } = useAuth();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  useEffect(() => {
    fetchTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTeam = async () => {
    try {
      const res = await fetch(`/api/teams/${id}`);
      if (!res.ok) {
        if (res.status === 404) router.push("/dashboard/teams");
        return;
      }
      const json = await res.json();
      const data = json.data || json;
      setTeam(data.team || data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!confirm("Are you sure you want to delete this team? This action cannot be undone.")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/teams/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard/teams");
      } else {
        alert("Failed to delete team");
        setIsDeleting(false);
      }
    } catch (e) {
      console.error(e);
      setIsDeleting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Remove this member from the team?")) return;
    setRemovingMemberId(memberId);
    try {
      const res = await fetch(`/api/teams/${id}/members/${memberId}`, { method: "DELETE" });
      if (res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setTeam((prev: any) => ({
          ...prev,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          users: prev.users.filter((u: any) => u.id !== memberId),
          members: Math.max(0, prev.members - 1)
        }));
      } else {
        alert("Failed to remove member");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRemovingMemberId(null);
    }
  };

  if (loading) {
    return (
      <main className="db-content tm-page">
        <div className="ui-skeleton" style={{ width: 200, height: 40, borderRadius: 8 }} />
        <div className="ui-skeleton" style={{ width: "100%", height: 300, borderRadius: 16 }} />
      </main>
    );
  }

  if (!team) return null;

  return (
    <main className="db-content tm-page">
      <button
        className="ui-btn ui-btn--ghost ui-btn--sm tm-back"
        onClick={() => router.push("/dashboard/teams")}
      >
        <ArrowLeft size={16} />
        Back to teams
      </button>

      {/* ── Identity header ── */}
      <div className="ui-page-header">
        <div className="tm-identity">
          <span className="tm-tile tm-tile--xl" aria-hidden="true">{initialsOf(team.name)}</span>
          <div style={{ minWidth: 0 }}>
            <h1 className="type-title tm-truncate">{team.name}</h1>
            <div className="tm-identity__meta">
              <span className="ui-badge ui-badge--neutral">{team.focus || "General"}</span>
              <span className="tm-identity__sep" aria-hidden="true">•</span>
              <span className="type-subtitle">{team.users?.length ?? 0} member{team.users?.length === 1 ? "" : "s"}</span>
            </div>
          </div>
        </div>

        <div className="ui-page-header__actions">
          {hasPermission("teams:manage") && (
            <button
              className="ui-btn ui-btn--destructive"
              onClick={handleDeleteTeam}
              disabled={isDeleting}
            >
              <Trash2 size={16} />
              {isDeleting ? "Deleting..." : "Delete team"}
            </button>
          )}
        </div>
      </div>

      <div className="tm-detail-grid">
        {/* Members List */}
        <section className="tm-section">
          <h2 className="type-heading">Team members</h2>
          <div className="ui-table-wrap">
            <table className="ui-table" style={{ minWidth: 560 }}>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Email</th>
                  <th>Workspace role</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {team.users && team.users.length > 0 ? (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  team.users.map((member: any) => (
                    <tr key={member.id}>
                      <td>
                        <div className="tm-member-cell">
                          <span className="tm-tile tm-tile--sm" aria-hidden="true">
                            {member.name ? member.name.charAt(0).toUpperCase() : "U"}
                          </span>
                          <span>{member.name || "Unknown User"}</span>
                        </div>
                      </td>
                      <td>
                        <span className="tm-email-cell">
                          <Mail size={14} />
                          {member.email}
                        </span>
                      </td>
                      <td>
                        <span className="ui-badge ui-badge--neutral">
                          <Shield size={12} />
                          {member.workspaceRole?.name || member.role}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {hasPermission("teams:manage") && member.id !== currentUser?.id && (
                          <button
                            className="ui-icon-btn ui-icon-btn--sm tm-remove-btn"
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={removingMemberId === member.id}
                            title="Remove from team"
                            aria-label="Remove from team"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ padding: 0 }}>
                      <EmptyState
                        compact
                        icon={<Users />}
                        title="No members yet"
                        description="No members assigned to this team yet."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Sidebar Stats */}
        <div className="tm-sidebar">
          {/* Health, knowledge and activity are not measured, so no scores are shown. */}
          <div className="tm-note">
            <Info size={16} />
            <div>
              <div className="tm-note__title">
                Team metrics <span className="ui-badge ui-badge--neutral">Not measured yet</span>
              </div>
              <div className="tm-note__text">
                Health score, knowledge coverage and activity are not measured yet, so they are not shown here.
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
