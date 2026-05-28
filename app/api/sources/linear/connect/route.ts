import { NextRequest, NextResponse } from "next/server";
import { auth, encrypt } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { user, workspace } = await auth();
    
    const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const redirectUri = `${origin}/api/sources/linear/callback`;
    
    const nonce = Math.random().toString(36).substring(2);
    const payload = await encrypt({
      workspaceId: workspace.id,
      userId: user.id,
      nonce
    });
    
    const state = Buffer.from(payload).toString("base64url");
    
    // Mock redirect to callback
    return NextResponse.redirect(`${redirectUri}?state=${state}`);
  } catch (err) {
    console.error("[Linear Connect Error]", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
