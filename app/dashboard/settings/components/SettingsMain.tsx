"use client";

import { motion } from "framer-motion";
import {
  AlignJustify, Lightbulb, Shield, Key, Settings as SettingsIcon,
  AlertTriangle, Mail, Copy, Plus, Trash2, Eye, EyeOff, Users, Activity,
  Clock, Building2, Moon, Sun, Download
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useTheme } from "@/components/ThemeProvider";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { ANSWER_MODELS, DEFAULT_ANSWER_MODEL, normaliseAnswerModel } from "@/lib/llm-models";

interface SettingsUpdates {
  preferences?: { theme?: string; [key: string]: unknown };
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
}

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
  initials: string;
}

interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  resource: string;
  timestamp: string;
  // Full date and time, used for the CSV export
  createdAt: string;
}

// The Claude models /api/ask can run. Any other saved value (e.g. an old
// "gpt-4o") falls back to the default.
const LLM_OPTIONS = ANSWER_MODELS.map((m) => ({ value: m.value as string, label: m.label as string }));

// Wraps a value in quotes for CSV and escapes any quotes inside it.
function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

// Small label for settings that are shown but do not work yet.
function ComingSoonBadge() {
  return <span className="ui-badge ui-badge--neutral">Coming soon</span>;
}

// A switch for a setting that does nothing yet. Always shown off and disabled.
function ComingSoonToggle({ label }: { label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={false}
      aria-label={label}
      disabled
      title="Not available yet"
      className="settings-toggle settings-toggle--disabled"
    >
      <span className="settings-toggle-knob" />
    </button>
  );
}

