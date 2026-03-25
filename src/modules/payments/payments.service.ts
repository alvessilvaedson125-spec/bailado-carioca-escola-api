export async function generateMonthlyPayments(
  env: any,
  competenceMonth: number,
  competenceYear: number
) {

  const enrollments = await env.DB.prepare(`
  SELECT
    e.id as enrollment_id,
    e.student_id,
    e.monthly_fee,
    e.discount
  FROM enrollments e
  JOIN students s ON s.id = e.student_id
  WHERE e.deleted_at IS NULL
  AND s.deleted_at IS NULL
  AND e.status = 'active' -- 🔥 ADICIONAR ISSO
`).all();

  let generated = 0;
  let skipped = 0;

  for (const row of enrollments.results) {

    const enrollmentId = row.enrollment_id;
    const studentId = row.student_id;

    const price = row.monthly_fee ?? 0;
    const discountPercent = row.discount ?? 0;

    const discountAmount = price * (discountPercent / 100);
    const finalAmount = price - discountAmount;

    const id = crypto.randomUUID();

    // =========================
// VERIFICAR DUPLICIDADE
// =========================
const existing = await env.DB.prepare(`
  SELECT id FROM payments
  WHERE enrollment_id = ?
  AND competence_month = ?
  AND competence_year = ?
  AND deleted_at IS NULL
`)
.bind(enrollmentId, competenceMonth, competenceYear)
.first();

if (existing) {
  skipped++;
  continue;
}

    try {

    const due_date = `${competenceYear}-${String(competenceMonth).padStart(2, "0")}-07`;
      await env.DB.prepare(`
        INSERT INTO payments (
          id,
          enrollment_id,
          student_id,
          amount,
          gross_amount,
          discount_percent,
          discount_amount,
          final_amount,
          competence_month,
          competence_year,
          due_date,
          status,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))
      `)
      .bind(
        id,
        enrollmentId,
        studentId,
        finalAmount,
        price,
        discountPercent,
        discountAmount,
        finalAmount,
        competenceMonth,
        competenceYear,
        due_date
      )
      .run();

      generated++;

    } catch (err) {

     console.error("PAYMENT INSERT ERROR:", JSON.stringify(err, null, 2));
throw err;
      skipped++;

    }

  }

  return {
    generated,
    skipped
  };

}