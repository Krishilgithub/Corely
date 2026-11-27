import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    // Note: Drive change notifications are not processed yet. The token is not
    // checked and no sync is started. We say so in the response instead of
    // claiming the change was processed.
    const resourceState = request.headers.get("x-goog-resource-state");
    const channelId = request.headers.get("x-goog-channel-id");

    if (!channelId) {
      return errorResponse("Missing channel ID", 400);
    }

    if (resourceState === "sync") {
      // Initial webhook registration
      return successResponse({ status: "acknowledged" });
    }

    console.log(`[Google Drive Webhook] Received update for channel ${channelId}. Ignored: processing is not built yet.`);

    // 202 = received but not acted on. Users sync manually with "Sync now" for now.
    return successResponse({ status: "ignored", reason: "webhook processing not implemented" }, 202);
  } catch (error) {
    console.error("POST /api/webhooks/drive error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
