-- Houston v0.6.1 Add summary column to changelogs

ALTER TABLE changelogs ADD COLUMN summary TEXT NOT NULL DEFAULT '';
