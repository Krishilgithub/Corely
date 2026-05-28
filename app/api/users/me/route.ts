import { auth } from "@/lib/auth-server";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const { user, workspace } = await auth();
    
    return successResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleId: user.roleId,
        roleName: user.workspaceRole?.name || (user.role === "admin" ? "Admin" : "Member"),
        permissions: user.workspaceRole?.permissions || [],
      },
      workspace,
    });
  } catch {
    return errorResponse("Unauthorized", 401);
  }
}
