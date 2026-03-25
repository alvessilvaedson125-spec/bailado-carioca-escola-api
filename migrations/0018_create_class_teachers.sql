CREATE TABLE IF NOT EXISTS class_teachers (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO class_teachers (id, class_id, teacher_id)
SELECT
  hex(randomblob(16)),
  id,
  teacher_id
FROM classes
WHERE teacher_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS class_teachers (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(class_id, teacher_id)
);