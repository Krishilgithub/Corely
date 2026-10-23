"use client";

import { motion } from "framer-motion";
import { Select } from "@/components/ui/select";
import { SourceLogo } from "@/components/ui/source-logo";
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
        className="ui-popover mem-modal-card"
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      >
        <div className="mem-modal-header">
          <h2 className="type-heading">Add to Memory</h2>
        </div>

        <form onSubmit={handleAddMemorySubmit} className="mem-form">
          <div className="mem-form-group">
            <label className="mem-form-label" htmlFor="mem-new-category">Event category</label>
            <Select
              id="mem-new-category"
              aria-label="Event category"
              value={newCategory}
              onChange={(v) => setNewCategory(v as TimelineItem["category"])}
              options={[
                { value: "decision", label: "Decision Captured" },
                { value: "discussion", label: "Discussion Summary" },
                { value: "document", label: "Document Added" },
                { value: "insight", label: "Insight Generated" },
                { value: "knowledge", label: "Knowledge Update" },
              ]}
            />
          </div>

          <div className="mem-form-group">
            <label className="mem-form-label">Title / event type</label>
            <input
              type="text"
              className={`ui-input ${formErrors.title ? "error" : ""}`}
              placeholder="e.g. Decision Captured"
              value={newTitle}
              onChange={(e) => {
                setNewTitle(e.target.value);
                if (formErrors.title) setFormErrors({ ...formErrors, title: undefined });
              }}
            />
            {formErrors.title && <span className="mem-form-error">{formErrors.title}</span>}
          </div>

          <div className="mem-form-group">
            <label className="mem-form-label">Content description</label>
            <textarea
              className={`ui-input mem-form-textarea ${formErrors.content ? "error" : ""}`}
              placeholder="Provide description of what happened..."
              value={newContent}
              onChange={(e) => {
                setNewContent(e.target.value);
                if (formErrors.content) setFormErrors({ ...formErrors, content: undefined });
              }}
            />
            {formErrors.content && <span className="mem-form-error">{formErrors.content}</span>}
          </div>

          <div className="mem-form-group">
            <label className="mem-form-label">Badge tag</label>
            <input
              type="text"
              className="ui-input"
              placeholder="e.g. Marketing Strategy"
              value={newBadge}
              onChange={(e) => setNewBadge(e.target.value)}
            />
          </div>

          <div className="mem-form-group">
            <label className="mem-form-label" htmlFor="mem-new-source">Data source</label>
            <Select
              id="mem-new-source"
              aria-label="Data source"
              value={newSource}
              onChange={(v) => setNewSource(v)}
              options={["Notion", "Slack", "Google Drive", "Corely AI", "HR System"].map((v) => ({
                value: v,
                label: v,
                icon: <SourceLogo type={v} size={14} tile={false} />,
              }))}
            />
          </div>

          <div className="mem-modal-actions">
            <button type="button" className="ui-btn ui-btn--secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </button>
            <button type="submit" className="ui-btn ui-btn--primary">
              Save memory
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
