import { requireRole } from "../../security/authorize";
import { createCashEntry, listCashEntries, cancelCashEntry } from "../payments/cash.service";

export async function cashRoutes(request: Request, env: any, user: any) {
  const url  = new URL(request.url);
  const path = url.pathname;

  // 🔥 CANCELAR
  if (request.method === "POST" && path.endsWith("/cash/cancel")) {
    const roleError = requireRole(user, ["admin"]);
    if (roleError) return roleError;
    return cancelCashEntry(request, env);
  }

  // 🔥 CRIAR
  if (request.method === "POST" && path.endsWith("/cash")) {
    const roleError = requireRole(user, ["admin"]);
    if (roleError) return roleError;
    return createCashEntry(request, env);
  }

  // 🔥 LISTAR
  if (request.method === "GET" && path.endsWith("/cash")) {
    const roleError = requireRole(user, ["admin", "operator"]);
    if (roleError) return roleError;
    return listCashEntries(env);
  }

  return Response.json(
    { success: false, message: "Rota não encontrada" },
    { status: 404 }
  );
}