ALTER TABLE enrollments ADD COLUMN role TEXT DEFAULT 'conductor';

ALTER TABLE enrollments ADD COLUMN type TEXT DEFAULT 'individual';

ALTER TABLE enrollments ADD COLUMN monthly_fee REAL DEFAULT 0;

ALTER TABLE enrollments ADD COLUMN discount REAL DEFAULT 0;