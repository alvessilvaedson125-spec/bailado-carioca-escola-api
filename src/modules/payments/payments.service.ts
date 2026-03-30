export async function generateMonthlyPayments(
  env: any,
  competenceMonth: number,
  competenceYear: number
) {

  const enrollments = await env.DB.prepare(`
    SELECT
      e.id        as enrollment_id,
      e.student_id,
      e.monthly_fee,
      e.discount,
      e.scholarship,
      e.status
    FROM enrollments e
    JOIN students s ON s.id = e.student_id
    WHERE e.deleted_at IS NULL
      AND s.deleted_at IS NULL
      AND e.status = 'active'
  `).all();

  let generated = 0;
  let skipped   = 0;

  for (const row of enrollments.results) {

    // Segurança extra
    if (row.status !== "active") {
      skipped++;
      continue;
    }

    // 🔥 Pula bolsistas integrais — não gera pagamento R$ 0,00
    const fee      = Number(row.monthly_fee  ?? 0);
    const discount = Number(row.discount     ?? 0);

    if (row.scholarship === 1 && discount === 100) {
      skipped++;
      continue;
    }

    const discountAmount = fee * (discount / 100);
    const finalAmount    = fee - discountAmount;

    // Verifica duplicidade
    const existing = await env.DB.prepare(`
      SELECT id FROM payments
      WHERE enrollment_id = ?
        AND competence_month = ?
        AND competence_year = ?
        AND deleted_at IS NULL
    `).bind(row.enrollment_id, competenceMonth, competenceYear).first();

    if (existing) {
      skipped++;
      continue;
    }

    const id       = crypto.randomUUID();
    const due_date = `${competenceYear}-${String(competenceMonth).padStart(2, "0")}-07`;

    try {
      await env.DB.prepare(`
        INSERT INTO payments (
          id, enrollment_id, student_id,
          amount, gross_amount, discount_percent, discount_amount, final_amount,
          competence_month, competence_year, due_date,
          status, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))
      `)
      .bind(
        id,
        row.enrollment_id,
        row.student_id,
        finalAmount,
        fee,
        discount,
        discountAmount,
        finalAmount,
        competenceMonth,
        competenceYear,
        due_date
      )
      .run();

      generated++;

    } catch (err) {
      // 🔥 Loga e pula — não interrompe a geração inteira
      console.error("PAYMENT INSERT ERROR:", err);
      skipped++;
    }
  }

  return { generated, skipped };
}