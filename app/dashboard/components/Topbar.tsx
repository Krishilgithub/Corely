"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Sparkles, Bell, ChevronDown, Command, Search, X, Menu, CheckCircle2, Cpu, AlertTriangle, UserPlus, Database } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { formatDistanceToNow } from "date-fns";

interface AppNotification {
  id: string;
  title: string;
  message: string;
  iconType: string;
  isRead: boolean;
  createdAt: string;
}

export default function Topbar() {
  const { user, workspace } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter((n: AppNotification) => !n.isRead).length);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      setShowNotifs(false);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const markAsRead = async (id: string, currentIsRead: boolean) => {
    if (currentIsRead) return;
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const renderIcon = (type: string) => {
    const props = { size: 14 };
    switch (type) {
      case "Sparkles": return <Sparkles {...props} />;
      case "CheckCircle2": return <CheckCircle2 {...props} />;
      case "AlertTriangle": return <AlertTriangle {...props} />;
      case "Cpu": return <Cpu {...props} />;
      case "UserPlus": return <UserPlus {...props} />;
      case "Database": return <Database {...props} />;
      default: return <Bell {...props} />;
    }
  };

  const getIconStyles = (type: string) => {
    switch (type) {
      case "Sparkles": return { bg: "#fef2f2", color: "#ef4444" };
      case "CheckCircle2": return { bg: "#f0fdf4", color: "#16a34a" };
      case "AlertTriangle": return { bg: "#fefce8", color: "#eab308" };
      case "Cpu": return { bg: "#eff6ff", color: "#3b82f6" };
      case "UserPlus": return { bg: "#f5f3ff", color: "#8b5cf6" };
      case "Database": return { bg: "#fff7ed", color: "#f97316" };
      default: return { bg: "#f4f4f5", color: "#71717a" };
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  return (
    <motion.header
      className="db-topbar"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <button 
          className="db-hamburger-btn" 
          aria-label="Toggle menu"
          onClick={() => {
            if (typeof document !== "undefined") {
              document.body.classList.toggle("mobile-sidebar-open");
            }
          }}
        >
          <Menu size={20} />
        </button>

        {/* Workspace Switcher */}
        <button className="db-ws-btn" aria-label="Switch workspace">
          <Building2 size={13} style={{ color: "#71717a" }} />
          <span>{workspace?.name || "Workspace"}</span>
          <ChevronDown size={12} style={{ color: "#a1a1aa" }} />
        </button>
      </div>

      {/* AI Search */}
      <button 
        className="db-search-bar" 
        onClick={() => setShowSearch(true)}
        aria-label="Global search"
        style={{ border: "none", cursor: "pointer", background: "white" }}
      >
        <div className="db-search-inner">
          <Sparkles size={14} style={{ color: "#ff6b00", flexShrink: 0 }} />
          <span className="db-search-text">Ask anything about your company...</span>
        </div>
        <div className="db-search-kbd">
          <Command size={9} />
          <span>K</span>
        </div>
      </button>

      {/* Right Actions */}
      <div className="db-topbar-right">
        {/* Notifications */}
        <div style={{ position: "relative" }}>
            <button 
              className="db-notif-btn" 
              aria-label="Notifications"
              onClick={() => setShowNotifs(!showNotifs)}
            >
              <Bell size={15} />
              {unreadCount > 0 && (
                <span className="db-notif-badge" aria-label={`${unreadCount} notifications`}>{unreadCount}</span>
              )}
            </button>
            
            <AnimatePresence>
              {showNotifs && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: "absolute", top: "100%", right: 0, marginTop: 12,
                    background: "#fff", border: "1px solid #e4e4e7", borderRadius: 12,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.08)", zIndex: 50, width: 320,
                    display: "flex", flexDirection: "column", overflow: "hidden",
                    maxHeight: 400
                  }}
                >
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #e4e4e7", fontWeight: 600, fontSize: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    Notifications
                    {unreadCount > 0 && (
                      <span style={{ fontSize: 11, background: "#fef2f2", color: "#ef4444", padding: "2px 6px", borderRadius: 100 }}>{unreadCount} new</span>
                    )}
                  </div>
                  
                  <div style={{ overflowY: "auto", flex: 1 }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: 24, textAlign: "center", color: "#a1a1aa", fontSize: 13 }}>
                        <Bell size={24} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map(notif => {
                        const style = getIconStyles(notif.iconType);
                        return (
                          <div 
                            key={notif.id} 
                            onClick={() => markAsRead(notif.id, notif.isRead)}
                            style={{ 
                              padding: "12px 16px", 
                              borderBottom: "1px solid #f4f4f5", 
                              display: "flex", 
                              gap: 12,
                              background: notif.isRead ? "transparent" : "#fafafa",
                              cursor: "pointer",
                              transition: "background 0.2s"
                            }}
                          >
                            <div style={{ background: style.bg, color: style.color, width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {renderIcon(notif.iconType)}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: notif.isRead ? 500 : 600, color: "#18181b" }}>{notif.title}</div>
                              <div style={{ fontSize: 12, color: "#71717a", marginTop: 2, lineHeight: 1.4 }}>{notif.message}</div>
                              <div style={{ fontSize: 11, color: "#a1a1aa", marginTop: 4 }}>
                                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                              </div>
                            </div>
                            {!notif.isRead && (
                              <div style={{ width: 6, height: 6, background: "#ff6b00", borderRadius: "50%", alignSelf: "center", marginLeft: "auto", flexShrink: 0 }} />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {notifications.length > 0 && unreadCount > 0 && (
                    <div style={{ padding: "8px 16px", background: "#fafafa", borderTop: "1px solid #e4e4e7", textAlign: "center" }}>
                      <span style={{ fontSize: 12, color: "#ff6b00", fontWeight: 600, cursor: "pointer" }} onClick={markAllAsRead}>
                        Mark all as read
                      </span>
                    </div>
                  )}
                </motion.div>
            )}
          </AnimatePresence>
        </div>



        {/* Avatar */}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #ff6b00, #ff9240)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 900,
            color: "#fff",
            cursor: "pointer",
            border: "1.5px solid #ebebeb",
          }}
          aria-label="User profile"
        >
          {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "U"}
        </div>
      </div>

      <AnimatePresence>
        {showSearch && (
          <div className="global-search-overlay" onClick={() => setShowSearch(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '10vh' }}>
            <motion.div 
              className="global-search-modal"
              initial={{ scale: 0.95, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 640, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #f4f4f5' }}>
                <Search size={20} color="#a1a1aa" style={{ marginRight: 16 }} />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Ask anything about your company..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16, background: 'transparent', color: "#18181b" }} 
                />
                <button onClick={() => setShowSearch(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>
                  <X size={20} color="#a1a1aa" />
                </button>
              </div>
              <div style={{ padding: 24, minHeight: 200, color: '#71717a', fontSize: 14 }}>
                {searchQuery.trim() ? (
                  <div style={{ textAlign: 'center', paddingTop: 32 }}>
                    <Sparkles size={24} color="#ff6b00" style={{ margin: '0 auto 12px' }} />
                    <p>Searching for &quot;{searchQuery}&quot;...</p>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 600, color: '#3f3f46', marginBottom: 12, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Suggested Searches</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {['What was the decision on Q3 marketing budget?', 'Find onboarding documents for new engineers', 'Who is the owner of the CRM Update Assistant workflow?'].map(q => (
                        <button key={q} onClick={() => setSearchQuery(q)} style={{ textAlign: 'left', padding: '8px 12px', background: '#f4f4f5', border: 'none', borderRadius: 8, color: '#3f3f46', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#e4e4e7'} onMouseOut={e => e.currentTarget.style.background = '#f4f4f5'}>
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
