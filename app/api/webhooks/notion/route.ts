import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Note: Notion webhooks are not processed yet. The signature is not checked
    // and no sync is started. We say so in the response instead of claiming
    // the update was processed.
    console.log(`[Notion Webhook] Received update. Ignored: processing is not built yet.`);

    // 202 = received but not acted on. Users sync manually with "Sync now" for now.
    return successResponse({ status: "ignored", reason: "webhook processing not implemented" }, 202);
  } catch (error) {
    console.error("POST /api/webhooks/notion error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
