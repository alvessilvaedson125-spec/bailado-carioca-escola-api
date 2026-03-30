import { verifyJWT } from "./jwt";

export async function requireAuth(request: Request, env: any) {
  const authHeader =
    request.headers.get("Authorization") ||
    request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // 🔥 Retorna Response diretamente — não wrappado em { error }
    return Response.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const payload = await verifyJWT(token, env.JWT_SECRET);

    if (!payload) {
      return Response.json(
        { success: false, message: "Unauthorized (invalid token)" },
        { status: 401 }
      );
    }

    if (!payload.userId || !payload.role) {
      return Response.json(
        { success: false, message: "Unauthorized (invalid payload)" },
        { status: 401 }
      );
    }

    // 🔥 Retorna { user: payload } apenas em caso de sucesso
    return { user: payload };

  } catch (err) {
    console.error("AUTH ERROR:", err);
    return Response.json(
      { success: false, message: "Unauthorized (token error)" },
      { status: 401 }
    );
  }
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