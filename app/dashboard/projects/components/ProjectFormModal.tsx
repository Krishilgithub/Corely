"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, X, Loader2 } from "lucide-react";
import { PHASES, STATUS_LABEL, type ProjectOptions, type ProjectStatus, type ProjectSummary } from "../types";

type Props = {
  open: boolean;
  project?: ProjectSummary | null; // set when editing
  onClose: () => void;
  onSaved: (project: { id: string }) => void;
};

const toDateInput = (v: string | null | undefined) => (v ? v.slice(0, 10) : "");

export default function ProjectFormModal({ open, project, onClose, onSaved }: Props) {
  const editing = !!project;
  const [options, setOptions] = useState<ProjectOptions | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    key: "",
    description: "",
    aliases: "",
    status: "active" as ProjectStatus,
    phase: "",
    ownerId: "",
    teamId: "",
    startDate: "",
    targetDate: "",
  });

  // Fill the form each time the modal opens.
  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm({
      name: project?.name ?? "",
      key: project?.key ?? "",
      description: project?.description ?? "",
      aliases: (project?.aliases ?? []).join(", "),
      status: project?.status ?? "active",
      phase: project?.phase ?? "",
      ownerId: project?.ownerId ?? "",
      teamId: project?.teamId ?? "",
      startDate: toDateInput(project?.startDate),
      targetDate: toDateInput(project?.targetDate),
    });
    fetch("/api/projects/options")
      .then(r => r.json())
      .then(d => {
        if (!d.success) return;
        setOptions(d.data);
        if (!project) setForm(f => ({ ...f, ownerId: f.ownerId || d.data.currentUserId }));
      })
      .catch(() => {});
  }, [open, project]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(editing ? `/api/projects/${project!.id}` : "/api/projects", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          aliases: form.aliases,
          phase: form.phase || null,
          ownerId: form.ownerId || null,
          teamId: form.teamId || null,
          startDate: form.startDate || null,
          targetDate: form.targetDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Could not save the project");
      onSaved(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the project");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="pj-overlay" onMouseDown={onClose}>
      <form
        className="pj-modal ui-popover"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pj-form-title"
        onMouseDown={e => e.stopPropagation()}
        onSubmit={submit}
      >
        <div className="pj-modal__head">
          <div>
            <div className="pj-modal__title" id="pj-form-title">{editing ? "Edit project" : "New project"}</div>
            <p className="type-subtitle" style={{ marginTop: 2 }}>
              {editing ? "Update the details Corely uses to group this project's knowledge." : "Corely gathers memory for this project from the sources you link to it."}
            </p>
          </div>
          <button type="button" className="ui-icon-btn ui-icon-btn--sm" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="pj-modal__body">
          {error && <div className="pj-error" role="alert">{error}</div>}

          <div className="pj-row">
            <div className="pj-field">
              <label htmlFor="pj-name">Name</label>
              <input id="pj-name" className="ui-input" value={form.name} onChange={set("name")} placeholder="Atlas mobile app" required maxLength={120} autoFocus />
            </div>
            <div className="pj-field">
              <label htmlFor="pj-key">Key</label>
              <input id="pj-key" className="ui-input" value={form.key} onChange={set("key")} placeholder="ATL" maxLength={10} style={{ textTransform: "uppercase" }} />
              <span className="pj-hint">Short code used in tickets and docs.</span>
            </div>
          </div>

          <div className="pj-field">
            <label htmlFor="pj-desc">Description</label>
            <textarea id="pj-desc" className="ui-input" rows={3} value={form.description} onChange={set("description")} maxLength={2000}
              placeholder="What the project is about. Corely uses this to find related content." />
          </div>

          <div className="pj-field">
            <label htmlFor="pj-aliases">Other names</label>
            <input id="pj-aliases" className="ui-input" value={form.aliases} onChange={set("aliases")} placeholder="Atlas, Project A, mobile-v2" />
            <span className="pj-hint">Code names or old names, separated by commas.</span>
          </div>

          <div className="pj-row">
            <div className="pj-field">
              <label htmlFor="pj-status">Status</label>
              <div className="pj-select">
                <select id="pj-status" className="ui-input" value={form.status} onChange={set("status")}>
                  {(Object.keys(STATUS_LABEL) as ProjectStatus[]).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
                <ChevronDown />
              </div>
            </div>
            <div className="pj-field">
              <label htmlFor="pj-phase">Phase</label>
              <div className="pj-select">
                <select id="pj-phase" className="ui-input" value={form.phase} onChange={set("phase")}>
                  <option value="">Not set</option>
                  {PHASES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <ChevronDown />
              </div>
            </div>
          </div>

          <div className="pj-row">
            <div className="pj-field">
              <label htmlFor="pj-owner">Owner</label>
              <div className="pj-select">
                <select id="pj-owner" className="ui-input" value={form.ownerId} onChange={set("ownerId")}>
                  <option value="">No owner</option>
                  {options?.members.map(m => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
                </select>
                <ChevronDown />
              </div>
            </div>
            <div className="pj-field">
              <label htmlFor="pj-team">Team</label>
              <div className="pj-select">
                <select id="pj-team" className="ui-input" value={form.teamId} onChange={set("teamId")}>
                  <option value="">No team</option>
                  {options?.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <ChevronDown />
              </div>
            </div>
          </div>

          <div className="pj-row">
            <div className="pj-field">
              <label htmlFor="pj-start">Start date</label>
              <input id="pj-start" type="date" className="ui-input" value={form.startDate} onChange={set("startDate")} />
            </div>
            <div className="pj-field">
              <label htmlFor="pj-target">Target date</label>
              <input id="pj-target" type="date" className="ui-input" value={form.targetDate} onChange={set("targetDate")} />
            </div>
          </div>
        </div>

        <div className="pj-modal__foot">
          <button type="button" className="ui-btn ui-btn--secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="ui-btn ui-btn--primary" disabled={saving || !form.name.trim()}>
            {saving && <Loader2 className="animate-spin" />}
            {editing ? "Save changes" : "Create project"}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
