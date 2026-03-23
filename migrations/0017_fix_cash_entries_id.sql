-- nova tabela com ID automático
CREATE TABLE cash_entries_new (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),

  type TEXT NOT NULL CHECK(type IN ('in', 'out')),
  amount REAL NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active'
);

-- copia dados antigos
INSERT INTO cash_entries_new (type, amount, description, created_at, status)
SELECT 
  type,
  amount,
  description,
  created_at,
  COALESCE(status, 'active')
FROM cash_entries;

-- remove tabela antiga
DROP TABLE cash_entries;

-- renomeia nova
ALTER TABLE cash_entries_new RENAME TO cash_entries;