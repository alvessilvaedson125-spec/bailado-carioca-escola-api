CREATE TABLE student_history (

id TEXT PRIMARY KEY,

student_id TEXT NOT NULL,

field TEXT NOT NULL,

old_value TEXT,

new_value TEXT,

changed_by TEXT,

changed_at INTEGER

);