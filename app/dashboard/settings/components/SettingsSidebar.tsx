"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Settings, Building2, Users, Sparkles, Database, 
  Key, Shield, Bell, FileCode2, CreditCard, Sliders
} from "lucide-react";

export const tabConfig = [
  { slug: "general", label: "General", icon: Settings },
  { slug: "workspace", label: "Workspace", icon: Building2 },
  { slug: "members", label: "Members", icon: Users },
  { slug: "ai", label: "AI & Intelligence", icon: Sparkles },
  { slug: "sources", label: "Data & Sources", icon: Database },
  { slug: "api-keys", label: "API Keys", icon: Key },
  { slug: "security", label: "Security", icon: Shield },
  { slug: "notifications", label: "Notifications", icon: Bell },
  { slug: "audit-logs", label: "Audit Logs", icon: FileCode2 },
  { slug: "billing", label: "Billing", icon: CreditCard },
  { slug: "advanced", label: "Advanced", icon: Sliders },
];

export default function SettingsSidebar() {
  const pathname = usePathname();
  const currentTabSlug = pathname.split("/").pop() || "general";
  
  return (
    <div className="settings-sidebar-nav">
      <div className="settings-sidebar-header">
        <h1 className="settings-sidebar-title">Settings</h1>
        <p className="settings-sidebar-subtitle">Manage your workspace preferences</p>
      </div>
      
      <nav className="settings-nav-list">
        {tabConfig.map((tab) => {
          const isActive = currentTabSlug === tab.slug;
          const Icon = tab.icon;
          
          return (
            <Link
              key={tab.slug}
              href={`/dashboard/settings/${tab.slug}`}
              className={`settings-nav-item ${isActive ? "active" : ""}`}
            >
              <Icon size={16} className="settings-nav-icon" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
