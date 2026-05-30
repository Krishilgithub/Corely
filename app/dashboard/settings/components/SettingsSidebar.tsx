"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

export const tabConfig = [
  { slug: "general", label: "General" },
  { slug: "workspace", label: "Workspace" },
  { slug: "members", label: "Members" },
  { slug: "ai", label: "AI & Intelligence" },
  { slug: "sources", label: "Data & Sources" },
  { slug: "api-keys", label: "API Keys" },
  { slug: "security", label: "Security" },
  { slug: "notifications", label: "Notifications" },
  { slug: "audit-logs", label: "Audit Logs" },
  { slug: "billing", label: "Billing" },
  { slug: "advanced", label: "Advanced" },
];

export default function SettingsSidebar() {
  const pathname = usePathname();
  const currentTabSlug = pathname.split("/").pop() || "general";
  
  const currentTabObj = tabConfig.find(t => t.slug === currentTabSlug) || tabConfig[0];
  const activeTab = currentTabObj.label;

  return (
    <div className="set-nav-sidebar">
      <div style={{ marginBottom: 24 }}>
        <h1 className="set-title" style={{ fontSize: 24 }}>Settings</h1>
        <p className="set-subtitle" style={{ fontSize: 13 }}>Manage your configurations.</p>
      </div>
      {tabConfig.map((tab) => (
        <Link
          key={tab.slug}
          href={`/dashboard/settings/${tab.slug}`}
          className={`set-nav-item ${activeTab === tab.label ? "active" : ""}`}
          style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between' }}
        >
          {tab.label}
          {activeTab === tab.label && <ChevronRight size={14} />}
        </Link>
      ))}
    </div>
  );
}
