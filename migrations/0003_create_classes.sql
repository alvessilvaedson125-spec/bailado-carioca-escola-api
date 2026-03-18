CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  teacher_id TEXT,
  unit_id TEXT,
  day_of_week TEXT,
  start_time TEXT,
  end_time TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_classes_deleted_at
ON classes (deleted_at);
