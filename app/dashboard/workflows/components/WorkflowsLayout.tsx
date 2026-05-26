"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import WorkflowsMain from "./WorkflowsMain";
import WorkflowsRightSidebar from "./WorkflowsRightSidebar";
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
  status: "success" | "running" | "failed";
  timestamp: string;
}

const INITIAL_WORKFLOWS: WorkflowItem[] = [
  {
    id: "wf-1",
    icon: "Mail",
    iconBg: "#eff6ff",
    iconCol: "#3b82f6",
    title: "Daily Executive Digest",
    desc: "Sends AI-powered daily summary to executives",
    triggerType: "Schedule",
    triggerIcon: "Clock",
    triggerDesc: "Daily at 8:00 AM",
    lastRun: "May 12, 2025",
    lastRunTime: "8:01 AM",
    executions: 312,
    status: "Active",
    owner: "JD",
    ownerBg: "#c2410c",
    ownerName: "Jane Doe"
  },
  {
    id: "wf-2",
    icon: "Video",
    iconBg: "#f3e8ff",
    iconCol: "#9333ea",
    title: "Meeting Summary Automation",
    desc: "Generate summaries and action items",
    triggerType: "Event",
    triggerIcon: "Zap",
    triggerDesc: "Meeting Ended",
    lastRun: "May 12, 2025",
    lastRunTime: "7:43 AM",
    executions: 245,
    status: "Active",
    owner: "KS",
    ownerBg: "#0ea5e9",
    ownerName: "Krishil Shah"
  },
  {
    id: "wf-3",
    icon: "Cloud",
    iconBg: "#dcfce7",
    iconCol: "#16a34a",
    title: "CRM Update Assistant",
    desc: "Auto-enrich and update CRM records",
    triggerType: "Event",
    triggerIcon: "Zap",
    triggerDesc: "New Email",
    lastRun: "May 12, 2025",
    lastRunTime: "7:21 AM",
    executions: 389,
    status: "Active",
    owner: "AM",
    ownerBg: "#db2777",
    ownerName: "Alex Morgan"
  },
  {
    id: "wf-4",
    icon: "Headphones",
    iconBg: "#ffedd5",
    iconCol: "#ea580c",
    title: "Support Ticket Triage",
    desc: "Categorize and route support tickets",
    triggerType: "Event",
    triggerIcon: "Zap",
    triggerDesc: "New Ticket",
    lastRun: "May 12, 2025",
    lastRunTime: "6:58 AM",
    executions: 178,
    status: "Active",
    owner: "TR",
    ownerBg: "#4f46e5",
    ownerName: "Taylor Rogers"
  },
  {
    id: "wf-5",
    icon: "DollarSign",
    iconBg: "#fee2e2",
    iconCol: "#ef4444",
    title: "Sales Opportunity Alerts",
    desc: "Notify team about high-value opportunities",
    triggerType: "Condition",
    triggerIcon: "LayoutGrid",
    triggerDesc: "Deal > $50K",
    lastRun: "May 12, 2025",
    lastRunTime: "6:34 AM",
    executions: 96,
    status: "Active",
    owner: "JD",
    ownerBg: "#c2410c",
    ownerName: "Jane Doe"
  },
  {
    id: "wf-6",
    icon: "Users",
    iconBg: "#f3e8ff",
    iconCol: "#9333ea",
    title: "HR Onboarding Flow",
    desc: "Automate new hire onboarding process",
    triggerType: "Event",
    triggerIcon: "Zap",
    triggerDesc: "New Employee",
    lastRun: "May 11, 2025",
    lastRunTime: "5:12 PM",
    executions: 24,
    status: "Active",
    owner: "KS",
    ownerBg: "#0ea5e9",
    ownerName: "Krishil Shah"
  },
  {
    id: "wf-7",
    icon: "LineChart",
    iconBg: "#ffedd5",
    iconCol: "#ea580c",
    title: "Product Feedback Analysis",
    desc: "Analyze and summarize product feedback",
    triggerType: "Schedule",
    triggerIcon: "Clock",
    triggerDesc: "Daily at 10:00 AM",
    lastRun: "May 11, 2025",
    lastRunTime: "10:01 AM",
    executions: 156,
    status: "Draft",
    owner: "AM",
    ownerBg: "#db2777",
    ownerName: "Alex Morgan"
  },
  {
    id: "wf-8",
    icon: "FileText",
    iconBg: "#fee2e2",
    iconCol: "#ef4444",
    title: "Expense Report Review",
    desc: "Review and approve expense reports",
    triggerType: "Event",
    triggerIcon: "Zap",
    triggerDesc: "Report Submitted",
    lastRun: "—",
    lastRunTime: "",
    executions: 0,
    status: "Draft",
    owner: "TR",
    ownerBg: "#4f46e5",
    ownerName: "Taylor Rogers"
  }
];

