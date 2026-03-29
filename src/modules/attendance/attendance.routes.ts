import { requireRole } from "../../security/authorize";

export async function handleAttendanceRoutes(
  request: Request,
  env: any,
  url: URL,
  user: any
) {

  // =========================
  // LISTAR PRESENÇAS
  // por turma + data
  // =========================
  if (
    url.pathname === "/api/v1/attendance" &&
    request.method === "GET"
  ) {
    const roleError = requireRole(user, ["admin", "operator"]);
    if (roleError) return roleError;

    const classId = url.searchParams.get("class_id");
    const date    = url.searchParams.get("date");
    const month   = url.searchParams.get("month");
    const year    = url.searchParams.get("year");

    let query = `
      SELECT
        a.id,
        a.enrollment_id,
        a.class_id,
        a.student_id,
        a.date,
        a.status,
        a.created_by,
        a.created_at,
        s.name as student_name,
        c.name as class_name,
        e.scholarship
      FROM attendance a
      JOIN enrollments e ON e.id = a.enrollment_id
      JOIN students s ON s.id = a.student_id
      JOIN classes c ON c.id = a.class_id
      WHERE a.deleted_at IS NULL
    `;

    const params: any[] = [];

    if (classId) {
      query += ` AND a.class_id = ?`;
      params.push(classId);
    }

    if (date) {
      query += ` AND a.date = ?`;
      params.push(date);
    }

    if (month && year) {
      query += ` AND strftime('%m', a.date) = ? AND strftime('%Y', a.date) = ?`;
      params.push(String(month).padStart(2, "0"), String(year));
    }

    query += ` ORDER BY a.date DESC, s.name ASC`;

    const { results } = await env.DB.prepare(query)
      .bind(...params)
      .all();

    return Response.json({ success: true, data: results });
  }

  // =========================
  // BUSCAR ALUNOS DA TURMA
  // para montar a chamada
  // =========================
  if (
    url.pathname === "/api/v1/attendance/students" &&
    request.method === "GET"
  ) {
    const roleError = requireRole(user, ["admin", "operator"]);
    if (roleError) return roleError;

    const classId = url.searchParams.get("class_id");
    const date    = url.searchParams.get("date");

    if (!classId || !date) {
      return Response.json(
        { success: false, message: "class_id e date são obrigatórios" },
        { status: 400 }
      );
    }

    // Busca alunos matriculados ativos na turma
    const { results: enrollments } = await env.DB.prepare(`
      SELECT
        e.id as enrollment_id,
        e.student_id,
        e.scholarship,
        s.name as student_name
      FROM enrollments e
      JOIN students s ON s.id = e.student_id
      WHERE e.class_id = ?
        AND e.status = 'active'
        AND e.deleted_at IS NULL
        AND s.deleted_at IS NULL
      ORDER BY s.name ASC
    `).bind(classId).all();

    // Busca presenças já registradas para esta turma/data
    const { results: existing } = await env.DB.prepare(`
      SELECT enrollment_id, status
      FROM attendance
      WHERE class_id = ?
        AND date = ?
        AND deleted_at IS NULL
    `).bind(classId, date).all();

    // Monta mapa de presenças existentes
    const attendanceMap: Record<string, string> = {};
    existing.forEach((a: any) => {
      attendanceMap[a.enrollment_id] = a.status;
    });

    // Combina: aluno + status já registrado (se houver)
    const data = enrollments.map((e: any) => ({
      enrollment_id: e.enrollment_id,
      student_id:    e.student_id,
      student_name:  e.student_name,
      scholarship:   e.scholarship === 1,
      status:        attendanceMap[e.enrollment_id] || null // null = não registrado
    }));

    return Response.json({ success: true, data });
  }

  // =========================
  // REGISTRAR CHAMADA
  // salva presença em lote
  // =========================
  if (
    url.pathname === "/api/v1/attendance" &&
    request.method === "POST"
  ) {
    const roleError = requireRole(user, ["admin"]);
    if (roleError) return roleError;

    const body = await request.json() as any;
    const { class_id, date, records } = body;

    if (!class_id || !date || !Array.isArray(records) || records.length === 0) {
      return Response.json(
        { success: false, message: "class_id, date e records são obrigatórios" },
        { status: 400 }
      );
    }

    // Valida formato da data
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Response.json(
        { success: false, message: "Formato de data inválido. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    let saved   = 0;
    let updated = 0;

    for (const record of records) {
      const { enrollment_id, student_id, status } = record;

      if (!enrollment_id || !student_id || !status) continue;
      if (!["present", "absent"].includes(status)) continue;

      // Verifica se já existe presença para este enrollment+date
      const existing = await env.DB.prepare(`
        SELECT id FROM attendance
        WHERE enrollment_id = ?
          AND date = ?
          AND deleted_at IS NULL
      `).bind(enrollment_id, date).first();

      if (existing) {
        // Atualiza presença existente
        await env.DB.prepare(`
          UPDATE attendance
          SET status = ?, created_by = ?
          WHERE id = ?
        `).bind(status, user.userId, existing.id).run();
        updated++;
      } else {
        // Insere nova presença
        const id = crypto.randomUUID();
        await env.DB.prepare(`
          INSERT INTO attendance (
            id, enrollment_id, class_id, student_id,
            date, status, created_by, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          id, enrollment_id, class_id, student_id,
          date, status, user.userId
        ).run();
        saved++;
      }
    }

    return Response.json({
      success: true,
      saved,
      updated
    });
  }

  // =========================
  // RESUMO DE FREQUÊNCIA
  // por aluno em uma turma
  // =========================
  if (
    url.pathname === "/api/v1/attendance/summary" &&
    request.method === "GET"
  ) {
    const roleError = requireRole(user, ["admin", "operator"]);
    if (roleError) return roleError;

    const classId = url.searchParams.get("class_id");

    if (!classId) {
      return Response.json(
        { success: false, message: "class_id é obrigatório" },
        { status: 400 }
      );
    }

    const { results } = await env.DB.prepare(`
      SELECT
        s.id as student_id,
        s.name as student_name,
        e.scholarship,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as total_present,
        COUNT(CASE WHEN a.status = 'absent'  THEN 1 END) as total_absent,
        COUNT(a.id) as total_classes
      FROM enrollments e
      JOIN students s ON s.id = e.student_id
      LEFT JOIN attendance a ON a.enrollment_id = e.id
        AND a.deleted_at IS NULL
      WHERE e.class_id = ?
        AND e.status = 'active'
        AND e.deleted_at IS NULL
        AND s.deleted_at IS NULL
      GROUP BY s.id, s.name, e.scholarship
      ORDER BY s.name ASC
    `).bind(classId).all();

    return Response.json({ success: true, data: results });
  }

  return null;
}