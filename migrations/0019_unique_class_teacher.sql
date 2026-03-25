CREATE UNIQUE INDEX IF NOT EXISTS idx_class_teacher_unique
ON class_teachers (class_id, teacher_id);