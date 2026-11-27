"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { User, Mail, Shield, Globe, Clock, Palette, Bell, Key, LogOut, AlertTriangle, Loader2 } from "lucide-react";
import { Select } from "@/components/ui/select";
import { useAuth } from "../../lib/auth-context";
import { useTheme } from "../../../components/ThemeProvider";

// Layout and form styles come from app/dashboard/settings/settings-layout.css,
// so this page matches the Settings page.

// Saved in users.preferences (JSON) through PATCH /api/settings.
type ProfilePrefs = {
  title?: string;
  language?: string;
  timezone?: string;
  notifications?: Partial<Record<NotificationKey, boolean>>;
};
type NotificationKey = "weeklyDigest" | "featureNews" | "teamActivity";

const NOTIFICATIONS: { key: NotificationKey | "securityAlerts"; title: string; desc: string }[] = [
  { key: "weeklyDigest", title: "Weekly Digest", desc: "A summary of knowledge discovered in your workspace." },
  { key: "featureNews", title: "New Feature Announcements", desc: "Updates about new Corely features and improvements." },
  { key: "securityAlerts", title: "Security Alerts", desc: "Notifications about unusual activity or new sign-ins. Always on." },
  { key: "teamActivity", title: "Team Activity", desc: "When teammates join your workspace or mention you." },
];

