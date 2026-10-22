export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "archived";

export type ProjectSummary = {
  id: string;
  name: string;
  key: string | null;
  description: string | null;
  aliases: string[];
  status: ProjectStatus;
  phase: string | null;
  ownerId: string | null;
  teamId: string | null;
  startDate: string | null;
  targetDate: string | null;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; name: string | null; email: string } | null;
  team: { id: string; name: string } | null;
  sourceTypes?: string[];
  counts: { links?: number; documents: number; memories: number; suggestions: number; byType?: Record<string, number>; unread?: number };
  lastActivityAt: string | null;
};

export type ProjectLink = {
  id: string;
  sourceId: string;
  scopeType: string;
  scopeId: string;
  scopeName: string;
  createdAt: string;
  source: { id: string; name: string; type: string; status: string };
};

export type ProjectDetail = ProjectSummary & { links: ProjectLink[]; activity: Array<{ date: string; count: number }> };

export type ProjectOptions = {
  members: Array<{ id: string; name: string | null; email: string }>;
  teams: Array<{ id: string; name: string }>;
  currentUserId: string;
};

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
  archived: "Archived",
};

export const STATUS_TONE: Record<ProjectStatus, "success" | "warning" | "info" | "neutral"> = {
  planning: "info",
  active: "success",
  on_hold: "warning",
  completed: "neutral",
  archived: "neutral",
};

export const PHASES = [
  { value: "discovery", label: "Discovery" },
  { value: "build", label: "Build" },
  { value: "beta", label: "Beta" },
  { value: "launch", label: "Launch" },
  { value: "maintenance", label: "Maintenance" },
];

export const SOURCE_LABEL: Record<string, string> = {
  google_drive: "Google Drive",
  notion: "Notion",
  gmail: "Gmail",
  github: "GitHub",
  slack: "Slack",
  linear: "Linear",
  manual_upload: "Uploads",
};

/** Two-letter initials from a project name or key. */
export function projectInitials(p: { name: string; key: string | null }) {
  if (p.key) return p.key.slice(0, 3);
  const words = p.name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function personName(u: { name: string | null; email: string } | null | undefined) {
  if (!u) return "No owner";
  return u.name || u.email;
}
