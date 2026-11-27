"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  Download,
  Zap,
  AlertTriangle,
  CheckCircle,
  Eye,
  Search,
  ChevronDown,
  Activity,
  Code2,
  DollarSign,
  Users,
  ShieldAlert,
  ArrowRight,
  Database,
  Clock,
  CheckCircle2,
  FileText,
  UserPlus
} from "lucide-react";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../components/DataTable";
import { PageHeader } from "@/components/ui/page-header";
import { KpiTile } from "@/components/ui/kpi-tile";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { FilterToolbar } from "@/components/ui/filter-toolbar";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SourceLogo } from "@/components/ui/source-logo";
import "./insights.css";




// ── Helpers ─────────────────────────────────────────────────────────────────
// Priority word → badge tone, any letter case.
// Critical and High read as errors, Medium as a warning, everything else neutral.
function priorityTone(priority?: string): StatusTone {
  const p = (priority || "").toLowerCase();
  if (p === "critical" || p === "high") return "error";
  if (p === "medium") return "warning";
  return "neutral";
}

// Chart tooltip: surface card, hairline border, 12px semibold text. Works in both themes.
function InsightsChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number | string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="in-chart-tooltip">
      <p className="in-chart-tooltip__label">{label}</p>
      <p>{payload[0].value}</p>
    </div>
  );
}

