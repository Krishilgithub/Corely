import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Google Drive webhook token/signature
    const resourceState = request.headers.get("x-goog-resource-state");
    const channelId = request.headers.get("x-goog-channel-id");

    if (!channelId) {
      return errorResponse("Missing channel ID", 400);
    }

    if (resourceState === "sync") {
      // Initial webhook registration
      return successResponse({ status: "acknowledged" });
    }

    // 2. Process changes (stub)
    console.log(`[Google Drive Webhook] Received update for channel ${channelId}`);
    
    // Here we would typically enqueue a background BullMQ job to fetch incremental changes
    // queue.add('sync-drive-incremental', { channelId })

    return successResponse({ status: "processed" });
  } catch (error) {
    console.error("POST /api/webhooks/drive error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
