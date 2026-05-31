import SettingsSidebar from "./components/SettingsSidebar";
import React from "react";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="settings-outer">
      <div className="settings-layout">
        <aside className="settings-sidebar-col">
          <SettingsSidebar />
        </aside>
        <div className="settings-main-col">
          {children}
        </div>
      </div>
    </div>
  );
}
