"use client";

import { motion } from "framer-motion";
import { TimelineItem } from "../types";
import "../memory.css";

interface AddMemoryModalProps {
  newCategory: TimelineItem["category"];
  setNewCategory: (c: TimelineItem["category"]) => void;
  newTitle: string;
  setNewTitle: (t: string) => void;
  newContent: string;
  setNewContent: (c: string) => void;
  newBadge: string;
  setNewBadge: (b: string) => void;
  newSource: string;
  setNewSource: (s: string) => void;
  formErrors: { title?: string; content?: string };
  setFormErrors: (errors: { title?: string; content?: string }) => void;
  handleAddMemorySubmit: (e: React.FormEvent) => void;
  setShowAddModal: (s: boolean) => void;
}

export function AddMemoryModal({
  newCategory,
  setNewCategory,
  newTitle,
  setNewTitle,
  newContent,
  setNewContent,
  newBadge,
  setNewBadge,
  newSource,
  setNewSource,
  formErrors,
  setFormErrors,
  handleAddMemorySubmit,
  setShowAddModal
}: AddMemoryModalProps) {
  return (
    <div className="mem-modal-overlay">
      <motion.div
        className="mem-modal-card"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <h2 className="mem-modal-title">Add to Memory</h2>
        
        <form onSubmit={handleAddMemorySubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="mem-form-group">
            <label className="mem-form-label">Event Category</label>
            <select
              className="mem-form-select"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as TimelineItem["category"])}
            >
              <option value="decision">Decision Captured</option>
              <option value="discussion">Discussion Summary</option>
              <option value="document">Document Added</option>
              <option value="insight">Insight Generated</option>
              <option value="knowledge">Knowledge Update</option>
            </select>
          </div>

          <div className="mem-form-group">
            <label className="mem-form-label">Title / Event Type</label>
            <input
              type="text"
              className={`mem-form-input ${formErrors.title ? "error" : ""}`}
              placeholder="e.g. Decision Captured"
              value={newTitle}
              onChange={(e) => {
                setNewTitle(e.target.value);
                if (formErrors.title) setFormErrors({ ...formErrors, title: undefined });
              }}
            />
            {formErrors.title && <span className="mem-form-error" style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{formErrors.title}</span>}
          </div>

          <div className="mem-form-group">
            <label className="mem-form-label">Content Description</label>
            <textarea
              className={`mem-form-textarea ${formErrors.content ? "error" : ""}`}
              placeholder="Provide description of what happened..."
              value={newContent}
              onChange={(e) => {
                setNewContent(e.target.value);
                if (formErrors.content) setFormErrors({ ...formErrors, content: undefined });
              }}
            />
            {formErrors.content && <span className="mem-form-error" style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{formErrors.content}</span>}
          </div>

          <div className="mem-form-group">
            <label className="mem-form-label">Badge Tag</label>
            <input
              type="text"
              className="mem-form-input"
              placeholder="e.g. Marketing Strategy"
              value={newBadge}
              onChange={(e) => setNewBadge(e.target.value)}
            />
          </div>

          <div className="mem-form-group">
            <label className="mem-form-label">Data Source</label>
            <select
              className="mem-form-select"
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
            >
              <option value="Notion">Notion</option>
              <option value="Slack">Slack</option>
              <option value="Google Drive">Google Drive</option>
              <option value="Corely AI">Corely AI</option>
              <option value="HR System">HR System</option>
            </select>
          </div>

          <div className="mem-modal-actions">
            <button type="button" className="mem-cancel-btn" onClick={() => setShowAddModal(false)}>
              Cancel
            </button>
            <button type="submit" className="mem-submit-btn">
              Save Memory
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
