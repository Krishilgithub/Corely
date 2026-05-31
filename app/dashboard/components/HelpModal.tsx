"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Book, MessageCircle, ExternalLink, Keyboard, Sparkles } from "lucide-react";

export default function HelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px",
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, type: "spring", damping: 25, stiffness: 300 }}
          style={{
            background: "var(--db-panel)",
            borderRadius: 24,
            width: "100%",
            maxWidth: 480,
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1) inset",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            position: "relative",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Subtle top gradient line */}
          <div style={{ height: 4, width: "100%", background: "linear-gradient(90deg, #ff6b00, #facc15)" }} />
          
          <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--db-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--db-panel)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #fff3ee, #ffe4d6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(255, 107, 0, 0.15)" }}>
                <Sparkles size={20} color="#ff6b00" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--db-text)", letterSpacing: "-0.02em" }}>
                  Help & Resources
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: "#71717a", marginTop: 2 }}>Everything you need to master Corely.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ background: "var(--db-bg)", border: "1px solid var(--db-border)", cursor: "pointer", color: "#a1a1aa", padding: 8, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", transition: "all 0.2s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#f4f4f5"; e.currentTarget.style.color = "#3f3f46"; e.currentTarget.style.transform = "rotate(90deg)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--db-bg)"; e.currentTarget.style.color = "#a1a1aa"; e.currentTarget.style.transform = "rotate(0deg)"; }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ padding: "32px", background: "var(--db-bg)" }}>
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <Keyboard size={14} /> Keyboard Shortcuts
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--db-panel)", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--db-border)" }}>
                  <span style={{ fontSize: 14, color: "var(--db-text)", fontWeight: 500 }}>Global Search / Command Palette</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <kbd style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderBottomWidth: 2, borderRadius: 6, padding: "4px 8px", fontSize: 12, color: "#52525b", fontFamily: "monospace", fontWeight: 600, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>Cmd</kbd>
                    <kbd style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderBottomWidth: 2, borderRadius: 6, padding: "4px 8px", fontSize: 12, color: "#52525b", fontFamily: "monospace", fontWeight: 600, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>K</kbd>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--db-panel)", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--db-border)" }}>
                  <span style={{ fontSize: 14, color: "var(--db-text)", fontWeight: 500 }}>Close Modals</span>
                  <kbd style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderBottomWidth: 2, borderRadius: 6, padding: "4px 8px", fontSize: 12, color: "#52525b", fontFamily: "monospace", fontWeight: 600, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>Esc</kbd>
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
                Resources
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <a href="#" style={{ display: "flex", flexDirection: "column", gap: 12, padding: "20px", background: "var(--db-panel)", border: "1px solid var(--db-border)", borderRadius: 16, textDecoration: "none", color: "var(--db-text)", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)", position: "relative", overflow: "hidden" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ff6b00"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(255, 107, 0, 0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--db-border)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fff3ee", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Book size={16} color="#ff6b00" />
                    </div>
                    <ExternalLink size={14} color="#a1a1aa" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Documentation</div>
                    <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.4 }}>Read our guides and API references.</div>
                  </div>
                </a>
                <a href="#" style={{ display: "flex", flexDirection: "column", gap: 12, padding: "20px", background: "var(--db-panel)", border: "1px solid var(--db-border)", borderRadius: 16, textDecoration: "none", color: "var(--db-text)", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)", position: "relative", overflow: "hidden" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ff6b00"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(255, 107, 0, 0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--db-border)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fff3ee", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <MessageCircle size={16} color="#ff6b00" />
                    </div>
                    <ExternalLink size={14} color="#a1a1aa" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Contact Support</div>
                    <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.4 }}>Get help from our support team.</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
          
          <div style={{ background: "var(--db-panel)", borderTop: "1px solid var(--db-border)", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#a1a1aa" }}>
            Corely v0.1.0 • Made with ❤️
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
