CREATE TABLE cash_entries (

id TEXT PRIMARY KEY,

type TEXT NOT NULL CHECK(type IN ('in','out')),

amount REAL NOT NULL,

description TEXT,

created_at TEXT DEFAULT CURRENT_TIMESTAMP

);