async function patchSettings(body: Record<string, unknown>) {
  const res = await fetch("/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) throw new Error(data.error || "Could not save your changes");
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"general" | "security" | "notifications">("general");

  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("English (US)");
  const [timezone, setTimezone] = useState("Coordinated Universal Time (UTC)");
  const [notifications, setNotifications] = useState<Record<NotificationKey, boolean>>({ weeklyDigest: true, featureNews: true, teamActivity: false });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState<null | "general" | "password" | "notifications">(null);

  // Load the saved name and preferences from the server.
  useEffect(() => {
    let alive = true;
    fetch("/api/settings")
      .then(r => r.json())
      .then(d => {
        if (!alive || !d.success) return;
        const prefs = (d.data.preferences || {}) as ProfilePrefs;
        setName(d.data.name || "");
        setSavedName(d.data.name || "");
        setTitle(prefs.title || "");
        if (prefs.language) setLanguage(prefs.language);
        if (prefs.timezone) setTimezone(prefs.timezone);
        if (prefs.notifications) setNotifications(n => ({ ...n, ...prefs.notifications }));
      })
      .catch(() => toast.error("Could not load your profile"))
      .finally(() => alive && setLoaded(true));
    return () => { alive = false; };
  }, []);

  const saveGeneral = async () => {
    if (!name.trim()) { toast.error("Full name cannot be empty"); return; }
    setSaving("general");
    try {
      await patchSettings({ name: name.trim(), preferences: { title: title.trim(), language, timezone } });
      setSavedName(name.trim());
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your changes");
    } finally {
      setSaving(null);
    }
  };

  const savePassword = async () => {
    if (!currentPassword || !newPassword) { toast.error("Enter your current and new password"); return; }
    setSaving("password");
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Could not update your password");
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update your password");
    } finally {
      setSaving(null);
    }
  };

  const saveNotifications = async () => {
    setSaving("notifications");
    try {
      await patchSettings({ preferences: { notifications } });
      toast.success("Notification preferences saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your preferences");
    } finally {
      setSaving(null);
    }
  };

  const displayName = savedName || user?.name || "";
  const initial = displayName ? displayName.charAt(0).toUpperCase() : "U";

  return (
    <div className="settings-outer">
      <div className="settings-layout">
        {/* Identity header */}
        <div className="settings-sidebar-header profile-identity">
          <div className="profile-avatar">{initial}</div>
          <div className="profile-identity-text">
            <h1 className="type-title">{displayName || "Profile Settings"}</h1>
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
            type="button"
            onClick={logout}
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
                      <p className="settings-row-desc" style={{ maxWidth: 300 }}>Your initial is shown for now. Uploading a picture is not available yet.</p>
                    </div>
                  </div>
                  <div className="settings-row-control">
                    <div className="profile-avatar profile-avatar--sm">{initial}</div>
                  </div>
                </div>

                <div className="settings-row">
                  <div className="settings-row-left">
                    <div><label htmlFor="profile-name" className="settings-row-label">Full Name</label></div>
                  </div>
                  <div className="settings-row-control">
                    <input id="profile-name" type="text" value={name} onChange={e => setName(e.target.value)} disabled={!loaded} maxLength={100} className="ui-input settings-control-input" onFocus={(e) => e.target.style.borderColor = "var(--accent-border)"} onBlur={(e) => e.target.style.borderColor = "var(--hairline)"} />
                  </div>
                </div>
                <div className="settings-row">
                  <div className="settings-row-left">
                    <div>
                      <label className="settings-row-label">Email Address</label>
                      <p className="settings-row-desc">Your sign-in email cannot be changed here.</p>
                    </div>
                  </div>
                  <div className="settings-row-control">
                    <div className="settings-input-wrap settings-input-wrap--lead">
                      <input type="email" value={user?.email || ""} disabled readOnly className="ui-input" aria-label="Email address" />
                      <Mail size={16} className="settings-input-lead-icon" />
                    </div>
                  </div>
                </div>
                <div className="settings-row">
                  <div className="settings-row-left">
                    <div><label htmlFor="profile-title" className="settings-row-label">Role / Title</label></div>
                  </div>
                  <div className="settings-row-control">
                    <input id="profile-title" type="text" value={title} onChange={e => setTitle(e.target.value)} disabled={!loaded} maxLength={100} placeholder="e.g. Software Engineer" className="ui-input settings-control-input" onFocus={(e) => e.target.style.borderColor = "var(--accent-border)"} onBlur={(e) => e.target.style.borderColor = "var(--hairline)"} />
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
                      options={["India Standard Time (IST)", "Pacific Time (PT)", "Eastern Time (ET)", "Coordinated Universal Time (UTC)"].map((o) => ({ value: o, label: o }))}
                    />
                  </div>
                </div>
                <div className="settings-row">
                  <div className="settings-row-left">
                    <div>
                      <label className="settings-row-label">Appearance</label>
                      <p className="settings-row-desc">Applies straight away on this device.</p>
                    </div>
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
                  <button onClick={saveGeneral} disabled={!loaded || saving !== null} className="ui-btn ui-btn--primary">
                    {saving === "general" && <Loader2 className="animate-spin" />}
                    {saving === "general" ? "Saving..." : "Save Changes"}
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
                      <p className="type-caption">Use at least 8 characters. A long, random password is safest.</p>
                    </div>
                  </div>
                  <div className="settings-row">
                    <div className="settings-row-left">
                      <div><label htmlFor="current-password" className="settings-row-label">Current Password</label></div>
                    </div>
                    <div className="settings-row-control">
                      <input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="ui-input settings-control-input" onFocus={(e) => e.target.style.borderColor = "var(--accent-border)"} onBlur={(e) => e.target.style.borderColor = "var(--hairline)"} />
                    </div>
                  </div>
                  <div className="settings-row">
                    <div className="settings-row-left">
                      <div><label htmlFor="new-password" className="settings-row-label">New Password</label></div>
                    </div>
                    <div className="settings-row-control">
                      <input id="new-password" type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="ui-input settings-control-input" onFocus={(e) => e.target.style.borderColor = "var(--accent-border)"} onBlur={(e) => e.target.style.borderColor = "var(--hairline)"} />
                    </div>
                  </div>
                  <div className="settings-card-footer">
                    <button onClick={savePassword} disabled={saving !== null} className="ui-btn ui-btn--primary">
                      {saving === "password" && <Loader2 className="animate-spin" />}
                      {saving === "password" ? "Updating..." : "Update Password"}
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
                          <span className="ui-badge ui-badge--neutral">Coming soon</span>
                        </div>
                        <p className="settings-row-desc" style={{ maxWidth: 500 }}>Add an extra layer of security by requiring more than just a password to sign in. This is not available yet.</p>
                      </div>
                    </div>
                    <div className="settings-row-control">
                      <button className="ui-btn ui-btn--secondary" disabled title="Not available yet">
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
                      <p className="settings-text">Deleting your own account is not available in the app yet. Ask your workspace admin to remove your account.</p>
                    </div>
                    <div className="settings-row-control">
                      <button className="ui-btn ui-btn--destructive" disabled title="Not available yet">
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
                    <p className="type-caption">Choose which Corely emails you want. Corely saves your choices now; these emails are not being sent yet.</p>
                  </div>
                </div>

                {NOTIFICATIONS.map(item => {
                  const locked = item.key === "securityAlerts";
                  const checked = locked ? true : notifications[item.key as NotificationKey];
                  return (
                    <label key={item.key} className="settings-row" style={{ cursor: locked ? "not-allowed" : "pointer", opacity: locked ? 0.6 : 1 }}>
                      <div className="settings-row-left">
                        <div>
                          <div className="settings-row-label">{item.title}</div>
                          <div className="settings-row-desc">{item.desc}</div>
                        </div>
                      </div>
                      <div className="settings-row-control">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={locked || !loaded}
                          onChange={e => !locked && setNotifications(n => ({ ...n, [item.key]: e.target.checked }))}
                          className="settings-switch-input"
                        />
                      </div>
                    </label>
                  );
                })}

                <div className="settings-card-footer">
                  <button onClick={saveNotifications} disabled={!loaded || saving !== null} className="ui-btn ui-btn--primary">
                    {saving === "notifications" && <Loader2 className="animate-spin" />}
                    {saving === "notifications" ? "Saving..." : "Save Preferences"}
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
