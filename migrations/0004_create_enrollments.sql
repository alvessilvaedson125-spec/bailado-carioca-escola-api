CREATE TABLE IF NOT EXISTS enrollments (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (class_id) REFERENCES classes(id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_student
ON enrollments (student_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_class
ON enrollments (class_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_deleted_at
ON enrollments (deleted_at);