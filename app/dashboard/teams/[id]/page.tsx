"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../lib/auth-context";
import {
  Users,
  ChevronLeft,
  Trash2,
  AlertTriangle,
  Mail,
  Shield,
  Activity,
  GraduationCap,
  Zap,
} from "lucide-react";
import { Skeleton } from "../../components/Skeleton";
import "../teams.css";

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
          members: Math.max(1, prev.members - 1)
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
      <main className="tm-container">
        <div className="tm-header-row">
          <Skeleton width={200} height={40} />
        </div>
        <div style={{ marginTop: 40 }}>
          <Skeleton width="100%" height={300} borderRadius={16} />
        </div>
      </main>
    );
  }

  if (!team) return null;

  return (
    <main className="tm-container">
      {/* ── Header ── */}
      <div 
        className="tm-header-row" 
        style={{ 
          background: "linear-gradient(to right, #ffffff, #fafafa)",
          borderRadius: 16,
          padding: 24,
          border: "1px solid #e4e4e7",
          boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
          marginBottom: 32,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start"
        }}
      >
        <div className="tm-title-wrapper" style={{ display: "flex", gap: 20 }}>
          <button 
            className="tm-btn-secondary" 
            style={{ padding: "10px", borderRadius: "12px", height: "fit-content", background: "#fff" }}
            onClick={() => router.push("/dashboard/teams")}
          >
            <ChevronLeft size={18} />
          </button>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <div
              className="tm-team-icon"
              style={{ 
                backgroundColor: team.iconBg || "#eff6ff", 
                color: team.iconColor || "#3b82f6", 
                width: 56, 
                height: 56,
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 16px rgba(59, 130, 246, 0.15)"
              }}
            >
              <Users size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="tm-title" style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px", color: "#09090b", marginBottom: 6 }}>
                {team.name}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ 
                  display: "inline-flex", 
                  alignItems: "center", 
                  gap: 6,
                  background: "#f4f4f5", 
                  padding: "4px 10px", 
                  borderRadius: 20, 
                  fontSize: 13, 
                  color: "#52525b",
                  fontWeight: 500
                }}>
                  {team.focus || "General"}
                </span>
                <span style={{ color: "#a1a1aa", fontSize: 13 }}>•</span>
                <span style={{ color: "#52525b", fontSize: 14, fontWeight: 500 }}>
                  {team.users?.length || team.members} Members
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="tm-header-actions" style={{ display: "flex", gap: 12 }}>
          {hasPermission("teams:manage") && (
            <button 
              className="tm-btn-secondary" 
              style={{ 
                color: "#ef4444", 
                borderColor: "#fecaca", 
                backgroundColor: "#fff",
                boxShadow: "0 2px 8px rgba(239, 68, 68, 0.1)",
                padding: "8px 16px",
                borderRadius: "8px",
                fontWeight: 600
              }}
              onClick={handleDeleteTeam}
              disabled={isDeleting}
            >
              <Trash2 size={16} style={{ marginRight: 6 }} />
              {isDeleting ? "Deleting..." : "Delete Team"}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, marginTop: 32 }}>
        {/* Members List */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Team Members</h2>
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e4e4e7", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1.5fr auto", padding: "16px 20px", borderBottom: "1px solid #e4e4e7", backgroundColor: "#fafafa", fontSize: 13, fontWeight: 500, color: "#71717a" }}>
              <div>Member</div>
              <div>Email</div>
              <div>Workspace Role</div>
              <div></div>
            </div>
            {team.users && team.users.length > 0 ? (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              team.users.map((member: any) => (
                <div key={member.id} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1.5fr auto", padding: "16px 20px", borderBottom: "1px solid #f4f4f5", alignItems: "center", fontSize: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "#e4e4e7", color: "#52525b", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 12 }}>
                      {member.name ? member.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <span style={{ fontWeight: 500 }}>{member.name || "Unknown User"}</span>
                  </div>
                  <div style={{ color: "#52525b", display: "flex", alignItems: "center", gap: 8 }}>
                    <Mail size={14} color="#a1a1aa" />
                    {member.email}
                  </div>
                  <div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500, backgroundColor: "#f4f4f5", color: "#52525b" }}>
                      <Shield size={12} />
                      {member.workspaceRole?.name || member.role}
                    </span>
                  </div>
                  <div>
                    {hasPermission("teams:manage") && member.id !== currentUser?.id && (
                      <button 
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={removingMemberId === member.id}
                        style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: 6, borderRadius: 6, opacity: removingMemberId === member.id ? 0.5 : 1 }}
                        title="Remove from team"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: 40, textAlign: "center", color: "#71717a" }}>
                <Users size={32} style={{ margin: "0 auto 12px", opacity: 0.2 }} />
                <p>No members assigned to this team yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="tm-side-card">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 20, color: "#09090b" }}>Team Metrics</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#3f3f46" }}><Activity size={14} color={team.healthColor} /> Health Score</span>
                  <span style={{ color: team.healthColor, fontWeight: 600 }}>{team.health}/100</span>
                </div>
                <div style={{ width: "100%", height: 8, backgroundColor: "#f4f4f5", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${team.health}%`, height: "100%", backgroundColor: team.healthColor, borderRadius: 4 }} />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#3f3f46" }}><GraduationCap size={14} color={team.knowColor} /> Knowledge Coverage</span>
                  <span style={{ color: team.knowColor, fontWeight: 600 }}>{team.know}%</span>
                </div>
                <div style={{ width: "100%", height: 8, backgroundColor: "#f4f4f5", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${team.know}%`, height: "100%", backgroundColor: team.knowColor, borderRadius: 4 }} />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#3f3f46" }}><Zap size={14} color="#0ea5e9" /> Actions (30D)</span>
                  <span style={{ color: "#0ea5e9", fontWeight: 600 }}>{team.actions}</span>
                </div>
                <div style={{ width: "100%", height: 8, backgroundColor: "#f4f4f5", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, team.actions / 5)}%`, height: "100%", backgroundColor: "#0ea5e9", borderRadius: 4 }} />
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fef3c7", borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", gap: 12 }}>
              <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#92400e", marginBottom: 4 }}>Note on Team Metrics</div>
                <div style={{ fontSize: 12, color: "#b45309", lineHeight: 1.5 }}>
                  Metrics like health score, knowledge coverage, and actions are currently derived from historical data points. Dynamic tracking will be fully enabled in the next platform update.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
