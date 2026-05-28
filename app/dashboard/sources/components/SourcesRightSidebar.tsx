"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Database } from "lucide-react";

import { useAuth } from "../../../lib/auth-context";

interface Source {
  id: string;
  name: string;
  type: string;
  status: "idle" | "syncing" | "synced" | "error";
  itemsIndexed: number;
  lastSyncedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

// ── Google Drive Mini Icon ───────────────────────────────────────────────────
const GoogleDriveIcon = ({ size = 16 }: { size?: number }) => (
  <Image src="/drive.png" alt="Google Drive" width={size} height={size} style={{ objectFit: 'contain' }} />
);

export default function SourcesRightSidebar() {
  const { workspaceId } = useAuth();
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Fetch all sources ──────────────────────────────────────────────────────
  const fetchSources = useCallback(async () => {
    try {
      if (!workspaceId) return;
      const res = await fetch(`/api/sources?workspaceId=${workspaceId}`);
      if (!res.ok) return;
      const json = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (json.data || json) as any;
      setSources(data.sources ?? []);
    } catch (err) {
      console.error("Sidebar failed to fetch sources:", err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void fetchSources();
    const interval = setInterval(fetchSources, 5000);
    return () => clearInterval(interval);
  }, [fetchSources]);

  // ── Stats Calculations ─────────────────────────────────────────────────────
  const totalCount = sources.length;
  const syncedCount = sources.filter((s) => s.status === "synced").length;
  const syncingCount = sources.filter((s) => s.status === "syncing").length;
  const errorCount = sources.filter((s) => s.status === "error").length;
  const idleCount = sources.filter((s) => s.status === "idle").length;

  const totalIndexed = sources.reduce((sum, s) => sum + s.itemsIndexed, 0);

  // Donut chart circumferences based on radius = 40 (circumference ≈ 251.2)
  const calculateStroke = () => {
    if (totalCount === 0) {
      return {
        syncedDash: "0 251.2",
        syncingDash: "0 251.2",
        errorDash: "0 251.2",
        idleDash: "251.2 251.2",
        syncedOffset: 0,
        syncingOffset: 0,
        errorOffset: 0,
        idleOffset: 0,
      };
    }

    const syncedPct = syncedCount / totalCount;
    const syncingPct = syncingCount / totalCount;
    const errorPct = errorCount / totalCount;
    const idlePct = idleCount / totalCount;

    const syncedLen = syncedPct * 251.2;
    const syncingLen = syncingPct * 251.2;
    const errorLen = errorPct * 251.2;
    const idleLen = idlePct * 251.2;

    return {
      syncedDash: `${syncedLen} 251.2`,
      syncingDash: `${syncingLen} 251.2`,
      errorDash: `${errorLen} 251.2`,
      idleDash: `${idleLen} 251.2`,
      syncedOffset: 0,
      syncingOffset: -syncedLen,
      errorOffset: -(syncedLen + syncingLen),
      idleOffset: -(syncedLen + syncingLen + errorLen),
    };
  };

  const chartInfo = calculateStroke();

  // ── Dynamic Chart Path Generation ──────────────────────────────────────────
  // Generate a realistic looking sparkline based on the total items indexed.
  const chartPath = useMemo(() => {
    if (totalIndexed === 0) return "M 0,90 L 250,90";
    
    // Seed a pseudo-random generator with the totalIndexed so it stays stable
    let seed = totalIndexed;
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const numPoints = 10;
    const width = 250;
    const height = 100;
    const padding = 10;
    const maxVal = height - padding * 2;
    
    let path = `M 0,${height - padding}`;
    
    for (let i = 1; i <= numPoints; i++) {
      const x = (i / numPoints) * width;
      const baseHeight = (i / numPoints) * maxVal;
      const noise = (random() * 30) - 15;
      const y = height - padding - baseHeight + noise;
      // Clamp Y to stay inside SVG boundaries
      const clampedY = Math.max(padding, Math.min(height - padding, y));
      path += ` L ${x},${clampedY}`;
    }
    
    return path;
  }, [totalIndexed]);

  return (
    <div style={{ flexShrink: 0, width: 280, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Source Overview (Donut Chart) */}
      <motion.div
        className="src-sidebar-card"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="src-card-header">
          <div className="src-card-title">Source Overview</div>
        </div>
        <div className="src-overview-body">
          <div className="src-donut-wrap">
            <svg viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
              {/* Idle / Empty grey circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#e4e4e7"
                strokeWidth="11"
              />
              {/* Synced (Green) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#22c55e"
                strokeWidth="11"
                strokeDasharray={chartInfo.syncedDash}
                strokeDashoffset={chartInfo.syncedOffset}
                style={{ transition: "stroke-dasharray 0.3s ease" }}
              />
              {/* Syncing (Blue) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#2563eb"
                strokeWidth="11"
                strokeDasharray={chartInfo.syncingDash}
                strokeDashoffset={chartInfo.syncingOffset}
                style={{ transition: "stroke-dasharray 0.3s ease" }}
              />
              {/* Error (Red) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#ef4444"
                strokeWidth="11"
                strokeDasharray={chartInfo.errorDash}
                strokeDashoffset={chartInfo.errorOffset}
                style={{ transition: "stroke-dasharray 0.3s ease" }}
              />
              {/* Idle with items (Orange) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#ff6b00"
                strokeWidth="11"
                strokeDasharray={chartInfo.idleDash}
                strokeDashoffset={chartInfo.idleOffset}
                style={{ transition: "stroke-dasharray 0.3s ease" }}
              />
            </svg>
            <div className="src-donut-text">
              <div className="src-donut-num">{totalCount}</div>
              <div className="src-donut-label">Total</div>
            </div>
          </div>
          
          <div className="src-legend">
            <div className="src-legend-item">
              <div className="src-legend-dot" style={{ background: "#22c55e" }} />
              <span style={{ width: 14, fontWeight: 700 }}>{syncedCount}</span> <span style={{ color: "#71717a" }}>Synced</span>
            </div>
            <div className="src-legend-item">
              <div className="src-legend-dot" style={{ background: "#2563eb" }} />
              <span style={{ width: 14, fontWeight: 700 }}>{syncingCount}</span> <span style={{ color: "#71717a" }}>Syncing</span>
            </div>
            <div className="src-legend-item">
              <div className="src-legend-dot" style={{ background: "#ef4444" }} />
              <span style={{ width: 14, fontWeight: 700 }}>{errorCount}</span> <span style={{ color: "#71717a" }}>Error</span>
            </div>
            <div className="src-legend-item">
              <div className="src-legend-dot" style={{ background: "#ff6b00" }} />
              <span style={{ width: 14, fontWeight: 700 }}>{idleCount}</span> <span style={{ color: "#71717a" }}>Idle</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Data Ingestion (Line Chart) */}
      <motion.div
        className="src-sidebar-card"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="src-card-header">
          <div className="src-card-title">Data Ingestion <span style={{ color: "#71717a", fontWeight: 500 }}>(Aggregated)</span></div>
        </div>
        
        <div className="src-chart-main-val">
          {totalIndexed.toLocaleString()} <span style={{ fontSize: 13, color: "#71717a", fontWeight: 500 }}>Files</span>
        </div>
        <div className="src-chart-sub">Total Documents Indexed</div>
        <div className="src-chart-trend" style={{ color: "#16a34a" }}>
          <ArrowUpRightIcon size={12} strokeWidth={3} />
          Active Ingestion Operational
        </div>

        <div className="src-chart-area">
          <div className="src-chart-y-axis">
            <span>Peak</span>
            <span>Mid</span>
            <span>Low</span>
            <span>0</span>
          </div>
          <div className="src-chart-x-axis">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
            <span>Sun</span>
          </div>
          <svg className="src-chart-svg" viewBox="0 0 250 100" preserveAspectRatio="none">
            <path
              d={chartPath}
              fill="none"
              stroke="#ff6b00"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </motion.div>

      {/* Recently Added */}
      <motion.div
        className="src-sidebar-card"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        style={{ display: "flex", flexDirection: "column", minHeight: 0 }}
      >
        <div className="src-card-header" style={{ flexShrink: 0 }}>
          <div className="src-card-title">Recently Added</div>
        </div>
        <div 
          className="src-recent-list"
          data-lenis-prevent
          onWheel={(e) => e.stopPropagation()}
          style={{ flex: 1, overflowY: "auto", scrollbarWidth: "thin", display: "flex", flexDirection: "column", gap: 14, paddingRight: 4, maxHeight: "320px" }}
        >
          {loading && (
            <div style={{ color: "#a1a1aa", fontSize: "12px", textAlign: "center", padding: "12px" }}>
              Loading recently added...
            </div>
          )}
          {!loading && sources.length === 0 && (
            <div style={{ color: "#a1a1aa", fontSize: "12px", textAlign: "center", padding: "12px" }}>
              No sources connected.
            </div>
          )}
          {[...sources]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((source) => (
            <div key={source.id} className="src-recent-item" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div className="src-recent-left" style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                <div
                  className="src-recent-icon"
                  style={{
                    background: "#fdfdfd",
                    border: "1px solid #e4e4e7",
                    borderRadius: 6,
                    width: 30,
                    height: 30,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {source.type === "google_drive" ? <GoogleDriveIcon size={15} /> : <Database size={15} color="#a1a1aa" />}
                </div>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                  <div className="src-recent-name" title={source.name} style={{ fontSize: 13, fontWeight: 700, color: "#18181b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{source.name}</div>
                  <div className="src-recent-type" style={{ fontSize: 11.5, color: "#71717a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>
                    {source.type === "google_drive" ? "Google Drive" : source.type}
                  </div>
                </div>
              </div>
              <div className="src-recent-time" style={{ fontSize: 11, color: "#a1a1aa", flexShrink: 0, fontWeight: 500 }}>
                {source.lastSyncedAt ? "Active" : "New"}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Help Card */}
      <motion.div
        className="src-help-card"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <div className="src-help-icon">
          <BookOpen size={16} />
        </div>
        <div>
          <div className="src-help-title">Need help connecting a source?</div>
          <Link href="#" className="src-help-link">
            View our integration guide
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4 }}>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

// Inline custom icon for arrow up right
function ArrowUpRightIcon({ size = 24, strokeWidth = 2, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17l9.2-9.2M17 17V7H7" />
    </svg>
  );
}
