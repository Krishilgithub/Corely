"use client";

import { useAuth } from "../../lib/auth-context";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, type ComponentType } from "react";
import {
  Home,
  MessageSquare,
  FolderKanban,
  Library,
  Link2,
  Building2,
  Settings,
  ChevronDown,
  ChevronsUpDown,
  PanelLeftClose,
  X,
  LogOut,
  User,
} from "lucide-react";
import CorelyLogo from "@/components/icons/corely-logo";

// ── Navigation model ────────────────────────────────────────────────────────
type NavChild = { label: string; href: string };
type NavItem =
  | { kind: "link"; label: string; icon: ComponentType<{ strokeWidth?: number }>; href: string }
  | { kind: "group"; label: string; icon: ComponentType<{ strokeWidth?: number }>; children: NavChild[] }
  | { kind: "divider" };

const NAV: NavItem[] = [
  { kind: "link", label: "Home", icon: Home, href: "/dashboard" },
  { kind: "link", label: "Ask Corely", icon: MessageSquare, href: "/dashboard/ask-corely" },
  { kind: "link", label: "Projects", icon: FolderKanban, href: "/dashboard/projects" },
  {
    kind: "group",
    label: "Knowledge",
    icon: Library,
    children: [
      { label: "Memory", href: "/dashboard/memory" },
      { label: "Insights", href: "/dashboard/insights" },
    ],
  },
  { kind: "link", label: "Sources", icon: Link2, href: "/dashboard/sources" },
  {
    kind: "group",
    label: "Workspace",
    icon: Building2,
    children: [
      { label: "Teams", href: "/dashboard/teams" },
      { label: "Workflows", href: "/dashboard/workflows" },
    ],
  },
  { kind: "divider" },
  { kind: "link", label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

// Home matches only itself; every other link also matches its sub-pages.
function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function closeMobileSidebar() {
  if (typeof document !== "undefined") {
    document.body.classList.remove("mobile-sidebar-open");
  }
}

// ── Branch connector: the tree line next to a group's children ───────────────
// Each child row is 32px tall. The active branch is drawn on top in orange.
function BranchConnector({ count, activeIndex }: { count: number; activeIndex: number }) {
  if (count <= 0) return null;
  const height = 32 * count - 8;
  const path =
    `M0.75 0V12 M24.75 24H8.75C4.33 24 0.75 20.42 0.75 16V12` +
    Array.from({ length: count - 1 }, (_, i) => {
      const y = 56 + i * 32;
      return ` M0.75 12V${y - 8}C0.75 ${y - 3.92} 4.33 ${y} 8.75 ${y}H24.75`;
    }).join("");
  const activeY = 24 + activeIndex * 32;
  const activePath =
    activeIndex >= 0 ? `M0.75 0V${activeY - 8}C0.75 ${activeY - 3.92} 4.33 ${activeY} 8.75 ${activeY}H24.75` : null;

  return (
    <svg
      className="db-branch"
      width="26"
      height={height + 20}
      viewBox={`0 -20 26 ${height + 20}`}
      fill="none"
      aria-hidden="true"
    >
      <path d={path} className="db-branch-track" strokeWidth="1.5" />
      {activePath && <path d={activePath} className="db-branch-active" strokeWidth="1.5" />}
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [usage, setUsage] = useState({
    plan: "Free",
    isEnterprise: false,
    usagePercent: 0,
    docsIndexed: 0,
    documentLimit: 100,
    queriesThisMonth: 0,
    queryLimit: 500,
  });

  // Groups start open.
  const [open, setOpen] = useState<Record<string, boolean>>({
    Knowledge: true,
    Workspace: true,
  });

  // Opening a page inside a closed group opens that group.
  useEffect(() => {
    for (const item of NAV) {
      if (item.kind === "group" && item.children.some(c => isActivePath(pathname, c.href))) {
        setOpen(prev => (prev[item.label] ? prev : { ...prev, [item.label]: true }));
      }
    }
  }, [pathname]);

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

  // The boot script in app/layout.tsx sets data-sidebar before paint; read it back.
  useEffect(() => {
    setCollapsed(document.documentElement.getAttribute("data-sidebar") === "collapsed");
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (next) document.documentElement.setAttribute("data-sidebar", "collapsed");
    else document.documentElement.removeAttribute("data-sidebar");
    try { localStorage.setItem("corely-sidebar", next ? "collapsed" : "expanded"); } catch {}
  };

  // Close the user menu on an outside click.
  useEffect(() => {
    if (!showUserMenu) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showUserMenu]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const planLabel = usage.isEnterprise
    ? "Enterprise"
    : (usage.plan || "Free").replace(/^\w/, c => c.toUpperCase());
  const barColor =
    usage.usagePercent > 90 ? "var(--error)" : usage.usagePercent > 75 ? "var(--warning)" : "var(--accent-fill)";
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <>
      <aside className="db-sidebar" aria-label="Sidebar">
        <div className="db-sidebar-inner">
          {/* Header: logo, wordmark, collapse */}
          <div className="db-sidebar-header">
            <Link href="/" className="db-logo-link">
              <span className="db-logo-tile">
                <CorelyLogo size={18} />
              </span>
              <span className="db-logo-text">Corely</span>
            </Link>
            <button
              type="button"
              className="db-collapse-btn"
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <PanelLeftClose size={18} />
            </button>
            <button
              type="button"
              className="ui-icon-btn ui-icon-btn--sm db-drawer-close"
              onClick={closeMobileSidebar}
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="db-nav" aria-label="Dashboard navigation">
            {NAV.map((item, idx) => {
              if (item.kind === "divider") {
                return <hr key={`divider-${idx}`} className="db-nav-divider" />;
              }

              const Icon = item.icon;

              if (item.kind === "link") {
                const active = isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`db-nav-item${active ? " active" : ""}`}
                    aria-current={active ? "page" : undefined}
                    title={item.label}
                    onClick={closeMobileSidebar}
                  >
                    <Icon strokeWidth={2} />
                    <span className="db-nav-item-label">{item.label}</span>
                  </Link>
                );
              }

              // Group with children
              const activeIndex = item.children.findIndex(c => isActivePath(pathname, c.href));
              const groupActive = activeIndex >= 0;
              const isOpen = !!open[item.label];
              const panelId = `nav-group-${item.label.toLowerCase()}`;

              return (
                <div key={item.label} className="db-nav-group">
                  {/* In the collapsed rail the group icon jumps to its first page. */}
                  <Link
                    href={item.children[0].href}
                    className={`db-nav-item db-nav-group-rail${groupActive ? " active" : ""}`}
                    title={item.label}
                    onClick={closeMobileSidebar}
                  >
                    <Icon strokeWidth={2} />
                  </Link>
                  <button
                    type="button"
                    className={`db-nav-item db-nav-group-toggle${groupActive ? " active" : ""}`}
                    onClick={() => setOpen(prev => ({ ...prev, [item.label]: !prev[item.label] }))}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                  >
                    <Icon strokeWidth={2} />
                    <span className="db-nav-item-label">{item.label}</span>
                    <ChevronDown className="db-nav-chevron" data-open={isOpen ? "true" : "false"} />
                  </button>

                  {isOpen && (
                    <div id={panelId} className="db-subnav">
                      <BranchConnector count={item.children.length} activeIndex={activeIndex} />
                      {item.children.map((child, i) => {
                        const childActive = i === activeIndex;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`db-subnav-link${childActive ? " active" : ""}`}
                            aria-current={childActive ? "page" : undefined}
                            onClick={closeMobileSidebar}
                          >
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Footer: plan, log out, account */}
          <div className="db-sidebar-footer">
            <div className="db-plan-card">
              <div className="db-plan-head">
                <span className="db-plan-tag">{planLabel} plan</span>
                <span className="db-plan-usage-pct">{usage.usagePercent}%</span>
              </div>
              <div className="db-plan-row">
                <span>Documents</span>
                <span><strong>{usage.docsIndexed.toLocaleString()}</strong> / {usage.documentLimit.toLocaleString()}</span>
              </div>
              <div className="db-plan-row">
                <span>Queries</span>
                <span><strong>{usage.queriesThisMonth.toLocaleString()}</strong> / {usage.queryLimit.toLocaleString()}</span>
              </div>
              <div className="db-plan-bar-bg">
                <div className="db-plan-bar-fill" style={{ width: `${Math.min(100, usage.usagePercent)}%`, background: barColor }} />
              </div>
            </div>

            <button type="button" className="db-logout-row" onClick={logout} title="Log out">
              <LogOut strokeWidth={2} />
              <span className="db-nav-item-label">Log out</span>
            </button>

            <div ref={menuRef} className="db-user-wrap">
              <button
                type="button"
                className="db-user-row"
                onClick={() => setShowUserMenu(v => !v)}
                aria-haspopup="menu"
                aria-expanded={showUserMenu}
                title={user?.name || "Account"}
              >
                <span className="db-user-info">
                  <span className="db-user-avatar">{initial}</span>
                  <span className="db-user-text" style={{ minWidth: 0 }}>
                    <span className="db-user-name" style={{ display: "block" }}>{user?.name || "User"}</span>
                    <span className="db-user-role" style={{ display: "block" }}>{user?.roleName || "Member"}</span>
                  </span>
                </span>
                <ChevronsUpDown className="db-user-chevron" size={16} style={{ color: "var(--icon-secondary)", flexShrink: 0 }} />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    className="db-user-menu ui-popover"
                    role="menu"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                  >
                    <div className="db-user-menu-head">
                      <span className="type-body" style={{ fontWeight: 600, display: "block" }}>{user?.name || "User"}</span>
                      <span className="type-caption" style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email}</span>
                    </div>
                    <Link
                      href="/dashboard/profile"
                      className="ui-menu-item"
                      role="menuitem"
                      onClick={() => { setShowUserMenu(false); closeMobileSidebar(); }}
                    >
                      <User /> Profile
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="ui-menu-item"
                      role="menuitem"
                      onClick={() => { setShowUserMenu(false); closeMobileSidebar(); }}
                    >
                      <Settings /> Settings
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </aside>
      <div
        className="db-mobile-overlay"
        onClick={closeMobileSidebar}
        aria-hidden="true"
      />
    </>
  );
}
