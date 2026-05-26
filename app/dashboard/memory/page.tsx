"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Sparkles,
  Clock,
  ShieldAlert,
  Search,
  Plus,
  SlidersHorizontal,
  ChevronDown,
  Trash2,
  FileText,
  MessageSquare,
  Zap,
  Users,
  CheckCircle2,
} from "lucide-react";
import "./memory.css";

// ── Types and Interfaces ────────────────────────────────────────────────────
interface TimelineItem {
  id: string;
  time: string;
  category: "decision" | "discussion" | "document" | "insight" | "knowledge";
  title: string;
  content: string;
  badges: string[];
  sourceName: string;
  avatarUrl: string;
  date: string;
}

interface SnapshotItem {
  id: string;
  title: string;
  date: string;
  isLatest?: boolean;
}

// ── Initial Timeline Data from Screenshot ────────────────────────────────────
const INITIAL_TIMELINE_ITEMS: TimelineItem[] = [
  {
    id: "1",
    time: "9:41 AM",
    category: "decision",
    title: "Decision Captured",
    content: "Approved Q2 marketing budget increase of 15% focusing on paid acquisition and brand.",
    badges: ["Marketing Strategy"],
    sourceName: "Notion",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    date: "Today • May 12, 2025",
  },
  {
    id: "2",
    time: "8:15 AM",
    category: "discussion",
    title: "Discussion Summary",
    content: "Product roadmap review meeting. Aligned on shipping AI Search in June.",
    badges: ["Product", "Roadmap"],
    sourceName: "Slack",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    date: "Today • May 12, 2025",
  },
  {
    id: "3",
    time: "7:02 AM",
    category: "document",
    title: "Document Added",
    content: "Q2 Sales Deck v3 uploaded and added to Sales Knowledge Set.",
    badges: ["Sales"],
    sourceName: "Google Drive",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    date: "Today • May 12, 2025",
  },
  {
    id: "4",
    time: "6:28 PM",
    category: "insight",
    title: "Insight Generated",
    content: "Customer churn risk increased by 18% among users on legacy pricing plans.",
    badges: ["Customer Success"],
    sourceName: "Corely AI",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    date: "Yesterday • May 11, 2025",
  },
  {
    id: "5",
    time: "3:45 PM",
    category: "knowledge",
    title: "Knowledge Update",
    content: "Updated organization chart: 3 new hires added to Engineering team.",
    badges: ["People"],
    sourceName: "HR System",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
    date: "Yesterday • May 11, 2025",
  },
];

// ── Initial Snapshot Data ────────────────────────────────────────────────────
const INITIAL_SNAPSHOTS: SnapshotItem[] = [
  { id: "s1", title: "Organization Snapshot", date: "May 12, 2025 • 8:00 AM", isLatest: true },
  { id: "s2", title: "Product Knowledge Base", date: "May 11, 2025 • 10:30 PM" },
  { id: "s3", title: "Q2 Business Context", date: "May 10, 2025 • 7:15 PM" },
];

