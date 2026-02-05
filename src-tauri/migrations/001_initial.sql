-- Houston v0.4.0 Initial Schema

CREATE TABLE settings (
    key   TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
);

INSERT OR IGNORE INTO settings (key, value) VALUES
    ('theme', 'dark'),
    ('default_editor', 'auto'),
    ('startup_section', 'dashboard'),
    ('auto_scan_on_startup', 'true'),
    ('scan_history_limit', '50'),
    ('ttl_system', '300'), ('ttl_path', '60'), ('ttl_languages', '120'),
    ('ttl_env', '60'), ('ttl_projects', '60'), ('ttl_git', '30'),
    ('ttl_packages', '300'), ('ttl_claude', '300'),
    ('ttl_diagnostics', '120'), ('ttl_ai_tools', '120');

CREATE TABLE workspaces (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    path     TEXT NOT NULL UNIQUE,
    added_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE scan_history (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    scanner    TEXT NOT NULL,
    data_json  TEXT NOT NULL,
    scanned_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_scan_history_scanner ON scan_history(scanner, scanned_at DESC);

CREATE TABLE issues (
    diagnostic_id TEXT PRIMARY KEY NOT NULL,
    category      TEXT NOT NULL,
    severity      TEXT NOT NULL,
    title         TEXT NOT NULL,
    description   TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'open',
    first_seen    TEXT NOT NULL DEFAULT (datetime('now')),
    last_seen     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_issues_status ON issues(status);
