"use client";

import { motion } from "framer-motion";
import {
  AlignJustify, Lightbulb, ChevronDown, Shield, Key, Settings as SettingsIcon,
  AlertTriangle, Mail, Copy, Plus, Trash2, Eye, EyeOff, Users, Activity,
  Clock, CheckCircle2, XCircle, Building2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface SettingsUpdates {
  preferences?: { theme?: string; compactMode?: boolean; onboardingTips?: boolean; [key: string]: unknown };
  workspaceName?: string;
  workspaceSlug?: string;
  [key: string]: unknown;
}

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsed: string | null;
  scopes: string[];
}

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
  status: "active" | "invited";
  initials: string;
}

interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  resource: string;
  timestamp: string;
  status: "success" | "failure";
}

// ── Dummy Data (replaces API placeholders) ────────────────────────────────────
// Mock data removed, fetching from real API endpoints now.

// ── Role Badge ────────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Owner: { bg: "#fff3ee", color: "#ff6b00" },
    Admin: { bg: "#eff6ff", color: "#3b82f6" },
    Member: { bg: "#f4f4f5", color: "#52525b" },
  };
  const s = map[role] || map.Member;
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11.5, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>
      {role}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SettingsMain({ currentTabSlug = "general" }: { currentTabSlug?: string }) {
  const tabConfig = [
    { slug: "general", label: "General" },
    { slug: "workspace", label: "Workspace" },
    { slug: "members", label: "Members" },
    { slug: "ai", label: "AI & Intelligence" },
    { slug: "sources", label: "Data & Sources" },
    { slug: "api-keys", label: "API Keys" },
    { slug: "security", label: "Security" },
    { slug: "notifications", label: "Notifications" },
    { slug: "audit-logs", label: "Audit Logs" },
    { slug: "billing", label: "Billing" },
    { slug: "advanced", label: "Advanced" },
  ];

  const activeTab = (tabConfig.find((t) => t.slug === currentTabSlug) || tabConfig[0]).label;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [onboardingTips, setOnboardingTips] = useState(true);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [defaultLlm, setDefaultLlm] = useState("gpt-4o");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Dynamic state
  const [members, setMembers] = useState<Member[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);

  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [settingsRes, membersRes, auditRes, keysRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/teams/members"),
        fetch("/api/audit-logs"),
        fetch("/api/settings/api-keys")
      ]);

      if (settingsRes.ok) {
        const json = await settingsRes.json();
        const data = json.data || json;
        if (data.preferences) {
          setCompactMode(data.preferences.compactMode || false);
          setOnboardingTips(data.preferences.onboardingTips ?? true);
          setTwoFactorEnabled(data.preferences.twoFactorEnabled || false);
          setEmailNotifications(data.preferences.emailNotifications ?? true);
        }
        if (data.workspace) {
          setWorkspaceName(data.workspace.name || "");
          setWorkspaceSlug(data.workspace.slug || "");
          if (data.workspace.settings) {
            setDefaultLlm(data.workspace.settings.defaultLlm || "gpt-4o");
          }
        }
      }

      if (membersRes.ok) {
        const d = await membersRes.json();
        setMembers(d.data?.members || []);
      }
      
      if (auditRes.ok) {
        const d = await auditRes.json();
        const mappedLogs = (d.data?.logs || []).map((l: { id: string, action: string, details: string, createdAt: string, user?: { name: string, email: string } }) => ({
          id: l.id,
          actor: l.user ? l.user.name || l.user.email : "System",
          action: l.action,
          resource: l.details,
          timestamp: new Date(l.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          status: "success"
        }));
        setAuditLogs(mappedLogs);
      }

      if (keysRes.ok) {
        const d = await keysRes.json();
        setApiKeys(d.data?.apiKeys || []);
      }
    } catch (e) {
      console.error("Failed to fetch settings data", e);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (updates: SettingsUpdates) => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        toast.success("Settings saved");
      } else {
        toast.error("Failed to save settings");
      }
    } catch {
      toast.error("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (val: boolean, setter: (v: boolean) => void, key: string) => {
    const next = !val;
    setter(next);
    saveSettings({ preferences: { [key]: next } });
  };

  const generateApiKey = async () => {
    if (!newKeyName.trim()) return;
    setGeneratingKey(true);
    try {
      const res = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      if (res.ok) {
        const { data } = await res.json();
        setApiKeys((prev) => [data.apiKey, ...prev]);
        setNewKeyValue(data.rawKey);
        toast.success("API key generated — copy it now, it won't be shown again");
      } else {
        toast.error("Failed to generate API key");
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setGeneratingKey(false);
    }
  };

  const revokeKey = async (id: string) => {
    try {
      const res = await fetch(`/api/settings/api-keys?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setApiKeys((prev) => prev.filter((k) => k.id !== id));
        toast.success("API key revoked");
      } else {
        toast.error("Failed to revoke API key");
      }
    } catch (e) {
      toast.error("An error occurred");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <div style={{ color: "#a1a1aa", fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  return (
    <motion.div
      key={activeTab}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {/* Page Header */}
      <div className="settings-page-header">
        <h2 className="settings-page-title">{activeTab}</h2>
        <p className="settings-page-desc">
          {activeTab === "Members" && "Manage team members, roles, and access permissions."}
          {activeTab === "API Keys" && "Create and manage API keys to access Corely programmatically."}
          {activeTab === "Audit Logs" && "A full audit trail of all actions performed in your workspace."}
          {activeTab === "General" && "Manage your personal display preferences."}
          {activeTab === "Workspace" && "Configure your workspace name and identity."}
          {activeTab === "AI & Intelligence" && "Control how Corely AI behaves across your workspace."}
          {activeTab === "Security" && "Manage authentication and security settings."}
          {activeTab === "Notifications" && "Control how and when you receive notifications."}
          {activeTab === "Billing" && "Manage your subscription and billing details."}
          {activeTab === "Data & Sources" && "Configure data retention and source behavior."}
          {activeTab === "Advanced" && "Danger zone — destructive workspace actions."}
        </p>
      </div>

      {/* ── GENERAL ──────────────────────────────────────────────────── */}
      {activeTab === "General" && (
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-row-icon"><AlignJustify size={17} /></div>
              <div>
                <p className="settings-row-label">Compact Mode</p>
                <p className="settings-row-desc">Display more content with reduced spacing.</p>
              </div>
            </div>
            <div className={`settings-toggle ${compactMode ? "on" : ""}`} onClick={() => toggle(compactMode, setCompactMode, "compactMode")}>
              <div className="settings-toggle-knob" />
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-row-icon"><Lightbulb size={17} /></div>
              <div>
                <p className="settings-row-label">Onboarding Tips</p>
                <p className="settings-row-desc">Show contextual tips and guided highlights.</p>
              </div>
            </div>
            <div className={`settings-toggle ${onboardingTips ? "on" : ""}`} onClick={() => toggle(onboardingTips, setOnboardingTips, "onboardingTips")}>
              <div className="settings-toggle-knob" />
            </div>
          </div>
        </div>
      )}

      {/* ── WORKSPACE ──────────────────────────────────────────────────── */}
      {activeTab === "Workspace" && (
        <div className="settings-card">
          <div className="settings-form-body">
            <div className="settings-input-group">
              <label className="settings-input-label">Workspace Name</label>
              <input type="text" className="settings-input" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} placeholder="e.g. Acme Corp" style={{ maxWidth: 440 }} />
            </div>
            <div className="settings-input-group">
              <label className="settings-input-label">Workspace Slug</label>
              <input type="text" className="settings-input" value={workspaceSlug} onChange={(e) => setWorkspaceSlug(e.target.value)} placeholder="e.g. acme-corp" style={{ maxWidth: 440 }} />
              <span style={{ fontSize: 12, color: "#a1a1aa" }}>corely.ai/<strong>{workspaceSlug || "your-slug"}</strong></span>
            </div>
            <button className="settings-btn settings-btn-primary" onClick={() => saveSettings({ workspaceName, workspaceSlug })} disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* ── MEMBERS ──────────────────────────────────────────────────── */}
      {activeTab === "Members" && (
        <>
          <div className="settings-card">
            <div className="settings-card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p className="settings-card-title">Team Members</p>
                <p className="settings-card-subtitle">{members.length} members total</p>
              </div>
              <button className="settings-btn settings-btn-primary" style={{ gap: 6 }}>
                <Plus size={14} /> Invite Member
              </button>
            </div>
            <div>
              {members.map((m) => (
                <div key={m.id} className="settings-row">
                  <div className="settings-row-left">
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: m.status === "invited" ? "#f4f4f5" : "linear-gradient(135deg, #ff6b00, #ff9240)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: m.status === "invited" ? "#a1a1aa" : "#fff", flexShrink: 0 }}>
                      {m.initials}
                    </div>
                    <div>
                      <p className="settings-row-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {m.name}
                        {m.status === "invited" && <span style={{ fontSize: 11, background: "#fef9c3", color: "#a16207", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>Invited</span>}
                      </p>
                      <p className="settings-row-desc">{m.email} · Joined {m.joinedAt}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <RoleBadge role={m.role} />
                    {m.role !== "Owner" && (
                      <button className="settings-btn settings-btn-danger" style={{ padding: "5px 10px", fontSize: 12 }}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── AI & INTELLIGENCE ──────────────────────────────────────────── */}
      {activeTab === "AI & Intelligence" && (
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-row-icon"><SettingsIcon size={17} /></div>
              <div>
                <p className="settings-row-label">Default LLM Model</p>
                <p className="settings-row-desc">The AI model used for all queries by default.</p>
              </div>
            </div>
            <div className="settings-select-wrapper">
              <select className="settings-select" value={defaultLlm} onChange={(e) => { setDefaultLlm(e.target.value); saveSettings({ workspaceSettings: { defaultLlm: e.target.value } }); }}>
                <option value="gpt-4o">GPT-4o (Recommended)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="claude-3-opus">Claude 3 Opus</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                <option value="gemini-1-5-pro">Gemini 1.5 Pro</option>
              </select>
              <ChevronDown size={14} className="settings-select-chevron" />
            </div>
          </div>
        </div>
      )}

      {/* ── DATA & SOURCES ──────────────────────────────────────────────── */}
      {activeTab === "Data & Sources" && (
        <div className="settings-card">
          <div className="settings-card-header">
            <p className="settings-card-title">Data Retention</p>
            <p className="settings-card-subtitle">Control how long synced data is retained in your workspace</p>
          </div>
          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-row-icon"><Clock size={17} /></div>
              <div>
                <p className="settings-row-label">Memory Retention Period</p>
                <p className="settings-row-desc">Automatically archive memory items older than this threshold.</p>
              </div>
            </div>
            <div className="settings-select-wrapper">
              <select className="settings-select" defaultValue="90">
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="180">6 months</option>
                <option value="365">1 year</option>
                <option value="0">Forever</option>
              </select>
              <ChevronDown size={14} className="settings-select-chevron" />
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-row-icon"><Activity size={17} /></div>
              <div>
                <p className="settings-row-label">Auto Re-sync</p>
                <p className="settings-row-desc">Automatically re-sync connected sources on a schedule.</p>
              </div>
            </div>
            <div className={`settings-toggle on`}>
              <div className="settings-toggle-knob" />
            </div>
          </div>
        </div>
      )}

      {/* ── API KEYS ──────────────────────────────────────────────────── */}
      {activeTab === "API Keys" && (
        <>
          {/* Generate new key modal */}
          {showNewKeyModal && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="settings-card" style={{ marginBottom: 20, border: "1px solid #ff6b00", background: "#fffaf7" }}>
              <div className="settings-form-body">
                {newKeyValue ? (
                  <>
                    <p className="settings-card-title" style={{ marginBottom: 4 }}>Your new API key</p>
                    <p style={{ fontSize: 13, color: "var(--db-text-muted)", marginBottom: 12 }}>Copy this now. For security, it won&apos;t be shown again.</p>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <code style={{ flex: 1, background: "#f4f4f5", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontFamily: "monospace", wordBreak: "break-all", border: "1px solid #e4e4e7" }}>
                        {newKeyValue}
                      </code>
                      <button
                        className="settings-btn settings-btn-default"
                        onClick={() => { navigator.clipboard.writeText(newKeyValue); toast.success("Copied to clipboard"); }}
                        style={{ flexShrink: 0, gap: 6 }}
                      >
                        <Copy size={14} /> Copy
                      </button>
                    </div>
                    <button className="settings-btn settings-btn-primary" style={{ marginTop: 16 }} onClick={() => { setShowNewKeyModal(false); setNewKeyValue(null); setNewKeyName(""); }}>
                      Done
                    </button>
                  </>
                ) : (
                  <>
                    <p className="settings-card-title" style={{ marginBottom: 12 }}>Create new API key</p>
                    <div className="settings-input-group">
                      <label className="settings-input-label">Key Name</label>
                      <input type="text" className="settings-input" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="e.g. Production, CI/CD, Local Dev" style={{ maxWidth: 380 }} autoFocus />
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                      <button className="settings-btn settings-btn-primary" onClick={generateApiKey} disabled={!newKeyName.trim() || generatingKey}>
                        {generatingKey ? "Generating…" : "Generate Key"}
                      </button>
                      <button className="settings-btn settings-btn-default" onClick={() => { setShowNewKeyModal(false); setNewKeyName(""); }}>
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          <div className="settings-card">
            <div className="settings-card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p className="settings-card-title">API Keys</p>
                <p className="settings-card-subtitle">{apiKeys.length} active key{apiKeys.length !== 1 ? "s" : ""}</p>
              </div>
              <button className="settings-btn settings-btn-primary" style={{ gap: 6 }} onClick={() => { setShowNewKeyModal(true); setNewKeyValue(null); }}>
                <Plus size={14} /> New Key
              </button>
            </div>

            {apiKeys.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#f4f4f5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <Key size={22} color="#a1a1aa" />
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--db-text)", margin: "0 0 6px" }}>No API keys yet</p>
                <p style={{ fontSize: 13, color: "var(--db-text-muted)", margin: 0 }}>Create your first key to access the Corely API programmatically.</p>
              </div>
            ) : (
              apiKeys.map((key) => (
                <div key={key.id} className="settings-row">
                  <div className="settings-row-left">
                    <div className="settings-row-icon"><Key size={16} /></div>
                    <div>
                      <p className="settings-row-label">{key.name}</p>
                      <p className="settings-row-desc">
                        {revealedKeys.has(key.id) ? <code style={{ fontFamily: "monospace" }}>{key.prefix}</code> : "••••••••••••••••"}
                        {" · "}Created {key.createdAt}
                        {key.lastUsed ? ` · Last used ${key.lastUsed}` : " · Never used"}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="settings-btn settings-btn-default"
                      style={{ gap: 5, padding: "5px 10px" }}
                      onClick={() => {
                        const next = new Set(revealedKeys);
                        if (next.has(key.id)) next.delete(key.id); else next.add(key.id);
                        setRevealedKeys(next);
                      }}
                    >
                      {revealedKeys.has(key.id) ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button className="settings-btn settings-btn-danger" style={{ gap: 5, padding: "5px 10px" }} onClick={() => revokeKey(key.id)}>
                      <Trash2 size={13} /> Revoke
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="settings-card" style={{ marginTop: 20 }}>
            <div className="settings-card-header">
              <p className="settings-card-title">API Documentation</p>
            </div>
            <div className="settings-form-body" style={{ paddingTop: 16 }}>
              <p style={{ fontSize: 13.5, color: "#52525b", lineHeight: 1.6 }}>
                Use your API key in the Authorization header to authenticate requests:
              </p>
              <code style={{ display: "block", background: "#18181b", color: "#10b981", borderRadius: 10, padding: "14px 18px", fontSize: 13, fontFamily: "monospace", marginTop: 12, lineHeight: 1.6 }}>
                curl -H &quot;Authorization: Bearer crl_live_...&quot; \<br />
                &nbsp;&nbsp;https://api.corely.ai/v1/memory
              </code>
            </div>
          </div>
        </>
      )}

      {/* ── SECURITY ──────────────────────────────────────────────────── */}
      {activeTab === "Security" && (
        <>
          <div className="settings-card">
            <div className="settings-row">
              <div className="settings-row-left">
                <div className="settings-row-icon"><Shield size={17} /></div>
                <div>
                  <p className="settings-row-label">Two-Factor Authentication</p>
                  <p className="settings-row-desc">Require 2FA for all workspace members.</p>
                </div>
              </div>
              <div className={`settings-toggle ${twoFactorEnabled ? "on" : ""}`} onClick={() => toggle(twoFactorEnabled, setTwoFactorEnabled, "twoFactorEnabled")}>
                <div className="settings-toggle-knob" />
              </div>
            </div>
            <div className="settings-row">
              <div className="settings-row-left">
                <div className="settings-row-icon"><Key size={17} /></div>
                <div>
                  <p className="settings-row-label">Single Sign-On (SSO)</p>
                  <p className="settings-row-desc">Configure SAML or OIDC provider for your team.</p>
                </div>
              </div>
              <button className="settings-btn settings-btn-default">Configure SSO</button>
            </div>
          </div>
          <p className="settings-section-title">Change Password</p>
          <div className="settings-card">
            <div className="settings-form-body">
              <div className="settings-input-group">
                <label className="settings-input-label">Current Password</label>
                <div style={{ position: "relative", maxWidth: 440 }}>
                  <input type={showCurrentPw ? "text" : "password"} className="settings-input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{ paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#a1a1aa" }}>
                    {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="settings-input-group">
                <label className="settings-input-label">New Password</label>
                <div style={{ position: "relative", maxWidth: 440 }}>
                  <input type={showNewPw ? "text" : "password"} className="settings-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#a1a1aa" }}>
                    {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <button className="settings-btn settings-btn-primary" style={{ marginTop: 8 }} onClick={async () => {
                if (!currentPassword || !newPassword) { toast.error("Please fill out both fields."); return; }
                try {
                  const res = await fetch("/api/settings/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
                  if (res.ok) { toast.success("Password updated successfully"); setCurrentPassword(""); setNewPassword(""); }
                  else { const d = await res.json(); toast.error(d.error || "Failed to update password"); }
                } catch { toast.error("An error occurred"); }
              }}>Update Password</button>
            </div>
          </div>
        </>
      )}

      {/* ── NOTIFICATIONS ──────────────────────────────────────────────── */}
      {activeTab === "Notifications" && (
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-row-icon"><Mail size={17} /></div>
              <div>
                <p className="settings-row-label">Email Digest</p>
                <p className="settings-row-desc">Receive daily activity summaries to your inbox.</p>
              </div>
            </div>
            <div className={`settings-toggle ${emailNotifications ? "on" : ""}`} onClick={() => toggle(emailNotifications, setEmailNotifications, "emailNotifications")}>
              <div className="settings-toggle-knob" />
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-row-icon"><Activity size={17} /></div>
              <div>
                <p className="settings-row-label">Source Sync Alerts</p>
                <p className="settings-row-desc">Get notified when a source sync fails or completes.</p>
              </div>
            </div>
            <div className="settings-toggle on">
              <div className="settings-toggle-knob" />
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-row-icon"><Users size={17} /></div>
              <div>
                <p className="settings-row-label">Team Activity</p>
                <p className="settings-row-desc">Notifications for member joins, role changes, and invitations.</p>
              </div>
            </div>
            <div className="settings-toggle">
              <div className="settings-toggle-knob" />
            </div>
          </div>
        </div>
      )}

      {/* ── AUDIT LOGS ──────────────────────────────────────────────────── */}
      {activeTab === "Audit Logs" && (
        <div className="settings-card">
          <div className="settings-card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p className="settings-card-title">Audit Trail</p>
              <p className="settings-card-subtitle">All workspace actions for compliance and security</p>
            </div>
            <button className="settings-btn settings-btn-default" style={{ gap: 6 }}>Export CSV</button>
          </div>
          {auditLogs.map((event) => (
            <div key={event.id} className="settings-row">
              <div className="settings-row-left">
                <div className="settings-row-icon" style={{ background: event.status === "success" ? "#f0fdf4" : "#fef2f2", color: event.status === "success" ? "#16a34a" : "#ef4444" }}>
                  {event.status === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                </div>
                <div>
                  <p className="settings-row-label">{event.action} — <span style={{ fontWeight: 500, color: "#52525b" }}>{event.resource}</span></p>
                  <p className="settings-row-desc">by {event.actor}</p>
                </div>
              </div>
              <span style={{ fontSize: 12, color: "#a1a1aa", whiteSpace: "nowrap", flexShrink: 0 }}>{event.timestamp}</span>
            </div>
          ))}
          {auditLogs.length === 0 && (
            <div style={{ padding: "40px", textAlign: "center", color: "#a1a1aa", fontSize: 14 }}>
              No audit logs found.
            </div>
          )}
        </div>
      )}

      {/* ── BILLING ──────────────────────────────────────────────────── */}
      {activeTab === "Billing" && (
        <div className="settings-card" style={{ padding: "48px 32px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, background: "#fff3ee", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Building2 size={24} color="#ff6b00" />
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--db-text)", margin: "0 0 8px" }}>Enterprise Plan</h3>
          <p style={{ fontSize: 14, color: "var(--db-text-muted)", margin: "0 0 24px", maxWidth: 360, lineHeight: 1.6 }}>
            Your billing is managed by your Corely account executive. Contact <strong>billing@corely.ai</strong> for invoice requests.
          </p>
          <button className="settings-btn settings-btn-primary">Contact Billing Team</button>
        </div>
      )}

      {/* ── ADVANCED ──────────────────────────────────────────────────── */}
      {activeTab === "Advanced" && (
        <div className="settings-danger-card">
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div className="settings-row-icon" style={{ background: "#fef2f2", color: "#ef4444", flexShrink: 0 }}>
              <AlertTriangle size={17} />
            </div>
            <div>
              <p className="settings-row-label" style={{ color: "#ef4444" }}>Danger Zone</p>
              <p className="settings-row-desc" style={{ marginBottom: 16 }}>
                Permanently delete this workspace and all associated data. This action is irreversible.
              </p>
              <button className="settings-btn settings-btn-danger" onClick={() => setShowDeleteModal(true)}>
                Delete Workspace
              </button>
            </div>
          </div>
          {showDeleteModal && (
            <div style={{ marginTop: 20, padding: 16, background: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca" }}>
              <p style={{ fontSize: 13, color: "#ef4444", marginBottom: 12, fontWeight: 500 }}>
                To delete this workspace, please contact <strong>support@corely.ai</strong>.
              </p>
              <button className="settings-btn settings-btn-default" onClick={() => setShowDeleteModal(false)}>Cancel</button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
