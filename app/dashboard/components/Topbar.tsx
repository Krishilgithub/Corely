"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Sparkles, Bell, ChevronDown, Command, Search, X, Menu, CheckCircle2, Cpu } from "lucide-react";
import { useAuth } from "../../lib/auth-context";

export default function Topbar() {
  const { user, workspace } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifs, setShowNotifs] = useState(false);

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
            <span className="db-notif-badge" aria-label="3 notifications">3</span>
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
                  display: "flex", flexDirection: "column", overflow: "hidden"
                }}
              >
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #e4e4e7", fontWeight: 600, fontSize: 14 }}>Notifications</div>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #f4f4f5", display: "flex", gap: 12 }}>
                  <div style={{ background: "#fef2f2", color: "#ef4444", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Sparkles size={14}/></div>
                  <div><div style={{ fontSize: 13, fontWeight: 500 }}>High Priority Insight</div><div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>Customer churn risk detected in Salesforce data.</div><div style={{ fontSize: 11, color: "#a1a1aa", marginTop: 4 }}>10m ago</div></div>
                </div>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #f4f4f5", display: "flex", gap: 12 }}>
                  <div style={{ background: "#f0fdf4", color: "#16a34a", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><CheckCircle2 size={14}/></div>
                  <div><div style={{ fontSize: 13, fontWeight: 500 }}>Slack Sync Complete</div><div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>Successfully indexed 1,204 messages from #general.</div><div style={{ fontSize: 11, color: "#a1a1aa", marginTop: 4 }}>1h ago</div></div>
                </div>
                <div style={{ padding: "12px 16px", display: "flex", gap: 12 }}>
                  <div style={{ background: "#eff6ff", color: "#3b82f6", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Cpu size={14}/></div>
                  <div><div style={{ fontSize: 13, fontWeight: 500 }}>Workflow Executed</div><div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>Weekly engineering digest has been compiled.</div><div style={{ fontSize: 11, color: "#a1a1aa", marginTop: 4 }}>3h ago</div></div>
                </div>
                <div style={{ padding: "8px 16px", background: "#fafafa", borderTop: "1px solid #e4e4e7", textAlign: "center" }}>
                  <span style={{ fontSize: 12, color: "#ff6b00", fontWeight: 600, cursor: "pointer" }} onClick={() => setShowNotifs(false)}>Mark all as read</span>
                </div>
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
