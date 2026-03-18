CREATE TABLE teachers (

id TEXT PRIMARY KEY,

name TEXT NOT NULL,

email TEXT,

phone TEXT,

status TEXT DEFAULT 'active',

created_at TEXT DEFAULT CURRENT_TIMESTAMP,

updated_at TEXT,

deleted_at TEXT

);