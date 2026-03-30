ALTER TABLE cash_entries ADD COLUMN date TEXT;
UPDATE cash_entries SET date = substr(created_at, 1, 10) WHERE date IS NULL;