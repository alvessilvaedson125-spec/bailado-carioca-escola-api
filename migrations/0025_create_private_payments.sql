CREATE TABLE IF NOT EXISTS private_payments (
  id TEXT PRIMARY KEY,
  origin_type TEXT NOT NULL,
  origin_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TEXT,
  payment_method TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (student_id) REFERENCES students(id)
);