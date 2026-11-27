"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import WorkflowsMain, { ownerInitials } from "./WorkflowsMain";
import WorkflowsRightSidebar, { WorkflowTemplate } from "./WorkflowsRightSidebar";
import { useAuth } from "../../../lib/auth-context";
import "../workflows.css";

// ── Types and Interfaces ────────────────────────────────────────────────────
export interface WorkflowItem {
  id: string;
  icon: string;
  iconBg: string;
  iconCol: string;
  title: string;
  desc: string;
  triggerType: "Schedule" | "Event" | "Condition";
  triggerIcon: string;
  triggerDesc: string;
  lastRun: string;
  lastRunTime: string;
  executions: number;
  status: "Active" | "Draft" | "Inactive";
  owner: string;
  ownerBg: string;
  ownerName: string;
}

export interface ActivityItem {
  id: string;
  workflowId: string;
  workflowTitle: string;
  // "recorded" = a manual run was recorded. No actions were executed.
  status: "success" | "running" | "failed" | "recorded";
  timestamp: string; // ISO date string
}



export default function WorkflowsLayout() {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Fetch Data on Mount ─────────────────────────────────────────────────
  const fetchWorkflows = async () => {
    try {
      const res = await fetch("/api/workflows");
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        setWorkflows(data.workflows || []);
        setActivityLogs(data.activities || []);
      }
    } catch (e) {
      console.error("Failed to fetch workflows:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ── Operations & Actions ───────────────────────────────────────────────────
  const handleAddWorkflow = async (newWf: Omit<WorkflowItem, "id" | "executions" | "lastRun" | "lastRunTime">) => {
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWf)
      });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        setWorkflows((prev) => [data.workflow, ...prev]);
        triggerToast(`Successfully created workflow: "${newWf.title}"`);
      }
    } catch (err) {
      console.error("Failed to create workflow:", err);
    }
  };

  const handleEditWorkflow = async (editedWf: WorkflowItem) => {
    try {
      const res = await fetch(`/api/workflows/${editedWf.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedWf)
      });
      if (res.ok) {
        setWorkflows((prev) => prev.map((w) => (w.id === editedWf.id ? editedWf : w)));
        triggerToast(`Updated workflow settings: "${editedWf.title}"`);
      }
    } catch (err) {
      console.error("Failed to update workflow:", err);
    }
  };

  const handleToggleStatus = async (id: string) => {
    const wf = workflows.find((w) => w.id === id);
    if (!wf) return;
    const newStatus: WorkflowItem["status"] = wf.status === "Active" ? "Inactive" : "Active";
    
    try {
      const res = await fetch(`/api/workflows/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setWorkflows((prev) => prev.map((w) => (w.id === id ? { ...w, status: newStatus } : w)));
        triggerToast(`Status changed to ${newStatus}`);
      }
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    try {
      const res = await fetch(`/api/workflows/${id}`, { method: "DELETE" });
      if (res.ok) {
        const title = workflows.find((w) => w.id === id)?.title || "Workflow";
        setWorkflows((prev) => prev.filter((w) => w.id !== id));
        setActivityLogs((prev) => prev.filter((log) => log.workflowId !== id));
        triggerToast(`Deleted workflow: "${title}"`);
      }
    } catch (err) {
      console.error("Failed to delete workflow:", err);
    }
  };

  const handleRunWorkflow = async (id: string) => {
    try {
      const res = await fetch(`/api/workflows/${id}/run`, { method: "POST" });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        let wfTitle = "";
        
        setWorkflows((prev) => prev.map((wf) => {
          if (wf.id === id) {
            wfTitle = wf.title;
            const now = new Date();
            return {
              ...wf,
              executions: wf.executions + 1,
              lastRun: now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
              lastRunTime: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            };
          }
          return wf;
        }));

        if (data.activity) {
          setActivityLogs((prev) => [data.activity, ...prev]);
        }

        triggerToast(`Run recorded for "${wfTitle}". Actions are not executed yet.`);
      }
    } catch (err) {
      console.error("Failed to run workflow:", err);
    }
  };

  // A template becomes a Draft owned by the signed-in user, with the template's own trigger.
  const handleUseTemplate = async (tpl: WorkflowTemplate) => {
    await handleAddWorkflow({
      icon: tpl.icon,
      iconBg: tpl.bg,
      iconCol: tpl.col,
      title: tpl.title,
      desc: tpl.desc,
      triggerType: tpl.triggerType,
      triggerIcon: tpl.triggerType === "Schedule" ? "Clock" : "Zap",
      triggerDesc: tpl.triggerDesc,
      status: "Draft",
      owner: ownerInitials(user?.name),
      ownerBg: "#0ea5e9",
      ownerName: user?.name || "User"
    });
  };

  return (
    <div className="wf-page-grid">
      {isLoading ? (
        <div className="wf-loading" style={{ gridColumn: "1 / -1" }}>
          <div className="wf-loading__col">
            <div className="ui-skeleton" style={{ height: 100, borderRadius: 16 }} />
            <div className="ui-skeleton" style={{ height: 100, borderRadius: 16 }} />
            <div className="ui-skeleton" style={{ height: 100, borderRadius: 16 }} />
            <div className="ui-skeleton" style={{ height: 100, borderRadius: 16 }} />
          </div>
          <div className="wf-loading__col">
            <div className="ui-skeleton" style={{ height: 200, borderRadius: 16 }} />
            <div className="ui-skeleton" style={{ height: 300, borderRadius: 16 }} />
          </div>
        </div>
      ) : (
        <>
          <WorkflowsMain
            workflows={workflows}
            onRun={handleRunWorkflow}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDeleteWorkflow}
            onAdd={handleAddWorkflow}
            onEdit={handleEditWorkflow}
          />
          <WorkflowsRightSidebar
            activityLogs={activityLogs}
            onUseTemplate={handleUseTemplate}
          />
        </>
      )}

      {/* Floating System Toasts */}
      <AnimatePresence>
        {toastMessage && (
          <div className="wf-toast-container">
            <motion.div
              className="wf-toast"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <CheckCircle2 size={16} />
              <span>{toastMessage}</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
