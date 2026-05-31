"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Shield, Camera, Globe, Clock, Palette, Bell, Key, LogOut, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { useTheme } from "../../../components/ThemeProvider";

export default function ProfilePage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
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

  return (
    <div style={{ flex: 1, minWidth: 0, padding: "40px", maxWidth: 1000, margin: "0 auto", width: "100%" }}>
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          style={{
            position: "fixed", top: 24, right: 24, zIndex: 9999, background: "var(--db-text)", color: "#ffffff",
            padding: "14px 20px", borderRadius: 12, display: "flex", alignItems: "center", gap: 10,
            fontSize: 13.5, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.25)"
          }}
        >
          <CheckCircle2 size={18} color="#4ade80" />
          Profile updated successfully
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--db-text)", margin: "0 0 8px", letterSpacing: "-0.02em" }}>Profile Settings</h1>
        <p style={{ fontSize: 14, color: "var(--db-text-muted)", margin: 0 }}>Manage your personal account settings and preferences.</p>
      </motion.div>

      <div style={{ display: "flex", gap: 40, marginTop: 40, alignItems: "flex-start" }}>
        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ width: 240, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}
        >
          <button
            onClick={() => setActiveTab("general")}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
              background: activeTab === "general" ? "#fff3ee" : "transparent",
              color: activeTab === "general" ? "#ff6b00" : "#52525b",
              borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600,
              cursor: "pointer", transition: "all 0.15s", textAlign: "left"
            }}
          >
            <User size={16} /> General
          </button>
          <button
            onClick={() => setActiveTab("security")}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
              background: activeTab === "security" ? "#fff3ee" : "transparent",
              color: activeTab === "security" ? "#ff6b00" : "#52525b",
              borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600,
              cursor: "pointer", transition: "all 0.15s", textAlign: "left"
            }}
          >
            <Shield size={16} /> Security
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
              background: activeTab === "notifications" ? "#fff3ee" : "transparent",
              color: activeTab === "notifications" ? "#ff6b00" : "#52525b",
              borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600,
              cursor: "pointer", transition: "all 0.15s", textAlign: "left"
            }}
          >
            <Bell size={16} /> Notifications
          </button>
          
          <div style={{ height: 1, background: "var(--db-border)", margin: "16px 0" }} />
          
          <button
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
              background: "transparent", color: "#ef4444",
              borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600,
              cursor: "pointer", transition: "all 0.15s", textAlign: "left"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#fef2f2"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <LogOut size={16} /> Sign out
          </button>
        </motion.div>

        {/* Content Area */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ flex: 1, minWidth: 0, background: "var(--db-panel)", border: "1px solid #e4e4e7", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.03)", padding: 32 }}
        >
          {activeTab === "general" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <div style={{ position: "relative" }}>
                  <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #ff6b00, #ff9240)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "#ffffff", boxShadow: "0 8px 24px rgba(255, 107, 0, 0.2)" }}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <button style={{ position: "absolute", bottom: -4, right: -4, width: 32, height: 32, borderRadius: "50%", background: "var(--db-panel)", border: "1px solid #e4e4e7", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", color: "#52525b" }}>
                    <Camera size={14} />
                  </button>
                </div>
                <div>
                  <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: "var(--db-text)" }}>Profile Picture</h3>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--db-text-muted)", maxWidth: 300 }}>Upload a high-res image. JPG, GIF, or PNG. Max size of 5MB.</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#3f3f46" }}>Full Name</label>
                  <input type="text" defaultValue={user?.name || ""} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 14, outline: "none", transition: "border-color 0.2s" }} onFocus={(e) => e.target.style.borderColor = "#ff6b00"} onBlur={(e) => e.target.style.borderColor = "var(--db-border)"} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#3f3f46" }}>Email Address</label>
                  <div style={{ position: "relative" }}>
                    <input type="email" defaultValue={user?.email || ""} disabled style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 14, outline: "none", background: "#f4f4f5", color: "var(--db-text-muted)" }} />
                    <Mail size={16} color="#a1a1aa" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#3f3f46" }}>Role / Title</label>
                  <input type="text" defaultValue="Software Engineer" style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 14, outline: "none", transition: "border-color 0.2s" }} onFocus={(e) => e.target.style.borderColor = "#ff6b00"} onBlur={(e) => e.target.style.borderColor = "var(--db-border)"} />
                </div>
              </div>

              <div style={{ height: 1, background: "var(--db-border)" }} />

              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--db-text)" }}>Preferences</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#3f3f46" }}>Language</label>
                  <div style={{ position: "relative" }}>
                    <select style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 14, outline: "none", appearance: "none", cursor: "pointer", background: "var(--db-panel)" }}>
                      <option>English (US)</option>
                      <option>French (FR)</option>
                      <option>Spanish (ES)</option>
                    </select>
                    <Globe size={16} color="#a1a1aa" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#3f3f46" }}>Timezone</label>
                  <div style={{ position: "relative" }}>
                    <select style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 14, outline: "none", appearance: "none", cursor: "pointer", background: "var(--db-panel)" }}>
                      <option>Pacific Time (PT)</option>
                      <option>Eastern Time (ET)</option>
                      <option>Coordinated Universal Time (UTC)</option>
                    </select>
                    <Clock size={16} color="#a1a1aa" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#3f3f46" }}>Appearance</label>
                  <div style={{ position: "relative" }}>
                    <select 
                      value={theme}
                      onChange={(e) => setTheme(e.target.value as "light" | "dark" | "system")}
                      style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: 8, border: "1px solid var(--db-border)", fontSize: 14, outline: "none", appearance: "none", cursor: "pointer", background: "var(--db-panel)", color: "var(--db-text)" }}
                    >
                      <option value="light">Light Mode</option>
                      <option value="dark">Dark Mode</option>
                      <option value="system">System Default</option>
                    </select>
                    <Palette size={16} color="#a1a1aa" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    background: "var(--db-text)", color: "#ffffff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: isSaving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, opacity: isSaving ? 0.7 : 1
                  }}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              <div>
                <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "var(--db-text)" }}>Change Password</h3>
                <p style={{ margin: "0 0 24px", fontSize: 13, color: "var(--db-text-muted)" }}>Ensure your account is using a long, random password to stay secure.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 400 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#3f3f46" }}>Current Password</label>
                    <input type="password" style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 14, outline: "none", transition: "border-color 0.2s" }} onFocus={(e) => e.target.style.borderColor = "#ff6b00"} onBlur={(e) => e.target.style.borderColor = "var(--db-border)"} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#3f3f46" }}>New Password</label>
                    <input type="password" style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 14, outline: "none", transition: "border-color 0.2s" }} onFocus={(e) => e.target.style.borderColor = "#ff6b00"} onBlur={(e) => e.target.style.borderColor = "var(--db-border)"} />
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{
                      background: "var(--db-text)", color: "#ffffff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: isSaving ? "not-allowed" : "pointer", marginTop: 8, width: "fit-content", opacity: isSaving ? 0.7 : 1
                    }}
                  >
                    {isSaving ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </div>

              <div style={{ height: 1, background: "var(--db-border)" }} />

              <div>
                <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "var(--db-text)", display: "flex", alignItems: "center", gap: 8 }}>Two-Factor Authentication <span style={{ padding: "2px 8px", borderRadius: 100, background: "#fefce8", color: "#eab308", fontSize: 11, fontWeight: 700 }}>Recommended</span></h3>
                <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--db-text-muted)", maxWidth: 500 }}>Add an extra layer of security to your account by requiring more than just a password to sign in.</p>
                <button style={{ background: "var(--db-panel)", border: "1px solid #e4e4e7", color: "var(--db-text)", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Key size={16} /> Enable 2FA
                </button>
              </div>

              <div style={{ height: 1, background: "var(--db-border)" }} />

              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 20 }}>
                <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#dc2626", display: "flex", alignItems: "center", gap: 8 }}>
                  <AlertTriangle size={18} /> Danger Zone
                </h3>
                <p style={{ margin: "0 0 20px", fontSize: 13, color: "#991b1b" }}>Once you delete your account, there is no going back. Please be certain.</p>
                <button style={{ background: "#dc2626", color: "#ffffff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  Delete Account
                </button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "var(--db-text)" }}>Email Notifications</h3>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--db-text-muted)" }}>Choose what Corely updates you receive via email.</p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { title: "Weekly Digest", desc: "A summary of knowledge discovered in your workspace.", checked: true },
                  { title: "New Feature Announcements", desc: "Updates about new Corely features and improvements.", checked: true },
                  { title: "Security Alerts", desc: "Notifications about unusual activity or new sign-ins.", checked: true, disabled: true },
                  { title: "Team Activity", desc: "When teammates join your workspace or mention you.", checked: false }
                ].map((item, i) => (
                  <label key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: item.disabled ? "not-allowed" : "pointer", opacity: item.disabled ? 0.6 : 1 }}>
                    <input type="checkbox" defaultChecked={item.checked} disabled={item.disabled} style={{ marginTop: 4, width: 16, height: 16, accentColor: "#ff6b00" }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--db-text)" }}>{item.title}</div>
                      <div style={{ fontSize: 13, color: "var(--db-text-muted)", marginTop: 2 }}>{item.desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    background: "var(--db-text)", color: "#ffffff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: isSaving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, opacity: isSaving ? 0.7 : 1
                  }}
                >
                  {isSaving ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
