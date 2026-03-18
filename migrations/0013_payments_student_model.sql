-- adicionar referência ao aluno
ALTER TABLE payments ADD COLUMN student_id TEXT;

-- valores financeiros congelados
ALTER TABLE payments ADD COLUMN gross_amount REAL;
ALTER TABLE payments ADD COLUMN discount_percent REAL;
ALTER TABLE payments ADD COLUMN discount_amount REAL;
ALTER TABLE payments ADD COLUMN final_amount REAL;

-- impedir duplicação por aluno e competência
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_student_competence
ON payments (student_id, competence_month, competence_year)
WHERE deleted_at IS NULL;