const INITIAL_ACTIVITIES: ActivityItem[] = [
  { id: "act-1", workflowId: "wf-1", workflowTitle: "Daily Executive Digest", status: "success", timestamp: "2 min ago" },
  { id: "act-2", workflowId: "wf-3", workflowTitle: "CRM Update Assistant", status: "success", timestamp: "7 min ago" },
  { id: "act-3", workflowId: "wf-2", workflowTitle: "Meeting Summary Automation", status: "running", timestamp: "12 min ago" },
  { id: "act-4", workflowId: "wf-4", workflowTitle: "Support Ticket Triage", status: "failed", timestamp: "18 min ago" },
  { id: "act-5", workflowId: "wf-5", workflowTitle: "Sales Opportunity Alerts", status: "success", timestamp: "32 min ago" }
];

export default function WorkflowsLayout() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>(INITIAL_WORKFLOWS);
  const [activityLogs, setActivityLogs] = useState<ActivityItem[]>(INITIAL_ACTIVITIES);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── Hydrate State on Mount ─────────────────────────────────────────────────
  useEffect(() => {
    try {
      const rawWorkflows = localStorage.getItem("corely-workflows");
      if (rawWorkflows) {
        const parsed = JSON.parse(rawWorkflows);
        if (Array.isArray(parsed)) {
          setWorkflows(parsed);
        }
      } else {
        localStorage.setItem("corely-workflows", JSON.stringify(INITIAL_WORKFLOWS));
      }
    } catch (e) {
      console.error("Failed to hydrate workflows:", e);
    }

    try {
      const rawActivity = localStorage.getItem("corely-workflow-activity");
      if (rawActivity) {
        const parsed = JSON.parse(rawActivity);
        if (Array.isArray(parsed)) {
          setActivityLogs(parsed);
        }
      } else {
        localStorage.setItem("corely-workflow-activity", JSON.stringify(INITIAL_ACTIVITIES));
      }
    } catch (e) {
      console.error("Failed to hydrate workflow activity logs:", e);
    }
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ── Operations & Actions ───────────────────────────────────────────────────
  const handleAddWorkflow = (newWf: Omit<WorkflowItem, "id" | "executions" | "lastRun" | "lastRunTime">) => {
    const item: WorkflowItem = {
      ...newWf,
      id: `wf-${Date.now()}`,
      executions: 0,
      lastRun: "—",
      lastRunTime: ""
    };

    setWorkflows((prev) => {
      const updated = [item, ...prev];
      localStorage.setItem("corely-workflows", JSON.stringify(updated));
      return updated;
    });

    triggerToast(`Successfully created workflow: "${item.title}"`);
  };

  const handleEditWorkflow = (editedWf: WorkflowItem) => {
    setWorkflows((prev) => {
      const updated = prev.map((w) => (w.id === editedWf.id ? editedWf : w));
      localStorage.setItem("corely-workflows", JSON.stringify(updated));
      return updated;
    });

    triggerToast(`Updated workflow settings: "${editedWf.title}"`);
  };

  const handleToggleStatus = (id: string) => {
    let newStatus: WorkflowItem["status"] = "Active";
    setWorkflows((prev) => {
      const updated = prev.map((w) => {
        if (w.id === id) {
          newStatus = w.status === "Active" ? "Inactive" : "Active";
          return { ...w, status: newStatus };
        }
        return w;
      });
      localStorage.setItem("corely-workflows", JSON.stringify(updated));
      return updated;
    });

    triggerToast(`Status changed to ${newStatus}`);
  };

  const handleDeleteWorkflow = (id: string) => {
    let title = "";
    setWorkflows((prev) => {
      const target = prev.find((w) => w.id === id);
      title = target ? target.title : "Workflow";
      const updated = prev.filter((w) => w.id !== id);
      localStorage.setItem("corely-workflows", JSON.stringify(updated));
      return updated;
    });

    // Also clean up matches inside activity logs (cascade simulation)
    setActivityLogs((prev) => {
      const updated = prev.filter((log) => log.workflowId !== id);
      localStorage.setItem("corely-workflow-activity", JSON.stringify(updated));
      return updated;
    });

    triggerToast(`Deleted workflow: "${title}"`);
  };

  const handleRunWorkflow = (id: string) => {
    let wfTitle = "";
    setWorkflows((prev) => {
      const updated = prev.map((wf) => {
        if (wf.id === id) {
          wfTitle = wf.title;
          const now = new Date();
          const lastRunStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          const lastRunTimeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          return {
            ...wf,
            executions: wf.executions + 1,
            lastRun: lastRunStr,
            lastRunTime: lastRunTimeStr
          };
        }
        return wf;
      });
      localStorage.setItem("corely-workflows", JSON.stringify(updated));
      return updated;
    });

    const newLog: ActivityItem = {
      id: `act-${Date.now()}`,
      workflowId: id,
      workflowTitle: wfTitle || "Workflow",
      status: "success",
      timestamp: "Just now"
    };

    setActivityLogs((prev) => {
      const updated = [newLog, ...prev];
      localStorage.setItem("corely-workflow-activity", JSON.stringify(updated));
      return updated;
    });

    triggerToast(`Triggered execution run for: "${wfTitle}"`);
  };

  const handleUseTemplate = (title: string, desc: string, icon: string, bg: string, col: string) => {
    const newWf: WorkflowItem = {
      id: `wf-${Date.now()}`,
      icon,
      iconBg: bg,
      iconCol: col,
      title,
      desc,
      triggerType: "Event",
      triggerIcon: "Zap",
      triggerDesc: "Template Created",
      lastRun: "—",
      lastRunTime: "",
      executions: 0,
      status: "Draft",
      owner: "KS",
      ownerBg: "#0ea5e9",
      ownerName: "Krishil Shah"
    };

    setWorkflows((prev) => {
      const updated = [newWf, ...prev];
      localStorage.setItem("corely-workflows", JSON.stringify(updated));
      return updated;
    });

    triggerToast(`Cloned template workflow: "${title}"`);
  };

  const handleImportWorkflow = () => {
    // Simulate importing a workflow
    const imported: WorkflowItem = {
      id: `wf-imported-${Date.now()}`,
      icon: "Cloud",
      iconBg: "#dcfce7",
      iconCol: "#16a34a",
      title: "Imported Analytics Sync",
      desc: "Synchronizes usage metadata logs and generates metric alerts",
      triggerType: "Schedule",
      triggerIcon: "Clock",
      triggerDesc: "Hourly at :00",
      lastRun: "—",
      lastRunTime: "",
      executions: 0,
      status: "Draft",
      owner: "KS",
      ownerBg: "#0ea5e9",
      ownerName: "Krishil Shah"
    };

    setWorkflows((prev) => {
      const updated = [imported, ...prev];
      localStorage.setItem("corely-workflows", JSON.stringify(updated));
      return updated;
    });

    triggerToast(`Imported workflow: "${imported.title}" successfully`);
  };

  return (
    <div className="wf-page-grid" style={{ width: "100%" }}>
      <WorkflowsMain
        workflows={workflows}
        onRun={handleRunWorkflow}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDeleteWorkflow}
        onAdd={handleAddWorkflow}
        onEdit={handleEditWorkflow}
        onImport={handleImportWorkflow}
      />
      <WorkflowsRightSidebar
        activityLogs={activityLogs}
        onUseTemplate={handleUseTemplate}
      />

      {/* Floating System Toasts */}
      <AnimatePresence>
        {toastMessage && (
          <div className="wf-toast-container">
            <motion.div
              className="wf-toast"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <CheckCircle2 size={16} style={{ color: "#ff6b00" }} />
              <span>{toastMessage}</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
