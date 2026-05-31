"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Command, Book, MessageCircle, ExternalLink, Keyboard } from "lucide-react";

export default function HelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, type: "spring", damping: 25 }}
          style={{
            background: "var(--db-panel)",
            borderRadius: 16,
            width: "100%",
            maxWidth: 440,
            overflow: "hidden",
            boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--db-bg)" }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--db-text)", display: "flex", alignItems: "center", gap: 8 }}>
              Help & Shortcuts
            </h2>
            <button
              onClick={onClose}
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "#a1a1aa", padding: 4, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f4f4f5")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ padding: "24px" }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Keyboard size={14} /> Keyboard Shortcuts
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#3f3f46", fontWeight: 500 }}>Global Search / Command Palette</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <kbd style={{ background: "#f4f4f5", border: "1px solid #e4e4e7", borderRadius: 4, padding: "2px 6px", fontSize: 12, color: "#52525b", fontFamily: "monospace" }}>Cmd</kbd>
                    <kbd style={{ background: "#f4f4f5", border: "1px solid #e4e4e7", borderRadius: 4, padding: "2px 6px", fontSize: 12, color: "#52525b", fontFamily: "monospace" }}>K</kbd>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#3f3f46", fontWeight: 500 }}>Close Modals</span>
                  <kbd style={{ background: "#f4f4f5", border: "1px solid #e4e4e7", borderRadius: 4, padding: "2px 6px", fontSize: 12, color: "#52525b", fontFamily: "monospace" }}>Esc</kbd>
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
                Resources
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <a href="#" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--db-bg)", border: "1px solid #f0f0f0", borderRadius: 8, textDecoration: "none", color: "#3f3f46", transition: "all 0.15s" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ff6b00"; e.currentTarget.style.background = "#fff3ee"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--db-border)"; e.currentTarget.style.background = "var(--db-bg)"; }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Book size={16} color="#ff6b00" />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Documentation</span>
                  </div>
                  <ExternalLink size={14} color="#a1a1aa" />
                </a>
                <a href="#" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--db-bg)", border: "1px solid #f0f0f0", borderRadius: 8, textDecoration: "none", color: "#3f3f46", transition: "all 0.15s" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ff6b00"; e.currentTarget.style.background = "#fff3ee"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--db-border)"; e.currentTarget.style.background = "var(--db-bg)"; }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <MessageCircle size={16} color="#ff6b00" />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Contact Support</span>
                  </div>
                  <ExternalLink size={14} color="#a1a1aa" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
