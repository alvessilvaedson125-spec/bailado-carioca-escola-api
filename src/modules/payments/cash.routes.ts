import { createCashEntry, listCashEntries } from "../payments/cash.service";

export async function cashRoutes(request: Request, env: any) {

const url = new URL(request.url);

if (request.method === "POST") {
  return createCashEntry(request, env);
}

if (request.method === "GET") {
  return listCashEntries(env);
}

return new Response(JSON.stringify({
  success: false,
  message: "Rota não encontrada"
}), { status: 404 });

}
