use rusqlite::{Connection, params};
use rusqlite_migration::{Migrations, M};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

/// Row types for database results
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SettingPair {
    pub key: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceRow {
    pub id: i64,
    pub path: String,
    pub added_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanHistoryRow {
    pub id: i64,
    pub scanner: String,
    pub data_json: String,
    pub scanned_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IssueRow {
    pub diagnostic_id: String,
    pub category: String,
    pub severity: String,
    pub title: String,
    pub description: String,
    pub status: String,
    pub first_seen: String,
    pub last_seen: String,
}

/// Database wrapper with all persistence operations
pub struct Database {
    conn: Connection,
}

impl Database {
    /// Create a backup of the database file before migrations
    pub fn backup(db_path: &Path) -> Result<(), String> {
        if db_path.exists() {
            let backup_path = db_path.with_extension("db.bak");
            fs::copy(db_path, &backup_path)
                .map_err(|e| format!("Failed to backup database: {}", e))?;
        }
        Ok(())
    }

    /// Open or create the database, run migrations
    pub fn open(db_path: &Path) -> Result<Self, String> {
        // Ensure parent directory exists
        if let Some(parent) = db_path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create app data directory: {}", e))?;
        }

        let mut conn = Connection::open(db_path)
            .map_err(|e| format!("Failed to open database: {}", e))?;

        // Enable WAL mode for concurrent reads
        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")
            .map_err(|e| format!("Failed to set PRAGMA: {}", e))?;

        // Run migrations
        let migrations = Migrations::new(vec![
            M::up(include_str!("../migrations/001_initial.sql")),
        ]);

        migrations.to_latest(&mut conn)
            .map_err(|e| format!("Migration failed: {}", e))?;

        Ok(Self { conn })
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Settings
    // ─────────────────────────────────────────────────────────────────────────────

    pub fn get_all_settings(&self) -> Result<Vec<SettingPair>, String> {
        let mut stmt = self.conn
            .prepare("SELECT key, value FROM settings ORDER BY key")
            .map_err(|e| e.to_string())?;

        let rows = stmt.query_map([], |row| {
            Ok(SettingPair {
                key: row.get(0)?,
                value: row.get(1)?,
            })
        }).map_err(|e| e.to_string())?;

        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())
    }

    pub fn get_setting(&self, key: &str) -> Result<Option<String>, String> {
        let mut stmt = self.conn
            .prepare("SELECT value FROM settings WHERE key = ?1")
            .map_err(|e| e.to_string())?;

        let result = stmt.query_row(params![key], |row| row.get(0));

        match result {
            Ok(value) => Ok(Some(value)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.to_string()),
        }
    }

    pub fn set_setting(&self, key: &str, value: &str) -> Result<(), String> {
        self.conn
            .execute(
                "INSERT INTO settings (key, value) VALUES (?1, ?2)
                 ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                params![key, value],
            )
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_setting(&self, key: &str) -> Result<(), String> {
        self.conn
            .execute("DELETE FROM settings WHERE key = ?1", params![key])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Workspaces
    // ─────────────────────────────────────────────────────────────────────────────

    pub fn get_workspaces(&self) -> Result<Vec<String>, String> {
        let mut stmt = self.conn
            .prepare("SELECT path FROM workspaces ORDER BY added_at")
            .map_err(|e| e.to_string())?;

        let rows = stmt.query_map([], |row| row.get(0))
            .map_err(|e| e.to_string())?;

        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())
    }

    pub fn add_workspace(&self, path: &str) -> Result<(), String> {
        self.conn
            .execute(
                "INSERT OR IGNORE INTO workspaces (path) VALUES (?1)",
                params![path],
            )
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn remove_workspace(&self, path: &str) -> Result<(), String> {
        self.conn
            .execute("DELETE FROM workspaces WHERE path = ?1", params![path])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Scan History
    // ─────────────────────────────────────────────────────────────────────────────

    /// Record a scan result and prune old entries
    pub fn record_scan<T: Serialize>(&self, scanner: &str, data: &T) -> Result<(), String> {
        let data_json = serde_json::to_string(data)
            .map_err(|e| format!("Failed to serialize scan data: {}", e))?;

        self.conn
            .execute(
                "INSERT INTO scan_history (scanner, data_json) VALUES (?1, ?2)",
                params![scanner, data_json],
            )
            .map_err(|e| e.to_string())?;

        // Prune old entries
        self.prune_old_scans(scanner)?;

        Ok(())
    }

    pub fn get_scan_history(&self, scanner: &str, limit: Option<u32>) -> Result<Vec<ScanHistoryRow>, String> {
        let limit = limit.unwrap_or(50);
        let mut stmt = self.conn
            .prepare(
                "SELECT id, scanner, data_json, scanned_at FROM scan_history
                 WHERE scanner = ?1 ORDER BY scanned_at DESC LIMIT ?2"
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt.query_map(params![scanner, limit], |row| {
            Ok(ScanHistoryRow {
                id: row.get(0)?,
                scanner: row.get(1)?,
                data_json: row.get(2)?,
                scanned_at: row.get(3)?,
            })
        }).map_err(|e| e.to_string())?;

        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())
    }

    pub fn get_latest_scan(&self, scanner: &str) -> Result<Option<ScanHistoryRow>, String> {
        let mut stmt = self.conn
            .prepare(
                "SELECT id, scanner, data_json, scanned_at FROM scan_history
                 WHERE scanner = ?1 ORDER BY scanned_at DESC LIMIT 1"
            )
            .map_err(|e| e.to_string())?;

        let result = stmt.query_row(params![scanner], |row| {
            Ok(ScanHistoryRow {
                id: row.get(0)?,
                scanner: row.get(1)?,
                data_json: row.get(2)?,
                scanned_at: row.get(3)?,
            })
        });

        match result {
            Ok(row) => Ok(Some(row)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.to_string()),
        }
    }

    fn prune_old_scans(&self, scanner: &str) -> Result<(), String> {
        // Get the limit from settings (default 50)
        let limit: i64 = self.get_setting("scan_history_limit")?
            .and_then(|s| s.parse().ok())
            .unwrap_or(50);

        self.conn
            .execute(
                "DELETE FROM scan_history WHERE scanner = ?1 AND id NOT IN (
                    SELECT id FROM scan_history WHERE scanner = ?1
                    ORDER BY scanned_at DESC LIMIT ?2
                )",
                params![scanner, limit],
            )
            .map_err(|e| e.to_string())?;

        Ok(())
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Issues
    // ─────────────────────────────────────────────────────────────────────────────

    /// Upsert an issue - preserves first_seen, updates last_seen, keeps dismissed status
    pub fn upsert_issue(
        &self,
        diagnostic_id: &str,
        category: &str,
        severity: &str,
        title: &str,
        description: &str,
    ) -> Result<(), String> {
        self.conn
            .execute(
                "INSERT INTO issues (diagnostic_id, category, severity, title, description, status)
                 VALUES (?1, ?2, ?3, ?4, ?5, 'open')
                 ON CONFLICT(diagnostic_id) DO UPDATE SET
                    category = excluded.category,
                    severity = excluded.severity,
                    title = excluded.title,
                    description = excluded.description,
                    last_seen = datetime('now'),
                    status = CASE
                        WHEN issues.status = 'dismissed' THEN 'dismissed'
                        ELSE 'open'
                    END",
                params![diagnostic_id, category, severity, title, description],
            )
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_issues(&self, status: Option<&str>) -> Result<Vec<IssueRow>, String> {
        let sql = match status {
            Some(_) => "SELECT diagnostic_id, category, severity, title, description, status, first_seen, last_seen
                        FROM issues WHERE status = ?1 ORDER BY last_seen DESC",
            None => "SELECT diagnostic_id, category, severity, title, description, status, first_seen, last_seen
                     FROM issues ORDER BY last_seen DESC",
        };

        let mut stmt = self.conn.prepare(sql).map_err(|e| e.to_string())?;

        let rows = if let Some(s) = status {
            stmt.query_map(params![s], Self::map_issue_row)
        } else {
            stmt.query_map([], Self::map_issue_row)
        }.map_err(|e| e.to_string())?;

        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())
    }

    fn map_issue_row(row: &rusqlite::Row) -> rusqlite::Result<IssueRow> {
        Ok(IssueRow {
            diagnostic_id: row.get(0)?,
            category: row.get(1)?,
            severity: row.get(2)?,
            title: row.get(3)?,
            description: row.get(4)?,
            status: row.get(5)?,
            first_seen: row.get(6)?,
            last_seen: row.get(7)?,
        })
    }

    pub fn update_issue_status(&self, diagnostic_id: &str, status: &str) -> Result<(), String> {
        self.conn
            .execute(
                "UPDATE issues SET status = ?2 WHERE diagnostic_id = ?1",
                params![diagnostic_id, status],
            )
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn dismiss_issue(&self, diagnostic_id: &str) -> Result<(), String> {
        self.update_issue_status(diagnostic_id, "dismissed")
    }

    /// Mark issues not in current scan as resolved (unless dismissed)
    pub fn resolve_missing_issues(&self, current_ids: &[&str]) -> Result<(), String> {
        if current_ids.is_empty() {
            // If no current issues, resolve all non-dismissed
            self.conn
                .execute(
                    "UPDATE issues SET status = 'resolved' WHERE status = 'open'",
                    [],
                )
                .map_err(|e| e.to_string())?;
        } else {
            // Build placeholders for IN clause
            let placeholders: Vec<String> = (1..=current_ids.len())
                .map(|i| format!("?{}", i))
                .collect();
            let sql = format!(
                "UPDATE issues SET status = 'resolved'
                 WHERE status = 'open' AND diagnostic_id NOT IN ({})",
                placeholders.join(", ")
            );

            let params: Vec<&dyn rusqlite::ToSql> = current_ids
                .iter()
                .map(|s| s as &dyn rusqlite::ToSql)
                .collect();

            self.conn.execute(&sql, params.as_slice())
                .map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Database Info
    // ─────────────────────────────────────────────────────────────────────────────

    pub fn get_scan_history_count(&self) -> Result<i64, String> {
        self.conn
            .query_row("SELECT COUNT(*) FROM scan_history", [], |row| row.get(0))
            .map_err(|e| e.to_string())
    }
}
