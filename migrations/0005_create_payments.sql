CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  enrollment_id TEXT NOT NULL,
  amount REAL NOT NULL,
  competence_month INTEGER NOT NULL,
  competence_year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(id)
);

CREATE INDEX IF NOT EXISTS idx_payments_enrollment
ON payments (enrollment_id);

CREATE INDEX IF NOT EXISTS idx_payments_competence
ON payments (competence_year, competence_month);

CREATE INDEX IF NOT EXISTS idx_payments_deleted_at
ON payments (deleted_at);