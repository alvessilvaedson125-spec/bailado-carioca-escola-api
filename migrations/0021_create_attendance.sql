CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  enrollment_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'present',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(id),
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_enrollment
ON attendance (enrollment_id);

CREATE INDEX IF NOT EXISTS idx_attendance_class
ON attendance (class_id);

CREATE INDEX IF NOT EXISTS idx_attendance_date
ON attendance (date);

CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_unique
ON attendance (enrollment_id, date, deleted_at);