"use client";

import React, { useState, useEffect, useMemo, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Search,
  Plus,
  ChevronDown,
  Trash2,
  FileText,
  MessageSquare,
  Zap,
  Users,
  CheckCircle2,
  AlertTriangle,
  Flag,
  HelpCircle,
  Info,
  Database,
  Download,
  FilterX,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterToolbar } from "@/components/ui/filter-toolbar";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SourceLogo } from "@/components/ui/source-logo";
import { MemoryStatsGrid } from "./components/MemoryStatsGrid";
import { MemoryRightSidebar } from "./components/MemoryRightSidebar";
import { AddMemoryModal } from "./components/AddMemoryModal";
import { TimelineItem, SnapshotItem } from "./types";
import "./memory.css";

export default function MemoryPage() {
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>("timeline");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const [selectedMemory, setSelectedMemory] = useState<TimelineItem | null>(null);

  // ── Filter Bar states ──────────────────────────────────────────────────────
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // ── Form State for New Memory ──────────────────────────────────────────────
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<TimelineItem["category"]>("decision");
  const [newBadge, setNewBadge] = useState("");
  const [newSource, setNewSource] = useState("Added manually");
  const [formErrors, setFormErrors] = useState<{ title?: string; content?: string }>({});

  // ── Hydration from Database ────────────────────────────────────────────────
  useEffect(() => {
    const fetchMemories = async () => {
      try {
        const res = await fetch("/api/memory");
        if (res.ok) {
          const json = await res.json();
          const data = json.data || json;
          if (data.memories) {
            interface ApiMemory {
              id: string;
              createdAt: string;
              category: TimelineItem["category"];
              title: string;
              content: string;
              badges: string[];
              sourceName: string;
              avatarUrl: string | null;
              url?: string | null;
              isSyncedDocument?: boolean;
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
                url: item.url,
                createdAt: item.createdAt,
                isSyncedDocument: item.isSyncedDocument === true,
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
      }

      setIsLoading(false);
    };
    fetchMemories();
  }, []);

  // ── Filters & Category Mapper ──────────────────────────────────────────────
  // Each category gets a neutral icon and a short label for its badge.
  const getCategoryDetails = (category: TimelineItem["category"]) => {
    switch (category) {
      case "decision":
        return { icon: <CheckCircle2 size={16} />, label: "Decision" };
      case "discussion":
        return { icon: <MessageSquare size={16} />, label: "Discussion" };
      case "document":
        return { icon: <FileText size={16} />, label: "Document" };
      case "insight":
        return { icon: <Zap size={16} />, label: "Insight" };
      case "knowledge":
        return { icon: <Users size={16} />, label: "Knowledge" };
      // Project memory types
      case "risk":
        return { icon: <AlertTriangle size={16} />, label: "Risk" };
      case "milestone":
        return { icon: <Flag size={16} />, label: "Milestone" };
      case "question":
        return { icon: <HelpCircle size={16} />, label: "Question" };
      case "fact":
        return { icon: <Info size={16} />, label: "Fact" };
      // Never crash on a category added later
      default:
        return { icon: <Info size={16} />, label: String(category || "Memory").replace(/^\w/, c => c.toUpperCase()) };
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
      insights: "insight",
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
      insight: "insights",
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
          insights: "insight",
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

  // Group filtered items by date (with limit)
  const groupedItems = useMemo(() => {
    const groups: Record<string, TimelineItem[]> = {};
    const itemsToShow = filteredItems.slice(0, visibleCount);
    for (const item of itemsToShow) {
      if (!groups[item.date]) {
        groups[item.date] = [];
      }
      groups[item.date].push(item);
    }
    return groups;
  }, [filteredItems, visibleCount]);

  // ── Dynamic Stats Calculation ──────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalMemories = timelineItems.length;
    const totalDecisions = timelineItems.filter(item => item.category === "decision").length;
    const totalDiscussions = timelineItems.filter(item => item.category === "discussion").length;
    const totalDocuments = timelineItems.filter(item => item.category === "document").length;
    const totalKnowledge = timelineItems.filter(item => item.category === "knowledge").length;
    const totalInsight = timelineItems.filter(item => item.category === "insight").length;
    const totalActiveKnowledgeSets = totalKnowledge;

    // Real count: entries created since the 1st of the current month.
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const addedThisMonth = timelineItems.filter(item => new Date(item.createdAt).getTime() >= monthStart).length;

    return {
      totalMemories,
      totalDecisions,
      totalDiscussions,
      totalDocuments,
      totalKnowledge,
      totalInsight,
      totalActiveKnowledgeSets,
      addedThisMonth,
    };
  }, [timelineItems]);

  // ── Source Chart Data ──────────────────────────────────────────────────────
  const sourceChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    timelineItems.forEach(item => {
      const name = item.sourceName || "Unknown";
      counts[name] = (counts[name] || 0) + 1;
    });

    const total = timelineItems.length;
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    
    let cumulativePercent = 0;

    const circ = 251.327; // 2 * pi * 40

    // Slices use the grayscale chart palette (defined in memory.css), in order.
    return sorted.map(([name, count], index) => {
      const percent = total > 0 ? count / total : 0;
      const dash = percent * circ;
      const gap = circ - dash;
      
      const offset = cumulativePercent * circ;
      cumulativePercent += percent;

      return {
        name,
        count,
        color: `var(--mem-chart-${(index % 5) + 1})`,
        dash: `${dash} ${gap}`,
        offset: -offset
      };
    });
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
        const json = await res.json();
        const data = json.data || json;
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
            createdAt: item.createdAt,
          };

          setTimelineItems((prev) => [newItem, ...prev]);
        }
      } else {
        // Keep the modal open so the user does not lose what they typed.
        toast.error("Could not save this memory. Please try again.");
        return;
      }
    } catch (err) {
      console.error("Failed to add memory", err);
      toast.error("Could not save this memory. Please try again.");
      return;
    }

    toast.success("Saved to memory");

    // Reset Form
    setNewTitle("");
    setNewContent("");
    setNewBadge("");
    setNewCategory("decision");
    setNewSource("Added manually");
    setFormErrors({});
    setShowAddModal(false);
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/memory?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Could not delete this entry.");
        return;
      }
      // Only remove the row once the server confirms the delete.
      setTimelineItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Failed to delete memory", err);
      toast.error("Could not delete this entry.");
    }
  };

  const handleDeleteSnapshot = async (id: string) => {
    try {
      const res = await fetch(`/api/memory/snapshots?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Could not delete this snapshot.");
        return;
      }
      setSnapshots((prev) => prev.filter((snap) => snap.id !== id));
    } catch (err) {
      console.error("Failed to delete snapshot", err);
      toast.error("Could not delete this snapshot.");
    }
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Title", "Category", "Source", "Date", "Time", "Content"];
    const rows = timelineItems.map(item => [
      item.id,
      `"${item.title.replace(/"/g, '""')}"`,
      item.category,
      item.sourceName,
      `"${item.date}"`,
      item.time,
      `"${item.content.replace(/"/g, '""').replace(/\n/g, ' ')}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "corely_memory_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="db-content">
      <div className="mem-container">

        {/* ── 1. Page Header ── */}
        <PageHeader
          title="Memory"
          subtitle="Corely's persistent memory of your organization's knowledge, decisions, and context."
          actions={
            <>
              <button type="button" className="ui-btn ui-btn--secondary" onClick={handleExportCSV}>
                <Download />
                <span>Export CSV</span>
              </button>
              <button type="button" className="ui-btn ui-btn--primary" onClick={() => setShowAddModal(true)}>
                <Plus />
                <span>Add to Memory</span>
              </button>
            </>
          }
        />

        {/* ── 2. Summary Stats Cards ── */}
        <MemoryStatsGrid stats={stats} />

        {/* ── 3. Main Dashboard Grid ── */}
        <div className="mem-main-grid">

          {/* ── Left Column: Timeline and Tabs ── */}
          <div className="mem-left-column">

            {/* Tabs: pick one view. Each shows how many entries it holds. */}
            <SegmentedControl
              label="Memory view"
              className="mem-tabs-list"
              segments={[
                { value: "timeline", label: "Timeline", count: stats.totalMemories },
                { value: "decisions", label: "Decisions", count: stats.totalDecisions },
                { value: "discussions", label: "Discussions", count: stats.totalDiscussions },
                { value: "documents", label: "Documents", count: stats.totalDocuments },
                { value: "knowledge sets", label: "Knowledge sets", count: stats.totalKnowledge },
                { value: "insights", label: "Insights", count: stats.totalInsight },
              ]}
              value={activeTab}
              onChange={handleTabChange}
            />

            {/* Search + filter chips */}
            <FilterToolbar
              search={{ value: searchQuery, onChange: setSearchQuery, placeholder: "Search Memory" }}
              filters={[
                {
                  id: "source",
                  label: "Source",
                  options: uniqueSources.map(source => ({
                    value: source,
                    label: source,
                    icon: <SourceLogo type={source} size={14} tile={false} />,
                  })),
                  value: selectedSource,
                  onChange: setSelectedSource,
                  emptyValue: "all",
                },
                {
                  id: "category",
                  label: "Category",
                  options: [
                    { value: "decision", label: "Decision Captured" },
                    { value: "discussion", label: "Discussion Summary" },
                    { value: "document", label: "Document Added" },
                    { value: "insight", label: "Insight Generated" },
                    { value: "knowledge", label: "Knowledge Update" },
                  ].map(o => ({ ...o, icon: getCategoryDetails(o.value as TimelineItem["category"]).icon })),
                  value: selectedCategory,
                  onChange: handleCategoryChange,
                  emptyValue: "all",
                },
              ]}
            />

            {/* Timeline: one hairline table card with a header and an optional footer */}
            <div className="ui-table-wrap mem-timeline-list">
              <div className="mem-table-card-header">
                <h2 className="type-heading">Memory timeline</h2>
                <p className="type-caption">A chronological view of important moments and changes.</p>
              </div>

              {isLoading ? (
                <div className="mem-skeleton-list">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="mem-skeleton-row">
                      <div className="ui-skeleton" style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} />
                      <div className="mem-skeleton-lines">
                        <div className="ui-skeleton" style={{ width: "40%", height: 14, borderRadius: 6 }} />
                        <div className="ui-skeleton" style={{ width: "80%", height: 12, borderRadius: 6 }} />
                      </div>
                      <div className="ui-skeleton" style={{ width: 80, height: 22, borderRadius: 9999 }} />
                      <div className="ui-skeleton" style={{ width: 56, height: 12, borderRadius: 6 }} />
                    </div>
                  ))}
                </div>
              ) : Object.keys(groupedItems).length === 0 ? (
                <EmptyState
                  icon={timelineItems.length === 0 ? <Database /> : <Search />}
                  title={timelineItems.length === 0 ? "Your Memory is empty" : "No entries match your filters"}
                  description={
                    timelineItems.length === 0
                      ? "Corely builds your institutional memory automatically by syncing with your tools."
                      : "Try adjusting your search query, or clear your filters to see all memory entries."
                  }
                  action={
                    timelineItems.length === 0 ? (
                      <div className="mem-empty-actions">
                        <Link href="/dashboard/sources" style={{ textDecoration: "none" }}>
                          <button type="button" className="ui-btn ui-btn--primary">
                            Connect data sources
                          </button>
                        </Link>
                        <button
                          type="button"
                          className="ui-btn ui-btn--secondary"
                          onClick={() => setShowAddModal(true)}
                        >
                          Add manual entry
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="ui-btn ui-btn--secondary"
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedSource("all");
                          handleCategoryChange("all");
                        }}
                      >
                        <FilterX />
                        Clear all filters
                      </button>
                    )
                  }
                />
              ) : (
                <table className="ui-table mem-data-table">
                  <thead>
                    <tr>
                      <th>Title &amp; snippet</th>
                      <th style={{ width: 140 }}>Category</th>
                      <th style={{ width: 160 }}>Source</th>
                      <th style={{ width: 96 }}>Time</th>
                      <th style={{ width: 56 }} aria-label="Actions"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(groupedItems).map((date) => (
                      <Fragment key={date}>
                        <tr className="mem-table-group-header">
                          <td colSpan={5}>{date}</td>
                        </tr>
                        {groupedItems[date].map((item) => {
                          const cfg = getCategoryDetails(item.category);
                          const isOld = !item.date.includes("Today") && !item.date.includes("Yesterday");
                          return (
                            <tr
                              key={item.id}
                              className={`mem-table-row ${isOld ? "mem-table-row-old" : ""}`}
                              onClick={() => setSelectedMemory(item)}
                            >
                              <td className="mem-td-title">
                                <div className="mem-title-cell">
                                  <span className="mem-row-icon">{cfg.icon}</span>
                                  <div className="mem-title-text">
                                    <span className="mem-row-title">{item.title}</span>
                                    <span className="type-caption mem-table-content-preview">{item.content}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="mem-td-category">
                                <span className="ui-badge ui-badge--neutral">{cfg.label}</span>
                              </td>
                              <td className="mem-td-source">
                                <div className="mem-source-badge">
                                  <SourceLogo type={item.sourceName} size={14} tileSize={24} />
                                  <span className="type-caption mem-source-name">{item.sourceName}</span>
                                </div>
                              </td>
                              <td className="mem-td-date">
                                <span className="type-caption">{item.time}</span>
                              </td>
                              <td className="mem-td-actions">
                                {/* Synced documents are removed from Sources, so they have no delete here. */}
                                {!item.isSyncedDocument && (
                                <button
                                  type="button"
                                  className="ui-icon-btn ui-icon-btn--sm mem-card-action-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteItem(item.id);
                                  }}
                                  title="Delete entry"
                                >
                                  <Trash2 size={16} />
                                </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Load More Button */}
              {visibleCount < filteredItems.length && (
                <div className="mem-load-more-container">
                  <button
                    type="button"
                    className="ui-btn ui-btn--ghost ui-btn--sm"
                    onClick={() => setVisibleCount(v => v + 10)}
                  >
                    <span>Load more</span>
                    <ChevronDown />
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* ── Right Column: Sidebar Panels ── */}
          <MemoryRightSidebar
            stats={stats}
            sourceChartData={sourceChartData}
            snapshots={snapshots}
            handleDeleteSnapshot={handleDeleteSnapshot}
          />

        </div>

      </div>

      {/* ── 4. Interactive "+ Add to Memory" Modal form ── */}
      <AnimatePresence>
        {showAddModal && (
          <AddMemoryModal
            newCategory={newCategory}
            setNewCategory={setNewCategory}
            newTitle={newTitle}
            setNewTitle={setNewTitle}
            newContent={newContent}
            setNewContent={setNewContent}
            newBadge={newBadge}
            setNewBadge={setNewBadge}
            newSource={newSource}
            setNewSource={setNewSource}
            formErrors={formErrors}
            setFormErrors={setFormErrors}
            handleAddMemorySubmit={handleAddMemorySubmit}
            setShowAddModal={setShowAddModal}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedMemory && (
          <div className="mem-modal-overlay" onClick={() => setSelectedMemory(null)}>
            <motion.div
              className="ui-popover mem-modal-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <div className="mem-modal-header">
                <h2 className="type-heading">{selectedMemory.title}</h2>
                <div className="type-caption mem-detail-meta">
                  <span>{selectedMemory.date} at {selectedMemory.time}</span>
                  <span aria-hidden="true">•</span>
                  <span className="mem-detail-source">{selectedMemory.sourceName}</span>
                </div>
              </div>

              <div className="mem-detail-content">
                {selectedMemory.content}
                {selectedMemory.url && (
                  <div className="mem-detail-link">
                    <a
                      href={selectedMemory.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ui-btn ui-btn--secondary ui-btn--sm"
                    >
                      <FileText /> Open Document
                    </a>
                  </div>
                )}
              </div>

              {selectedMemory.badges.length > 0 && (
                <div className="mem-badge-list">
                  {selectedMemory.badges.map((b) => (
                    <span key={b} className="ui-badge ui-badge--neutral mem-badge">{b}</span>
                  ))}
                </div>
              )}

              <div className="mem-modal-actions">
                <button type="button" className="ui-btn ui-btn--secondary" onClick={() => setSelectedMemory(null)}>
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}
