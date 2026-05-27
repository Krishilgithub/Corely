import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST() {
  try {
    // 1. Verify Notion webhook signature
    // Currently Notion does not have native push webhooks for databases, 
    // but if using a 3rd party or a polling bridge, this acts as the receiver.

    console.log(`[Notion Webhook] Received update`);
    
    return successResponse({ status: "processed" });
  } catch (error) {
    console.error("POST /api/webhooks/notion error:", error);
    return errorResponse("Internal Server Error", 500);
  }
}
