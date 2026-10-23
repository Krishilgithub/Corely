"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Shield, Camera, Globe, Clock, Palette, Bell, Key, LogOut, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Select } from "@/components/ui/select";
import { useAuth } from "../../lib/auth-context";
import { useTheme } from "../../../components/ThemeProvider";

// Layout and form styles come from app/dashboard/settings/settings-layout.css,
// so this page matches the Settings page.
export default function ProfilePage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  // Language and timezone only live on this page for now. They are not saved yet.
  const [language, setLanguage] = useState("English (US)");
  const [timezone, setTimezone] = useState("Pacific Time (PT)");
  const [activeTab, setActiveTab] = useState<"general" | "security" | "notifications">("general");
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 800);
  };

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="settings-outer">
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="settings-toast"
          role="status"
        >
          <CheckCircle2 size={16} />
          Profile updated successfully
        </motion.div>
      )}

      <div className="settings-layout">
        {/* Identity header */}
        <div className="settings-sidebar-header profile-identity">
          <div className="profile-avatar">{initial}</div>
          <div className="profile-identity-text">
            <h1 className="type-title">{user?.name || "Profile Settings"}</h1>
            <p className="type-caption">{user?.email || "Manage your personal account settings and preferences."}</p>
          </div>
        </div>

        {/* Mini-nav */}
        <nav className="settings-nav-list" aria-label="Profile sections">
          <button
            onClick={() => setActiveTab("general")}
            className={`settings-nav-item ${activeTab === "general" ? "active" : ""}`}
          >
            <User size={16} className="settings-nav-icon" /> General
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`settings-nav-item ${activeTab === "security" ? "active" : ""}`}
          >
            <Shield size={16} className="settings-nav-icon" /> Security
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`settings-nav-item ${activeTab === "notifications" ? "active" : ""}`}
          >
            <Bell size={16} className="settings-nav-icon" /> Notifications
          </button>

          <div className="settings-nav-divider" />

          <button
            className="settings-nav-item settings-nav-item--danger"
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--error-soft)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <LogOut size={16} className="settings-nav-icon" /> Sign out
          </button>
        </nav>

        {/* Content Area */}
        <div className="settings-main-col">
          <div key={activeTab} className="settings-stack">
            {activeTab === "general" && (
              <div className="ui-card settings-card">
                <div className="ui-card-header">
                  <div className="settings-card-heading">
                    <p className="type-heading">Profile Settings</p>
                    <p className="type-caption">Manage your personal account settings and preferences.</p>
                  </div>
                </div>

                <div className="settings-row">
                  <div className="settings-row-left">
                    <div>
                      <h3 className="settings-row-label">Profile Picture</h3>
                      <p className="settings-row-desc" style={{ maxWidth: 300 }}>Upload a high-res image. JPG, GIF, or PNG. Max size of 5MB.</p>
                    </div>
                  </div>
                  <div className="settings-row-control">
                    <div className="profile-avatar-edit">
                      <div className="profile-avatar profile-avatar--sm">{initial}</div>
                      <button className="profile-avatar-btn" aria-label="Upload profile picture">
                        <Camera size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="settings-row">
                  <div className="settings-row-left">
                    <div><label className="settings-row-label">Full Name</label></div>
                  </div>
                  <div className="settings-row-control">
                    <input type="text" defaultValue={user?.name || ""} className="ui-input settings-control-input" onFocus={(e) => e.target.style.borderColor = "var(--accent-border)"} onBlur={(e) => e.target.style.borderColor = "var(--hairline)"} />
                  </div>
                </div>
                <div className="settings-row">
                  <div className="settings-row-left">
                    <div><label className="settings-row-label">Email Address</label></div>
                  </div>
                  <div className="settings-row-control">
                    <div className="settings-input-wrap settings-input-wrap--lead">
                      <input type="email" defaultValue={user?.email || ""} disabled className="ui-input" />
                      <Mail size={16} className="settings-input-lead-icon" />
                    </div>
                  </div>
                </div>
                <div className="settings-row">
                  <div className="settings-row-left">
                    <div><label className="settings-row-label">Role / Title</label></div>
                  </div>
                  <div className="settings-row-control">
                    <input type="text" defaultValue="Software Engineer" className="ui-input settings-control-input" onFocus={(e) => e.target.style.borderColor = "var(--accent-border)"} onBlur={(e) => e.target.style.borderColor = "var(--hairline)"} />
                  </div>
                </div>

                <div className="settings-card-subhead">
                  <h3 className="type-heading">Preferences</h3>
                </div>
                <div className="settings-row">
                  <div className="settings-row-left">
                    <div><label className="settings-row-label">Language</label></div>
                  </div>
                  <div className="settings-row-control">
                    <Select
                      className="settings-select settings-select--wide"
                      aria-label="Language"
                      leadingIcon={<Globe size={16} />}
                      value={language}
                      onChange={(v) => setLanguage(v)}
                      options={["English (US)", "French (FR)", "Spanish (ES)"].map((o) => ({ value: o, label: o }))}
                    />
                  </div>
                </div>
                <div className="settings-row">
                  <div className="settings-row-left">
                    <div><label className="settings-row-label">Timezone</label></div>
                  </div>
                  <div className="settings-row-control">
                    <Select
                      className="settings-select settings-select--wide"
                      aria-label="Timezone"
                      leadingIcon={<Clock size={16} />}
                      value={timezone}
                      onChange={(v) => setTimezone(v)}
                      options={["Pacific Time (PT)", "Eastern Time (ET)", "Coordinated Universal Time (UTC)"].map((o) => ({ value: o, label: o }))}
                    />
                  </div>
                </div>
                <div className="settings-row">
                  <div className="settings-row-left">
                    <div><label className="settings-row-label">Appearance</label></div>
                  </div>
                  <div className="settings-row-control">
                    <Select
                      className="settings-select settings-select--wide"
                      aria-label="Appearance"
                      leadingIcon={<Palette size={16} />}
                      value={theme}
                      onChange={(v) => setTheme(v as "light" | "dark" | "system")}
                      options={[
                        { value: "light", label: "Light Mode" },
                        { value: "dark", label: "Dark Mode" },
                        { value: "system", label: "System Default" },
                      ]}
                    />
                  </div>
                </div>

                <div className="settings-card-footer">
                  <button onClick={handleSave} disabled={isSaving} className="ui-btn ui-btn--primary">
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <>
                <div className="ui-card settings-card">
                  <div className="ui-card-header">
                    <div className="settings-card-heading">
                      <h3 className="type-heading">Change Password</h3>
                      <p className="type-caption">Ensure your account is using a long, random password to stay secure.</p>
                    </div>
                  </div>
                  <div className="settings-row">
                    <div className="settings-row-left">
                      <div><label className="settings-row-label">Current Password</label></div>
                    </div>
                    <div className="settings-row-control">
                      <input type="password" className="ui-input settings-control-input" onFocus={(e) => e.target.style.borderColor = "var(--accent-border)"} onBlur={(e) => e.target.style.borderColor = "var(--hairline)"} />
                    </div>
                  </div>
                  <div className="settings-row">
                    <div className="settings-row-left">
                      <div><label className="settings-row-label">New Password</label></div>
                    </div>
                    <div className="settings-row-control">
                      <input type="password" className="ui-input settings-control-input" onFocus={(e) => e.target.style.borderColor = "var(--accent-border)"} onBlur={(e) => e.target.style.borderColor = "var(--hairline)"} />
                    </div>
                  </div>
                  <div className="settings-card-footer">
                    <button onClick={handleSave} disabled={isSaving} className="ui-btn ui-btn--primary">
                      {isSaving ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </div>

                <div className="ui-card settings-card">
                  <div className="settings-row">
                    <div className="settings-row-left">
                      <div className="settings-row-icon"><Key size={16} /></div>
                      <div>
                        <div className="settings-card-title-row">
                          <h3 className="type-heading">Two-Factor Authentication</h3>
                          <span className="ui-badge ui-badge--accent">Recommended</span>
                        </div>
                        <p className="settings-row-desc" style={{ maxWidth: 500 }}>Add an extra layer of security to your account by requiring more than just a password to sign in.</p>
                      </div>
                    </div>
                    <div className="settings-row-control">
                      <button className="ui-btn ui-btn--secondary">
                        <Key size={16} /> Enable 2FA
                      </button>
                    </div>
                  </div>
                </div>

                <div className="ui-card settings-card settings-danger-card">
                  <div className="ui-card-header">
                    <div className="settings-card-title-row">
                      <div className="settings-row-icon settings-row-icon--danger"><AlertTriangle size={16} /></div>
                      <h3 className="type-heading settings-danger-title">Danger Zone</h3>
                    </div>
                  </div>
                  <div className="settings-row">
                    <div className="settings-row-left">
                      <p className="settings-text">Once you delete your account, there is no going back. Please be certain.</p>
                    </div>
                    <div className="settings-row-control">
                      <button className="ui-btn ui-btn--destructive">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === "notifications" && (
              <div className="ui-card settings-card">
                <div className="ui-card-header">
                  <div className="settings-card-heading">
                    <h3 className="type-heading">Email Notifications</h3>
                    <p className="type-caption">Choose what Corely updates you receive via email.</p>
                  </div>
                </div>

                {[
                  { title: "Weekly Digest", desc: "A summary of knowledge discovered in your workspace.", checked: true },
                  { title: "New Feature Announcements", desc: "Updates about new Corely features and improvements.", checked: true },
                  { title: "Security Alerts", desc: "Notifications about unusual activity or new sign-ins.", checked: true, disabled: true },
                  { title: "Team Activity", desc: "When teammates join your workspace or mention you.", checked: false }
                ].map((item, i) => (
                  <label key={i} className="settings-row" style={{ cursor: item.disabled ? "not-allowed" : "pointer", opacity: item.disabled ? 0.6 : 1 }}>
                    <div className="settings-row-left">
                      <div>
                        <div className="settings-row-label">{item.title}</div>
                        <div className="settings-row-desc">{item.desc}</div>
                      </div>
                    </div>
                    <div className="settings-row-control">
                      <input type="checkbox" defaultChecked={item.checked} disabled={item.disabled} className="settings-switch-input" />
                    </div>
                  </label>
                ))}

                <div className="settings-card-footer">
                  <button onClick={handleSave} disabled={isSaving} className="ui-btn ui-btn--primary">
                    {isSaving ? "Saving..." : "Save Preferences"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
