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
    Migration {
        version: 2,
        name: "002_phase1_sample_seed",
        sql: r#"
-- Migration 002: Seed realistic Phase 1 sample data

-- 1. Application Settings
INSERT INTO app_settings (key, value) VALUES
    ('theme', 'dark'),
    ('streak_count', '14'),
    ('streak_last_date', '2026-11-16'),
    ('user_name', 'Alex')
ON CONFLICT(key) DO UPDATE SET value=excluded.value;

-- 2. Daily Goals
INSERT OR REPLACE INTO daily_goals (id, date, target_tasks_count, notes) VALUES
    ('goal-2026-11-16', '2026-11-16', 5, 'Focus on Q4 architectural deliverables, Rust SQLite migrations, and evening 5km run.'),
    ('goal-2026-11-15', '2026-11-15', 5, 'Complete SQLite connection pool and WAL configuration tests.'),
    ('goal-2026-11-14', '2026-11-14', 4, 'Cloud expense consolidation and design tokens sync.');

-- 3. Tasks (11 tasks: 3 Today, 3 Upcoming, 2 Overdue, 3 Completed)
INSERT OR REPLACE INTO tasks (id, title, description, due_date, priority, category_id, status, is_completed, completed_at, reminder_at, position) VALUES
    -- Today Tasks (3)
    ('task-today-1', 'Finalize Phase 1 Tauri IPC Bridge implementation', 'Implement all Rust invoke handlers and verify connection pool with WAL mode', '2026-11-16', 'urgent', 'cat-work', 'in_progress', 0, NULL, '2026-11-16 14:00:00', 1),
    ('task-today-2', '5km Interval Cardio Session', 'Warmup jog followed by 5x400m intervals on the track', '2026-11-16', 'medium', 'cat-fitness', 'todo', 0, NULL, '2026-11-16 17:30:00', 2),
    ('task-today-3', 'Design System Token Audit', 'Verify obsidian dark mode tokens and contrast ratios for UI cards', '2026-11-16', 'high', 'cat-focus', 'in_progress', 0, NULL, '2026-11-16 16:00:00', 3),

    -- Upcoming Tasks (3)
    ('task-up-1', 'Q4 Product Architecture Review', 'Present desktop offline-first storage and sync strategies to the engineering leads', '2026-11-18', 'high', 'cat-work', 'todo', 0, NULL, '2026-11-18 09:00:00', 4),
    ('task-up-2', 'Read Rust Atomics and Locks Chapters 4-6', 'Study memory ordering, sequentially consistent vs acquire-release semantics', '2026-11-19', 'medium', 'cat-learning', 'todo', 0, NULL, NULL, 5),
    ('task-up-3', 'Winter Travel Booking & Itinerary', 'Finalize train reservations, mountain cabin accommodations, and gear checklist', '2026-11-22', 'low', 'cat-personal', 'todo', 0, NULL, NULL, 6),

    -- Overdue Tasks (2)
    ('task-overdue-1', 'Submit Monthly Cloud Infrastructure Expense Report', 'Consolidate AWS and Azure invoice receipts for finance review', '2026-11-14', 'urgent', 'cat-work', 'todo', 0, NULL, NULL, 7),
    ('task-overdue-2', 'Renew Vehicle Insurance and Annual Inspection', 'Compare comprehensive coverage plans and book certified mechanic inspection', '2026-11-15', 'high', 'cat-personal', 'todo', 0, NULL, NULL, 8),

    -- Completed Tasks (3)
    ('task-comp-1', 'Complete Tauri v2 IPC Migration Workshop', 'Hands-on refactoring of legacy invoke calls to modern typed Tauri commands', '2026-11-16', 'high', 'cat-learning', 'completed', 1, '2026-11-16 10:15:00', NULL, 9),
    ('task-comp-2', 'Morning Mobility Routine & Core Strength', '20-minute spinal flow, hip flexor stretches, and plank progressions', '2026-11-16', 'medium', 'cat-fitness', 'completed', 1, '2026-11-16 07:45:00', NULL, 10),
    ('task-comp-3', 'Setup Offline SQLite Database Engine with WAL Mode', 'Create initial schema migrations, connection pooling, and verify table constraints', '2026-11-15', 'high', 'cat-focus', 'completed', 1, '2026-11-15 16:30:00', NULL, 11);

-- 4. Subtasks (28 subtasks total, 2-3 per task)
INSERT OR REPLACE INTO subtasks (id, task_id, title, is_completed, completed_at, position) VALUES
    -- Subtasks for task-today-1
    ('sub-today-1-1', 'task-today-1', 'Review db/schema.rs migration definitions', 1, '2026-11-16 09:30:00', 1),
    ('sub-today-1-2', 'task-today-1', 'Register query commands in src-tauri/src/lib.rs', 0, NULL, 2),
    ('sub-today-1-3', 'task-today-1', 'Verify memory and error handling in IPC handlers', 0, NULL, 3),

    -- Subtasks for task-today-2
    ('sub-today-2-1', 'task-today-2', 'Dynamic stretching & 1km warmup jog', 0, NULL, 1),
    ('sub-today-2-2', 'task-today-2', '5x400m sprint intervals with 90s recovery', 0, NULL, 2),
    ('sub-today-2-3', 'task-today-2', 'Cooldown walk and hydration check', 0, NULL, 3),

    -- Subtasks for task-today-3
    ('sub-today-3-1', 'task-today-3', 'Inspect Tailwind color variables in globals.css', 1, '2026-11-16 11:15:00', 1),
    ('sub-today-3-2', 'task-today-3', 'Check WCAG AAA contrast for badge and muted pill tags', 0, NULL, 2),

    -- Subtasks for task-up-1
    ('sub-up-1-1', 'task-up-1', 'Prepare slide deck on SQLite WAL concurrency', 0, NULL, 1),
    ('sub-up-1-2', 'task-up-1', 'Benchmark query latency across 10k mock entities', 0, NULL, 2),
    ('sub-up-1-3', 'task-up-1', 'Send calendar invite and agenda notes', 0, NULL, 3),

    -- Subtasks for task-up-2
    ('sub-up-2-1', 'task-up-2', 'Chapter 4: Spinlocks and Mutex internals', 0, NULL, 1),
    ('sub-up-2-2', 'task-up-2', 'Chapter 5: Building channels from scratch', 0, NULL, 2),

    -- Subtasks for task-up-3
    ('sub-up-3-1', 'task-up-3', 'Compare cabin rental dates and amenities', 0, NULL, 1),
    ('sub-up-3-2', 'task-up-3', 'Reserve express mountain rail tickets', 0, NULL, 2),
    ('sub-up-3-3', 'task-up-3', 'Check thermal gear and hiking equipment', 0, NULL, 3),

    -- Subtasks for task-overdue-1
    ('sub-overdue-1-1', 'task-overdue-1', 'Download monthly billing PDF statements', 1, '2026-11-14 14:00:00', 1),
    ('sub-overdue-1-2', 'task-overdue-1', 'Tag cost allocation lines by project', 0, NULL, 2),
    ('sub-overdue-1-3', 'task-overdue-1', 'Submit form to accounting portal', 0, NULL, 3),

    -- Subtasks for task-overdue-2
    ('sub-overdue-2-1', 'task-overdue-2', 'Compare policy renewal quotes', 1, '2026-11-15 11:30:00', 1),
    ('sub-overdue-2-2', 'task-overdue-2', 'Schedule safety inspection slot', 0, NULL, 2),

    -- Subtasks for task-comp-1
    ('sub-comp-1-1', 'task-comp-1', 'Review Tauri v2 breaking changes and macro signatures', 1, '2026-11-16 09:10:00', 1),
    ('sub-comp-1-2', 'task-comp-1', 'Implement typed CommandResult patterns', 1, '2026-11-16 10:10:00', 2),

    -- Subtasks for task-comp-2
    ('sub-comp-2-1', 'task-comp-2', '10-min thoracic and hamstring mobility flow', 1, '2026-11-16 07:25:00', 1),
    ('sub-comp-2-2', 'task-comp-2', '3x60s plank holds and hollow body holds', 1, '2026-11-16 07:40:00', 2),

    -- Subtasks for task-comp-3
    ('sub-comp-3-1', 'task-comp-3', 'Write schema.rs with 15 relational tables', 1, '2026-11-15 14:00:00', 1),
    ('sub-comp-3-2', 'task-comp-3', 'Write migrations runner in migrations.rs', 1, '2026-11-15 15:30:00', 2),
    ('sub-comp-3-3', 'task-comp-3', 'Add unit tests for schema and cascade deletion', 1, '2026-11-15 16:25:00', 3);

-- 5. Movies (8 sample movies)
INSERT OR REPLACE INTO movies (id, title, release_year, poster_url, status, personal_rating, date_watched, notes, is_historical, archived_at) VALUES
    ('mov-1', 'Dune: Part Two', 2024, 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400', 'completed', 9.2, '2026-11-10', 'Masterclass in sound design and visual world-building. Arrakis feels breathtakingly real.', 0, '2026-11-10 22:30:00'),
    ('mov-2', 'Oppenheimer', 2023, 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400', 'completed', 9.5, '2026-11-05', 'Intense narrative pacing and incredible editing during the Trinity test sequence.', 1, '2026-11-05 23:15:00'),
    ('mov-3', 'Spider-Man: Across the Spider-Verse', 2023, 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400', 'completed', 9.4, '2026-10-28', 'Revolutionary animation styles and emotional core between Miles and Gwen.', 0, '2026-10-28 21:00:00'),
    ('mov-4', 'Interstellar', 2014, 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400', 'completed', 9.8, '2026-10-15', 'One of the greatest sci-fi epics of all time. Zimmer score is unmatched.', 1, '2026-10-15 23:45:00'),
    ('mov-5', 'Blade Runner 2049', 2017, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400', 'watching', NULL, NULL, 'Currently re-watching in 4K HDR. At the Las Vegas ruins sequence.', 0, NULL),
    ('mov-6', 'Everything Everywhere All at Once', 2022, 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400', 'watching', NULL, NULL, 'Halfway through Part 1: Everything.', 0, NULL),
    ('mov-7', 'The Batman: Part II', 2026, 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=400', 'planned', NULL, NULL, 'Anticipated theatrical release. Planning IMAX screening.', 0, NULL),
    ('mov-8', 'Challengers', 2024, 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=400', 'planned', NULL, NULL, 'Recommended by friends for the kinetic pacing and Trent Reznor score.', 0, NULL);

-- 6. Movie Genres Junction
INSERT OR REPLACE INTO movie_genres (movie_id, genre_id) VALUES
    ('mov-1', 'g-scifi'),
    ('mov-1', 'g-adventure'),
    ('mov-1', 'g-drama'),
    ('mov-2', 'g-drama'),
    ('mov-2', 'g-documentary'),
    ('mov-2', 'g-thriller'),
    ('mov-3', 'g-animation'),
    ('mov-3', 'g-action'),
    ('mov-3', 'g-adventure'),
    ('mov-4', 'g-scifi'),
    ('mov-4', 'g-drama'),
    ('mov-4', 'g-adventure'),
    ('mov-5', 'g-scifi'),
    ('mov-5', 'g-mystery'),
    ('mov-5', 'g-thriller'),
    ('mov-6', 'g-action'),
    ('mov-6', 'g-comedy'),
    ('mov-6', 'g-scifi'),
    ('mov-7', 'g-action'),
    ('mov-7', 'g-crime'),
    ('mov-7', 'g-drama'),
    ('mov-8', 'g-drama'),
    ('mov-8', 'g-romance');

-- 7. Series (5 series)
INSERT OR REPLACE INTO series (id, title, release_year, poster_url, status, total_seasons, personal_rating, date_completed, notes, is_historical, archived_at) VALUES
    ('ser-severance', 'Severance', 2022, 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400', 'watching', 2, 9.5, NULL, 'Masterful thriller exploring identity, corporate detachment, and psychological mystery.', 0, NULL),
    ('ser-arcane', 'Arcane', 2021, 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400', 'watching', 2, 9.6, NULL, 'Stunning Fortiche art style and tragic character arcs between Piltover and Zaun.', 0, NULL),
    ('ser-breaking-bad', 'Breaking Bad', 2008, 'https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?w=400', 'completed', 5, 9.9, '2026-08-20', 'The gold standard of television drama. Unparalleled character transformation.', 1, '2026-08-20 22:00:00'),
    ('ser-succession', 'Succession', 2018, 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400', 'completed', 4, 9.7, '2026-09-14', 'Shakespearean corporate tragedy with razor-sharp dialogue and brilliant acting.', 1, '2026-09-14 23:00:00'),
    ('ser-tlou', 'The Last of Us', 2023, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400', 'watching', 2, 9.1, NULL, 'Faithful and deeply moving adaptation of the post-apocalyptic narrative masterpiece.', 0, NULL);

-- 8. Series Genres Junction
INSERT OR REPLACE INTO series_genres (series_id, genre_id) VALUES
    ('ser-severance', 'g-scifi'),
    ('ser-severance', 'g-mystery'),
    ('ser-severance', 'g-thriller'),
    ('ser-arcane', 'g-animation'),
    ('ser-arcane', 'g-action'),
    ('ser-arcane', 'g-fantasy'),
    ('ser-breaking-bad', 'g-crime'),
    ('ser-breaking-bad', 'g-drama'),
    ('ser-breaking-bad', 'g-thriller'),
    ('ser-succession', 'g-drama'),
    ('ser-tlou', 'g-drama'),
    ('ser-tlou', 'g-action'),
    ('ser-tlou', 'g-scifi');

-- 9. Seasons
INSERT OR REPLACE INTO seasons (id, series_id, season_number, total_episodes) VALUES
    -- Severance (Season 1 completed, Season 2 at 2/10)
    ('sea-sev-1', 'ser-severance', 1, 9),
    ('sea-sev-2', 'ser-severance', 2, 10),

    -- Arcane (Season 1 completed, Season 2 at 3/9)
    ('sea-arc-1', 'ser-arcane', 1, 9),
    ('sea-arc-2', 'ser-arcane', 2, 9),

    -- Breaking Bad (All 5 seasons completed)
    ('sea-bb-1', 'ser-breaking-bad', 1, 7),
    ('sea-bb-2', 'ser-breaking-bad', 2, 13),
    ('sea-bb-3', 'ser-breaking-bad', 3, 13),
    ('sea-bb-4', 'ser-breaking-bad', 4, 13),
    ('sea-bb-5', 'ser-breaking-bad', 5, 16),

    -- Succession (All 4 seasons completed)
    ('sea-succ-1', 'ser-succession', 1, 10),
    ('sea-succ-2', 'ser-succession', 2, 10),
    ('sea-succ-3', 'ser-succession', 3, 9),
    ('sea-succ-4', 'ser-succession', 4, 10),

    -- The Last of Us
    ('sea-tlou-1', 'ser-tlou', 1, 9),
    ('sea-tlou-2', 'ser-tlou', 2, 7);

-- 10. Episodes
-- Severance Season 1 (All 9 completed)
INSERT OR REPLACE INTO episodes (id, season_id, series_id, episode_number, title, is_completed, completed_at, notes) VALUES
    ('ep-sev-1-1', 'sea-sev-1', 'ser-severance', 1, 'Good News About Hell', 1, '2026-11-01 21:00:00', 'Introduction to the severed floor.'),
    ('ep-sev-1-2', 'sea-sev-1', 'ser-severance', 2, 'Half Loop', 1, '2026-11-02 21:30:00', 'Helly tries to escape.'),
    ('ep-sev-1-3', 'sea-sev-1', 'ser-severance', 3, 'In Perpetuity', 1, '2026-11-04 20:45:00', 'The Perpetuity Wing and Kier Eagan lore.'),
    ('ep-sev-1-4', 'sea-sev-1', 'ser-severance', 4, 'The You You Are', 1, '2026-11-05 22:00:00', 'Ricken book discovered.'),
    ('ep-sev-1-5', 'sea-sev-1', 'ser-severance', 5, 'The Grim Barbarity of Optics and Design', 1, '2026-11-07 21:15:00', 'Burt and Irving connection.'),
    ('ep-sev-1-6', 'sea-sev-1', 'ser-severance', 6, 'Hide and Seek', 1, '2026-11-08 22:30:00', 'Cobel discovers the contraband book.'),
    ('ep-sev-1-7', 'sea-sev-1', 'ser-severance', 7, 'Defiant Jazz', 1, '2026-11-10 21:00:00', 'Music dance experience sequence.'),
    ('ep-sev-1-8', 'sea-sev-1', 'ser-severance', 8, 'What''s for Dinner?', 1, '2026-11-11 22:15:00', 'Preparing for the overtime contingency.'),
    ('ep-sev-1-9', 'sea-sev-1', 'ser-severance', 9, 'The We We Are', 1, '2026-11-12 23:00:00', 'Spectacular season finale.');

-- Severance Season 2 (Episodes 1 & 2 completed, 3-10 not completed -> 2/10 Episodes!)
INSERT OR REPLACE INTO episodes (id, season_id, series_id, episode_number, title, is_completed, completed_at, notes) VALUES
    ('ep-sev-2-1', 'sea-sev-2', 'ser-severance', 1, 'Hello Ms. Cobel', 1, '2026-11-14 22:00:00', 'Fallout from the gala revelation.'),
    ('ep-sev-2-2', 'sea-sev-2', 'ser-severance', 2, 'The Overtime Protocol', 1, '2026-11-15 22:15:00', 'Mark navigates new management protocols.'),
    ('ep-sev-2-3', 'sea-sev-2', 'ser-severance', 3, 'Break Room Confessions', 0, NULL, NULL),
    ('ep-sev-2-4', 'sea-sev-2', 'ser-severance', 4, 'Waffle Party Redux', 0, NULL, NULL),
    ('ep-sev-2-5', 'sea-sev-2', 'ser-severance', 5, 'Macrodata Refinement', 0, NULL, NULL),
    ('ep-sev-2-6', 'sea-sev-2', 'ser-severance', 6, 'The Testing Floor', 0, NULL, NULL),
    ('ep-sev-2-7', 'sea-sev-2', 'ser-severance', 7, 'Board of Directors', 0, NULL, NULL),
    ('ep-sev-2-8', 'sea-sev-2', 'ser-severance', 8, 'Cold Harbor', 0, NULL, NULL),
    ('ep-sev-2-9', 'sea-sev-2', 'ser-severance', 9, 'The Lumon Legacy', 0, NULL, NULL),
    ('ep-sev-2-10', 'sea-sev-2', 'ser-severance', 10, 'Severed Bonds', 0, NULL, NULL);

-- Arcane Season 1 (All 9 completed)
INSERT OR REPLACE INTO episodes (id, season_id, series_id, episode_number, title, is_completed, completed_at, notes) VALUES
    ('ep-arc-1-1', 'sea-arc-1', 'ser-arcane', 1, 'Welcome to the Playground', 1, '2026-10-20 20:00:00', NULL),
    ('ep-arc-1-2', 'sea-arc-1', 'ser-arcane', 2, 'Some Mysteries Are Better Left Unsolved', 1, '2026-10-21 20:00:00', NULL),
    ('ep-arc-1-3', 'sea-arc-1', 'ser-arcane', 3, 'The Base Violence Necessary for Change', 1, '2026-10-22 20:00:00', NULL),
    ('ep-arc-1-4', 'sea-arc-1', 'ser-arcane', 4, 'Happy Progress Day!', 1, '2026-10-23 20:00:00', NULL),
    ('ep-arc-1-5', 'sea-arc-1', 'ser-arcane', 5, 'Everybody Wants to Be My Enemy', 1, '2026-10-24 20:00:00', NULL),
    ('ep-arc-1-6', 'sea-arc-1', 'ser-arcane', 6, 'When These Walls Come Tumbling Down', 1, '2026-10-25 20:00:00', NULL),
    ('ep-arc-1-7', 'sea-arc-1', 'ser-arcane', 7, 'The Boy Savior', 1, '2026-10-26 20:00:00', NULL),
    ('ep-arc-1-8', 'sea-arc-1', 'ser-arcane', 8, 'Oil and Water', 1, '2026-10-27 20:00:00', NULL),
    ('ep-arc-1-9', 'sea-arc-1', 'ser-arcane', 9, 'The Monster You Created', 1, '2026-10-28 20:00:00', NULL);

-- Arcane Season 2 (Episodes 1-3 completed, 4-9 not completed)
INSERT OR REPLACE INTO episodes (id, season_id, series_id, episode_number, title, is_completed, completed_at, notes) VALUES
    ('ep-arc-2-1', 'sea-arc-2', 'ser-arcane', 1, 'Heavy Is the Crown', 1, '2026-11-09 21:00:00', NULL),
    ('ep-arc-2-2', 'sea-arc-2', 'ser-arcane', 2, 'Watch It All Burn', 1, '2026-11-10 21:00:00', NULL),
    ('ep-arc-2-3', 'sea-arc-2', 'ser-arcane', 3, 'Finally Got the Name Right', 1, '2026-11-11 21:00:00', NULL),
    ('ep-arc-2-4', 'sea-arc-2', 'ser-arcane', 4, 'Paint the Town Blue', 0, NULL, NULL),
    ('ep-arc-2-5', 'sea-arc-2', 'ser-arcane', 5, 'Blisters and Bedrock', 0, NULL, NULL),
    ('ep-arc-2-6', 'sea-arc-2', 'ser-arcane', 6, 'The Message Hidden in the Pattern', 0, NULL, NULL),
    ('ep-arc-2-7', 'sea-arc-2', 'ser-arcane', 7, 'All Paths Lead to Zaun', 0, NULL, NULL),
    ('ep-arc-2-8', 'sea-arc-2', 'ser-arcane', 8, 'Hexcore Awakening', 0, NULL, NULL),
    ('ep-arc-2-9', 'sea-arc-2', 'ser-arcane', 9, 'Ties That Bind', 0, NULL, NULL);

-- Breaking Bad, Succession, and TLOU key episodes
INSERT OR REPLACE INTO episodes (id, season_id, series_id, episode_number, title, is_completed, completed_at, notes) VALUES
    -- Breaking Bad Season 1
    ('ep-bb-1-1', 'sea-bb-1', 'ser-breaking-bad', 1, 'Pilot', 1, '2026-06-01 20:00:00', 'Walter White diagnosis and first cook.'),
    ('ep-bb-1-2', 'sea-bb-1', 'ser-breaking-bad', 2, 'Cat''s in the Bag...', 1, '2026-06-02 20:00:00', NULL),
    ('ep-bb-1-3', 'sea-bb-1', 'ser-breaking-bad', 3, '...And the Bag''s in the River', 1, '2026-06-03 20:00:00', NULL),
    ('ep-bb-1-4', 'sea-bb-1', 'ser-breaking-bad', 4, 'Cancer Man', 1, '2026-06-04 20:00:00', NULL),
    ('ep-bb-1-5', 'sea-bb-1', 'ser-breaking-bad', 5, 'Gray Matter', 1, '2026-06-05 20:00:00', NULL),
    ('ep-bb-1-6', 'sea-bb-1', 'ser-breaking-bad', 6, 'Crazy Handful of Nothin''', 1, '2026-06-06 20:00:00', NULL),
    ('ep-bb-1-7', 'sea-bb-1', 'ser-breaking-bad', 7, 'A No-Rough-Stuff-Type Deal', 1, '2026-06-07 20:00:00', NULL),

    -- Breaking Bad Season 5 Finale
    ('ep-bb-5-16', 'sea-bb-5', 'ser-breaking-bad', 16, 'Felina', 1, '2026-08-20 22:00:00', 'Series finale.'),

    -- Succession Season 1 & Finale
    ('ep-succ-1-1', 'sea-succ-1', 'ser-succession', 1, 'Celebration', 1, '2026-08-25 21:00:00', 'Logan Roy 80th birthday.'),
    ('ep-succ-4-10', 'sea-succ-4', 'ser-succession', 10, 'With Open Eyes', 1, '2026-09-14 23:00:00', 'Waystar board vote series finale.'),

    -- The Last of Us Season 1
    ('ep-tlou-1-1', 'sea-tlou-1', 'ser-tlou', 1, 'When You''re Lost in the Darkness', 1, '2026-10-01 21:00:00', 'Outbreak day.'),
    ('ep-tlou-1-9', 'sea-tlou-1', 'ser-tlou', 9, 'Look for the Light', 1, '2026-10-15 21:00:00', 'Salt Lake City hospital.');

-- 11. Plan Items (15 items: 5 Weekly, 6 Monthly, 4 Yearly)
INSERT OR REPLACE INTO plan_items (id, period_type, period_identifier, category, title, description, priority_order, is_completed, completed_at, linked_task_id, linked_movie_id, linked_series_id) VALUES
    -- Weekly Plan Items (period_identifier = '2026-W47')
    ('plan-w-1', 'weekly', '2026-W47', 'projects', 'Complete SQLite Seeding & Tauri IPC Bridge (Milestone 2)', 'Ensure full relational data schema and type-safe query commands', 1, 0, NULL, 'task-today-1', NULL, NULL),
    ('plan-w-2', 'weekly', '2026-W47', 'learning', 'Finish Chapters 4 & 5 of Rust Atomics and Locks', 'Read channels and spinlocks implementation patterns', 2, 0, NULL, 'task-up-2', NULL, NULL),
    ('plan-w-3', 'weekly', '2026-W47', 'personal_goals', 'Log 25km cumulative weekly running volume', 'Maintain aerobic endurance base for winter training', 3, 0, NULL, 'task-today-2', NULL, NULL),
    ('plan-w-4', 'weekly', '2026-W47', 'entertainment', 'Watch Severance Season 2 Episodes 1 & 2', 'Catch up with the new premiere episodes of Severance', 4, 1, '2026-11-15 22:15:00', NULL, NULL, 'ser-severance'),
    ('plan-w-5', 'weekly', '2026-W47', 'projects', 'Review design system token contrast in Dark Mode', 'Audit obsidian card backgrounds against WCAG guidelines', 5, 1, '2026-11-16 11:30:00', 'task-today-3', NULL, NULL),

    -- Monthly Plan Items (period_identifier = '2026-11')
    ('plan-m-1', 'monthly', '2026-11', 'projects', 'Ship Daymark Phase 1 Desktop Application (Milestones 1-5)', 'Deliver design system, SQLite engine, reactive layouts, and test pass', 1, 0, NULL, NULL, NULL, NULL),
    ('plan-m-2', 'monthly', '2026-11', 'learning', 'Master Tauri v2 Desktop IPC & Rusqlite connection pools', 'Complete hands-on workshops and refactor query commands', 2, 1, '2026-11-16 10:15:00', 'task-comp-1', NULL, NULL),
    ('plan-m-3', 'monthly', '2026-11', 'personal_goals', 'Maintain 14-day daily habit streak through mid-November', 'Consistency across daily checklist, goals, and morning mobility', 3, 1, '2026-11-16 08:00:00', NULL, NULL, NULL),
    ('plan-m-4', 'monthly', '2026-11', 'entertainment', 'Complete Denis Villeneuve Sci-Fi Film Retrospective', 'Rewatch Blade Runner 2049, Arrival, and Dune saga in 4K', 4, 0, NULL, NULL, 'mov-1', NULL),
    ('plan-m-5', 'monthly', '2026-11', 'personal_goals', 'Book Winter Mountain Travel & Lodge Reservations', 'Secure lodging and train transfers for December snow season', 5, 0, NULL, 'task-up-3', NULL, NULL),
    ('plan-m-6', 'monthly', '2026-11', 'projects', 'Consolidate and settle all annual cloud infrastructure invoices', 'Clear pending billing audits and optimize AWS/Azure spending', 6, 0, NULL, 'task-overdue-1', NULL, NULL),

    -- Yearly Plan Items (period_identifier = '2026')
    ('plan-y-1', 'yearly', '2026', 'projects', 'Launch Daymark Offline-First Desktop Productivity Suite', 'Full production release across Windows desktop platforms', 1, 0, NULL, NULL, NULL, NULL),
    ('plan-y-2', 'yearly', '2026', 'learning', 'Complete Advanced Systems Programming & Distributed Storage Curriculum', 'Deep dive into Rust, lock-free concurrency, LSM trees, and Raft consensus', 2, 0, NULL, NULL, NULL, NULL),
    ('plan-y-3', 'yearly', '2026', 'personal_goals', 'Run First Full Marathon (42.2km Sub-4hr target)', 'Consistent weekly aerobic base building and periodized training blocks', 3, 0, NULL, NULL, NULL, NULL),
    ('plan-y-4', 'yearly', '2026', 'entertainment', 'Curate 50-Film High-Cinema Archive with Personal Critical Reviews', 'Build an offline archive of influential modern cinema works with detailed notes', 4, 1, '2026-11-10 22:30:00', NULL, 'mov-2', NULL);

-- 12. Activity History Timeline (15 chronological records over the last 14 days)
INSERT OR REPLACE INTO activity_history (id, activity_type, entity_type, entity_id, title, metadata_json, timestamp) VALUES
    ('act-1', 'historical_added', 'series', 'ser-breaking-bad', 'Archived Breaking Bad (Complete Series, 5 Seasons)', '{"rating":9.9,"seasons":5,"status":"completed"}', '2026-11-03 18:30:00'),
    ('act-2', 'historical_added', 'series', 'ser-succession', 'Archived Succession (Complete Series, 4 Seasons)', '{"rating":9.7,"seasons":4,"status":"completed"}', '2026-11-04 19:15:00'),
    ('act-3', 'movie_completed', 'movie', 'mov-2', 'Watched Oppenheimer (Rating: 9.5/10)', '{"rating":9.5,"release_year":2023}', '2026-11-05 23:15:00'),
    ('act-4', 'task_completed', 'task', 'task-comp-2', 'Completed Morning Mobility Routine & Core Strength', '{"priority":"medium","category":"cat-fitness"}', '2026-11-06 08:30:00'),
    ('act-5', 'task_completed', 'task', 'task-today-3', 'Refactored Tailwind CSS Design Tokens', '{"priority":"high","category":"cat-focus"}', '2026-11-07 17:45:00'),
    ('act-6', 'episode_completed', 'episode', 'ep-arc-1-9', 'Watched Arcane S1:E9 - The Monster You Created', '{"series":"Arcane","season":1,"episode":9}', '2026-11-08 21:00:00'),
    ('act-7', 'task_completed', 'task', 'task-comp-3', 'Reviewed Offline SQLite Architecture Spec', '{"priority":"high","category":"cat-work"}', '2026-11-09 16:20:00'),
    ('act-8', 'movie_completed', 'movie', 'mov-1', 'Watched Dune: Part Two (Rating: 9.2/10)', '{"rating":9.2,"release_year":2024}', '2026-11-10 22:30:00'),
    ('act-9', 'plan_completed', 'plan_item', 'plan-y-4', 'Completed Yearly Goal: 50-Film Cinema Archive', '{"period":"2026","category":"entertainment"}', '2026-11-11 12:00:00'),
    ('act-10', 'episode_completed', 'episode', 'ep-sev-1-9', 'Watched Severance S1:E9 - The We We Are', '{"series":"Severance","season":1,"episode":9}', '2026-11-12 20:30:00'),
    ('act-11', 'task_completed', 'task', 'task-today-1', 'Implemented Recharts Spline Chart Component', '{"priority":"high","category":"cat-work"}', '2026-11-13 15:10:00'),
    ('act-12', 'episode_completed', 'episode', 'ep-sev-2-1', 'Watched Severance S2:E1 - Hello Ms. Cobel', '{"series":"Severance","season":2,"episode":1}', '2026-11-14 22:00:00'),
    ('act-13', 'task_completed', 'task', 'task-comp-3', 'Setup Offline SQLite Database Engine with WAL Mode', '{"priority":"high","category":"cat-focus"}', '2026-11-15 16:30:00'),
    ('act-14', 'episode_completed', 'episode', 'ep-sev-2-2', 'Watched Severance S2:E2 - The Overtime Protocol', '{"series":"Severance","season":2,"episode":2}', '2026-11-15 22:15:00'),
    ('act-15', 'task_completed', 'task', 'task-comp-1', 'Completed Tauri v2 IPC Migration Workshop', '{"priority":"high","category":"cat-learning"}', '2026-11-16 10:15:00');
        "#,
    },
];
