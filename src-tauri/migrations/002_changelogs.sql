-- Houston v0.7.0 Changelogs table

CREATE TABLE changelogs (
    version    TEXT PRIMARY KEY NOT NULL,
    date       TEXT NOT NULL,
    title      TEXT NOT NULL,
    highlights TEXT NOT NULL,  -- JSON array of strings
    sections   TEXT            -- JSON array of {title, items[]} (optional)
);
