import { requireRole } from "../../security/authorize";

export async function handlePrivateRoutes(
  request: Request,
  env: any,
  url: URL,
  user: any
) {

  // =========================
  // PACOTES
  // =========================

  // LISTAR PACOTES
  if (url.pathname === "/api/v1/private/packages" && request.method === "GET") {
    const roleError = requireRole(user, ["admin", "operator"]);
    if (roleError) return roleError;

    const studentId = url.searchParams.get("student_id");

    let query = `
      SELECT
        pp.*,
        s.name  as student_name,
        t1.name as teacher_1_name,
        t2.name as teacher_2_name
      FROM private_packages pp
      JOIN students  s  ON s.id  = pp.student_id
      JOIN teachers  t1 ON t1.id = pp.teacher_1_id
      LEFT JOIN teachers t2 ON t2.id = pp.teacher_2_id
      WHERE pp.deleted_at IS NULL
    `;

    const params: any[] = [];

    if (studentId) {
      query += ` AND pp.student_id = ?`;
      params.push(studentId);
    }

    query += ` ORDER BY pp.created_at DESC`;

    const { results } = params.length
      ? await env.DB.prepare(query).bind(...params).all()
      : await env.DB.prepare(query).all();

    return Response.json({ success: true, data: results });
  }

  // CRIAR PACOTE
  if (url.pathname === "/api/v1/private/packages" && request.method === "POST") {
    const roleError = requireRole(user, ["admin", "operator"]);
    if (roleError) return roleError;

    const body = await request.json() as any;
    const {
      student_id, teacher_1_id, teacher_2_id,
      total_sessions, price_total,
      location_type, location_notes,
      start_date, notes
    } = body;

    if (!student_id || !teacher_1_id) {
      return Response.json(
        { success: false, message: "student_id e teacher_1_id são obrigatórios" },
        { status: 400 }
      );
    }

    if (!price_total || price_total <= 0) {
      return Response.json(
        { success: false, message: "Informe o valor total do pacote" },
        { status: 400 }
      );
    }

    const sessions   = total_sessions || 4;
    const perSession = price_total / sessions;
    const id         = crypto.randomUUID();

    await env.DB.prepare(`
      INSERT INTO private_packages (
        id, student_id, teacher_1_id, teacher_2_id,
        total_sessions, sessions_used, price_total, price_per_session,
        location_type, location_notes, start_date, status, notes,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, 'active', ?, datetime('now'), datetime('now'))
    `)
    .bind(
      id, student_id, teacher_1_id, teacher_2_id ?? null,
      sessions, price_total, perSession,
      location_type  || 'bailado_laranjeiras',
      location_notes ?? null,
      start_date     ?? null,
      notes          ?? null
    )
    .run();

    // Gera payment automático para o pacote
    const paymentId = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO private_payments (
        id, origin_type, origin_id, student_id,
        amount, status, created_at, updated_at
      )
      VALUES (?, 'package', ?, ?, ?, 'pending', datetime('now'), datetime('now'))
    `)
    .bind(paymentId, id, student_id, price_total)
    .run();

    return Response.json({ success: true, id, payment_id: paymentId });
  }

  // ATUALIZAR PACOTE
  if (
    url.pathname.startsWith("/api/v1/private/packages/") &&
    request.method === "PUT"
  ) {
    const roleError = requireRole(user, ["admin"]);
    if (roleError) return roleError;

    const id   = url.pathname.split("/").pop();
    const body = await request.json() as any;

    const existing = await env.DB.prepare(`
      SELECT id FROM private_packages WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first();

    if (!existing) {
      return Response.json(
        { success: false, message: "Pacote não encontrado" },
        { status: 404 }
      );
    }

    await env.DB.prepare(`
      UPDATE private_packages
      SET
        teacher_1_id   = COALESCE(?, teacher_1_id),
        teacher_2_id   = ?,
        total_sessions = COALESCE(?, total_sessions),
        price_total    = COALESCE(?, price_total),
        location_type  = COALESCE(?, location_type),
        location_notes = ?,
        start_date     = COALESCE(?, start_date),
        status         = COALESCE(?, status),
        notes          = ?,
        updated_at     = datetime('now')
      WHERE id = ?
    `)
    .bind(
      body.teacher_1_id   ?? null,
      body.teacher_2_id   ?? null,
      body.total_sessions ?? null,
      body.price_total    ?? null,
      body.location_type  ?? null,
      body.location_notes ?? null,
      body.start_date     ?? null,
      body.status         ?? null,
      body.notes          ?? null,
      id
    )
    .run();

    return Response.json({ success: true });
  }

  // SOFT DELETE PACOTE
  if (
    url.pathname.startsWith("/api/v1/private/packages/") &&
    request.method === "DELETE"
  ) {
    const roleError = requireRole(user, ["admin"]);
    if (roleError) return roleError;

    const id = url.pathname.split("/").pop();

    await env.DB.prepare(`
      UPDATE private_packages
      SET deleted_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).bind(id).run();

    return Response.json({ success: true });
  }

  // =========================
  // SESSÕES
  // =========================

  // LISTAR SESSÕES
  if (url.pathname === "/api/v1/private/sessions" && request.method === "GET") {
    const roleError = requireRole(user, ["admin", "operator"]);
    if (roleError) return roleError;

    const packageId = url.searchParams.get("package_id");
    const studentId = url.searchParams.get("student_id");
    const status    = url.searchParams.get("status");

    let query = `
      SELECT
        ps.*,
        s.name  as student_name,
        t1.name as teacher_1_name,
        t2.name as teacher_2_name
      FROM private_sessions ps
      JOIN students  s  ON s.id  = ps.student_id
      JOIN teachers  t1 ON t1.id = ps.teacher_1_id
      LEFT JOIN teachers t2 ON t2.id = ps.teacher_2_id
      WHERE ps.deleted_at IS NULL
    `;

    const params: any[] = [];

    if (packageId) { query += ` AND ps.package_id = ?`; params.push(packageId); }
    if (studentId) { query += ` AND ps.student_id = ?`; params.push(studentId); }
    if (status)    { query += ` AND ps.status = ?`;      params.push(status);    }

    query += ` ORDER BY ps.scheduled_at DESC`;

    const { results } = params.length
      ? await env.DB.prepare(query).bind(...params).all()
      : await env.DB.prepare(query).all();

    return Response.json({ success: true, data: results });
  }
// CRIAR SESSÃO
  if (url.pathname === "/api/v1/private/sessions" && request.method === "POST") {
    const roleError = requireRole(user, ["admin", "operator"]);
    if (roleError) return roleError;

    const body = await request.json() as any;
    const {
      package_id, student_id, teacher_1_id, teacher_2_id,
      scheduled_at, duration_minutes, price,
      location_type, location_notes, notes
    } = body;

    if (!student_id || !teacher_1_id || !scheduled_at) {
      return Response.json(
        { success: false, message: "student_id, teacher_1_id e scheduled_at são obrigatórios" },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();

    await env.DB.prepare(`
      INSERT INTO private_sessions (
        id, package_id, student_id, teacher_1_id, teacher_2_id,
        scheduled_at, duration_minutes, price,
        location_type, location_notes, status, notes,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, datetime('now'), datetime('now'))
    `)
    .bind(
      id,
      package_id       ?? null,
      student_id,
      teacher_1_id,
      teacher_2_id     ?? null,
      scheduled_at,
      duration_minutes || 60,
      price            || 0,
      location_type    || 'bailado_laranjeiras',
      location_notes   ?? null,
      notes            ?? null
    )
    .run();

    // 🔥 Aula avulsa com valor — gera payment automático
    if (!package_id && price && price > 0) {
      const paymentId = crypto.randomUUID();
      await env.DB.prepare(`
        INSERT INTO private_payments (
          id, origin_type, origin_id, student_id,
          amount, status, created_at, updated_at
        )
        VALUES (?, 'session', ?, ?, ?, 'pending', datetime('now'), datetime('now'))
      `)
      .bind(paymentId, id, student_id, price)
      .run();
    }

    return Response.json({ success: true, id });
  }

  // ATUALIZAR STATUS DA SESSÃO
  if (
    url.pathname.startsWith("/api/v1/private/sessions/") &&
    request.method === "PATCH"
  ) {
    const roleError = requireRole(user, ["admin", "operator"]);
    if (roleError) return roleError;

    const id   = url.pathname.split("/").pop();
    const body = await request.json() as any;
    const { status, notes } = body;

    const validStatus = ["scheduled", "completed", "cancelled", "no_show"];
    if (!validStatus.includes(status)) {
      return Response.json(
        { success: false, message: "Status inválido" },
        { status: 400 }
      );
    }

    const existing = await env.DB.prepare(`
      SELECT id, package_id, status FROM private_sessions
      WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first() as any;

    if (!existing) {
      return Response.json(
        { success: false, message: "Sessão não encontrada" },
        { status: 404 }
      );
    }

    await env.DB.prepare(`
      UPDATE private_sessions
      SET status     = ?,
          notes      = COALESCE(?, notes),
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(status, notes ?? null, id).run();

    // 🔥 Marcada como COMPLETED — incrementa sessions_used no pacote
    if (status === "completed" && existing.status !== "completed" && existing.package_id) {
      await env.DB.prepare(`
        UPDATE private_packages
        SET sessions_used = sessions_used + 1,
            updated_at    = datetime('now')
        WHERE id = ?
      `).bind(existing.package_id).run();

      // Verifica se pacote foi concluído
      const pkg = await env.DB.prepare(`
        SELECT total_sessions, sessions_used FROM private_packages WHERE id = ?
      `).bind(existing.package_id).first() as any;

      if (pkg && pkg.sessions_used >= pkg.total_sessions) {
        await env.DB.prepare(`
          UPDATE private_packages
          SET status     = 'completed',
              updated_at = datetime('now')
          WHERE id = ?
        `).bind(existing.package_id).run();
      }
    }

    // 🔥 Desmarcada (cancelled/no_show) — só decrementa se estava completed
    if (
      (status === "cancelled" || status === "no_show") &&
      existing.status === "completed" &&
      existing.package_id
    ) {
      await env.DB.prepare(`
        UPDATE private_packages
        SET sessions_used = MAX(0, sessions_used - 1),
            status        = 'active',
            updated_at    = datetime('now')
        WHERE id = ?
      `).bind(existing.package_id).run();
    }

    return Response.json({ success: true });
  }

  // =========================
  // PAGAMENTOS PARTICULARES
  // =========================

  // LISTAR
  if (url.pathname === "/api/v1/private/payments" && request.method === "GET") {
    const roleError = requireRole(user, ["admin", "operator"]);
    if (roleError) return roleError;

    const { results } = await env.DB.prepare(`
      SELECT
        pp.*,
        s.name as student_name
      FROM private_payments pp
      JOIN students s ON s.id = pp.student_id
      WHERE pp.deleted_at IS NULL
      ORDER BY pp.created_at DESC
    `).all();

    return Response.json({ success: true, data: results });
  }

  // MARCAR COMO PAGO
  if (
    url.pathname.startsWith("/api/v1/private/payments/") &&
    request.method === "PATCH"
  ) {
    const roleError = requireRole(user, ["admin"]);
    if (roleError) return roleError;

    const id   = url.pathname.split("/").pop();
    const body = await request.json().catch(() => ({})) as any;

    const existing = await env.DB.prepare(`
      SELECT id, status FROM private_payments WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first() as any;

    if (!existing) {
      return Response.json(
        { success: false, message: "Pagamento não encontrado" },
        { status: 404 }
      );
    }

    if (existing.status === "paid") {
      return Response.json(
        { success: false, message: "Pagamento já registrado" },
        { status: 400 }
      );
    }

    await env.DB.prepare(`
      UPDATE private_payments
      SET status         = 'paid',
          paid_at        = datetime('now'),
          payment_method = COALESCE(?, payment_method),
          notes          = COALESCE(?, notes),
          updated_at     = datetime('now')
      WHERE id = ?
    `)
    .bind(body.payment_method ?? null, body.notes ?? null, id)
    .run();

    return Response.json({ success: true });
  }

  // RESUMO FINANCEIRO PARTICULARES
  if (
    url.pathname === "/api/v1/private/payments/summary" &&
    request.method === "GET"
  ) {
    const roleError = requireRole(user, ["admin", "operator"]);
    if (roleError) return roleError;

    const { results } = await env.DB.prepare(`
      SELECT
        SUM(amount) as total_expected,
        SUM(CASE WHEN status = 'paid'    THEN amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending
      FROM private_payments
      WHERE deleted_at IS NULL
    `).all();

    return Response.json({ success: true, data: results[0] });
  }

  return null;
}