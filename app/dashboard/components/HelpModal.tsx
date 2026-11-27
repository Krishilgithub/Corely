"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { X, Book, MessageCircle, Keyboard, Sparkles } from "lucide-react";

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
          className="db-help-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          onClick={onClose}
        >
          <motion.div
            className="db-help-modal ui-popover"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-modal-title"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="db-help-head">
              <div className="db-help-brand">
                <span className="ui-icon-well ui-icon-well--sm" aria-hidden="true">
                  <Sparkles />
                </span>
                <div className="db-help-brand-text">
                  <h2 id="help-modal-title" className="type-heading">Help &amp; resources</h2>
                  <p className="type-caption">Shortcuts and ways to get help.</p>
                </div>
              </div>
              <button type="button" className="ui-icon-btn ui-icon-btn--sm" onClick={onClose} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            {/* Body (scrolls inside the modal on short screens) */}
            <div className="db-help-body">
              <section className="db-help-section">
                <div className="db-help-section-title type-label">
                  <Keyboard /> Keyboard shortcuts
                </div>
                <div className="db-help-list">
                  <div className="db-help-row">
                    <span className="type-body">Open the quick menu to jump to a page</span>
                    <div className="db-help-keys">
                      <kbd className="ui-kbd">Cmd/Ctrl</kbd>
                      <kbd className="ui-kbd">K</kbd>
                    </div>
                  </div>
                  <div className="db-help-row">
                    <span className="type-body">Close modals</span>
                    <div className="db-help-keys">
                      <kbd className="ui-kbd">Esc</kbd>
                    </div>
                  </div>
                </div>
              </section>

              <section className="db-help-section">
                <div className="db-help-section-title type-label">Resources</div>
                <div className="db-help-resources">
                  {/* No documentation site exists yet, so this is not a link */}
                  <div className="db-help-resource" aria-disabled="true" title="Not available yet" style={{ opacity: 0.6, cursor: "not-allowed" }}>
                    <div className="db-help-resource-top">
                      <span className="db-row-icon" aria-hidden="true"><Book /></span>
                      <span className="ui-badge ui-badge--neutral">Coming soon</span>
                    </div>
                    <div>
                      <div className="db-help-resource-title">Documentation</div>
                      <div className="type-caption">Guides are not available yet.</div>
                    </div>
                  </div>
                  <Link href="/contact" className="db-help-resource" onClick={onClose}>
                    <div className="db-help-resource-top">
                      <span className="db-row-icon" aria-hidden="true"><MessageCircle /></span>
                    </div>
                    <div>
                      <div className="db-help-resource-title">Contact support</div>
                      <div className="type-caption">Open the contact page to reach our team.</div>
                    </div>
                  </Link>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="db-help-foot type-caption">Corely v0.1.0</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
