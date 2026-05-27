"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Skeleton } from "../components/Skeleton";
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

export default function MemoryPage() {
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>("timeline");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ── Filter Bar states ──────────────────────────────────────────────────────
  const [showFilterBar, setShowFilterBar] = useState<boolean>(false);
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // ── Form State for New Memory ──────────────────────────────────────────────
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<TimelineItem["category"]>("decision");
  const [newBadge, setNewBadge] = useState("");
  const [newSource, setNewSource] = useState("Notion");
  const [formErrors, setFormErrors] = useState<{ title?: string; content?: string }>({});

  // ── Hydration from Database ────────────────────────────────────────────────
  useEffect(() => {
    const fetchMemories = async () => {
      try {
        const res = await fetch("/api/memory");
        if (res.ok) {
          const data = await res.json();
          if (data.memories) {
            interface ApiMemory {
              id: string;
              createdAt: string;
              category: "decision" | "discussion" | "document" | "insight" | "knowledge";
              title: string;
              content: string;
              badges: string[];
              sourceName: string;
              avatarUrl: string | null;
            }
            const mappedList: TimelineItem[] = data.memories.map((item: ApiMemory) => {
              const dateObj = new Date(item.createdAt);
              const timeStr = dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              
              const today = new Date();
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);
              
              let prefix = "";
              if (dateObj.toDateString() === today.toDateString()) {
                prefix = "Today • ";
              } else if (dateObj.toDateString() === yesterday.toDateString()) {
                prefix = "Yesterday • ";
              }

              return {
                id: item.id,
                time: timeStr,
                category: item.category,
                title: item.title,
                content: item.content,
                badges: Array.isArray(item.badges) ? item.badges : [],
                sourceName: item.sourceName,
                avatarUrl: item.avatarUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
                date: `${prefix}${dateStr}`,
              };
            });
            setTimelineItems(mappedList);
          }
        }
      } catch (e) {
        console.error("Failed to fetch memories:", e);
      }

      try {
        const snapRes = await fetch("/api/memory/snapshots");
        if (snapRes.ok) {
          const snapData = await snapRes.json();
          if (snapData.data?.snapshots) {
            const mappedSnapshots = snapData.data.snapshots.map((item: { id: string; title: string; createdAt: string }, index: number) => {
              const dateObj = new Date(item.createdAt);
              const timeStr = dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              return {
                id: item.id,
                title: item.title,
                date: `${dateStr} • ${timeStr}`,
                isLatest: index === 0
              };
            });
            setSnapshots(mappedSnapshots);
          }
        }
      } catch (e) {
        console.error("Failed to fetch snapshots:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMemories();
  }, []);

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

  // ── Sync Active Tab and Category Dropdown ──────────────────────────────────
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const tabCategoryMap: Record<string, string> = {
      timeline: "all",
      decisions: "decision",
      discussions: "discussion",
      documents: "document",
      "knowledge sets": "knowledge",
      snapshots: "insight",
    };
    setSelectedCategory(tabCategoryMap[tab] || "all");
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    const categoryTabMap: Record<string, string> = {
      all: "timeline",
      decision: "decisions",
      discussion: "discussions",
      document: "documents",
      knowledge: "knowledge sets",
      insight: "snapshots",
    };
    setActiveTab(categoryTabMap[category] || "timeline");
  };

  // ── Dynamic Source Filter ──────────────────────────────────────────────────
  const uniqueSources = useMemo(() => {
    const sources = new Set<string>();
    timelineItems.forEach(item => {
      if (item.sourceName) sources.add(item.sourceName);
    });
    return Array.from(sources).sort();
  }, [timelineItems]);

  // ── Filtered Items Logic ───────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    return timelineItems.filter((item) => {
      // 1. Tab / Category filter
      if (activeTab !== "timeline") {
        const tabCategoryMap: Record<string, string> = {
          decisions: "decision",
          discussions: "discussion",
          documents: "document",
          "knowledge sets": "knowledge",
          snapshots: "insight",
        };
        if (item.category !== tabCategoryMap[activeTab]) return false;
      }

      // 2. Source filter
      if (selectedSource !== "all") {
        if (item.sourceName.toLowerCase() !== selectedSource.toLowerCase()) return false;
      }

      // 3. Search filter
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
  }, [timelineItems, activeTab, selectedSource, searchQuery]);

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

  // ── Dynamic Stats Calculation ──────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalMemories = timelineItems.length;
    const totalDecisions = timelineItems.filter(item => item.category === "decision").length;
    const totalDiscussions = timelineItems.filter(item => item.category === "discussion").length;
    const totalDocuments = timelineItems.filter(item => item.category === "document").length;
    const totalKnowledge = timelineItems.filter(item => item.category === "knowledge").length;
    const totalInsight = timelineItems.filter(item => item.category === "insight").length;
    const totalActiveKnowledgeSets = totalKnowledge;

    return {
      totalMemories,
      totalDecisions,
      totalDiscussions,
      totalDocuments,
      totalKnowledge,
      totalInsight,
      totalActiveKnowledgeSets
    };
  }, [timelineItems]);

  // ── Form Handlers ──────────────────────────────────────────────────────────
  const handleAddMemorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { title?: string; content?: string } = {};
    if (!newTitle.trim()) errors.title = "Title is required";
    if (!newContent.trim()) errors.content = "Content is required";
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setFormErrors({});

    try {
      const payload = {
        category: newCategory,
        title: newTitle.trim(),
        content: newContent.trim(),
        badges: newBadge.trim() ? [newBadge.trim()] : ["Custom"],
        sourceName: newSource,
      };

      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.memory) {
          const item = data.memory;
          const dateObj = new Date(item.createdAt);
          const timeStr = dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          const prefix = "Today • ";
          
          const newItem: TimelineItem = {
            id: item.id,
            time: timeStr,
            category: item.category,
            title: item.title,
            content: item.content,
            badges: item.badges,
            sourceName: item.sourceName,
            avatarUrl: item.avatarUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
            date: `${prefix}${dateStr}`,
          };

          setTimelineItems((prev) => [newItem, ...prev]);
        }
      }
    } catch (err) {
      console.error("Failed to add memory", err);
    }
    
    // Reset Form
    setNewTitle("");
    setNewContent("");
    setNewBadge("");
    setNewCategory("decision");
    setNewSource("Notion");
    setFormErrors({});
    setShowAddModal(false);
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await fetch(`/api/memory?id=${id}`, { method: "DELETE" });
      setTimelineItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Failed to delete memory", err);
    }
  };

  const handleCreateSnapshot = async () => {
    try {
      const res = await fetch("/api/memory/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${filteredItems[0]?.title || "Workspace"} Snapshot`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data?.snapshot) {
          const item = data.data.snapshot;
          const dateObj = new Date(item.createdAt);
          const timeStr = dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          
          setSnapshots((prev) => [
            {
              id: item.id,
              title: item.title,
              date: `${dateStr} • ${timeStr}`,
              isLatest: true,
            },
            ...prev.map((s) => ({ ...s, isLatest: false })),
          ]);
        }
      }
    } catch (err) {
      console.error("Failed to create snapshot", err);
    }
  };

  const handleDeleteSnapshot = async (id: string) => {
    try {
      await fetch(`/api/memory/snapshots?id=${id}`, { method: "DELETE" });
      setSnapshots((prev) => prev.filter((snap) => snap.id !== id));
    } catch (err) {
      console.error("Failed to delete snapshot", err);
    }
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
              <span className="mem-stat-value">{stats.totalMemories.toLocaleString()}</span>
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
              <span className="mem-stat-value">{stats.totalDecisions.toLocaleString()}</span>
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
              <span className="mem-stat-value">{stats.totalActiveKnowledgeSets.toLocaleString()}</span>
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
                    onClick={() => handleTabChange(tab)}
                    style={{ textTransform: "capitalize" }}
                  >
                    {tab}
                    {activeTab === tab && (
                      <motion.div layoutId="tab-line" className="mem-tab-active-line" />
                    )}
                  </button>
                ))}
              </div>
              
              <button
                className={`mem-filter-btn ${showFilterBar ? "active" : ""}`}
                onClick={() => setShowFilterBar((prev) => !prev)}
              >
                <SlidersHorizontal size={13} />
                <span>Filters</span>
              </button>
            </div>

            {/* Filter Bar */}
            <AnimatePresence>
              {showFilterBar && (
                <motion.div
                  className="mem-filter-bar"
                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                  animate={{ height: "auto", opacity: 1, marginTop: 12 }}
                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="mem-filter-row-inner">
                    <div className="mem-filter-group">
                      <label className="mem-filter-label">Source</label>
                      <select
                        className="mem-filter-select"
                        value={selectedSource}
                        onChange={(e) => setSelectedSource(e.target.value)}
                      >
                        <option value="all">All Sources</option>
                        {uniqueSources.map(source => (
                          <option key={source} value={source}>{source}</option>
                        ))}
                      </select>
                    </div>

                    <div className="mem-filter-group">
                      <label className="mem-filter-label">Category</label>
                      <select
                        className="mem-filter-select"
                        value={selectedCategory}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                      >
                        <option value="all">All Categories</option>
                        <option value="decision">Decision Captured</option>
                        <option value="discussion">Discussion Summary</option>
                        <option value="document">Document Added</option>
                        <option value="insight">Insight Generated</option>
                        <option value="knowledge">Knowledge Update</option>
                      </select>
                    </div>

                    {(selectedSource !== "all" || selectedCategory !== "all") && (
                      <button
                        className="mem-filter-clear-btn"
                        onClick={() => {
                          setSelectedSource("all");
                          handleCategoryChange("all");
                        }}
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Timeline Header Info */}
            <div className="mem-timeline-header">
              <h2 className="mem-timeline-title">Memory Timeline</h2>
              <p className="mem-timeline-sub">A chronological view of important moments and changes.</p>
            </div>

            {/* Timeline Items List */}
            <div className="mem-timeline-list">
              <div className="mem-timeline-line" />

              {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingLeft: 120 }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                      <Skeleton width={48} height={48} borderRadius="50%" />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <Skeleton width="40%" height={20} />
                        <Skeleton width="100%" height={16} />
                        <Skeleton width="80%" height={16} />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Skeleton width={80} height={24} borderRadius={12} />
                          <Skeleton width={80} height={24} borderRadius={12} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : Object.keys(groupedItems).length === 0 ? (
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
                              
                              {/* eslint-disable-next-line @next/next/no-img-element */}
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
                    <span className="mem-category-value">{stats.totalDecisions.toLocaleString()}</span>
                  </div>
                  <div className="mem-category-bar-bg">
                    <div className="mem-category-bar-fill" style={{ background: "#ff6b00", width: `${Math.min(95, Math.max(10, 45 + (stats.totalDecisions - 1842) * 5))}%` }} />
                  </div>
                </div>

                {/* Discussions */}
                <div className="mem-category-item">
                  <div className="mem-category-row-top">
                    <div className="mem-category-name-wrapper">
                      <MessageSquare size={12} style={{ color: "#8b5cf6" }} />
                      <span>Discussions</span>
                    </div>
                    <span className="mem-category-value">{stats.totalDiscussions.toLocaleString()}</span>
                  </div>
                  <div className="mem-category-bar-bg">
                    <div className="mem-category-bar-fill" style={{ background: "#8b5cf6", width: `${Math.min(95, Math.max(10, 65 + (stats.totalDiscussions - 3421) * 5))}%` }} />
                  </div>
                </div>

                {/* Documents */}
                <div className="mem-category-item">
                  <div className="mem-category-row-top">
                    <div className="mem-category-name-wrapper">
                      <FileText size={12} style={{ color: "#3b82f6" }} />
                      <span>Documents</span>
                    </div>
                    <span className="mem-category-value">{stats.totalDocuments.toLocaleString()}</span>
                  </div>
                  <div className="mem-category-bar-bg">
                    <div className="mem-category-bar-fill" style={{ background: "#3b82f6", width: `${Math.min(95, Math.max(10, 88 + (stats.totalDocuments - 12842) * 5))}%` }} />
                  </div>
                </div>

                {/* People */}
                <div className="mem-category-item">
                  <div className="mem-category-row-top">
                    <div className="mem-category-name-wrapper">
                      <Users size={12} style={{ color: "#10b981" }} />
                      <span>People</span>
                    </div>
                    <span className="mem-category-value">{stats.totalKnowledge.toLocaleString()}</span>
                  </div>
                  <div className="mem-category-bar-bg">
                    <div className="mem-category-bar-fill" style={{ background: "#10b981", width: `${Math.min(95, Math.max(10, 55 + (stats.totalKnowledge - 2153) * 5))}%` }} />
                  </div>
                </div>

                {/* Projects */}
                <div className="mem-category-item">
                  <div className="mem-category-row-top">
                    <div className="mem-category-name-wrapper">
                      <FileText size={12} style={{ color: "#f59e0b" }} />
                      <span>Projects</span>
                    </div>
                    <span className="mem-category-value">{stats.totalInsight.toLocaleString()}</span>
                  </div>
                  <div className="mem-category-bar-bg">
                    <div className="mem-category-bar-fill" style={{ background: "#f59e0b", width: `${Math.min(95, Math.max(10, 35 + (stats.totalInsight - 1284) * 5))}%` }} />
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
                  <div key={snap.id} className="mem-snapshot-item" style={{ position: "relative" }}>
                    <div className="mem-snapshot-item-left">
                      <div className="mem-snapshot-icon-wrapper">
                        <FileText size={16} />
                      </div>
                      <div className="mem-snapshot-meta">
                        <span className="mem-snapshot-title">{snap.title}</span>
                        <span className="mem-snapshot-date">{snap.date}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {snap.isLatest && <span className="mem-snapshot-badge">Latest</span>}
                      <button
                        className="mem-snapshot-delete-btn"
                        onClick={() => handleDeleteSnapshot(snap.id)}
                        title="Delete snapshot"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
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
                    className={`mem-form-input ${formErrors.title ? "error" : ""}`}
                    placeholder="e.g. Decision Captured"
                    value={newTitle}
                    onChange={(e) => {
                      setNewTitle(e.target.value);
                      if (formErrors.title) setFormErrors({ ...formErrors, title: undefined });
                    }}
                  />
                  {formErrors.title && <span className="mem-form-error" style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{formErrors.title}</span>}
                </div>

                <div className="mem-form-group">
                  <label className="mem-form-label">Content Description</label>
                  <textarea
                    className={`mem-form-textarea ${formErrors.content ? "error" : ""}`}
                    placeholder="Provide description of what happened..."
                    value={newContent}
                    onChange={(e) => {
                      setNewContent(e.target.value);
                      if (formErrors.content) setFormErrors({ ...formErrors, content: undefined });
                    }}
                  />
                  {formErrors.content && <span className="mem-form-error" style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{formErrors.content}</span>}
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
