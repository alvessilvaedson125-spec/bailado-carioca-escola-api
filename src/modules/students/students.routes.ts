import { requireRole } from "../../security/authorize";

export async function handleStudentsRoutes(
  request: Request,
  env: any,
  url: URL,
  user: any
) {
  // =========================
  // LISTAR TODOS
  // =========================
  if (url.pathname === "/api/v1/students" && request.method === "GET") {
    const roleError = requireRole(user, ["admin", "operator"]);
    if (roleError) return roleError;

    const { results } = await env.DB.prepare(`
      SELECT *
      FROM students
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `).all();

    return Response.json({ success: true, data: results });
  }

  // =========================
  // BUSCAR POR ID
  // =========================
  if (
    url.pathname.startsWith("/api/v1/students/") &&
    request.method === "GET"
  ) {
    const roleError = requireRole(user, ["admin", "operator"]);
    if (roleError) return roleError;

    const id = url.pathname.split("/").pop();

    const result = await env.DB.prepare(`
      SELECT * FROM students
      WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first();

    if (!result) {
      return Response.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: result });
  }

  // =========================
  // CRIAR
  // =========================
  if (url.pathname === "/api/v1/students" && request.method === "POST") {
    const roleError = requireRole(user, ["admin", "operator"]);
    if (roleError) return roleError;

    const body = (await request.json()) as any;
    const { name, phone, email } = body;

    if (!name) {
      return Response.json(
        { success: false, message: "Name is required" },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();

    await env.DB.prepare(`
      INSERT INTO students (id, name, phone, email, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(id, name, phone ?? null, email ?? null).run();

    return Response.json({ success: true, id });
  }

  // =========================
  // ATUALIZAR
  // =========================
  if (
    url.pathname.startsWith("/api/v1/students/") &&
    request.method === "PUT"
  ) {
    const roleError = requireRole(user, ["admin", "operator"]);
    if (roleError) return roleError;

    const id   = url.pathname.split("/").pop();
    const body = (await request.json()) as any;

    const existing = await env.DB.prepare(`
      SELECT * FROM students
      WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first();

    if (!existing) {
      return Response.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    // Registra histórico se telefone mudar
    if (existing.phone !== body.phone) {
      await env.DB.prepare(`
        INSERT INTO student_history (
          id, student_id, field, old_value, new_value, changed_by, changed_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        crypto.randomUUID(),
        id,
        "phone",
        existing.phone,
        body.phone,
        user.userId,
        Date.now()
      )
      .run();
    }

    await env.DB.prepare(`
      UPDATE students
      SET name = ?, phone = ?, email = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(body.name, body.phone ?? null, body.email ?? null, id).run();

    return Response.json({ success: true });
  }

  // =========================
  // SOFT DELETE
  // =========================
  if (
    url.pathname.startsWith("/api/v1/students/") &&
    request.method === "DELETE"
  ) {
    const roleError = requireRole(user, ["admin", "operator"]);
    if (roleError) return roleError;

    const id = url.pathname.split("/").pop();

    const existing = await env.DB.prepare(`
      SELECT id FROM students
      WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first();

    if (!existing) {
      return Response.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    await env.DB.prepare(`
      UPDATE students
      SET deleted_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).bind(id).run();

    return Response.json({ success: true });
  }

  return null;
}