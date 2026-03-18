import { verifyJWT } from "./jwt";

export async function requireAuth(request: Request, env: any) {

  const authHeader =
    request.headers.get("Authorization") ||
    request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return Response.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const token = authHeader.replace("Bearer ", "");

  const payload = await verifyJWT(token, env.JWT_SECRET);

  if (!payload) {
    return Response.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  return { user: payload };
}

export function requireRole(user: any, allowedRoles: string[]) {

  if (!user || !user.role) {
    return Response.json(
      { success: false, message: "Forbidden" },
      { status: 403 }
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return Response.json(
      { success: false, message: "Forbidden" },
      { status: 403 }
    );
  }

  return null;
}