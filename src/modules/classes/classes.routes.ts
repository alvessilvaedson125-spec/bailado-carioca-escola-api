import { requireRole } from "../../security/authorize";

export async function handleClassesRoutes(
  request: Request,
  env: any,
  url: URL,
  user: any
) {
  // LISTAR TODAS
  if (url.pathname === "/api/v1/classes" && request.method === "GET") {
    const roleError = requireRole(user, ["admin", "operator"]);
    if (roleError) return roleError;

    
   const { results } = await env.DB.prepare(`
SELECT
  c.id,
  c.name,
  c.description,
  c.teacher_id,
  c.unit_id,
  c.day_of_week,
  c.start_time,
  c.end_time,
  c.created_at,

 GROUP_CONCAT(t.name, ', ') AS teacher_names,
 GROUP_CONCAT(t.id) AS teacher_ids,
  u.name AS unit_name,


  
  SUM(CASE 
        WHEN e.role IN ('leader','conductor') THEN 1 
        ELSE 0 
      END) AS conductors_count,

  SUM(CASE 
        WHEN e.role = 'follower' THEN 1 
        ELSE 0 
      END) AS followers_count

FROM classes c

LEFT JOIN class_teachers ct
ON ct.class_id = c.id

LEFT JOIN teachers t
ON t.id = ct.teacher_id

LEFT JOIN units u
ON u.id = c.unit_id

LEFT JOIN enrollments e
ON e.class_id = c.id
AND e.deleted_at IS NULL

WHERE c.deleted_at IS NULL

GROUP BY c.id

ORDER BY c.created_at DESC
`).all();

    return Response.json({
      success: true,
      data: results,
    });
  }

  // BUSCAR POR ID
  if (
    url.pathname.startsWith("/api/v1/classes/") &&
    request.method === "GET"
  ) {
    const roleError = requireRole(user, ["admin", "operator"]);
    if (roleError) return roleError;

    const id = url.pathname.split("/").pop();

    const result = await env.DB.prepare(`
      SELECT *
      FROM classes
      WHERE id = ?
      AND deleted_at IS NULL
    `)
      .bind(id)
      .first();

    if (!result) {
      return Response.json(
        { success: false, message: "Class not found" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: result,
    });
  }
// CRIAR
if (url.pathname === "/api/v1/classes" && request.method === "POST") {
  const roleError = requireRole(user, ["admin"]);
  if (roleError) return roleError;

  const body = (await request.json()) as any;
  const {
    name,
    description,
    teachers, // 🔥 novo (array)
    unit_id,
    day_of_week,
    start_time,
    end_time,
  } = body;

  if (!name) {
    return Response.json(
      { success: false, message: "Name is required" },
      { status: 400 }
    );
  }

  const id = crypto.randomUUID();

  // 🔥 cria classe (SEM teacher_id obrigatório)
  await env.DB.prepare(`
    INSERT INTO classes (
      id,
      name,
      description,
      unit_id,
      day_of_week,
      start_time,
      end_time,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `)
    .bind(
      id,
      name,
      description ?? null,
      unit_id ?? null,
      day_of_week ?? null,
      start_time ?? null,
      end_time ?? null
    )
    .run();

  // 🔥 salva múltiplos professores
  if (Array.isArray(teachers)) {
    for (const teacherId of teachers) {
      await env.DB.prepare(`
        INSERT INTO class_teachers (id, class_id, teacher_id)
        VALUES (?, ?, ?)
      `)
        .bind(crypto.randomUUID(), id, teacherId)
        .run();
    }
  }

  return Response.json({
    success: true,
    id,
  });
}
  // ATUALIZAR
if (
  url.pathname.startsWith("/api/v1/classes/") &&
  request.method === "PUT"
) {
  const roleError = requireRole(user, ["admin"]);
  if (roleError) return roleError;

  const id = url.pathname.split("/").pop();
  const body = (await request.json()) as any;

  const existing = await env.DB.prepare(`
    SELECT id
    FROM classes
    WHERE id = ?
    AND deleted_at IS NULL
  `)
    .bind(id)
    .first();

  if (!existing) {
    return Response.json(
      { success: false, message: "Class not found" },
      { status: 404 }
    );
  }

  // 🔥 atualiza classe
  await env.DB.prepare(`
    UPDATE classes
    SET
      name = ?,
      description = ?,
      unit_id = ?,
      day_of_week = ?,
      start_time = ?,
      end_time = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `)
    .bind(
      body.name,
      body.description ?? null,
      body.unit_id ?? null,
      body.day_of_week ?? null,
      body.start_time ?? null,
      body.end_time ?? null,
      id
    )
    .run();

  // 🔥 remove antigos professores
  await env.DB.prepare(`
    DELETE FROM class_teachers
    WHERE class_id = ?
  `)
    .bind(id)
    .run();

  // 🔥 insere novos professores
  if (Array.isArray(body.teachers)) {
    for (const teacherId of body.teachers) {
      await env.DB.prepare(`
        INSERT INTO class_teachers (id, class_id, teacher_id)
        VALUES (?, ?, ?)
      `)
        .bind(crypto.randomUUID(), id, teacherId)
        .run();
    }
  }

  return Response.json({
    success: true,
  });
}
  // SOFT DELETE
  if (
    url.pathname.startsWith("/api/v1/classes/") &&
    request.method === "DELETE"
  ) {
    const roleError = requireRole(user, ["admin"]);
    if (roleError) return roleError;

    const id = url.pathname.split("/").pop();

    const existing = await env.DB.prepare(`
      SELECT id
      FROM classes
      WHERE id = ?
      AND deleted_at IS NULL
    `)
      .bind(id)
      .first();

    if (!existing) {
      return Response.json(
        { success: false, message: "Class not found" },
        { status: 404 }
      );
    }

    await env.DB.prepare(`
      UPDATE classes
      SET
        deleted_at = datetime('now'),
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