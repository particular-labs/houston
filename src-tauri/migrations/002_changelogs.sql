-- Houston v0.6.0 Changelogs table

CREATE TABLE changelogs (
    version    TEXT PRIMARY KEY NOT NULL,
    date       TEXT NOT NULL,
    title      TEXT NOT NULL,
    summary    TEXT NOT NULL DEFAULT '',
    highlights TEXT NOT NULL,  -- JSON array of strings
    sections   TEXT            -- JSON array of {title, items[]} (optional)
);
