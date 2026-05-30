import SettingsSidebar from "./components/SettingsSidebar";
import React from "react";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="db-content" style={{ minHeight: "calc(100vh - 60px)", overflowY: "scroll" }}>
      <div className="set-page-grid" style={{ alignItems: "flex-start", minHeight: 600 }}>
        <SettingsSidebar />
        {children}
      </div>
    </main>
  );
}
