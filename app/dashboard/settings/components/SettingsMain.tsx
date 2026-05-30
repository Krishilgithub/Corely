"use client";

import { motion } from "framer-motion";
import {
  Building2,
  Palette,
  AlignJustify,
  Lightbulb,
  ChevronRight,
  ChevronDown,
  Sun,
  Moon,
  Shield,
  Key,
  Database,
  Settings as SettingsIcon,
  AlertTriangle,
  Mail
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

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
  
  const currentTabObj = tabConfig.find(t => t.slug === currentTabSlug) || tabConfig[0];
  const activeTab = currentTabObj.label;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings State
  const [theme, setTheme] = useState("light");
  const [compactMode, setCompactMode] = useState(false);
  const [onboardingTips, setOnboardingTips] = useState(true);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [defaultLlm, setDefaultLlm] = useState("gpt-4o");

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passMessage, setPassMessage] = useState("");

  // SSO State
  const [ssoProviderUrl, setSsoProviderUrl] = useState("");
  const [ssoDomain, setSsoDomain] = useState("");
  const [showSsoModal, setShowSsoModal] = useState(false);

  // Advanced State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");

  // Removed tabs array as it is replaced by tabConfig

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      const data = json.data || json;
      if (data.preferences) {
        setTheme(data.preferences.theme || "light");
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
      // alert("Failed to load settings");
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
        // alert("Settings saved successfully");
        if (updates.preferences && typeof updates.preferences.theme === 'string') {
          // In a real app, apply theme to document root here
          document.documentElement.className = updates.preferences.theme;
        }
      } else {
        alert("Failed to save settings");
      }
    } catch {
      alert("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    saveSettings({ preferences: { theme: newTheme } });
  };

  const handleToggleCompactMode = () => {
    const newVal = !compactMode;
    setCompactMode(newVal);
    saveSettings({ preferences: { compactMode: newVal } });
  };

  const handleToggleOnboardingTips = () => {
    const newVal = !onboardingTips;
    setOnboardingTips(newVal);
    saveSettings({ preferences: { onboardingTips: newVal } });
  };

  const handleWorkspaceSave = () => {
    saveSettings({ workspaceName, workspaceSlug });
  };

  const handleToggleTwoFactor = () => {
    const newVal = !twoFactorEnabled;
    setTwoFactorEnabled(newVal);
    saveSettings({ preferences: { twoFactorEnabled: newVal } });
  };

  const handleToggleEmail = () => {
    const newVal = !emailNotifications;
    setEmailNotifications(newVal);
    saveSettings({ preferences: { emailNotifications: newVal } });
  };

  const handleLlmChange = (model: string) => {
    setDefaultLlm(model);
    saveSettings({ workspaceSettings: { defaultLlm: model } });
  };

  if (loading) {
    return <div style={{ flex: 1, minWidth: 0, padding: 20 }}>Loading settings...</div>;
  }

  return (
    <>
      {/* Left Navigation */}
      <div className="set-nav-sidebar">
        <div style={{ marginBottom: 24 }}>
          <h1 className="set-title" style={{ fontSize: 24 }}>Settings</h1>
          <p className="set-subtitle" style={{ fontSize: 13 }}>Manage your configurations.</p>
        </div>
        {tabConfig.map((tab) => (
          <Link
            key={tab.slug}
            href={`/dashboard/settings/${tab.slug}`}
            className={`set-nav-item ${activeTab === tab.label ? "active" : ""}`}
            style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between' }}
          >
            {tab.label}
            {activeTab === tab.label && <ChevronRight size={14} />}
          </Link>
        ))}
      </div>

      {/* Right Content */}
      <motion.div
        key={activeTab}
        style={{ flex: 1, minWidth: 0, paddingRight: 16, paddingBottom: 64 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === "General" && (
          <>
            <div className="set-section">
              <div className="set-section-title">General Settings</div>
              <div className="set-card">
                <div className="set-row">
                  <div className="set-row-left">
                    <div className="set-row-icon-wrap">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <div className="set-row-title">Workspace Profile</div>
                      <div className="set-row-desc">Manage your workspace name, logo, and basic details.</div>
                    </div>
                  </div>
                  <div className="set-row-right">
                    <span className="set-value-text">{workspaceName || "Corely Enterprise"}</span>
                    <ChevronRight size={16} color="#a1a1aa" />
                  </div>
                </div>

                <div className="set-row">
                  <div className="set-row-left">
                    <div className="set-row-icon-wrap">
                      <Palette size={18} />
                    </div>
                    <div>
                      <div className="set-row-title">Theme</div>
                      <div className="set-row-desc">Choose your preferred appearance.</div>
                    </div>
                  </div>
                  <div className="set-row-right">
                    <div className="set-theme-picker">
                      <div
                        className={`set-theme-btn ${theme === "light" ? "active" : ""}`}
                        onClick={() => handleThemeChange("light")}
                      >
                        <Sun size={14} className="set-theme-icon" /> Light
                      </div>
                      <div
                        className={`set-theme-btn ${theme === "dark" ? "active" : ""}`}
                        onClick={() => handleThemeChange("dark")}
                      >
                        <Moon size={14} className="set-theme-icon" /> Dark
                      </div>
                    </div>
                  </div>
                </div>

                <div className="set-row">
                  <div className="set-row-left">
                    <div className="set-row-icon-wrap">
                      <AlignJustify size={18} />
                    </div>
                    <div>
                      <div className="set-row-title">Enable Compact Mode</div>
                      <div className="set-row-desc">Display more content in less space.</div>
                    </div>
                  </div>
                  <div className="set-row-right" style={{ paddingRight: 20 }}>
                    <div
                      className={`set-toggle ${compactMode ? "active" : ""}`}
                      onClick={handleToggleCompactMode}
                    >
                      <div className="set-toggle-knob" />
                    </div>
                  </div>
                </div>

                <div className="set-row">
                  <div className="set-row-left">
                    <div className="set-row-icon-wrap">
                      <Lightbulb size={18} />
                    </div>
                    <div>
                      <div className="set-row-title">Show Onboarding Tips</div>
                      <div className="set-row-desc">Show helpful tips to get the most out of Corely.</div>
                    </div>
                  </div>
                  <div className="set-row-right" style={{ paddingRight: 20 }}>
                    <div
                      className={`set-toggle ${onboardingTips ? "active" : ""}`}
                      onClick={handleToggleOnboardingTips}
                    >
                      <div className="set-toggle-knob" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "Workspace" && (
          <div className="set-section">
            <div className="set-section-title">Workspace Configuration</div>
            <div className="set-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label className="set-row-title" style={{ display: 'block', marginBottom: 8 }}>Workspace Name</label>
                <input 
                  type="text" 
                  value={workspaceName} 
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e4e4e7', outline: 'none', background: 'transparent' }}
                />
              </div>
              <div>
                <label className="set-row-title" style={{ display: 'block', marginBottom: 8 }}>Workspace Slug</label>
                <input 
                  type="text" 
                  value={workspaceSlug} 
                  onChange={(e) => setWorkspaceSlug(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e4e4e7', outline: 'none', background: 'transparent' }}
                />
              </div>
              <button 
                className="btn-primary" 
                onClick={handleWorkspaceSave}
                disabled={saving}
                style={{ alignSelf: 'flex-start' }}
              >
                {saving ? 'Saving...' : 'Save Workspace'}
              </button>
            </div>
          </div>
        )}

        {activeTab === "AI & Intelligence" && (
          <div className="set-section">
            <div className="set-section-title">AI Settings</div>
            <div className="set-card">
               <div className="set-row">
                  <div className="set-row-left">
                    <div className="set-row-icon-wrap">
                      <SettingsIcon size={18} />
                    </div>
                    <div>
                      <div className="set-row-title">Default LLM Model</div>
                      <div className="set-row-desc">Select the default AI model for queries.</div>
                    </div>
                  </div>
                  <div className="set-row-right">
                    <div className="set-dropdown" style={{ minWidth: 140 }}>
                      <select 
                        value={defaultLlm}
                        onChange={(e) => handleLlmChange(e.target.value)}
                        style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', color: 'inherit', cursor: 'pointer', appearance: 'none' }}
                      >
                        <option value="gpt-4o">GPT-4o</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        <option value="claude-3-opus">Claude 3 Opus</option>
                        <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                      </select>
                      <ChevronDown size={14} color="#71717a" style={{ position: 'absolute', right: 12, pointerEvents: 'none' }} />
                    </div>
                  </div>
                </div>
            </div>
          </div>
        )}

        {activeTab === "Security" && (
          <div className="set-section">
            <div className="set-section-title">Security Settings</div>
            
            <div className="set-card" style={{ marginBottom: 24 }}>
              <div className="set-row">
                <div className="set-row-left">
                  <div className="set-row-icon-wrap">
                    <Shield size={18} />
                  </div>
                  <div>
                    <div className="set-row-title">Two-Factor Authentication</div>
                    <div className="set-row-desc">Require 2FA for all workspace members.</div>
                  </div>
                </div>
                <div className="set-row-right" style={{ paddingRight: 20 }}>
                  <div className={`set-toggle ${twoFactorEnabled ? 'active' : ''}`} onClick={handleToggleTwoFactor}>
                    <div className="set-toggle-knob" />
                  </div>
                </div>
              </div>
              <div className="set-row">
                <div className="set-row-left">
                  <div className="set-row-icon-wrap">
                    <Key size={18} />
                  </div>
                  <div>
                    <div className="set-row-title">Single Sign-On (SSO)</div>
                    <div className="set-row-desc">Configure SAML or OIDC provider.</div>
                  </div>
                </div>
                <div className="set-row-right">
                  <button className="set-btn-outline" style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e4e4e7', background: 'transparent', cursor: 'pointer' }} onClick={() => setShowSsoModal(true)}>Configure</button>
                </div>
              </div>
            </div>

            <div className="set-section-title">Change Password</div>
            <div className="set-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label className="set-row-title" style={{ display: 'block', marginBottom: 8 }}>Current Password</label>
                <input 
                  type="password" 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e4e4e7', outline: 'none', background: 'transparent' }}
                />
              </div>
              <div>
                <label className="set-row-title" style={{ display: 'block', marginBottom: 8 }}>New Password</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e4e4e7', outline: 'none', background: 'transparent' }}
                />
              </div>
              {passMessage && <div style={{ fontSize: 13, color: passMessage.includes('Success') ? '#16a34a' : '#ef4444' }}>{passMessage}</div>}
              <button 
                className="btn-primary" 
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
                  } catch (err) {
                    console.error(err);
                    setPassMessage("An error occurred.");
                  }
                }}
                disabled={saving}
                style={{ alignSelf: 'flex-start' }}
              >
                Update Password
              </button>
            </div>
          </div>
        )}

        {activeTab === "Notifications" && (
          <div className="set-section">
            <div className="set-section-title">Notification Preferences</div>
            <div className="set-card">
               <div className="set-row">
                <div className="set-row-left">
                  <div className="set-row-icon-wrap">
                    <Mail size={18} />
                  </div>
                  <div>
                    <div className="set-row-title">Email Notifications</div>
                    <div className="set-row-desc">Receive updates via email.</div>
                  </div>
                </div>
                <div className="set-row-right" style={{ paddingRight: 20 }}>
                  <div className={`set-toggle ${emailNotifications ? 'active' : ''}`} onClick={handleToggleEmail}>
                    <div className="set-toggle-knob" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Advanced" && (
          <div className="set-section">
            <div className="set-section-title" style={{ color: '#ef4444' }}>Danger Zone</div>
            <div className="set-card" style={{ border: '1px solid #fecaca' }}>
               <div className="set-row" style={{ borderBottom: 'none' }}>
                <div className="set-row-left">
                  <div className="set-row-icon-wrap" style={{ background: '#fee2e2', color: '#ef4444' }}>
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <div className="set-row-title" style={{ color: '#ef4444' }}>Delete Workspace</div>
                    <div className="set-row-desc">Permanently delete this workspace and all its data.</div>
                  </div>
                </div>
                <div className="set-row-right">
                  <button onClick={() => setShowDeleteModal(true)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #ef4444', color: '#ef4444', background: 'transparent', cursor: 'pointer', fontWeight: 500 }}>
                    Delete Workspace
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Members" && (
          <div className="set-section">
            <div className="set-section-title">Workspace Members</div>
            <div className="set-card" style={{ padding: 24, textAlign: 'center', color: '#71717a' }}>
              <div>Manage who has access to your workspace.</div>
              <button className="set-btn-outline" style={{ marginTop: 20, padding: '8px 16px', borderRadius: 6, border: '1px solid #e4e4e7', background: 'transparent', cursor: 'pointer' }} onClick={() => window.location.href = '/dashboard/teams'}>
                Go to Teams Dashboard
              </button>
            </div>
          </div>
        )}

        {activeTab === "API Keys" && (
          <div className="set-section">
            <div className="set-section-title">API Keys</div>
            <div className="set-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: '#71717a' }}>Manage your programmatic access to the Corely API.</div>
                <button className="btn-primary">Generate New Key</button>
              </div>
              <div style={{ borderTop: '1px solid #e4e4e7', paddingTop: 20, textAlign: 'center', color: '#a1a1aa', fontSize: 13 }}>
                No API keys generated yet.
              </div>
            </div>
          </div>
        )}

        {activeTab === "Audit Logs" && (
          <div className="set-section">
            <div className="set-section-title">Audit Logs</div>
            <div className="set-card" style={{ padding: 24 }}>
              <div style={{ fontSize: 13, color: '#71717a', marginBottom: 20 }}>View recent security and administrative events.</div>
              <div className="table-responsive-wrapper">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e4e4e7', textAlign: 'left', color: '#71717a' }}>
                      <th style={{ padding: '12px 8px' }}>Action</th>
                      <th style={{ padding: '12px 8px' }}>Actor</th>
                      <th style={{ padding: '12px 8px' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '12px 8px' }} colSpan={3} align="center" className="text-gray-400">No logs available.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Billing" && (
          <div className="set-section">
            <div className="set-section-title">Billing & Subscription</div>
            <div className="set-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#111111', marginBottom: 4 }} className="set-title">Current Plan: Free</div>
                  <div style={{ fontSize: 13, color: '#71717a' }}>You are on the free tier. Upgrade to unlock more features.</div>
                </div>
                <button className="btn-primary">Upgrade to Pro</button>
              </div>
              <div style={{ borderTop: '1px solid #e4e4e7', paddingTop: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#111111' }} className="set-title">Payment Methods</div>
                <div style={{ fontSize: 13, color: '#71717a' }}>No payment methods added.</div>
              </div>
            </div>
          </div>
        )}

        {/* Fallback for Data & Sources */}
        {(activeTab === "Data & Sources") && (
          <div className="set-section">
            <div className="set-section-title">{activeTab}</div>
            <div className="set-card" style={{ padding: 40, textAlign: 'center', color: '#71717a' }}>
              <div style={{ marginBottom: 12 }}>
                <Database size={32} style={{ margin: '0 auto' }}/>
              </div>
              <div>Manage your {activeTab.toLowerCase()} settings here.</div>
              <button className="set-btn-outline" style={{ marginTop: 20, padding: '8px 16px', borderRadius: 6, border: '1px solid #e4e4e7', background: 'transparent', cursor: 'pointer' }} onClick={() => window.location.href = '/dashboard/sources'}>
                Go to {activeTab} Dashboard
              </button>
            </div>
          </div>
        )}

      </motion.div>

      {showSsoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="set-card" style={{ padding: 24, width: 400, maxWidth: '90%' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Configure SSO</h3>
            <p style={{ fontSize: 13, color: '#71717a', marginBottom: 20 }}>Enter your Identity Provider (IdP) details below.</p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>SAML Provider URL</label>
              <input type="text" value={ssoProviderUrl} onChange={e => setSsoProviderUrl(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e4e4e7', outline: 'none', background: 'transparent' }} placeholder="https://idp.example.com/saml2" />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Email Domain</label>
              <input type="text" value={ssoDomain} onChange={e => setSsoDomain(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e4e4e7', outline: 'none', background: 'transparent' }} placeholder="acme.com" />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="set-btn-outline" onClick={() => setShowSsoModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={() => {
                alert("SSO configuration saved (Mocked)");
                setShowSsoModal(false);
              }}>Save Configuration</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="set-card" style={{ padding: 24, width: 400, maxWidth: '90%', border: '1px solid #ef4444' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#ef4444' }}>Delete Workspace?</h3>
            <p style={{ fontSize: 13, color: '#71717a', marginBottom: 20 }}>This action cannot be undone. All data will be permanently lost.</p>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Type &quot;{workspaceName}&quot; to confirm</label>
              <input type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e4e4e7', outline: 'none', background: 'transparent' }} />
              {deleteError && <div style={{ fontSize: 13, color: '#ef4444', marginTop: 8 }}>{deleteError}</div>}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="set-btn-outline" onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); setDeleteError(""); }}>Cancel</button>
              <button className="btn-primary" style={{ background: '#ef4444' }} onClick={async () => {
                if (deleteConfirmText !== workspaceName) {
                  setDeleteError("Confirmation text does not match.");
                  return;
                }
                alert("Workspace deletion simulated. Redirecting...");
                window.location.href = "/";
              }}>Confirm Deletion</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
