"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { SourceLogo } from "@/components/ui/source-logo";

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

/** Documents indexed on one day (UTC), from GET /api/sources/ingestion. */
interface IngestionDay {
  date: string; // YYYY-MM-DD
  documents: number;
}

/** Short weekday name for a YYYY-MM-DD date, e.g. "Mon". */
function weekdayLabel(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString([], { weekday: "short", timeZone: "UTC" });
}

/** Readable name for a source type, e.g. "manual_upload" becomes "Manual upload". */
function sourceTypeLabel(type: string) {
  const known: Record<string, string> = {
    google_drive: "Google Drive", gmail: "Gmail", github: "GitHub", slack: "Slack",
    notion: "Notion", linear: "Linear", manual_upload: "Manual upload",
  };
  if (known[type]) return known[type];
  const t = type.replace(/_/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

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

  // ── Fetch real documents-indexed-per-day for the last 7 days ───────────────
  const [ingestion, setIngestion] = useState<IngestionDay[] | null>(null);
  const [ingestionError, setIngestionError] = useState(false);

  const fetchIngestion = useCallback(async () => {
    try {
      const res = await fetch("/api/sources/ingestion");
      if (!res.ok) throw new Error("Failed to load ingestion");
      const json = await res.json();
      setIngestion(json.data?.days ?? []);
      setIngestionError(false);
    } catch (err) {
      console.error("Sidebar failed to fetch ingestion:", err);
      setIngestionError(true);
    }
  }, []);

  useEffect(() => {
    void fetchIngestion();
    // Counts change slowly, so refresh once a minute.
    const interval = setInterval(fetchIngestion, 60000);
    return () => clearInterval(interval);
  }, [fetchIngestion]);

  // ── Stats Calculations ─────────────────────────────────────────────────────
  const totalCount = sources.length;
  const syncedCount = sources.filter((s) => s.status === "synced").length;
  const syncingCount = sources.filter((s) => s.status === "syncing").length;
  const errorCount = sources.filter((s) => s.status === "error").length;
  const idleCount = sources.filter((s) => s.status === "idle").length;

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

  // ── Chart path from the real daily counts ──────────────────────────────────
  const ingestionTotal = (ingestion ?? []).reduce((sum, d) => sum + d.documents, 0);
  const ingestionMax = Math.max(1, ...(ingestion ?? []).map((d) => d.documents));

  const chartPath = useMemo(() => {
    const days = ingestion ?? [];
    if (days.length < 2) return "M 0,90 L 250,90";
    // Plot area runs from y=90 (0 documents) up to y=10 (the busiest day).
    return days
      .map((d, i) => {
        const x = (i / (days.length - 1)) * 250;
        const y = 90 - (d.documents / ingestionMax) * 80;
        return `${i === 0 ? "M" : "L"} ${x},${y}`;
      })
      .join(" ");
  }, [ingestion, ingestionMax]);

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
          <div className="type-heading">Data ingestion <span className="type-caption">(last 7 days)</span></div>
        </div>
        <div className="ui-card-body">
          <div className="src-chart-head">
            <div className="src-chart-value">
              <span className="type-metric">{ingestion ? ingestionTotal.toLocaleString() : "—"}</span>
              <span className="type-caption">documents</span>
            </div>
            <div className="type-caption">
              {ingestionError ? "Could not load ingestion data." : "Indexed per day (UTC), by each document's latest index time"}
            </div>
            {/* Real status from the sources list, not a fixed message */}
            {(syncingCount > 0 || errorCount > 0) && (
              <div className={`src-kpi__hint src-kpi__hint--${errorCount > 0 ? "error" : "warning"}`}>
                <span className="ui-dot" aria-hidden="true" />
                {errorCount > 0
                  ? `${errorCount} source${errorCount !== 1 ? "s" : ""} need${errorCount === 1 ? "s" : ""} attention`
                  : `${syncingCount} syncing now`}
              </div>
            )}
          </div>

          <div className="src-chart">
            <div className="src-chart__y" aria-hidden="true">
              <span style={{ top: "10%" }}>{ingestionMax.toLocaleString()}</span>
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
              {/* Every second day, so the 4 labels line up with points 1, 3, 5 and 7 */}
              {(ingestion ?? []).filter((_, i) => i % 2 === 0).map((d) => (
                <span key={d.date}>{weekdayLabel(d.date)}</span>
              ))}
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
                  <SourceLogo type={source.type} size={18} tileSize={32} />
                  <div className="src-recent-text">
                    <div className="src-recent-name" title={source.name}>{source.name}</div>
                    <div className="type-caption src-recent-type">
                      {sourceTypeLabel(source.type)}
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
    </div>
  );
}
