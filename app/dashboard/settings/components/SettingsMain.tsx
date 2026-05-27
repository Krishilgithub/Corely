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
  CreditCard,
  Settings as SettingsIcon,
  AlertTriangle,
  Mail
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

export default function SettingsMain() {
  const [activeTab, setActiveTab] = useState("General");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings State
  const [theme, setTheme] = useState("light");
  const [compactMode, setCompactMode] = useState(false);
  const [onboardingTips, setOnboardingTips] = useState(true);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("");

  const tabs = [
    "General",
    "Workspace",
    "AI & Intelligence",
    "Data & Sources",
    "Security",
    "Notifications",
    "Billing",
    "Advanced",
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.preferences) {
        setTheme(data.preferences.theme || "light");
        setCompactMode(data.preferences.compactMode || false);
        setOnboardingTips(data.preferences.onboardingTips ?? true);
      }
      if (data.workspace) {
        setWorkspaceName(data.workspace.name || "");
        setWorkspaceSlug(data.workspace.slug || "");
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

  if (loading) {
    return <div style={{ flex: 1, minWidth: 0, padding: 20 }}>Loading settings...</div>;
  }

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Header */}
      <motion.div
        className="set-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="set-title">Settings</h1>
        <p className="set-subtitle">Manage your workspace, preferences, and configurations.</p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        className="set-tabs-wrap"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {tabs.map((tab) => (
          <div
            key={tab}
            className={`set-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>
        ))}
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
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
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e4e4e7', outline: 'none' }}
                />
              </div>
              <div>
                <label className="set-row-title" style={{ display: 'block', marginBottom: 8 }}>Workspace Slug</label>
                <input 
                  type="text" 
                  value={workspaceSlug} 
                  onChange={(e) => setWorkspaceSlug(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e4e4e7', outline: 'none' }}
                />
              </div>
              <button 
                className="set-btn-primary" 
                onClick={handleWorkspaceSave}
                disabled={saving}
                style={{ alignSelf: 'flex-start', padding: '10px 20px', background: '#09090b', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer' }}
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
                      GPT-4o <ChevronDown size={14} color="#71717a" />
                    </div>
                  </div>
                </div>
            </div>
          </div>
        )}

        {activeTab === "Security" && (
          <div className="set-section">
            <div className="set-section-title">Security Settings</div>
            <div className="set-card">
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
                  <div className="set-toggle active"><div className="set-toggle-knob" /></div>
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
                  <button className="set-btn-outline" style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e4e4e7', background: 'transparent', cursor: 'pointer' }}>Configure</button>
                </div>
              </div>
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
                  <div className="set-toggle active"><div className="set-toggle-knob" /></div>
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
                  <button style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #ef4444', color: '#ef4444', background: 'transparent', cursor: 'pointer', fontWeight: 500 }}>
                    Delete Workspace
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fallback for Data & Sources, Billing */}
        {(activeTab === "Data & Sources" || activeTab === "Billing") && (
          <div className="set-section">
            <div className="set-section-title">{activeTab}</div>
            <div className="set-card" style={{ padding: 40, textAlign: 'center', color: '#71717a' }}>
              <div style={{ marginBottom: 12 }}>
                {activeTab === "Data & Sources" ? <Database size={32} style={{ margin: '0 auto' }}/> : <CreditCard size={32} style={{ margin: '0 auto' }} />}
              </div>
              <div>Manage your {activeTab.toLowerCase()} settings here.</div>
              <button className="set-btn-outline" style={{ marginTop: 20, padding: '8px 16px', borderRadius: 6, border: '1px solid #e4e4e7', background: 'transparent', cursor: 'pointer' }}>
                Go to {activeTab} Dashboard
              </button>
            </div>
          </div>
        )}

      </motion.div>
    </div>
  );
}
