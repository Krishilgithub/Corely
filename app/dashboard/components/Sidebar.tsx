"use client";

import { useAuth } from "../../lib/auth-context";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Home,
  MessageSquare,
  Brain,
  BarChart2,
  Link2,
  Users,
  GitBranch,
  Settings,
  ChevronDown,
} from "lucide-react";

const navItems = [
  { icon: Home, label: "Home", href: "/dashboard" },
  { icon: MessageSquare, label: "Ask Corely", href: "/dashboard/ask-corely" },
  { icon: Brain, label: "Memory", href: "/dashboard/memory" },
  { icon: BarChart2, label: "Insights", href: "/dashboard/insights" },
  { icon: Link2, label: "Sources", href: "/dashboard/sources" },
  { icon: Users, label: "Teams", href: "/dashboard/teams" },
  { icon: GitBranch, label: "Workflows", href: "/dashboard/workflows" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [usage, setUsage] = useState({
    plan: "Free",
    isEnterprise: false,
    usagePercent: 0,
    docsIndexed: 0,
    documentLimit: 100,
    queriesThisMonth: 0,
    queryLimit: 500,
  });

  useEffect(() => {
    fetch("/api/usage")
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setUsage(data.data);
        }
      })
      .catch(err => console.error("Failed to fetch usage:", err));
  }, []);

  return (
    <>
      <aside className="db-sidebar">
      <div className="db-sidebar-inner">
        {/* Top: Logo + Nav */}
        <div>
          <Link href="/" className="db-logo-link">
            <Image src="/logo.png" alt="Corely" width={32} height={32} style={{ borderRadius: 8 }} />
            <span className="db-logo-text">Corely</span>
          </Link>

          <nav className="db-nav" aria-label="Dashboard navigation">
            {navItems.map((item, i) => {
              // Match active state either exactly, or if it's the home dashboard
              const isActive = 
                item.href !== "#" && 
                (pathname === item.href || (item.href === "/dashboard" && pathname === "/dashboard"));

              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.03 * i, duration: 0.25, ease: "easeOut" }}
                >
                  <Link
                    href={item.href}
                    className={`db-nav-item${isActive ? " active" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={item.label}
                    onClick={() => {
                      if (typeof document !== "undefined") {
                        document.body.classList.remove("mobile-sidebar-open");
                      }
                    }}
                  >
                    <item.icon size={15} strokeWidth={2} style={{ flexShrink: 0 }} />
                    {item.label}
                  </Link>
                </motion.div>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Plan card + User */}
        <div>
          <motion.div
            className="db-plan-card"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.35 }}
          >
            <div className="db-plan-tag">{usage.isEnterprise ? "Enterprise Plan" : "Free Plan"}</div>
            <div className="db-plan-name">{usage.isEnterprise ? "Unlimited insights" : "Basic insights"}</div>
            <div className="db-plan-row">
              <span>Usage this month</span>
              <span className="db-plan-usage-pct">{usage.usagePercent}%</span>
            </div>
            <div className="db-plan-row" style={{ marginTop: 4, color: "#6b7280", fontSize: 11.5 }}>
              <span>Documents</span>
              <span>{usage.docsIndexed.toLocaleString()} / {usage.documentLimit.toLocaleString()}</span>
            </div>
            <div className="db-plan-row" style={{ color: "#6b7280", fontSize: 11.5 }}>
              <span>Queries</span>
              <span>{usage.queriesThisMonth.toLocaleString()} / {usage.queryLimit.toLocaleString()}</span>
            </div>
            <div className="db-plan-bar-bg">
              <motion.div
                className="db-plan-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${usage.usagePercent}%` }}
                transition={{ delay: 0.7, duration: 1.2, ease: "easeOut" }}
                style={{ 
                  background: usage.usagePercent > 90 ? "#ef4444" : usage.usagePercent > 75 ? "#f59e0b" : "#ff6b00" 
                }}
              />
            </div>
          </motion.div>

          <motion.div
            className="db-user-row"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{ cursor: "pointer", position: "relative" }}
          >
            <div className="db-user-info">
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #ff6b00, #ff9240)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: 13,
                  fontWeight: 900,
                  color: "#fff",
                }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <div className="db-user-name">{user?.name || "User"}</div>
                <div className="db-user-role">{user?.roleName || "Member"}</div>
              </div>
            </div>
            <ChevronDown size={13} style={{ color: "#a1a1aa", flexShrink: 0 }} />
            
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{
                    position: "absolute",
                    bottom: "100%",
                    left: 0,
                    right: 0,
                    marginBottom: 8,
                    background: "var(--db-panel)",
                    borderRadius: 8,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    border: "1px solid #e4e4e7",
                    overflow: "hidden",
                    zIndex: 100,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button 
                    onClick={async () => {
                      await fetch("/api/auth/logout", { method: "POST" });
                      router.push("/login");
                      router.refresh();
                    }}
                    style={{ width: "100%", padding: "12px 16px", textAlign: "left", background: "none", border: "none", color: "#ef4444", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
                  >
                    Log out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
      </aside>
      <div 
        className="db-mobile-overlay" 
        onClick={() => {
          if (typeof document !== "undefined") {
            document.body.classList.remove("mobile-sidebar-open");
          }
        }}
        aria-hidden="true"
      />
    </>
  );
}
