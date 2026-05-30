"use client";

import React from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="custom-chart-tooltip"
        style={{
          background: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(0,0,0,0.05)",
          borderRadius: "8px",
          padding: "8px 12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          fontSize: "12px",
          fontWeight: 600,
          color: "#18181b",
        }}
      >
        <p style={{ margin: 0, color: "#71717a", fontSize: "10px", marginBottom: "4px" }}>
          {label}
        </p>
        <p style={{ margin: 0 }}>
          {payload[0].value}
        </p>
      </div>
    );
  }

  return null;
};
