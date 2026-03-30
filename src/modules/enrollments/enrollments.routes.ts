import { requireRole } from "../../security/authorize";

export async function handleEnrollmentsRoutes(
  request: Request,
  env: any,
  url: URL,
  user: any
) {
  // =========================
  // LISTAR ENROLLMENTS
  // =========================
  if (
    url.pathname === "/api/v1/enrollments" &&
    request.method === "GET"
  ) {
    const roleError = requireRole(user, ["admin", "operator"]);
    if (roleError) return roleError;

    const { results } = await env.DB.prepare(`
      SELECT
        e.*,
        s.name as student_name,
        c.name as class_name,
        c.day_of_week,
        c.start_time,
        u.name as unit_name
      FROM enrollments e
      JOIN students s ON s.id = e.student_id
      JOIN classes c ON c.id = e.class_id
      LEFT JOIN units u ON u.id = c.unit_id
      WHERE e.deleted_at IS NULL
      ORDER BY e.created_at DESC
    `).all();

    return Response.json({ success: true, data: results });
  }

  // =========================
  // CRIAR ENROLLMENT
  // =========================
  if (
    url.pathname === "/api/v1/enrollments" &&
    request.method === "POST"
  ) {
    const roleError = requireRole(user, ["admin", "operator"]);
    if (roleError) return roleError;

    const body = (await request.json()) as any;

    const {
      student_id,
      class_id,
      role,
      type,
      monthly_fee,
      discount,
      status,
      scholarship
    } = body;

    if (!student_id || !class_id) {
      return Response.json(
        { success: false, message: "student_id and class_id are required" },
        { status: 400 }
      );
    }

    const existingEnrollment = await env.DB.prepare(`
      SELECT id FROM enrollments
      WHERE student_id = ?
      AND class_id = ?
      AND deleted_at IS NULL
    `).bind(student_id, class_id).first();

    if (existingEnrollment) {
      return Response.json(
        { success: false, message: "Aluno já matriculado nesta turma" },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();

    try {
      await env.DB.prepare(`
        INSERT INTO enrollments (
          id, student_id, class_id, role, type,
          monthly_fee, discount, status, scholarship,
          created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `)
      .bind(
        id,
        student_id,
        class_id,
        role        || "conductor",
        type        || "individual",
        monthly_fee || 0,
        discount    || 0,
        status      || "active",
        scholarship  ? 1 : 0
      )
      .run();

    } catch (err: any) {
      if (err.message?.includes("UNIQUE")) {
        return Response.json(
          { success: false, message: "Matrícula duplicada bloqueada" },
          { status: 400 }
        );
      }
      throw err;
    }

    return Response.json({ success: true, id });
  }

  // =========================
  // UPDATE ENROLLMENT
  // =========================
  if (
    url.pathname.startsWith("/api/v1/enrollments/") &&
    request.method === "PUT"
  ) {
    const roleError = requireRole(user, ["admin", "operator"]);
    if (roleError) return roleError;

    const id = url.pathname.split("/").pop();
    const body = (await request.json()) as any;

    const {
      student_id,
      class_id,
      role,
      type,
      monthly_fee,
      discount,
      status,
      scholarship
    } = body;

    const existing = await env.DB.prepare(`
      SELECT id FROM enrollments
      WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first();

    if (!existing) {
      return Response.json(
        { success: false, message: "Enrollment not found" },
        { status: 404 }
      );
    }

    await env.DB.prepare(`
      UPDATE enrollments
      SET
        student_id  = COALESCE(?, student_id),
        class_id    = COALESCE(?, class_id),
        role        = COALESCE(?, role),
        type        = COALESCE(?, type),
        monthly_fee = COALESCE(?, monthly_fee),
        discount    = COALESCE(?, discount),
        status      = COALESCE(?, status),
        scholarship = COALESCE(?, scholarship),
        updated_at  = datetime('now')
      WHERE id = ?
    `)
    .bind(
      student_id  ?? null,
      class_id    ?? null,
      role        ?? null,
      type        ?? null,
      monthly_fee ?? null,
      discount    ?? null,
      status      ?? null,
      scholarship !== undefined ? (scholarship ? 1 : 0) : null,
      id
    )
    .run();

    return Response.json({ success: true });
  }

  // =========================
  // SOFT DELETE
  // =========================
  if (
    url.pathname.startsWith("/api/v1/enrollments/") &&
    request.method === "DELETE"
  ) {
    const roleError = requireRole(user, ["admin", "operator"]);
    if (roleError) return roleError;

    const id = url.pathname.split("/").pop();

    const existing = await env.DB.prepare(`
      SELECT id FROM enrollments
      WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first();

    if (!existing) {
      return Response.json(
        { success: false, message: "Enrollment not found" },
        { status: 404 }
      );
    }

    await env.DB.prepare(`
      UPDATE enrollments
      SET deleted_at = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(id).run();

    return Response.json({ success: true });
  }

  return null;
}