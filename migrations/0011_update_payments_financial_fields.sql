-- ==========================================
-- 0011_update_payments_financial_fields.sql
-- Evolução da tabela payments para modelo financeiro profissional
-- ==========================================

-- adicionar data de vencimento
ALTER TABLE payments
ADD COLUMN due_date TEXT;

-- forma de pagamento
ALTER TABLE payments
ADD COLUMN payment_method TEXT;

-- observações administrativas
ALTER TABLE payments
ADD COLUMN notes TEXT;

-- índice único para evitar duplicação de cobrança
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_unique_competence
ON payments (enrollment_id, competence_year, competence_month)
WHERE deleted_at IS NULL;