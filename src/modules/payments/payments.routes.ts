import { requireRole } from "../../security/authorize";
import { generateMonthlyPayments } from "./payments.service";

export async function handlePaymentsRoutes(
  request: Request,
  env: any,
  url: URL,
  user: any
) {

  // =========================
  // LISTAR PAYMENTS
  // =========================
  if (
    url.pathname === "/api/v1/payments" &&
    request.method === "GET"
  ) {
    const roleError = requireRole(user, ["admin", "operator"]);
    if (roleError) return roleError;

    const competenceMonth = url.searchParams.get("competence_month");
    const competenceYear  = url.searchParams.get("competence_year");
    const status          = url.searchParams.get("status");
    const classId         = url.searchParams.get("class_id");

    let query = `
      SELECT
        p.*,
        s.name as student_name,
        c.name as class_name,
        e.scholarship,
        CASE
          WHEN p.status = 'paid' THEN 'paid'
          WHEN p.due_date IS NULL THEN 'pending'
          WHEN DATE(p.due_date || ' 00:00:00') < DATE('now') THEN 'overdue'
          ELSE 'pending'
        END as computed_status
      FROM payments p
      JOIN enrollments e ON p.enrollment_id = e.id
      JOIN students s ON e.student_id = s.id
      JOIN classes c ON e.class_id = c.id
      WHERE p.deleted_at IS NULL
    `;

    const params: any[] = [];

    if (competenceMonth) {
      query += ` AND p.competence_month = ?`;
      params.push(Number(competenceMonth));
    }

    if (competenceYear) {
      query += ` AND p.competence_year = ?`;
      params.push(Number(competenceYear));
    }

    if (status) {
      query += ` AND p.status = ?`;
      params.push(status);
    }

    if (classId) {
      query += ` AND e.class_id = ?`;
      params.push(classId);
    }

    query += `
      ORDER BY
        p.competence_year DESC,
        p.competence_month DESC
    `;

    const { results } = await env.DB.prepare(query)
      .bind(...params)
      .all();

    return Response.json({ success: true, data: results });
  }

  // =========================
  // CRIAR PAYMENT
  // =========================
  if (
    url.pathname === "/api/v1/payments" &&
    request.method === "POST"
  ) {
    const roleError = requireRole(user, ["admin"]);
    if (roleError) return roleError;

    const body = (await request.json()) as any;

    const {
      enrollment_id,
      amount,
      competence_month,
      competence_year,
      payment_method,
      notes,
    } = body;

    if (!enrollment_id || !amount || !competence_month || !competence_year) {
      return Response.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const enrollment = await env.DB.prepare(`
      SELECT student_id FROM enrollments
      WHERE id = ? AND deleted_at IS NULL
    `).bind(enrollment_id).first();

    if (!enrollment) {
      return Response.json(
        { success: false, message: "Invalid enrollment" },
        { status: 400 }
      );
    }

    const existingPayment = await env.DB.prepare(`
      SELECT id FROM payments
      WHERE enrollment_id = ?
      AND competence_month = ?
      AND competence_year = ?
      AND deleted_at IS NULL
    `).bind(enrollment_id, competence_month, competence_year).first();

    if (existingPayment) {
      return Response.json(
        { success: false, message: "Payment already exists for this period" },
        { status: 400 }
      );
    }

    const enrollmentData = await env.DB.prepare(`
      SELECT
        e.student_id,
        s.name as student_name,
        c.name as class_name
      FROM enrollments e
      JOIN students s ON s.id = e.student_id
      JOIN classes c ON c.id = e.class_id
      WHERE e.id = ?
    `).bind(enrollment_id).first();

    const id = crypto.randomUUID();
    const computed_due_date = `${competence_year}-${String(competence_month).padStart(2, "0")}-07`;

    await env.DB.prepare(`
      INSERT INTO payments (
        id, enrollment_id, student_id, student_name, class_name,
        amount, gross_amount, discount_percent, discount_amount, final_amount,
        competence_month, competence_year, due_date, status,
        payment_method, notes, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, datetime('now'), datetime('now'))
    `)
    .bind(
      id,
      enrollment_id,
      enrollmentData.student_id,
      enrollmentData.student_name,
      enrollmentData.class_name,
      amount, amount, 0, 0, amount,
      competence_month,
      competence_year,
      computed_due_date,
      payment_method ?? null,
      notes ?? null
    )
    .run();

    return Response.json({ success: true, id });
  }

  // =========================
  // MARCAR COMO PAGO
  // =========================
  if (
    url.pathname.startsWith("/api/v1/payments/") &&
    request.method === "PATCH"
  ) {
    const roleError = requireRole(user, ["admin"]);
    if (roleError) return roleError;

    const id = url.pathname.split("/").pop();
    const body = (await request.json().catch(() => ({}))) as any;
    const { payment_method, notes } = body;

    const existing = await env.DB.prepare(`
      SELECT id, status FROM payments
      WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first();

    if (!existing) {
      return Response.json(
        { success: false, message: "Payment not found" },
        { status: 404 }
      );
    }

    if (existing.status === "paid") {
      return Response.json(
        { success: false, message: "Payment already paid" },
        { status: 400 }
      );
    }

    if (existing.status !== "pending") {
      return Response.json(
        { success: false, message: "Invalid payment state transition" },
        { status: 400 }
      );
    }

    await env.DB.prepare(`
      UPDATE payments
      SET
        status = 'paid',
        paid_at = datetime('now'),
        payment_method = COALESCE(?, payment_method),
        notes = COALESCE(?, notes),
        updated_at = datetime('now')
      WHERE id = ?
    `)
    .bind(payment_method ?? null, notes ?? null, id)
    .run();

    return Response.json({ success: true });
  }

  // =========================
  // GERAR MENSALIDADES
  // =========================
  if (
    url.pathname === "/api/v1/payments/generate" &&
    request.method === "POST"
  ) {
    const roleError = requireRole(user, ["admin"]);
    if (roleError) return roleError;

    const body = (await request.json()) as any;
    const { competence_month, competence_year } = body;

    if (!competence_month || !competence_year) {
      return Response.json(
        { success: false, message: "Missing competence fields" },
        { status: 400 }
      );
    }

    const result = await generateMonthlyPayments(env, competence_month, competence_year);

    return Response.json({
      success: true,
      generated: result.generated,
      skipped: result.skipped,
    });
  }

  // =========================
  // RESUMO FINANCEIRO
  // 🔥 Exclui bolsistas integrais
  // =========================
  if (
    url.pathname === "/api/v1/payments/summary" &&
    request.method === "GET"
  ) {
    const roleError = requireRole(user, ["admin", "operator"]);
    if (roleError) return roleError;

    const { results } = await env.DB.prepare(`
      SELECT
        SUM(p.final_amount) as total_expected,

        SUM(
          CASE WHEN p.status = 'paid' THEN p.final_amount ELSE 0 END
        ) as total_paid,

        SUM(
          CASE
            WHEN p.status = 'pending'
              AND date(p.competence_year || '-' || printf('%02d', p.competence_month) || '-10') >= date('now')
            THEN p.final_amount ELSE 0
          END
        ) as total_pending,

        SUM(
          CASE
            WHEN p.status = 'pending'
              AND date(p.competence_year || '-' || printf('%02d', p.competence_month) || '-10') < date('now')
            THEN p.final_amount ELSE 0
          END
        ) as total_overdue

      FROM payments p
      JOIN enrollments e ON p.enrollment_id = e.id
      WHERE p.deleted_at IS NULL
        AND NOT (e.scholarship = 1 AND p.final_amount = 0)
    `).all();

    return Response.json({ success: true, data: results[0] });
  }

  // =========================
  // RECEITA POR TURMA
  // 🔥 Exclui bolsistas integrais
  // =========================
  if (
    url.pathname === "/api/v1/payments/by-class" &&
    request.method === "GET"
  ) {
    const { results } = await env.DB.prepare(`
      SELECT
        c.id as class_id,
        c.name as class_name,

        SUM(p.final_amount) as total_expected,

        SUM(
          CASE WHEN p.status = 'paid' THEN p.final_amount ELSE 0 END
        ) as total_received,

        SUM(
          CASE
            WHEN p.status = 'pending'
              AND date(p.due_date) < date('now')
            THEN p.final_amount ELSE 0
          END
        ) as total_overdue

      FROM payments p
      JOIN enrollments e ON p.enrollment_id = e.id
      JOIN classes c ON e.class_id = c.id
      WHERE p.deleted_at IS NULL
        AND NOT (e.scholarship = 1 AND p.final_amount = 0)
      GROUP BY c.id, c.name
      ORDER BY total_expected DESC
    `).all();

    return Response.json({ success: true, data: results });
  }

  return null;
}