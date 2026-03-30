import { requireRole } from "../../security/authorize";

export async function handleTeachersRoutes(
  request: Request,
  env: any,
  url: URL,
  user: any
) {

  // =========================
  // LISTAR
  // =========================
  if (url.pathname === "/api/v1/teachers" && request.method === "GET") {
    const roleError = requireRole(user, ["admin", "operator"]);
    if (roleError) return roleError;

    const { results } = await env.DB.prepare(`
      SELECT * FROM teachers
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `).all();

    return Response.json({ success: true, data: results });
  }

  // =========================
  // CRIAR
  // =========================
  if (url.pathname === "/api/v1/teachers" && request.method === "POST") {
    const roleError = requireRole(user, ["admin"]);
    if (roleError) return roleError;

    const body: any = await request.json();

    // 🔥 Valida name
    if (!body.name) {
      return Response.json(
        { success: false, message: "Name is required" },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();

    await env.DB.prepare(`
      INSERT INTO teachers (id, name, email, phone, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `)
    .bind(
      id,
      body.name,
      body.email  ?? null,
      body.phone  ?? null,
      body.status ?? "active"
    )
    .run();

    return Response.json({ success: true, id });
  }

  // =========================
  // EDITAR
  // =========================
  if (
    url.pathname.startsWith("/api/v1/teachers/") &&
    request.method === "PUT"
  ) {
    const roleError = requireRole(user, ["admin"]);
    if (roleError) return roleError;

    const id   = url.pathname.split("/").pop();
    const body: any = await request.json();

    // 🔥 Verifica existência
    const existing = await env.DB.prepare(`
      SELECT id FROM teachers WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first();

    if (!existing) {
      return Response.json(
        { success: false, message: "Teacher not found" },
        { status: 404 }
      );
    }

    if (!body.name) {
      return Response.json(
        { success: false, message: "Name is required" },
        { status: 400 }
      );
    }

    await env.DB.prepare(`
      UPDATE teachers
      SET name = ?, email = ?, phone = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?
    `)
    .bind(
      body.name,
      body.email  ?? null,
      body.phone  ?? null,
      body.status ?? "active",
      id
    )
    .run();

    return Response.json({ success: true });
  }

  // =========================
  // DELETAR
  // =========================
  if (
    url.pathname.startsWith("/api/v1/teachers/") &&
    request.method === "DELETE"
  ) {
    const roleError = requireRole(user, ["admin"]);
    if (roleError) return roleError;

    const id = url.pathname.split("/").pop();

    // 🔥 Verifica existência
    const existing = await env.DB.prepare(`
      SELECT id FROM teachers WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first();

    if (!existing) {
      return Response.json(
        { success: false, message: "Teacher not found" },
        { status: 404 }
      );
    }

    await env.DB.prepare(`
      UPDATE teachers
      SET deleted_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).bind(id).run();

    return Response.json({ success: true });
  }

  return null;
}