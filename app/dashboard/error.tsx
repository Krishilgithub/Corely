"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      height: "100%", 
      minHeight: "500px",
      padding: 32,
      textAlign: "center"
    }}>
      <div style={{ 
        width: 64, 
        height: 64, 
        borderRadius: "50%", 
        background: "#fef2f2", 
        color: "#ef4444", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        marginBottom: 24
      }}>
        <AlertTriangle size={32} />
      </div>
      
      <h2 style={{ fontSize: 24, fontWeight: 700, color: "#18181b", marginBottom: 12 }}>
        Something went wrong!
      </h2>
      
      <p style={{ color: "#71717a", maxWidth: 400, marginBottom: 32, lineHeight: 1.5 }}>
        We encountered an unexpected error while loading this page. Our team has been notified.
      </p>
      
      <button
        onClick={() => reset()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#ff6b00",
          color: "white",
          padding: "10px 20px",
          borderRadius: 8,
          fontWeight: 600,
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(255, 107, 0, 0.2)",
          transition: "transform 0.1s, background 0.2s"
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = "#e55a00")}
        onMouseOut={(e) => (e.currentTarget.style.background = "#ff6b00")}
        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.96)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <RefreshCw size={16} />
        Try again
      </button>
    </div>
  );
}