export default function MemoryPage() {
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>(INITIAL_TIMELINE_ITEMS);
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>(INITIAL_SNAPSHOTS);
  const [activeTab, setActiveTab] = useState<string>("timeline");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // ── Form State for New Memory ──────────────────────────────────────────────
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<TimelineItem["category"]>("decision");
  const [newBadge, setNewBadge] = useState("");
  const [newSource, setNewSource] = useState("Notion");

  // ── Filters & Category Mapper ──────────────────────────────────────────────
  const getCategoryDetails = (category: TimelineItem["category"]) => {
    switch (category) {
      case "decision":
        return {
          icon: <CheckCircle2 size={14} />,
          iconBg: "#fff3ee",
          iconColor: "#ff6b00",
          iconBorder: "#ffd7c7",
          badgeBg: "#fff3ee",
          badgeColor: "#ff6b00",
        };
      case "discussion":
        return {
          icon: <MessageSquare size={14} />,
          iconBg: "#f5f3ff",
          iconColor: "#8b5cf6",
          iconBorder: "#ddd6fe",
          badgeBg: "#f5f3ff",
          badgeColor: "#8b5cf6",
        };
      case "document":
        return {
          icon: <FileText size={14} />,
          iconBg: "#eff6ff",
          iconColor: "#3b82f6",
          iconBorder: "#bfdbfe",
          badgeBg: "#eff6ff",
          badgeColor: "#3b82f6",
        };
      case "insight":
        return {
          icon: <Zap size={14} />,
          iconBg: "#fff3ee",
          iconColor: "#ff6b00",
          iconBorder: "#ffd7c7",
          badgeBg: "#fff3ee",
          badgeColor: "#ff6b00",
        };
      case "knowledge":
        return {
          icon: <Users size={14} />,
          iconBg: "#eff6ff",
          iconColor: "#3b82f6",
          iconBorder: "#bfdbfe",
          badgeBg: "#eff6ff",
          badgeColor: "#3b82f6",
        };
    }
  };

  const getSourceIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "notion":
        return <span style={{ fontWeight: 800, fontSize: 10, background: "#111", color: "#fff", width: 15, height: 15, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>N</span>;
      case "slack":
        return <span style={{ fontWeight: 800, fontSize: 10, background: "#4a154b", color: "#fff", width: 15, height: 15, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>S</span>;
      case "google drive":
        return <span style={{ fontWeight: 800, fontSize: 10, background: "#34a853", color: "#fff", width: 15, height: 15, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>▲</span>;
      case "corely ai":
        return <span style={{ fontWeight: 800, fontSize: 10, background: "#ff6b00", color: "#fff", width: 15, height: 15, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>C</span>;
      default:
        return <span style={{ fontWeight: 800, fontSize: 10, background: "#10b981", color: "#fff", width: 15, height: 15, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>H</span>;
    }
  };

  // ── Filtered Items Logic ───────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    return timelineItems.filter((item) => {
      // 1. Tab filter
      if (activeTab !== "timeline") {
        // Map tab plural name to item categories
        const tabCategoryMap: Record<string, string> = {
          decisions: "decision",
          discussions: "discussion",
          documents: "document",
          "knowledge sets": "knowledge",
          snapshots: "insight", // Insights fall under snapshots tab view for simplicity in MVP
        };
        if (item.category !== tabCategoryMap[activeTab]) return false;
      }

      // 2. Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(query) ||
          item.content.toLowerCase().includes(query) ||
          item.sourceName.toLowerCase().includes(query) ||
          item.badges.some((b) => b.toLowerCase().includes(query))
        );
      }

      return true;
    });
  }, [timelineItems, activeTab, searchQuery]);

  // Group filtered items by date
  const groupedItems = useMemo(() => {
    const groups: Record<string, TimelineItem[]> = {};
    for (const item of filteredItems) {
      if (!groups[item.date]) {
        groups[item.date] = [];
      }
      groups[item.date].push(item);
    }
    return groups;
  }, [filteredItems]);

  // ── Form Handlers ──────────────────────────────────────────────────────────
  const handleAddMemorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newItem: TimelineItem = {
      id: `mem-${Date.now()}`,
      time: timeStr,
      category: newCategory,
      title: newTitle.trim(),
      content: newContent.trim(),
      badges: newBadge.trim() ? [newBadge.trim()] : ["Custom"],
      sourceName: newSource,
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80", // Admin face
      date: "Today • May 12, 2025",
    };

    setTimelineItems((prev) => [newItem, ...prev]);
    
    // Reset Form
    setNewTitle("");
    setNewContent("");
    setNewBadge("");
    setNewCategory("decision");
    setNewSource("Notion");
    setShowAddModal(false);
  };

  const handleDeleteItem = (id: string) => {
    setTimelineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCreateSnapshot = () => {
    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateStr = new Date().toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    // Clear previous latest markers
    setSnapshots((prev) => [
      {
        id: `snap-${Date.now()}`,
        title: `${filteredItems[0]?.title || "Workspace"} Snapshot`,
        date: `${dateStr} • ${timeStr}`,
        isLatest: true,
      },
      ...prev.map((s) => ({ ...s, isLatest: false })),
    ]);
  };

  return (
    <main className="db-content">
      <div className="mem-container">
        
        {/* ── 1. Page Header ── */}
        <div className="mem-header-row">
          <div className="mem-header-left">
            <div className="mem-title-wrap">
              <div className="mem-title-icon">
                <Brain size={26} strokeWidth={2.5} />
              </div>
              <h1 className="mem-title">Memory</h1>
            </div>
            <p className="mem-subtitle">
              Corely&apos;s persistent memory of your organization&apos;s knowledge, decisions, and context.
            </p>
          </div>
          
          <div className="mem-header-actions">
            <div className="mem-search-bar">
              <Search size={14} style={{ color: "#a1a1aa", flexShrink: 0 }} />
              <input
                type="text"
                className="mem-search-input"
                placeholder="Search Memory"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="mem-add-btn" onClick={() => setShowAddModal(true)}>
              <Plus size={15} strokeWidth={2.5} />
              <span>Add to Memory</span>
            </button>
          </div>
        </div>

        {/* ── 2. Summary Stats Cards ── */}
        <div className="mem-stats-grid">
          {/* Card 1 */}
          <div className="mem-stat-card">
            <div className="mem-stat-icon-wrapper" style={{ background: "#fff3ee", color: "#ff6b00" }}>
              <Brain size={20} strokeWidth={2.5} />
            </div>
            <div className="mem-stat-info">
              <span className="mem-stat-value">2,48,392</span>
              <span className="mem-stat-label">Memory Items</span>
              <span className="mem-stat-trend" style={{ color: "#10b981" }}>
                ↑ 18% <span style={{ color: "#71717a", fontWeight: 500 }}>vs last month</span>
              </span>
            </div>
          </div>
          {/* Card 2 */}
          <div className="mem-stat-card">
            <div className="mem-stat-icon-wrapper" style={{ background: "#f5f3ff", color: "#a855f7" }}>
              <Sparkles size={20} strokeWidth={2.5} />
            </div>
            <div className="mem-stat-info">
              <span className="mem-stat-value">1,842</span>
              <span className="mem-stat-label">Decisions Captured</span>
              <span className="mem-stat-trend" style={{ color: "#10b981" }}>
                ↑ 23% <span style={{ color: "#71717a", fontWeight: 500 }}>vs last month</span>
              </span>
            </div>
          </div>
          {/* Card 3 */}
          <div className="mem-stat-card">
            <div className="mem-stat-icon-wrapper" style={{ background: "#eff6ff", color: "#3b82f6" }}>
              <Clock size={20} strokeWidth={2.5} />
            </div>
            <div className="mem-stat-info">
              <span className="mem-stat-value">94%</span>
              <span className="mem-stat-label">Context Retention</span>
              <span className="mem-stat-trend" style={{ color: "#10b981" }}>
                • <span style={{ color: "#10b981", fontWeight: 700 }}>Excellent</span>
              </span>
            </div>
          </div>
          {/* Card 4 */}
          <div className="mem-stat-card">
            <div className="mem-stat-icon-wrapper" style={{ background: "#ecfdf5", color: "#10b981" }}>
              <ShieldAlert size={20} strokeWidth={2.5} />
            </div>
            <div className="mem-stat-info">
              <span className="mem-stat-value">128</span>
              <span className="mem-stat-label">Active Knowledge Sets</span>
              <span className="mem-stat-trend" style={{ color: "#10b981" }}>
                ↑ 11% <span style={{ color: "#71717a", fontWeight: 500 }}>vs last month</span>
              </span>
            </div>
          </div>
        </div>

        {/* ── 3. Main Dashboard Grid ── */}
        <div className="mem-main-grid">
          
          {/* ── Left Column: Timeline and Tabs ── */}
          <div className="mem-left-column">
            
            {/* Tabs & Filters */}
            <div className="mem-tabs-bar">
              <div className="mem-tabs-list">
                {["timeline", "decisions", "discussions", "documents", "knowledge sets", "snapshots"].map((tab) => (
                  <button
                    key={tab}
                    className={`mem-tab-item ${activeTab === tab ? "active" : ""}`}
                    onClick={() => setActiveTab(tab)}
                    style={{ textTransform: "capitalize" }}
                  >
                    {tab}
                    {activeTab === tab && (
                      <motion.div layoutId="tab-line" className="mem-tab-active-line" />
                    )}
                  </button>
                ))}
              </div>
              
              <button className="mem-filter-btn">
                <SlidersHorizontal size={13} />
                <span>Filters</span>
              </button>
            </div>

            {/* Timeline Header Info */}
            <div className="mem-timeline-header">
              <h2 className="mem-timeline-title">Memory Timeline</h2>
              <p className="mem-timeline-sub">A chronological view of important moments and changes.</p>
            </div>

            {/* Timeline Items List */}
            <div className="mem-timeline-list">
              <div className="mem-timeline-line" />

              {Object.keys(groupedItems).length === 0 ? (
                <div style={{ padding: "48px", textAlign: "center", border: "1.5px dashed #e4e4e7", borderRadius: 12, marginLeft: 128, background: "#fafafa" }}>
                  <Brain size={32} style={{ color: "#a1a1aa", marginBottom: 12 }} />
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 4 }}>No memory entries found</h3>
                  <p style={{ fontSize: 13, color: "#71717a", margin: 0 }}>Try clearing your search filters or add a new entry.</p>
                </div>
              ) : (
                Object.keys(groupedItems).map((date) => (
                  <div key={date}>
                    <div className="mem-timeline-group-header">{date}</div>
                    
                    {groupedItems[date].map((item) => {
                      const cfg = getCategoryDetails(item.category);
                      return (
                        <motion.div
                          key={item.id}
                          className="mem-timeline-row"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                        >
                          <div className="mem-timeline-time">{item.time}</div>
                          
                          <div className="mem-timeline-node-container">
                            <div
                              className="mem-timeline-node"
                              style={{
                                borderColor: cfg.iconBorder,
                                background: cfg.iconBg,
                                color: cfg.iconColor,
                              }}
                            >
                              {cfg.icon}
                            </div>
                          </div>

                          <div className="mem-timeline-card">
                            <div className="mem-card-left">
                              <div className="mem-card-meta">
                                <span style={{ color: cfg.iconColor }}>{item.title}</span>
                              </div>
                              <p className="mem-card-content">{item.content}</p>
                              
                              <div className="mem-badge-list">
                                {item.badges.map((b) => (
                                  <span
                                    key={b}
                                    className="mem-badge"
                                    style={{
                                      background: cfg.badgeBg,
                                      color: cfg.badgeColor,
                                    }}
                                  >
                                    {b}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="mem-card-right">
                              <div className="mem-source-badge">
                                <div className="mem-source-icon-wrap">
                                  {getSourceIcon(item.sourceName)}
                                </div>
                                <span>{item.sourceName}</span>
                              </div>
                              
                              <img
                                src={item.avatarUrl}
                                className="mem-participant-avatar"
                                alt="User avatar"
                              />

                              <button
                                className="mem-card-action-btn"
                                onClick={() => handleDeleteItem(item.id)}
                                title="Delete entry"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ))
              )}

              {/* Load More Button */}
              {Object.keys(groupedItems).length > 0 && (
                <div className="mem-load-more-container">
                  <button className="mem-load-more-btn">
                    <span>Load more</span>
                    <ChevronDown size={13} />
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* ── Right Column: Sidebar Panels ── */}
          <div className="mem-right-column">
            
            {/* Panel 1: Memory Insights */}
            <div className="mem-sidebar-card">
              <div className="mem-sidebar-card-header">
                <span className="mem-sidebar-card-title">Memory Insights</span>
                <a href="#" className="mem-sidebar-view-all">View all</a>
              </div>

              <div className="mem-insights-banner">
                <div className="mem-insights-banner-header">
                  <Sparkles size={14} fill="#ff6b00" />
                  <span className="mem-insights-banner-title">Corely learns and remembers</span>
                </div>
                <p className="mem-insights-banner-desc">
                  I&apos;ve identified 28 new connections across your data this week.
                </p>
                <button className="mem-insights-btn" onClick={handleCreateSnapshot}>
                  See insights →
                </button>
              </div>
            </div>

            {/* Panel 2: Memory by Category */}
            <div className="mem-sidebar-card">
              <div className="mem-sidebar-card-header">
                <span className="mem-sidebar-card-title">Memory by Category</span>
                <a href="#" className="mem-sidebar-view-all">View all</a>
              </div>

              <div className="mem-category-list">
                {/* Decisions */}
                <div className="mem-category-item">
                  <div className="mem-category-row-top">
                    <div className="mem-category-name-wrapper">
                      <CheckCircle2 size={12} style={{ color: "#ff6b00" }} />
                      <span>Decisions</span>
                    </div>
                    <span className="mem-category-value">1,842</span>
                  </div>
                  <div className="mem-category-bar-bg">
                    <div className="mem-category-bar-fill" style={{ background: "#ff6b00", width: "45%" }} />
                  </div>
                </div>

                {/* Discussions */}
                <div className="mem-category-item">
                  <div className="mem-category-row-top">
                    <div className="mem-category-name-wrapper">
                      <MessageSquare size={12} style={{ color: "#8b5cf6" }} />
                      <span>Discussions</span>
                    </div>
                    <span className="mem-category-value">3,421</span>
                  </div>
                  <div className="mem-category-bar-bg">
                    <div className="mem-category-bar-fill" style={{ background: "#8b5cf6", width: "65%" }} />
                  </div>
                </div>

                {/* Documents */}
                <div className="mem-category-item">
                  <div className="mem-category-row-top">
                    <div className="mem-category-name-wrapper">
                      <FileText size={12} style={{ color: "#3b82f6" }} />
                      <span>Documents</span>
                    </div>
                    <span className="mem-category-value">12,842</span>
                  </div>
                  <div className="mem-category-bar-bg">
                    <div className="mem-category-bar-fill" style={{ background: "#3b82f6", width: "88%" }} />
                  </div>
                </div>

                {/* People */}
                <div className="mem-category-item">
                  <div className="mem-category-row-top">
                    <div className="mem-category-name-wrapper">
                      <Users size={12} style={{ color: "#10b981" }} />
                      <span>People</span>
                    </div>
                    <span className="mem-category-value">2,153</span>
                  </div>
                  <div className="mem-category-bar-bg">
                    <div className="mem-category-bar-fill" style={{ background: "#10b981", width: "55%" }} />
                  </div>
                </div>

                {/* Projects */}
                <div className="mem-category-item">
                  <div className="mem-category-row-top">
                    <div className="mem-category-name-wrapper">
                      <FileText size={12} style={{ color: "#f59e0b" }} />
                      <span>Projects</span>
                    </div>
                    <span className="mem-category-value">1,284</span>
                  </div>
                  <div className="mem-category-bar-bg">
                    <div className="mem-category-bar-fill" style={{ background: "#f59e0b", width: "35%" }} />
                  </div>
                </div>

                {/* Processes */}
                <div className="mem-category-item">
                  <div className="mem-category-row-top">
                    <div className="mem-category-name-wrapper">
                      <SlidersHorizontal size={12} style={{ color: "#ec4899" }} />
                      <span>Processes</span>
                    </div>
                    <span className="mem-category-value">956</span>
                  </div>
                  <div className="mem-category-bar-bg">
                    <div className="mem-category-bar-fill" style={{ background: "#ec4899", width: "25%" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Panel 3: Recent Snapshots */}
            <div className="mem-sidebar-card">
              <div className="mem-sidebar-card-header">
                <span className="mem-sidebar-card-title">Recent Snapshots</span>
                <a href="#" className="mem-sidebar-view-all">View all</a>
              </div>

              <div className="mem-snapshot-list">
                {snapshots.map((snap) => (
                  <div key={snap.id} className="mem-snapshot-item">
                    <div className="mem-snapshot-item-left">
                      <div className="mem-snapshot-icon-wrapper">
                        <FileText size={16} />
                      </div>
                      <div className="mem-snapshot-meta">
                        <span className="mem-snapshot-title">{snap.title}</span>
                        <span className="mem-snapshot-date">{snap.date}</span>
                      </div>
                    </div>
                    {snap.isLatest && <span className="mem-snapshot-badge">Latest</span>}
                  </div>
                ))}
              </div>

              <button className="mem-snapshot-create-btn" onClick={handleCreateSnapshot}>
                Create Snapshot
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* ── 4. Interactive "+ Add to Memory" Modal form ── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="mem-modal-overlay">
            <motion.div
              className="mem-modal-card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <h2 className="mem-modal-title">Add to Memory</h2>
              
              <form onSubmit={handleAddMemorySubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="mem-form-group">
                  <label className="mem-form-label">Event Category</label>
                  <select
                    className="mem-form-select"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as TimelineItem["category"])}
                  >
                    <option value="decision">Decision Captured</option>
                    <option value="discussion">Discussion Summary</option>
                    <option value="document">Document Added</option>
                    <option value="insight">Insight Generated</option>
                    <option value="knowledge">Knowledge Update</option>
                  </select>
                </div>

                <div className="mem-form-group">
                  <label className="mem-form-label">Title / Event Type</label>
                  <input
                    type="text"
                    className="mem-form-input"
                    placeholder="e.g. Decision Captured"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="mem-form-group">
                  <label className="mem-form-label">Content Description</label>
                  <textarea
                    className="mem-form-textarea"
                    placeholder="Provide description of what happened..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    required
                  />
                </div>

                <div className="mem-form-group">
                  <label className="mem-form-label">Badge Tag</label>
                  <input
                    type="text"
                    className="mem-form-input"
                    placeholder="e.g. Marketing Strategy"
                    value={newBadge}
                    onChange={(e) => setNewBadge(e.target.value)}
                  />
                </div>

                <div className="mem-form-group">
                  <label className="mem-form-label">Data Source</label>
                  <select
                    className="mem-form-select"
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                  >
                    <option value="Notion">Notion</option>
                    <option value="Slack">Slack</option>
                    <option value="Google Drive">Google Drive</option>
                    <option value="Corely AI">Corely AI</option>
                    <option value="HR System">HR System</option>
                  </select>
                </div>

                <div className="mem-modal-actions">
                  <button type="button" className="mem-cancel-btn" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="mem-submit-btn">
                    Save Memory
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}
