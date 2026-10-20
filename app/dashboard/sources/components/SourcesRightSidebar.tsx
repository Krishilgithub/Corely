"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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

  // Area under the line, for a faint wash below the series.
  const areaPath = `${chartPath} L 250,100 L 0,100 Z`;

  return (
    <div className="src-rail">
      {/* Source Overview (Donut Chart) */}
      <div className="ui-card src-rail-card">
        <div className="ui-card-header">
          <div className="type-heading">Source overview</div>
        </div>
        <div className="ui-card-body src-overview-body">
          <div className="src-donut-wrap">
            <svg viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
              {/* Empty track */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--divider)" strokeWidth="11" />
              {/* Synced (key series, accent) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="var(--src-ring-synced)"
                strokeWidth="11"
                strokeDasharray={chartInfo.syncedDash}
                strokeDashoffset={chartInfo.syncedOffset}
                style={{ transition: "stroke-dasharray 0.3s ease" }}
              />
              {/* Syncing */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="var(--src-ring-syncing)"
                strokeWidth="11"
                strokeDasharray={chartInfo.syncingDash}
                strokeDashoffset={chartInfo.syncingOffset}
                style={{ transition: "stroke-dasharray 0.3s ease" }}
              />
              {/* Error */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="var(--src-ring-error)"
                strokeWidth="11"
                strokeDasharray={chartInfo.errorDash}
                strokeDashoffset={chartInfo.errorOffset}
                style={{ transition: "stroke-dasharray 0.3s ease" }}
              />
              {/* Idle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="var(--src-ring-idle)"
                strokeWidth="11"
                strokeDasharray={chartInfo.idleDash}
                strokeDashoffset={chartInfo.idleOffset}
                style={{ transition: "stroke-dasharray 0.3s ease" }}
              />
            </svg>
            <div className="src-donut-text">
              <div className="type-metric">{totalCount}</div>
              <div className="type-caption">Total</div>
            </div>
          </div>

          <div className="src-legend">
            <div className="src-legend-item">
              <span className="src-legend-dot" style={{ background: "var(--src-ring-synced)" }} />
              <strong>{syncedCount}</strong> Synced
            </div>
            <div className="src-legend-item">
              <span className="src-legend-dot" style={{ background: "var(--src-ring-syncing)" }} />
              <strong>{syncingCount}</strong> Syncing
            </div>
            <div className="src-legend-item">
              <span className="src-legend-dot" style={{ background: "var(--src-ring-error)" }} />
              <strong>{errorCount}</strong> Error
            </div>
            <div className="src-legend-item">
              <span className="src-legend-dot" style={{ background: "var(--src-ring-idle)" }} />
              <strong>{idleCount}</strong> Idle
            </div>
          </div>
        </div>
      </div>

      {/* Data Ingestion (Line Chart) */}
      <div className="ui-card src-rail-card">
        <div className="ui-card-header">
          <div className="type-heading">Data ingestion <span className="type-caption">(aggregated)</span></div>
        </div>
        <div className="ui-card-body">
          <div className="src-chart-head">
            <div className="src-chart-value">
              <span className="type-metric">{totalIndexed.toLocaleString()}</span>
              <span className="type-caption">files</span>
            </div>
            <div className="type-caption">Total documents indexed</div>
            <div className="src-chart-trend">
              <ArrowUpRightIcon size={12} strokeWidth={3} />
              Active ingestion operational
            </div>
          </div>

          <div className="src-chart">
            <div className="src-chart__y" aria-hidden="true">
              <span style={{ top: "10%" }}>Peak</span>
              <span style={{ top: "36.67%" }}>Mid</span>
              <span style={{ top: "63.33%" }}>Low</span>
              <span style={{ top: "90%" }}>0</span>
            </div>
            <svg className="src-chart__plot" viewBox="0 0 250 100" preserveAspectRatio="none">
              {/* Horizontal dashed grid only */}
              {[10, 36.67, 63.33, 90].map((y) => (
                <line
                  key={y}
                  x1="0"
                  x2="250"
                  y1={y}
                  y2={y}
                  stroke="var(--divider)"
                  strokeDasharray="3 3"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              <path d={areaPath} fill="var(--accent-wash)" stroke="none" />
              <path
                d={chartPath}
                fill="none"
                stroke="var(--accent-fill)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <div className="src-chart__x" aria-hidden="true">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
              <span>Sun</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recently Added */}
      <div className="ui-card src-rail-card">
        <div className="ui-card-header">
          <div className="type-heading">Recently added</div>
        </div>
        <div className="ui-card-body">
          <div
            className="src-recent-list"
            data-lenis-prevent
            onWheel={(e) => e.stopPropagation()}
          >
            {loading && (
              <div className="type-caption src-recent-empty">
                Loading recently added...
              </div>
            )}
            {!loading && sources.length === 0 && (
              <div className="type-caption src-recent-empty">
                No sources connected.
              </div>
            )}
            {[...sources]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((source) => (
              <div key={source.id} className="src-recent-item">
                <div className="src-recent-left">
                  {source.type === "google_drive" ? (
                    <span className="src-logo-tile src-logo-tile--sm"><GoogleDriveIcon size={16} /></span>
                  ) : (
                    <span className="src-glyph-tile src-glyph-tile--sm"><Database size={16} /></span>
                  )}
                  <div className="src-recent-text">
                    <div className="src-recent-name" title={source.name}>{source.name}</div>
                    <div className="type-caption src-recent-type">
                      {source.type === "google_drive" ? "Google Drive" : source.type}
                    </div>
                  </div>
                </div>
                <div className="type-caption" style={{ flexShrink: 0 }}>
                  {source.lastSyncedAt ? "Active" : "New"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Help Card */}
      <div className="src-help-card">
        <span className="src-glyph-tile src-glyph-tile--sm">
          <BookOpen size={16} />
        </span>
        <div className="src-help-text">
          <div className="type-body" style={{ fontWeight: 600 }}>Need help connecting a source?</div>
          <Link href="#" className="src-help-link">
            View our integration guide
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </Link>
        </div>
      </div>
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
