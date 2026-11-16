pub struct Migration {
    pub version: i32,
    pub name: &'static str,
    pub sql: &'static str,
}

pub const MIGRATIONS: &[Migration] = &[
    Migration {
        version: 1,
        name: "001_initial_daymark_schema",
        sql: r#"
-- Core schema version tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Application Settings
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Genres for Movies and Series
CREATE TABLE IF NOT EXISTS genres (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Task Categories
CREATE TABLE IF NOT EXISTS task_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    color TEXT NOT NULL DEFAULT '#14b8a6',
    icon TEXT NOT NULL DEFAULT 'folder',
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category_id TEXT REFERENCES task_categories(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled')),
    is_completed INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT,
    reminder_at TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Subtasks
CREATE TABLE IF NOT EXISTS subtasks (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Daily Goals
CREATE TABLE IF NOT EXISTS daily_goals (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    target_tasks_count INTEGER NOT NULL DEFAULT 5,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Movies
CREATE TABLE IF NOT EXISTS movies (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    release_year INTEGER,
    poster_url TEXT,
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'watching', 'completed')),
    personal_rating REAL CHECK (personal_rating IS NULL OR (personal_rating >= 0 AND personal_rating <= 10)),
    date_watched TEXT,
    notes TEXT,
    is_historical INTEGER NOT NULL DEFAULT 0,
    archived_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Movie Genres Junction
CREATE TABLE IF NOT EXISTS movie_genres (
    movie_id TEXT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    genre_id TEXT NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, genre_id)
);

-- Series
CREATE TABLE IF NOT EXISTS series (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    release_year INTEGER,
    poster_url TEXT,
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'watching', 'completed')),
    total_seasons INTEGER NOT NULL DEFAULT 1,
    personal_rating REAL CHECK (personal_rating IS NULL OR (personal_rating >= 0 AND personal_rating <= 10)),
    date_completed TEXT,
    notes TEXT,
    is_historical INTEGER NOT NULL DEFAULT 0,
    archived_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Series Genres Junction
CREATE TABLE IF NOT EXISTS series_genres (
    series_id TEXT NOT NULL REFERENCES series(id) ON DELETE CASCADE,
    genre_id TEXT NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (series_id, genre_id)
);

-- Seasons
CREATE TABLE IF NOT EXISTS seasons (
    id TEXT PRIMARY KEY,
    series_id TEXT NOT NULL REFERENCES series(id) ON DELETE CASCADE,
    season_number INTEGER NOT NULL,
    total_episodes INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(series_id, season_number)
);

-- Episodes
CREATE TABLE IF NOT EXISTS episodes (
    id TEXT PRIMARY KEY,
    season_id TEXT NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    series_id TEXT NOT NULL REFERENCES series(id) ON DELETE CASCADE,
    episode_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    is_completed INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(season_id, episode_number)
);

-- Plan Items (Monthly, Weekly, Yearly)
CREATE TABLE IF NOT EXISTS plan_items (
    id TEXT PRIMARY KEY,
    period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'yearly')),
    period_identifier TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('entertainment', 'learning', 'personal_goals', 'projects', 'custom')),
    custom_category_name TEXT,
    title TEXT NOT NULL,
    description TEXT,
    priority_order INTEGER NOT NULL DEFAULT 1,
    is_completed INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT,
    linked_task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
    linked_movie_id TEXT REFERENCES movies(id) ON DELETE SET NULL,
    linked_series_id TEXT REFERENCES series(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Activity History Timeline
CREATE TABLE IF NOT EXISTS activity_history (
    id TEXT PRIMARY KEY,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('task_completed', 'movie_completed', 'episode_completed', 'series_completed', 'plan_completed', 'historical_added')),
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    title TEXT NOT NULL,
    metadata_json TEXT,
    timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for lightning-fast queries
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_movies_status ON movies(status);
CREATE INDEX IF NOT EXISTS idx_movies_date_watched ON movies(date_watched);
CREATE INDEX IF NOT EXISTS idx_series_status ON series(status);
CREATE INDEX IF NOT EXISTS idx_seasons_series ON seasons(series_id);
CREATE INDEX IF NOT EXISTS idx_episodes_season ON episodes(season_id);
CREATE INDEX IF NOT EXISTS idx_episodes_series ON episodes(series_id);
CREATE INDEX IF NOT EXISTS idx_plan_period ON plan_items(period_type, period_identifier);
CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity_history(timestamp DESC);

-- Initial default seeds
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('theme', 'dark');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('app_version', '0.1.0');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('sidebar_collapsed', 'false');

INSERT OR IGNORE INTO task_categories (id, name, color, icon, position) VALUES
    ('cat-personal', 'Personal', '#14b8a6', 'user', 0),
    ('cat-work', 'Work', '#3b82f6', 'briefcase', 1),
    ('cat-learning', 'Learning', '#8b5cf6', 'book-open', 2),
    ('cat-fitness', 'Fitness', '#f59e0b', 'activity', 3),
    ('cat-focus', 'Focus', '#ec4899', 'target', 4);

INSERT OR IGNORE INTO genres (id, name) VALUES
    ('g-action', 'Action'),
    ('g-adventure', 'Adventure'),
    ('g-animation', 'Animation'),
    ('g-comedy', 'Comedy'),
    ('g-crime', 'Crime'),
    ('g-documentary', 'Documentary'),
    ('g-drama', 'Drama'),
    ('g-family', 'Family'),
    ('g-fantasy', 'Fantasy'),
    ('g-horror', 'Horror'),
    ('g-mystery', 'Mystery'),
    ('g-romance', 'Romance'),
    ('g-scifi', 'Sci-Fi'),
    ('g-thriller', 'Thriller'),
    ('g-western', 'Western');
        "#,
    },
];