// ── Role Badge ────────────────────────────────────────────────────────────────
// Roles are not a status, so every role uses the same neutral badge.
function RoleBadge({ role }: { role: string }) {
  return <span className="ui-badge ui-badge--neutral">{role}</span>;
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
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [workspacePlan, setWorkspacePlan] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [defaultLlm, setDefaultLlm] = useState<string>(DEFAULT_ANSWER_MODEL);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Dynamic state
  const [members, setMembers] = useState<Member[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  // True when the audit log API says only admins can see the logs
  const [auditForbidden, setAuditForbidden] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);

  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
          setEmailNotifications(data.preferences.emailNotifications ?? true);
        }
        if (data.workspace) {
          setWorkspaceName(data.workspace.name || "");
          setWorkspaceSlug(data.workspace.slug || "");
          setWorkspacePlan(data.workspace.plan || "");
          setDefaultLlm(normaliseAnswerModel(data.workspace.settings?.defaultLlm));
        }
      }

      if (membersRes.ok) {
        const d = await membersRes.json();
        setMembers(d.data?.members || []);
      }
      
      if (auditRes.status === 403) setAuditForbidden(true);
      if (auditRes.ok) {
        const d = await auditRes.json();
        const mappedLogs = (d.data?.logs || []).map((l: { id: string, action: string, details: string, createdAt: string, user?: { name: string, email: string } }) => ({
          id: l.id,
          actor: l.user ? l.user.name || l.user.email : "System",
          action: l.action,
          resource: l.details,
          timestamp: new Date(l.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          createdAt: new Date(l.createdAt).toISOString(),
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

  // Downloads the audit logs shown on this page as a CSV file.
  const exportAuditCsv = () => {
    const header = ["timestamp", "user", "action", "details"].join(",");
    const rows = auditLogs.map((e) =>
      [e.createdAt, e.actor, e.action, e.resource || ""].map(csvCell).join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `corely-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
    } catch {
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
    } catch {
      toast.error("An error occurred");
    }
  };

  if (loading) {
    return (
      <div className="settings-stack" aria-busy="true">
        <span className="sr-only">Loading…</span>
        <div className="ui-skeleton" style={{ height: 44, width: 280, maxWidth: "100%" }} />
        <div className="ui-skeleton" style={{ height: 240, borderRadius: 16 }} />
      </div>
    );
  }

  return (
    <div key={activeTab} className="settings-stack">
      {/* Tab title + description */}
      <div className="settings-section-head">
        <h2 className="type-heading">{activeTab}</h2>
        <p className="type-subtitle">
          {activeTab === "Members" && "Manage team members, roles, and access permissions."}
          {activeTab === "API Keys" && "Create and manage API keys for your workspace."}
          {activeTab === "Audit Logs" && "A record of actions performed in your workspace."}
          {activeTab === "General" && "Manage your personal display preferences."}
          {activeTab === "Workspace" && "Configure your workspace name and identity."}
          {activeTab === "AI & Intelligence" && "Control how Corely AI behaves across your workspace."}
          {activeTab === "Security" && "Manage authentication and security settings."}
          {activeTab === "Notifications" && "Control how and when you receive notifications."}
          {activeTab === "Billing" && "See which plan your workspace is on."}
          {activeTab === "Data & Sources" && "Configure data retention and source behavior."}
          {activeTab === "Advanced" && "Danger zone — destructive workspace actions."}
        </p>
      </div>

      {/* ── GENERAL ──────────────────────────────────────────────────── */}
      {activeTab === "General" && (
        <div className="ui-card settings-card">
          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-row-icon"><AlignJustify size={16} /></div>
              <div>
                <div className="settings-card-title-row">
                  <p className="settings-row-label">Compact Mode</p>
                  <ComingSoonBadge />
                </div>
                <p className="settings-row-desc">Display more content with reduced spacing.</p>
              </div>
            </div>
            <div className="settings-row-control">
              <ComingSoonToggle label="Compact mode" />
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-row-icon">
                {mounted && resolvedTheme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
              </div>
              <div>
                <p className="settings-row-label">Dark Mode</p>
                <p className="settings-row-desc">Switch between light and dark themes.</p>
              </div>
            </div>
            {mounted && (
              <div className="settings-row-control">
                <div className={`settings-toggle ${resolvedTheme === "dark" ? "on" : ""}`} onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
                  <div className="settings-toggle-knob" />
                </div>
              </div>
            )}
          </div>
          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-row-icon"><Lightbulb size={16} /></div>
              <div>
                <div className="settings-card-title-row">
                  <p className="settings-row-label">Onboarding Tips</p>
                  <ComingSoonBadge />
                </div>
                <p className="settings-row-desc">Show contextual tips and guided highlights.</p>
              </div>
            </div>
            <div className="settings-row-control">
              <ComingSoonToggle label="Onboarding tips" />
            </div>
          </div>
        </div>
      )}

      {/* ── WORKSPACE ──────────────────────────────────────────────────── */}
      {activeTab === "Workspace" && (
        <div className="ui-card settings-card">
          <div className="settings-row">
            <div className="settings-row-left">
              <div>
                <label className="settings-row-label">Workspace Name</label>
              </div>
            </div>
            <div className="settings-row-control">
              <input type="text" className="ui-input settings-control-input" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} placeholder="e.g. Acme Corp" />
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-left">
              <div>
                <label className="settings-row-label">Workspace Slug</label>
                <p className="settings-row-desc">corely.ai/<strong>{workspaceSlug || "your-slug"}</strong></p>
              </div>
            </div>
            <div className="settings-row-control">
              <input type="text" className="ui-input settings-control-input" value={workspaceSlug} onChange={(e) => setWorkspaceSlug(e.target.value)} placeholder="e.g. acme-corp" />
            </div>
          </div>
          <div className="settings-card-footer">
            <button className="ui-btn ui-btn--primary" onClick={() => saveSettings({ workspaceName, workspaceSlug })} disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* ── MEMBERS ──────────────────────────────────────────────────── */}
      {activeTab === "Members" && (
        <>
          <div className="ui-card settings-card">
            <div className="ui-card-header">
              <div className="settings-card-heading">
                <p className="type-heading">Team Members</p>
                <p className="type-caption">{members.length} members total</p>
              </div>
              {/* Invites are sent from the Teams page, which opens its invite form */}
              <Link href="/dashboard/teams?invite=1" className="ui-btn ui-btn--primary">
                <Plus size={16} /> Invite Member
              </Link>
            </div>
            <div className="settings-table-scroll">
              <table className="ui-table settings-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div className="settings-member">
                          <div className="settings-avatar">
                            {m.initials}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p className="settings-member-name">{m.name}</p>
                            <p className="type-caption">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td><RoleBadge role={m.role} /></td>
                      <td className="settings-table-muted">{m.joinedAt}</td>
                      <td className="settings-table-actions">
                        {m.role !== "Owner" && (
                          <button className="ui-btn ui-btn--ghost ui-btn--sm settings-danger-ghost" disabled title="Not available yet">
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {members.length === 0 && (
                    <tr>
                      <td colSpan={4} className="settings-table-empty">No members found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── AI & INTELLIGENCE ──────────────────────────────────────────── */}
      {activeTab === "AI & Intelligence" && (
        <div className="ui-card settings-card">
          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-row-icon"><SettingsIcon size={16} /></div>
              <div>
                <p className="settings-row-label">Default LLM Model</p>
                <p className="settings-row-desc">The AI model Corely uses to answer questions in this workspace.</p>
              </div>
            </div>
            <div className="settings-row-control">
              <Select
                className="settings-select"
                aria-label="Default LLM model"
                value={defaultLlm}
                onChange={(v) => { setDefaultLlm(v); saveSettings({ workspaceSettings: { defaultLlm: v } }); }}
                options={LLM_OPTIONS}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── DATA & SOURCES ──────────────────────────────────────────────── */}
      {activeTab === "Data & Sources" && (
        <div className="ui-card settings-card">
          <div className="ui-card-header">
            <div className="settings-card-heading">
              <p className="type-heading">Data Retention</p>
              <p className="type-caption">Corely keeps all synced data for now. These options are not available yet.</p>
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-row-icon"><Clock size={16} /></div>
              <div>
                <div className="settings-card-title-row">
                  <p className="settings-row-label">Memory Retention Period</p>
                  <ComingSoonBadge />
                </div>
                <p className="settings-row-desc">Automatically archive memory items older than this threshold.</p>
              </div>
            </div>
            <div className="settings-row-control">
              <Select
                className="settings-select"
                aria-label="Memory retention period"
                value="0"
                onChange={() => {}}
                disabled
                options={[
                  { value: "30", label: "30 days" },
                  { value: "90", label: "90 days" },
                  { value: "180", label: "6 months" },
                  { value: "365", label: "1 year" },
                  { value: "0", label: "Forever" },
                ]}
              />
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-row-icon"><Activity size={16} /></div>
              <div>
                <div className="settings-card-title-row">
                  <p className="settings-row-label">Auto Re-sync</p>
                  <ComingSoonBadge />
                </div>
                <p className="settings-row-desc">Automatically re-sync connected sources on a schedule.</p>
              </div>
            </div>
            <div className="settings-row-control">
              <ComingSoonToggle label="Auto re-sync" />
            </div>
          </div>
        </div>
      )}

      {/* ── API KEYS ──────────────────────────────────────────────────── */}
      {activeTab === "API Keys" && (
        <>
          {/* Generate new key panel */}
          {showNewKeyModal && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15, ease: "easeOut" }} className="ui-card settings-card settings-card--highlight">
              {newKeyValue ? (
                <>
                  <div className="ui-card-header">
                    <div className="settings-card-heading">
                      <p className="type-heading">Your new API key</p>
                      <p className="type-caption">Copy this now. For security, it won&apos;t be shown again.</p>
                    </div>
                  </div>
                  <div className="settings-card-body">
                    <div className="settings-key-reveal">
                      <code className="settings-code-block settings-code-block--key">
                        {newKeyValue}
                      </code>
                      <button
                        className="ui-btn ui-btn--secondary"
                        onClick={() => { navigator.clipboard.writeText(newKeyValue); toast.success("Copied to clipboard"); }}
                        style={{ flexShrink: 0 }}
                      >
                        <Copy size={16} /> Copy
                      </button>
                    </div>
                  </div>
                  <div className="settings-card-footer">
                    <button className="ui-btn ui-btn--primary" onClick={() => { setShowNewKeyModal(false); setNewKeyValue(null); setNewKeyName(""); }}>
                      Done
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="ui-card-header">
                    <div className="settings-card-heading">
                      <p className="type-heading">Create new API key</p>
                    </div>
                  </div>
                  <div className="settings-row">
                    <div className="settings-row-left">
                      <div>
                        <label className="settings-row-label">Key Name</label>
                      </div>
                    </div>
                    <div className="settings-row-control">
                      <input type="text" className="ui-input settings-control-input" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="e.g. Production, CI/CD, Local Dev" autoFocus />
                    </div>
                  </div>
                  <div className="settings-card-footer">
                    <button className="ui-btn ui-btn--secondary" onClick={() => { setShowNewKeyModal(false); setNewKeyName(""); }}>
                      Cancel
                    </button>
                    <button className="ui-btn ui-btn--primary" onClick={generateApiKey} disabled={!newKeyName.trim() || generatingKey}>
                      {generatingKey ? "Generating…" : "Generate Key"}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          <div className="ui-card settings-card">
            <div className="ui-card-header">
              <div className="settings-card-heading">
                <p className="type-heading">API Keys</p>
                <p className="type-caption">{apiKeys.length} active key{apiKeys.length !== 1 ? "s" : ""}</p>
              </div>
              <button className="ui-btn ui-btn--primary" onClick={() => { setShowNewKeyModal(true); setNewKeyValue(null); }}>
                <Plus size={16} /> New Key
              </button>
            </div>

            {apiKeys.length === 0 ? (
              <EmptyState
                compact
                icon={<Key />}
                title="No API keys yet"
                description="You can create a key now, but it cannot be used until API access is ready."
              />
            ) : (
              apiKeys.map((key) => (
                <div key={key.id} className="settings-row">
                  <div className="settings-row-left">
                    <div className="settings-row-icon"><Key size={16} /></div>
                    <div>
                      <p className="settings-row-label">{key.name}</p>
                      <p className="settings-row-desc">
                        Created {key.createdAt}
                        {key.lastUsed ? ` · Last used ${key.lastUsed}` : " · Never used"}
                      </p>
                    </div>
                  </div>
                  <div className="settings-row-control">
                    <code className="settings-key-chip">
                      {revealedKeys.has(key.id) ? key.prefix : "••••••••••••••••"}
                    </code>
                    <button
                      className="ui-icon-btn"
                      aria-label={revealedKeys.has(key.id) ? "Hide key" : "Show key"}
                      onClick={() => {
                        const next = new Set(revealedKeys);
                        if (next.has(key.id)) next.delete(key.id); else next.add(key.id);
                        setRevealedKeys(next);
                      }}
                    >
                      {revealedKeys.has(key.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button className="ui-btn ui-btn--ghost settings-danger-ghost" onClick={() => revokeKey(key.id)}>
                      <Trash2 size={16} /> Revoke
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="ui-card settings-card">
            <div className="ui-card-header">
              <div className="settings-card-heading">
                <div className="settings-card-title-row">
                  <p className="type-heading">API Access</p>
                  <ComingSoonBadge />
                </div>
              </div>
            </div>
            <div className="settings-card-body">
              <p className="settings-text">
                API access is coming soon. Keys you create now cannot be used yet.
              </p>
            </div>
          </div>
        </>
      )}

      {/* ── SECURITY ──────────────────────────────────────────────────── */}
      {activeTab === "Security" && (
        <>
          <div className="ui-card settings-card">
            <div className="settings-row">
              <div className="settings-row-left">
                <div className="settings-row-icon"><Shield size={16} /></div>
                <div>
                  <div className="settings-card-title-row">
                    <p className="settings-row-label">Two-Factor Authentication</p>
                    <ComingSoonBadge />
                  </div>
                  <p className="settings-row-desc">Require 2FA for all workspace members. This is not available yet.</p>
                </div>
              </div>
              <div className="settings-row-control">
                <ComingSoonToggle label="Require two-factor authentication" />
              </div>
            </div>
            <div className="settings-row">
              <div className="settings-row-left">
                <div className="settings-row-icon"><Key size={16} /></div>
                <div>
                  <div className="settings-card-title-row">
                    <p className="settings-row-label">Single Sign-On (SSO)</p>
                    <ComingSoonBadge />
                  </div>
                  <p className="settings-row-desc">Configure SAML or OIDC provider for your team.</p>
                </div>
              </div>
              <div className="settings-row-control">
                <button className="ui-btn ui-btn--secondary" disabled title="Not available yet">Configure SSO</button>
              </div>
            </div>
          </div>
          <div className="ui-card settings-card">
            <div className="ui-card-header">
              <div className="settings-card-heading">
                <p className="type-heading">Change Password</p>
              </div>
            </div>
            <div className="settings-row">
              <div className="settings-row-left">
                <div>
                  <label className="settings-row-label">Current Password</label>
                </div>
              </div>
              <div className="settings-row-control">
                <div className="settings-input-wrap">
                  <input type={showCurrentPw ? "text" : "password"} className="ui-input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{ paddingRight: 40 }} />
                  <button type="button" className="settings-input-icon-btn" aria-label={showCurrentPw ? "Hide password" : "Show password"} onClick={() => setShowCurrentPw(!showCurrentPw)}>
                    {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="settings-row">
              <div className="settings-row-left">
                <div>
                  <label className="settings-row-label">New Password</label>
                </div>
              </div>
              <div className="settings-row-control">
                <div className="settings-input-wrap">
                  <input type={showNewPw ? "text" : "password"} className="ui-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ paddingRight: 40 }} />
                  <button type="button" className="settings-input-icon-btn" aria-label={showNewPw ? "Hide password" : "Show password"} onClick={() => setShowNewPw(!showNewPw)}>
                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="settings-card-footer">
              <button className="ui-btn ui-btn--primary" onClick={async () => {
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
        <div className="ui-card settings-card">
          <div className="settings-card-body">
            <p className="settings-text">Corely saves your choice; these emails are not sent yet.</p>
          </div>
          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-row-icon"><Mail size={16} /></div>
              <div>
                <p className="settings-row-label">Email Digest</p>
                <p className="settings-row-desc">Receive daily activity summaries to your inbox.</p>
              </div>
            </div>
            <div className="settings-row-control">
              <div className={`settings-toggle ${emailNotifications ? "on" : ""}`} onClick={() => toggle(emailNotifications, setEmailNotifications, "emailNotifications")}>
                <div className="settings-toggle-knob" />
              </div>
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-row-icon"><Activity size={16} /></div>
              <div>
                <div className="settings-card-title-row">
                  <p className="settings-row-label">Source Sync Alerts</p>
                  <ComingSoonBadge />
                </div>
                <p className="settings-row-desc">Get notified when a source sync fails or completes.</p>
              </div>
            </div>
            <div className="settings-row-control">
              <ComingSoonToggle label="Source sync alerts" />
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-row-icon"><Users size={16} /></div>
              <div>
                <div className="settings-card-title-row">
                  <p className="settings-row-label">Team Activity</p>
                  <ComingSoonBadge />
                </div>
                <p className="settings-row-desc">Notifications for member joins, role changes, and invitations.</p>
              </div>
            </div>
            <div className="settings-row-control">
              <ComingSoonToggle label="Team activity" />
            </div>
          </div>
        </div>
      )}

      {/* ── AUDIT LOGS ──────────────────────────────────────────────────── */}
      {activeTab === "Audit Logs" && (
        <div className="ui-card settings-card">
          <div className="ui-card-header">
            <div className="settings-card-heading">
              <p className="type-heading">Audit Trail</p>
              <p className="type-caption">The most recent actions in your workspace</p>
            </div>
            <button className="ui-btn ui-btn--secondary" onClick={exportAuditCsv} disabled={auditLogs.length === 0}>
              <Download size={16} /> Export CSV
            </button>
          </div>
          <div className="settings-table-scroll">
            <table className="ui-table settings-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Actor</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((event) => (
                  <tr key={event.id}>
                    <td style={{ fontWeight: 500 }}>{event.action}</td>
                    <td className="settings-table-muted" style={{ whiteSpace: "normal" }}>{event.resource}</td>
                    <td className="settings-table-muted">{event.actor}</td>
                    <td className="settings-table-muted" style={{ textAlign: "right" }}>{event.timestamp}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="settings-table-empty">
                      {auditForbidden ? "Only workspace admins can view audit logs." : "No audit logs found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── BILLING ──────────────────────────────────────────────────── */}
      {activeTab === "Billing" && (
        <div className="ui-card settings-card">
          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-row-icon"><Building2 size={16} /></div>
              <div>
                {/* The real plan saved on the workspace (for example "free") */}
                <h3 className="type-heading" style={{ textTransform: "capitalize" }}>
                  {workspacePlan ? `${workspacePlan} plan` : "Plan unknown"}
                </h3>
                <p className="settings-text" style={{ marginTop: 4, maxWidth: 520 }}>
                  Online billing and plan changes are not available yet.
                </p>
              </div>
            </div>
            <div className="settings-row-control">
              <button className="ui-btn ui-btn--secondary" disabled title="Not available yet">Contact Billing Team</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADVANCED ──────────────────────────────────────────────────── */}
      {activeTab === "Advanced" && (
        <div className="ui-card settings-card settings-danger-card">
          <div className="ui-card-header">
            <div className="settings-card-title-row">
              <div className="settings-row-icon settings-row-icon--danger">
                <AlertTriangle size={16} />
              </div>
              <p className="type-heading settings-danger-title">Danger Zone</p>
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-left">
              <p className="settings-text">
                Permanently delete this workspace and all associated data. Deleting a workspace from here is not available yet.
              </p>
            </div>
            <div className="settings-row-control">
              <button className="ui-btn ui-btn--destructive" disabled title="Not available yet">
                Delete Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
