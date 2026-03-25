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
      SELECT e.*, s.name as student_name, c.name as class_name
      FROM enrollments e
      JOIN students s ON s.id = e.student_id
      JOIN classes c ON c.id = e.class_id
      WHERE e.deleted_at IS NULL
      ORDER BY e.created_at DESC
    `).all();

    return Response.json({
      success: true,
      data: results,
    });
  }

  // =========================
  // CRIAR ENROLLMENT
  // =========================
  if (
  url.pathname === "/api/v1/enrollments" &&
  request.method === "POST"
) {
  const roleError = requireRole(user, ["admin"]);
  if (roleError) return roleError;

  const body = (await request.json()) as any;

  const {
    student_id,
    class_id,
    role,
    type,
    monthly_fee,
    discount,
    status
  } = body;

  if (!student_id || !class_id) {
    return Response.json(
      { success: false, message: "student_id and class_id are required" },
      { status: 400 }
    );
  }

  // 🚨 BLOQUEIO DE DUPLICIDADE (ANTES DO INSERT)
  const existingEnrollment = await env.DB.prepare(`
    SELECT id FROM enrollments
    WHERE student_id = ?
    AND class_id = ?
    AND deleted_at IS NULL
  `)
    .bind(student_id, class_id)
    .first();

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
        id,
        student_id,
        class_id,
        role,
        type,
        monthly_fee,
        discount,
        status,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `)
    .bind(
      id,
      student_id,
      class_id,
      role || "conductor",
      type || "individual",
      monthly_fee || 0,
      discount || 0,
      status || "active"
    )
    .run();

  } catch (err: any) {

    // 🔥 fallback caso UNIQUE INDEX dispare
    if (err.message?.includes("UNIQUE")) {
      return Response.json(
        { success: false, message: "Matrícula duplicada bloqueada" },
        { status: 400 }
      );
    }

    throw err;
  }

  return Response.json({
    success: true,
    id,
  });
}

  // =========================
// UPDATE ENROLLMENT
// =========================
if (
  url.pathname.startsWith("/api/v1/enrollments/") &&
  request.method === "PUT"
) {
  const roleError = requireRole(user, ["admin"]);
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
  status
} = body;

  const existing = await env.DB.prepare(`
    SELECT id FROM enrollments
    WHERE id = ? AND deleted_at IS NULL
  `)
    .bind(id)
    .first();

  if (!existing) {
    return Response.json(
      { success: false, message: "Enrollment not found" },
      { status: 404 }
    );
  }

  await env.DB.prepare(`
  UPDATE enrollments
  SET
    student_id = ?,
    class_id = ?,
    role = ?,
    type = ?,
    monthly_fee = ?,
    discount = ?,
    status = ?,
    updated_at = datetime('now')
  WHERE id = ?
`)
.bind(
  student_id,
  class_id,
  role || "conductor",
  type || "individual",
  monthly_fee || 0,
  discount || 0,
  status || "active",
  id
)
.run();

  return Response.json({
    success: true,
  });
}

  // =========================
  // SOFT DELETE
  // =========================
  if (
    url.pathname.startsWith("/api/v1/enrollments/") &&
    request.method === "DELETE"
  ) {
    const roleError = requireRole(user, ["admin"]);
    if (roleError) return roleError;

    const id = url.pathname.split("/").pop();

    const existing = await env.DB.prepare(`
      SELECT id FROM enrollments
      WHERE id = ? AND deleted_at IS NULL
    `)
      .bind(id)
      .first();

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
    `)
      .bind(id)
      .run();

    return Response.json({
      success: true,
    });
  }

  return null;
}