-- 🔒 impedir duplicação de pagamento por matrícula + competência

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_unique_enrollment_period
ON payments (
  enrollment_id,
  competence_month,
  competence_year
)
WHERE deleted_at IS NULL;