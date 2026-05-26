"use client";

import { motion } from "framer-motion";
import {
  Building2,
  Globe,
  Clock,
  Calendar,
  Palette,
  LayoutGrid,
  AlignJustify,
  Lightbulb,
  Monitor,
  List,
  ChevronRight,
  ChevronDown,
  Sun,
  Moon,
} from "lucide-react";
import { useState } from "react";

export default function SettingsMain() {
  const [theme, setTheme] = useState("light");
  const [compactMode, setCompactMode] = useState(false);
  const [onboardingTips, setOnboardingTips] = useState(true);

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
        <div className="set-tab active">General</div>
        <div className="set-tab">Workspace</div>
        <div className="set-tab">AI & Intelligence</div>
        <div className="set-tab">Data & Sources</div>
        <div className="set-tab">Security</div>
        <div className="set-tab">Notifications</div>
        <div className="set-tab">Billing</div>
        <div className="set-tab">Advanced</div>
      </motion.div>

      {/* General Settings */}
      <motion.div
        className="set-section"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
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
              <span className="set-value-text">Corely Enterprise</span>
              <ChevronRight size={16} color="#a1a1aa" />
            </div>
          </div>

          <div className="set-row">
            <div className="set-row-left">
              <div className="set-row-icon-wrap">
                <Globe size={18} />
              </div>
              <div>
                <div className="set-row-title">Language & Region</div>
                <div className="set-row-desc">Set your language preference and regional settings.</div>
              </div>
            </div>
            <div className="set-row-right">
              <div className="set-dropdown">
                English (US) <ChevronDown size={14} color="#71717a" />
              </div>
              <ChevronRight size={16} color="#a1a1aa" />
            </div>
          </div>

          <div className="set-row">
            <div className="set-row-left">
              <div className="set-row-icon-wrap">
                <Clock size={18} />
              </div>
              <div>
                <div className="set-row-title">Default Time Zone</div>
                <div className="set-row-desc">Set the default time zone for your workspace.</div>
              </div>
            </div>
            <div className="set-row-right">
              <div className="set-dropdown" style={{ minWidth: 180 }}>
                (GMT+05:30) Asia/Kolkata <ChevronDown size={14} color="#71717a" />
              </div>
              <ChevronRight size={16} color="#a1a1aa" />
            </div>
          </div>

          <div className="set-row">
            <div className="set-row-left">
              <div className="set-row-icon-wrap">
                <Calendar size={18} />
              </div>
              <div>
                <div className="set-row-title">Date & Time Format</div>
                <div className="set-row-desc">Configure how dates and times are displayed.</div>
              </div>
            </div>
            <div className="set-row-right">
              <div className="set-dropdown" style={{ minWidth: 180 }}>
                May 12, 2025, 9:41 AM <ChevronDown size={14} color="#71717a" />
              </div>
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
                  onClick={() => setTheme("light")}
                >
                  <Sun size={14} className="set-theme-icon" /> Light
                </div>
                <div
                  className={`set-theme-btn ${theme === "dark" ? "active" : ""}`}
                  onClick={() => setTheme("dark")}
                >
                  <Moon size={14} className="set-theme-icon" /> Dark
                </div>
              </div>
              <ChevronRight size={16} color="#a1a1aa" />
            </div>
          </div>

          <div className="set-row">
            <div className="set-row-left">
              <div className="set-row-icon-wrap">
                <LayoutGrid size={18} />
              </div>
              <div>
                <div className="set-row-title">Default Start Page</div>
                <div className="set-row-desc">Choose the default page when you log in to Corely.</div>
              </div>
            </div>
            <div className="set-row-right">
              <div className="set-dropdown" style={{ minWidth: 140 }}>
                Home <ChevronDown size={14} color="#71717a" />
              </div>
              <ChevronRight size={16} color="#a1a1aa" />
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
                onClick={() => setCompactMode(!compactMode)}
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
                <div className="set-row-desc">Show helpful tips and suggestions to get the most out of Corely.</div>
              </div>
            </div>
            <div className="set-row-right" style={{ paddingRight: 20 }}>
              <div
                className={`set-toggle ${onboardingTips ? "active" : ""}`}
                onClick={() => setOnboardingTips(!onboardingTips)}
              >
                <div className="set-toggle-knob" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Personal Preferences */}
      <motion.div
        className="set-section"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div className="set-section-title">Personal Preferences</div>
        <div className="set-card">
          <div className="set-row">
            <div className="set-row-left">
              <div className="set-row-icon-wrap">
                <Monitor size={18} />
              </div>
              <div>
                <div className="set-row-title">Default View</div>
                <div className="set-row-desc">Choose how data is displayed across Corely.</div>
              </div>
            </div>
            <div className="set-row-right">
              <div className="set-dropdown" style={{ minWidth: 140 }}>
                Comfortable <ChevronDown size={14} color="#71717a" />
              </div>
              <ChevronRight size={16} color="#a1a1aa" />
            </div>
          </div>

          <div className="set-row">
            <div className="set-row-left">
              <div className="set-row-icon-wrap">
                <List size={18} />
              </div>
              <div>
                <div className="set-row-title">Items Per Page</div>
                <div className="set-row-desc">Set the default number of items per page in tables.</div>
              </div>
            </div>
            <div className="set-row-right">
              <div className="set-dropdown" style={{ minWidth: 140 }}>
                25 <ChevronDown size={14} color="#71717a" />
              </div>
              <ChevronRight size={16} color="#a1a1aa" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
