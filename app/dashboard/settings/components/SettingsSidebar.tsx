"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Settings, Building2, Users, Sparkles, Database, 
  Key, Shield, Bell, FileCode2, CreditCard, Sliders, ChevronRight
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
    <div className="set-nav-sidebar" style={{ 
      position: "sticky", 
      top: "0px", 
      display: "flex", 
      flexDirection: "column", 
      gap: "2px",
      paddingRight: "8px"
    }}>
      <div style={{ marginBottom: 28, paddingLeft: 12 }}>
        <h1 className="set-title" style={{ fontSize: 22, fontWeight: 800, color: "#111", letterSpacing: "-0.5px", marginBottom: 6 }}>Settings</h1>
        <p className="set-subtitle" style={{ fontSize: 13, color: "#71717a", fontWeight: 500 }}>Manage your preferences and workspace configurations.</p>
      </div>
      
      {tabConfig.map((tab) => {
        const isActive = currentTabSlug === tab.slug;
        const Icon = tab.icon;
        
        return (
          <Link
            key={tab.slug}
            href={`/dashboard/settings/${tab.slug}`}
            style={{ 
              textDecoration: 'none', 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '10px',
              color: isActive ? '#ff6b00' : '#52525b',
              background: isActive ? '#fff3ee' : 'transparent',
              fontWeight: isActive ? 600 : 500,
              fontSize: '13.5px',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = '#f4f4f5';
                e.currentTarget.style.color = '#111';
              }
            }}
            onMouseOut={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#52525b';
              }
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Icon size={16} strokeWidth={isActive ? 2.5 : 2} style={{ opacity: isActive ? 1 : 0.7 }} />
              {tab.label}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