// ── Components ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IconMap: Record<string, any> = { Activity, Code2, DollarSign, Users, ShieldAlert, Sparkles, Database, AlertTriangle, Clock, CheckCircle2, FileText, UserPlus };

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState("All Insights");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [insights, setInsights] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("All Priority");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedSource, setSelectedSource] = useState("All Sources");
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    fetch("/api/insights")
      .then(res => res.json())
      .then(data => {
        setInsights(data.data?.insights || data.data || []);
        if (data.data?.timeline) {
          setTimeline(data.data.timeline);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const tabs = [
    "All Insights",
    "Operational",
    "Activity",
    "Product",
    "People",
    "Risk",
  ];

  // ── Computed Stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const critical = insights.filter((i) => i.priority === "Critical").length;
    const high = insights.filter((i) => i.priority === "High").length;
    // Real counts only. Insights are rebuilt on each load, so there is no
    // history for "vs last month" or an "actioned" rate.
    return {
      critical,
      high,
      total: insights.length,
      risks: insights.filter((i) => i.category === "Risk").length,
    };
  }, [insights]);

  // ── Dynamic Pie Data ──────────────────────────────────────────────────────
  const dynamicPieData = useMemo(() => {
    const critical = insights.filter((i) => i.priority === "Critical").length;
    const high = insights.filter((i) => i.priority === "High").length;
    const medium = insights.filter((i) => i.priority === "Medium").length;
    const low = insights.filter((i) => i.priority === "Low").length;

    return [
      { name: "Critical", value: critical, color: "var(--in-pie-1)" },
      { name: "High", value: high, color: "var(--in-pie-2)" },
      { name: "Medium", value: medium, color: "var(--in-pie-3)" },
      { name: "Low", value: low, color: "var(--in-pie-4)" },
    ].filter(d => d.value > 0);
  }, [insights]);

  // ── Dynamic Category Progress ─────────────────────────────────────────────
  const dynamicCategoryProgress = useMemo(() => {
    const counts: Record<string, number> = {};
    insights.forEach((i) => {
      counts[i.category] = (counts[i.category] || 0) + 1;
    });
    return Object.entries(counts)
      // Bars and icon tiles stay neutral; orange is kept for the trend line.
      .map(([name, value]) => ({
        name,
        value,
        color: "var(--icon-secondary)",
        iconBg: "var(--surface-secondary)",
        iconColor: "var(--icon-primary)",
      }))
      .sort((a, b) => b.value - a.value);
  }, [insights]);

  const maxCategoryValue = Math.max(...dynamicCategoryProgress.map((c) => c.value), 1);

  // ── Line Data ─────────────────────────────────────────────────────────────
  // Real points from the API only. An all-zero line means there is nothing to show yet.
  const hasTimelineData = timeline.some((p) => Number(p.val) > 0);

  // Source filter options come from the sources the loaded insights really use.
  const sourceOptions = useMemo(() => {
    const names = new Set<string>();
    insights.forEach((i) => {
      if (i.source) names.add(i.source);
    });
    return Array.from(names).sort();
  }, [insights]);

  // ── Filtering Logic ───────────────────────────────────────────────────────
  const filteredInsights = useMemo(() => {
    return insights.filter((item) => {
      if (activeTab !== "All Insights" && item.category !== activeTab) return false;
      if (selectedPriority !== "All Priority" && item.priority !== selectedPriority) return false;
      if (selectedCategory !== "All Categories" && item.category !== selectedCategory) return false;
      if (selectedSource !== "All Sources" && item.source !== selectedSource) return false;
      
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(query) ||
          item.desc.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [insights, activeTab, selectedPriority, selectedCategory, selectedSource, searchQuery]);

  const visibleInsights = filteredInsights.slice(0, visibleCount);

  // ── Table Columns ─────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = useMemo<ColumnDef<any, any>[]>(() => [
    {
      accessorKey: "title",
      header: "Insight",
      cell: ({ row }) => {
        const item = row.original;
        const IconCmp = IconMap[item.icon] || Sparkles;
        return (
          <div className="in-insight-col">
            <div className="in-insight-icon">
              <IconCmp size={16} />
            </div>
            <div>
              <div className="in-insight-title">{item.title}</div>
              <div className="in-insight-desc">{item.desc}</div>
            </div>
          </div>
        );
      },
      size: 400,
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <span className="ui-badge ui-badge--neutral">{item.category}</span>
        );
      },
      size: 150,
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <StatusBadge tone={priorityTone(item.priority)} dot>
            {item.priority}
          </StatusBadge>
        );
      },
      size: 150,
    },
    {
      accessorKey: "impact",
      header: "Impact",
      cell: ({ row }) => {
        const item = row.original;
        return (
          // Impact is a fixed rating per rule, not a measured trend, so no arrow.
          <div className="in-impact">{item.impact}</div>
        );
      },
      size: 100,
    },
    {
      accessorKey: "time",
      header: "Detected",
      cell: ({ getValue }) => <div className="type-caption in-time">{getValue<string>()}</div>,
      size: 120,
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="in-sources">
            <SourceLogo type={item.source} size={14} tileSize={24} />
            {item.source && <span className="type-caption in-source-name">{item.source}</span>}
          </div>
        );
      },
      size: 140,
    },
  ], []);

  const handleExport = () => {
    const headers = ["Title", "Category", "Priority", "Impact", "Source", "Time"];
    const rows = filteredInsights.map(row => 
      `"${row.title.replace(/"/g, '""')}","${row.category}","${row.priority}","${row.impact}","${row.source || ''}","${row.time}"`
    );
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'insights_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="db-content in-container">
      {/* ── Header ── */}
      <PageHeader
        title="Insights"
        subtitle="AI-generated insights from across your organization."
        actions={
          <>
            <button type="button" className="ui-btn ui-btn--secondary" onClick={handleExport}>
              <Download />
              Export
            </button>
            <Link href="/dashboard/ask-corely?q=Analyze+my+recent+insights" style={{ textDecoration: "none" }}>
              <button type="button" className="ui-btn ui-btn--primary">
                <Sparkles />
                Ask about insights
              </button>
            </Link>
          </>
        }
      />

      {/* ── Stat Cards ── */}
      <div className="in-stats-grid">
        <KpiTile
          className="in-kpi--key"
          icon={<Zap />}
          value={stats.critical}
          label="Critical insights"
        />
        <KpiTile
          icon={<AlertTriangle />}
          value={stats.high}
          label="High priority"
        />
        <KpiTile
          icon={<CheckCircle />}
          value={stats.total}
          label="Total insights"
        />
        <KpiTile
          icon={<Eye />}
          value={stats.risks}
          label="Risks flagged"
        />
      </div>

      {/* ── Tabs + Filters ── */}
      <div className="in-filters">
        <SegmentedControl
          label="Insight category"
          segments={tabs.map(tab => ({
            value: tab,
            label: tab,
            count: tab === "All Insights" ? insights.length : insights.filter(i => i.category === tab).length,
          }))}
          value={activeTab}
          onChange={setActiveTab}
          className="in-tabs"
        />

        <FilterToolbar
          search={{ value: searchQuery, onChange: setSearchQuery, placeholder: "Search insights..." }}
          filters={[
            {
              id: "priority",
              label: "Priority",
              options: ["Critical", "High", "Medium", "Low"].map(v => ({ value: v, label: v })),
              value: selectedPriority,
              onChange: setSelectedPriority,
              emptyValue: "All Priority",
            },
            {
              id: "category",
              label: "Category",
              options: ["Operational", "Activity", "Product", "People", "Risk"].map(v => ({ value: v, label: v })),
              value: selectedCategory,
              onChange: setSelectedCategory,
              emptyValue: "All Categories",
            },
            {
              id: "source",
              label: "Source",
              options: sourceOptions.map(v => ({
                value: v,
                label: v,
                icon: <SourceLogo type={v} size={14} tile={false} />,
              })),
              value: selectedSource,
              onChange: setSelectedSource,
              emptyValue: "All Sources",
            },
          ]}
        />
      </div>

      {/* ── Main Layout ── */}
      <div className="in-main-grid">
        {/* Left Side Table */}
        <div className="in-table-container">
          {loading ? (
            <div>
              {Array.from({ length: 6 }).map((_, i) => (
                <div className="in-skeleton-row" key={`skel-${i}`}>
                  <div className="in-skeleton-main">
                    <div className="ui-skeleton" style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} />
                    <div className="in-skeleton-lines">
                      <div className="ui-skeleton" style={{ width: "80%", height: 14, borderRadius: 6 }} />
                      <div className="ui-skeleton" style={{ width: "95%", height: 12, borderRadius: 6 }} />
                    </div>
                  </div>
                  <div className="in-skeleton-cell"><div className="ui-skeleton" style={{ width: 80, height: 22, borderRadius: 9999 }} /></div>
                  <div className="in-skeleton-cell"><div className="ui-skeleton" style={{ width: 80, height: 22, borderRadius: 9999 }} /></div>
                  <div className="in-skeleton-cell"><div className="ui-skeleton" style={{ width: 60, height: 14, borderRadius: 6 }} /></div>
                </div>
              ))}
            </div>
          ) : visibleInsights.length > 0 ? (
            <DataTable columns={columns} data={visibleInsights} />
          ) : (
            <EmptyState
              icon={insights.length === 0 ? <Sparkles /> : <Search />}
              title={insights.length === 0 ? "No insights generated yet" : "No insights match your filters"}
              description={
                insights.length === 0
                  ? "Corely needs more data to generate organizational insights. Connect more tools or wait for the next analysis cycle."
                  : "Try adjusting your search query, or clear your filters to see all available insights."
              }
              action={
                insights.length === 0 ? (
                  <Link href="/dashboard/sources" style={{ textDecoration: "none" }}>
                    <button type="button" className="ui-btn ui-btn--primary">
                      Connect data sources
                    </button>
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="ui-btn ui-btn--secondary"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedPriority("All Priority");
                      setSelectedCategory("All Categories");
                      setSelectedSource("All Sources");
                    }}
                  >
                    Clear all filters
                  </button>
                )
              }
            />
          )}

          <div className="in-table-footer">
            <span className="type-caption">Showing {Math.min(visibleInsights.length, visibleCount)} of {filteredInsights.length} insights</span>
            {visibleCount < filteredInsights.length && (
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setVisibleCount(v => v + 5)}>
                Load more <ChevronDown />
              </button>
            )}
          </div>
        </div>

        {/* Right Side Sidebar */}
        <div className="in-sidebar">
          {/* Donut Chart */}
          <div className="ui-card in-side-card">
            <div className="in-side-header">
              <h3 className="type-heading">Insights overview</h3>
            </div>
            <div className="in-donut-row">
              <div className="in-donut">
                {dynamicPieData.length === 0 && <div className="in-donut-track" />}
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dynamicPieData}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      cornerRadius={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {dynamicPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="in-donut-center">
                  <span className="type-metric">{insights.length}</span>
                  <span className="type-caption">Total</span>
                </div>
              </div>
              <div className="in-legend">
                {dynamicPieData.map((d) => (
                  <div className="in-legend-item" key={d.name}>
                    <span className="in-legend-dot" style={{ backgroundColor: d.color }} />
                    <span className="in-legend-value">{d.value}</span>
                    <span className="in-legend-name">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Line Chart */}
          <div className="ui-card in-side-card">
            <div className="in-side-header">
              {/* Named for what the line really counts */}
              <h3 className="type-heading">Knowledge growth</h3>
            </div>
            <p className="type-caption">Running total of indexed documents and chats, last 6 weeks.</p>
            {!hasTimelineData ? (
              <p className="type-caption">{loading ? "Loading..." : "No documents or chats yet."}</p>
            ) : (
            <div className="in-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--divider)" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fontWeight: 600, fill: "var(--text-tertiary)" }}
                    dy={8}
                  />
                  <YAxis
                    hide
                    domain={[0, "dataMax + 10"]}
                  />
                  <Tooltip
                    content={<InsightsChartTooltip />}
                    cursor={{ stroke: "var(--border-strong)", strokeWidth: 1, strokeDasharray: "3 3" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="val"
                    stroke="var(--accent-fill)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "var(--accent-fill)", stroke: "var(--surface)", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            )}
          </div>

          {/* Progress Bars */}
          <div className="ui-card in-side-card">
            <div className="in-side-header">
              <h3 className="type-heading">Top insight categories</h3>
            </div>
            <div className="in-progress-list">
              {dynamicCategoryProgress.map((cat) => (
                <div className="in-progress-row" key={cat.name}>
                  <div className="in-progress-label">
                    <div
                      className="in-progress-label-icon"
                      style={{ backgroundColor: cat.iconBg, color: cat.iconColor }}
                    >
                      {cat.name === "Operational" && <Code2 size={12} />}
                      {cat.name === "Activity" && <Activity size={12} />}
                      {cat.name === "People" && <Users size={12} />}
                      {cat.name === "Product" && <Sparkles size={12} />}
                      {cat.name === "Risk" && <ShieldAlert size={12} />}
                    </div>
                    {cat.name}
                  </div>
                  <div className="in-progress-bg">
                    <div
                      className="in-progress-fill"
                      style={{ width: `${(cat.value / maxCategoryValue) * 100}%`, backgroundColor: cat.color }}
                    />
                  </div>
                  <div className="in-progress-value">{cat.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Card */}
          <div className="ui-card in-cta-card">
            <div className="in-cta-head">
              <span className="ui-icon-well ui-icon-well--sm">
                <Sparkles />
              </span>
              <div className="in-cta-text">
                <span className="type-heading">Want deeper insights?</span>
                <span className="type-caption">Ask Corely anything about these insights</span>
              </div>
            </div>
            <Link href="/dashboard/ask-corely?q=Analyze+my+recent+insights" className="ui-btn ui-btn--secondary ui-btn--sm">
              Ask Corely <ArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
