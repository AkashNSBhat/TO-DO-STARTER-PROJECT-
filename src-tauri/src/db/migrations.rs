use rusqlite::{Connection, Result};
use crate::db::schema::MIGRATIONS;

pub fn run_migrations(conn: &mut Connection) -> Result<()> {
    // Ensure migrations table exists
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        "#,
    )?;

    // Get current applied migration version in an isolated scope so stmt borrow ends
    let current_version: i32 = {
        let mut stmt = conn.prepare("SELECT COALESCE(MAX(version), 0) FROM schema_migrations")?;
        stmt.query_row([], |row| row.get(0))?
    };

    for migration in MIGRATIONS {
        if migration.version > current_version {
            println!(
                "[DB] Applying migration {} - {}...",
                migration.version, migration.name
            );

            let tx = conn.transaction()?;
            tx.execute_batch(migration.sql)?;
            tx.execute(
                "INSERT INTO schema_migrations (version, name) VALUES (?1, ?2)",
                rusqlite::params![migration.version, migration.name],
            )?;
            tx.commit()?;

            println!(
                "[DB] Migration {} ({}) applied successfully.",
                migration.version, migration.name
            );
        }
    }

    Ok(())
}
