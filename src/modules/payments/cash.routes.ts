import { createCashEntry, listCashEntries, cancelCashEntry } from "../payments/cash.service";

export async function cashRoutes(request: Request, env: any) {
  const url = new URL(request.url);
  const path = url.pathname;

  // 🔥 CANCELAR
  if (request.method === "POST" && path.endsWith("/cash/cancel")) {
    return cancelCashEntry(request, env);
  }

  // 🔥 CRIAR
  if (request.method === "POST" && path.endsWith("/cash")) {
    return createCashEntry(request, env);
  }

  // 🔥 LISTAR
  if (request.method === "GET" && path.endsWith("/cash")) {
    return listCashEntries(env);
  }

  return new Response(JSON.stringify({
    success: false,
    message: "Rota não encontrada"
  }), { status: 404 });
}