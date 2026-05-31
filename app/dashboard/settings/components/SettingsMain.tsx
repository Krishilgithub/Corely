"use client";

import { motion } from "framer-motion";
import {
  Building2,
  AlignJustify,
  Lightbulb,
  ChevronDown,
  Shield,
  Key,
  Settings as SettingsIcon,
  AlertTriangle,
  Mail,
} from "lucide-react";
import { useState, useEffect } from "react";

interface SettingsUpdates {
  preferences?: {
    theme?: string;
    compactMode?: boolean;
    onboardingTips?: boolean;
    [key: string]: unknown;
  };
  workspaceName?: string;
  workspaceSlug?: string;
  [key: string]: unknown;
}

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

  const currentTabObj = tabConfig.find((t) => t.slug === currentTabSlug) || tabConfig[0];
  const activeTab = currentTabObj.label;

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
  const [passMessage, setPassMessage] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
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
    } catch (error) {
      console.error("Failed to fetch settings", error);
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
      if (!res.ok) alert("Failed to save settings");
    } catch {
      alert("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (val: boolean, setter: (v: boolean) => void, key: string) => {
    const next = !val;
    setter(next);
    saveSettings({ preferences: { [key]: next } });
  };

  if (loading) {
    return (
      <div className="settings-main-col" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <div style={{ color: "#a1a1aa", fontSize: 14 }}>Loading settings…</div>
      </div>
    );
  }

  return (
    <motion.div
      key={activeTab}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      {/* Page header */}
      <div className="settings-page-header">
        <h2 className="settings-page-title">{activeTab}</h2>
        <p className="settings-page-desc">
          Manage your {activeTab.toLowerCase()} preferences and configurations.
        </p>
      </div>

      {/* ── GENERAL ─────────────────────────────────────────── */}
      {activeTab === "General" && (
        <div className="settings-card">
          {/* Row: compact mode */}
          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-row-icon"><AlignJustify size={17} /></div>
              <div>
                <p className="settings-row-label">Compact Mode</p>
                <p className="settings-row-desc">Display more content in less space.</p>
              </div>
            </div>
            <div
              className={`settings-toggle ${compactMode ? "on" : ""}`}
              onClick={() => toggle(compactMode, setCompactMode, "compactMode")}
            >
              <div className="settings-toggle-knob" />
            </div>
          </div>

          {/* Row: onboarding tips */}
          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-row-icon"><Lightbulb size={17} /></div>
              <div>
                <p className="settings-row-label">Onboarding Tips</p>
                <p className="settings-row-desc">Show helpful tips to get the most out of Corely.</p>
              </div>
            </div>
            <div
              className={`settings-toggle ${onboardingTips ? "on" : ""}`}
              onClick={() => toggle(onboardingTips, setOnboardingTips, "onboardingTips")}
            >
              <div className="settings-toggle-knob" />
            </div>
          </div>
        </div>
      )}

      {/* ── WORKSPACE ───────────────────────────────────────── */}
      {activeTab === "Workspace" && (
        <div className="settings-card">
          <div className="settings-form-body">
            <div className="settings-input-group">
              <label className="settings-input-label">Workspace Name</label>
              <input
                type="text"
                className="settings-input"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="e.g. Acme Corp"
                style={{ maxWidth: 420 }}
              />
            </div>
            <div className="settings-input-group">
              <label className="settings-input-label">Workspace Slug</label>
              <input
                type="text"
                className="settings-input"
                value={workspaceSlug}
                onChange={(e) => setWorkspaceSlug(e.target.value)}
                placeholder="e.g. acme-corp"
                style={{ maxWidth: 420 }}
              />
            </div>
            <button
              className="settings-btn settings-btn-primary"
              onClick={() => saveSettings({ workspaceName, workspaceSlug })}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* ── AI & INTELLIGENCE ───────────────────────────────── */}
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
              <select
                className="settings-select"
                value={defaultLlm}
                onChange={(e) => {
                  setDefaultLlm(e.target.value);
                  saveSettings({ workspaceSettings: { defaultLlm: e.target.value } });
                }}
              >
                <option value="gpt-4o">GPT-4o</option>
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

      {/* ── SECURITY ────────────────────────────────────────── */}
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
              <div
                className={`settings-toggle ${twoFactorEnabled ? "on" : ""}`}
                onClick={() => toggle(twoFactorEnabled, setTwoFactorEnabled, "twoFactorEnabled")}
              >
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
                <input
                  type="password"
                  className="settings-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{ maxWidth: 420 }}
                />
              </div>
              <div className="settings-input-group">
                <label className="settings-input-label">New Password</label>
                <input
                  type="password"
                  className="settings-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ maxWidth: 420 }}
                />
              </div>
              {passMessage && (
                <div className={`settings-status ${passMessage.includes("Success") ? "success" : "error"}`}>
                  {passMessage}
                </div>
              )}
              <button
                className="settings-btn settings-btn-primary"
                style={{ marginTop: 16 }}
                onClick={async () => {
                  setPassMessage("");
                  if (!currentPassword || !newPassword) {
                    setPassMessage("Please fill out both fields.");
                    return;
                  }
                  try {
                    const res = await fetch("/api/settings/password", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ currentPassword, newPassword }),
                    });
                    if (res.ok) {
                      setPassMessage("Successfully updated password.");
                      setCurrentPassword("");
                      setNewPassword("");
                    } else {
                      const data = await res.json();
                      setPassMessage(data.error || "Failed to update password.");
                    }
                  } catch {
                    setPassMessage("An error occurred.");
                  }
                }}
              >
                Update Password
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── NOTIFICATIONS ───────────────────────────────────── */}
      {activeTab === "Notifications" && (
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-row-icon"><Mail size={17} /></div>
              <div>
                <p className="settings-row-label">Email Notifications</p>
                <p className="settings-row-desc">Receive activity digests and alert emails.</p>
              </div>
            </div>
            <div
              className={`settings-toggle ${emailNotifications ? "on" : ""}`}
              onClick={() => toggle(emailNotifications, setEmailNotifications, "emailNotifications")}
            >
              <div className="settings-toggle-knob" />
            </div>
          </div>
        </div>
      )}

      {/* ── ADVANCED ────────────────────────────────────────── */}
      {activeTab === "Advanced" && (
        <div className="settings-danger-card">
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div className="settings-row-icon" style={{ background: "#fef2f2", color: "#ef4444", flexShrink: 0 }}>
              <AlertTriangle size={17} />
            </div>
            <div>
              <p className="settings-row-label" style={{ color: "#ef4444" }}>Danger Zone</p>
              <p className="settings-row-desc" style={{ marginBottom: 16 }}>
                Permanently delete your workspace and all associated data. This action cannot be undone.
              </p>
              <button
                className="settings-btn settings-btn-danger"
                onClick={() => setShowDeleteModal(true)}
              >
                Delete Workspace
              </button>
            </div>
          </div>
          {showDeleteModal && (
            <div style={{ marginTop: 20, padding: "16px", background: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca" }}>
              <p style={{ fontSize: 13, color: "#ef4444", marginBottom: 8 }}>This feature requires contacting support.</p>
              <button className="settings-btn settings-btn-default" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── PLACEHOLDER TABS ────────────────────────────────── */}
      {["Members", "Data & Sources", "API Keys", "Audit Logs", "Billing"].includes(activeTab) && (
        <div className="settings-card" style={{ padding: "48px 32px", textAlign: "center" }}>
          <Building2 size={32} color="#d4d4d8" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111", margin: "0 0 6px" }}>{activeTab}</h3>
          <p style={{ fontSize: 14, color: "#71717a", margin: 0 }}>This section is currently under development.</p>
        </div>
      )}
    </motion.div>
  );
}
