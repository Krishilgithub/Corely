import { prisma } from "./db";

export type NotificationType = "Bell" | "Sparkles" | "CheckCircle2" | "AlertTriangle" | "Cpu" | "UserPlus" | "Database";

export async function createNotification(data: {
  workspaceId: string;
  userId?: string; // If omitted, creates a broadcast notification for all users in workspace
  title: string;
  message: string;
  iconType?: NotificationType;
  link?: string;
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        workspaceId: data.workspaceId,
        userId: data.userId || null,
        title: data.title,
        message: data.message,
        iconType: data.iconType || "Bell",
        link: data.link,
      },
    });
    return notification;
  } catch (error) {
    console.error("[Notifications] Failed to create notification:", error);
    return null;
  }
}
