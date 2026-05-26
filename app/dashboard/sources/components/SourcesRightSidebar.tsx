"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function SourcesRightSidebar() {
  return (
    <div style={{ flexShrink: 0 }}>
      {/* Source Overview (Donut Chart) */}
      <motion.div
        className="src-sidebar-card"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="src-card-header">
          <div className="src-card-title">Source Overview</div>
          <Link href="#" className="src-card-view-all">View details</Link>
        </div>
        <div className="src-overview-body">
          <div className="src-donut-wrap">
            <svg viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
              {/* Purple (Disabled) - 2/9 = 22.2% = 70.3 circumference */}
              {/* Yellow (Warning) - 1/9 = 11.1% = 35.1 circumference */}
              {/* Green (Healthy) - 6/9 = 66.7% = 211.2 circumference */}
              {/* Total circumference of r=40 is ~251.2 */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#8b5cf6" strokeWidth="12" strokeDasharray="70.3 251.2" strokeDashoffset="0" />
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#eab308" strokeWidth="12" strokeDasharray="35.1 251.2" strokeDashoffset="-70.3" />
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#22c55e" strokeWidth="12" strokeDasharray="145.8 251.2" strokeDashoffset="-105.4" />
            </svg>
            <div className="src-donut-text">
              <div className="src-donut-num">9</div>
              <div className="src-donut-label">Total</div>
            </div>
          </div>
          <div className="src-legend">
            <div className="src-legend-item">
              <div className="src-legend-dot" style={{ background: "#22c55e" }} />
              <span style={{ width: 14 }}>6</span> <span style={{ color: "#3f3f46" }}>Healthy</span>
            </div>
            <div className="src-legend-item">
              <div className="src-legend-dot" style={{ background: "#eab308" }} />
              <span style={{ width: 14 }}>1</span> <span style={{ color: "#3f3f46" }}>Warning</span>
            </div>
            <div className="src-legend-item">
              <div className="src-legend-dot" style={{ background: "#ef4444" }} />
              <span style={{ width: 14 }}>0</span> <span style={{ color: "#3f3f46" }}>Error</span>
            </div>
            <div className="src-legend-item">
              <div className="src-legend-dot" style={{ background: "#8b5cf6" }} />
              <span style={{ width: 14 }}>2</span> <span style={{ color: "#3f3f46" }}>Disabled</span>
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
          <div className="src-card-title">Data Ingestion <span style={{ color: "#71717a", fontWeight: 500 }}>(Last 7 Days)</span></div>
          <Link href="#" className="src-card-view-all">View analytics</Link>
        </div>
        
        <div className="src-chart-main-val">2.4 <span style={{ fontSize: 18 }}>TB</span></div>
        <div className="src-chart-sub">Total Data Ingested</div>
        <div className="src-chart-trend">
          <ArrowUpRightIcon size={12} strokeWidth={3} />
          +18% vs previous 7 days
        </div>

        <div className="src-chart-area">
          {/* Y Axis */}
          <div className="src-chart-y-axis">
            <span>750 GB</span>
            <span>500 GB</span>
            <span>250 GB</span>
            <span>0</span>
          </div>
          {/* X Axis */}
          <div className="src-chart-x-axis">
            <span>May 5</span>
            <span>May 8</span>
            <span>May 10</span>
            <span>May 12</span>
          </div>
          {/* Chart SVG */}
          <svg className="src-chart-svg" viewBox="0 0 250 100" preserveAspectRatio="none">
            <path
              d="M 0,80 L 30,85 L 60,65 L 90,80 L 120,40 L 150,60 L 180,30 L 210,45 L 240,10 L 250,5"
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
      >
        <div className="src-card-header">
          <div className="src-card-title">Recently Added</div>
          <Link href="#" className="src-card-view-all">View all</Link>
        </div>
        <div className="src-recent-list">
          <div className="src-recent-item">
            <div className="src-recent-left">
              <div className="src-recent-icon">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19" stroke="#29b5e8" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <div className="src-recent-name">Snowflake</div>
                <div className="src-recent-type">Data Warehouse</div>
              </div>
            </div>
            <div className="src-recent-time">20 min ago</div>
          </div>
          <div className="src-recent-item">
            <div className="src-recent-left">
              <div className="src-recent-icon">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <circle cx="12" cy="12" r="5" fill="#ff7a59" />
                  <circle cx="19" cy="6" r="3" fill="#ff7a59" />
                  <circle cx="5" cy="18" r="3" fill="#ff7a59" />
                  <circle cx="5" cy="6" r="3" fill="#ff7a59" />
                  <path d="M16.5 8L15 9.5M7.5 16l1.5-1.5M7.5 8l1.5 1.5" stroke="#ff7a59" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <div className="src-recent-name">HubSpot</div>
                <div className="src-recent-type">Marketing</div>
              </div>
            </div>
            <div className="src-recent-time">25 min ago</div>
          </div>
          <div className="src-recent-item">
            <div className="src-recent-left">
              <div className="src-recent-icon">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M15 2H9v5h6V2zM15 17H9v5h6v-5zM22 9h-5v6h5V9zM7 9H2v6h5V9z" fill="#4285f4" />
                  <path d="M9 2v5H4V2h5zm0 15v5H4v-5h5zm11-15v5h-5V2h5zm0 15v5h-5v-5h5z" fill="#ea4335" />
                  <path d="M15 7h2v2h-2V7zm0 8h2v2h-2v-2zM7 7h2v2H7V7zm0 8h2v2H7v-2z" fill="#fbbc04" />
                  <path d="M10 10h4v4h-4v-4z" fill="#34a853" />
                </svg>
              </div>
              <div>
                <div className="src-recent-name">Google Calendar</div>
                <div className="src-recent-type">Calendar</div>
              </div>
            </div>
            <div className="src-recent-time">2 days ago</div>
          </div>
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
