import SettingsSidebar from "./components/SettingsSidebar";
import React from "react";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="db-content">
      <div className="set-page-grid">
        <SettingsSidebar />
        {children}
      </div>
    </main>
  );
}
