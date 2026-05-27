"use client";

import { Brain } from "lucide-react";
import { Skeleton } from "./components/Skeleton";

export default function DashboardLoading() {
  return (
    <div style={{ padding: 32, width: "100%", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "#fff3ee", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Brain size={24} color="#ff6b00" />
        </div>
        <div>
          <Skeleton width={200} height={28} style={{ marginBottom: 8 }} />
          <Skeleton width={300} height={16} />
        </div>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 24, marginBottom: 48 }}>
        <Skeleton height={100} borderRadius={16} />
        <Skeleton height={100} borderRadius={16} />
        <Skeleton height={100} borderRadius={16} />
        <Skeleton height={100} borderRadius={16} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Skeleton height={80} borderRadius={12} />
          <Skeleton height={80} borderRadius={12} />
          <Skeleton height={80} borderRadius={12} />
          <Skeleton height={80} borderRadius={12} />
          <Skeleton height={80} borderRadius={12} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <Skeleton height={200} borderRadius={16} />
          <Skeleton height={200} borderRadius={16} />
        </div>
      </div>
    </div>
  );
}
