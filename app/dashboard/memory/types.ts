export interface TimelineItem {
  id: string;
  time: string;
  // The last four come from project memory (see lib/project-memory.ts).
  category: "decision" | "discussion" | "document" | "insight" | "knowledge" | "risk" | "milestone" | "question" | "fact";
  title: string;
  content: string;
  badges: string[];
  sourceName: string;
  avatarUrl: string;
  date: string;
  url?: string | null;
  // Raw ISO time, used for real "this month" counts.
  createdAt: string;
  // True for synced Documents. They can only be removed from Sources.
  isSyncedDocument?: boolean;
}

export interface SnapshotItem {
  id: string;
  title: string;
  date: string;
  isLatest?: boolean;
}

export interface MemoryStats {
  totalMemories: number;
  totalDecisions: number;
  totalDiscussions: number;
  totalDocuments: number;
  totalKnowledge: number;
  totalInsight: number;
  totalActiveKnowledgeSets: number;
  addedThisMonth: number;
}

export interface SourceChartData {
  name: string;
  count: number;
  color: string;
  dash: string;
  offset: number;
}
