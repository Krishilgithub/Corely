"use client";

import React from "react";

// Chart tooltip: surface background, hairline border, 8px radius, 12px semibold text.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="custom-chart-tooltip"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--hairline)",
          borderRadius: "8px",
          padding: "6px 12px",
          boxShadow: "var(--shadow-popover)",
          fontSize: "12px",
          lineHeight: "16px",
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        <p style={{ margin: 0, color: "var(--text-tertiary)", fontSize: "12px", fontWeight: 500, marginBottom: "2px" }}>
          {label}
        </p>
        <p style={{ margin: 0, fontVariantNumeric: "tabular-nums" }}>
          {payload[0].value}
        </p>
      </div>
    );
  }

  return null;
};
