# DAYMARK

> *Every day counts. Every completion stays.*

DAYMARK is a production-quality, offline-first Windows desktop application that seamlessly combines:
1. **Personal Daily Task & Goal Manager**: Daily goals, prioritized tasks, subtasks, overdue tracking, and non-destructive completion archiving.
2. **Movie & TV Series Tracker**: Watchlist, active watching progress, episodic season tracking with independent episode counts, and ratings.
3. **Permanent Entertainment Archive**: A persistent historical ledger preserving every completed movie and series forever.
4. **PLAN Module & Statistics Dashboard**: Multi-horizon planning (weekly, monthly, yearly) and calculated offline analytics powered by SQLite and Recharts.

---

## 🛠️ Technology Stack
- **Desktop Engine**: Tauri v2 (Rust backend with Windows native Webview2)
- **Database**: SQLite 3 (Embedded with WAL mode and foreign key constraints via `rusqlite`)
- **Frontend Framework**: React 18 with TypeScript
- **Bundler & Tooling**: Vite 6, TypeScript 5.7
- **Styling**: Tailwind CSS (Dark charcoal base, sage/teal accents, soft grey secondary text)
- **Visualizations**: Recharts 2
- **Icons**: Lucide React

---

## 📂 Architecture & Directory Structure

```text
TO-DO-STARTER-PROJECT-/
├── .vscode/                     # VS Code recommended settings and configurations
├── plan.md                      # Comprehensive 8-phase master development plan & checklists
├── package.json                 # Node dependencies, scripts, and build configurations
├── tsconfig.json                # TypeScript compiler configuration with path aliases
├── vite.config.ts               # Vite bundler configuration tailored for Tauri
├── tailwind.config.js           # Design system tokens (charcoal palette, sage accents)
├── postcss.config.js            # PostCSS configuration
├── index.html                   # Application entry HTML
│
├── src/                         # Complete React + TypeScript frontend codebase
│   ├── components/              # Modular UI components
│   │   ├── common/              # Reusable components (Badge, Button, Card, Modal)
│   │   ├── layout/              # Sidebar, Top Header, and System StatusBar
│   │   ├── tasks/               # Task-specific components and subtask lists
│   │   ├── entertainment/       # Movie, Series, and Archive components
│   │   └── plan/                # Multi-horizon planning components
│   ├── hooks/                   # Custom React hooks (useDatabase, useAppInfo, useTheme)
│   ├── lib/                     # Frontend client utilities and IPC abstractions
│   │   ├── db/                  # Type-safe Tauri IPC database client & interfaces
│   │   │   ├── client.ts        # Typed invoke wrappers for Rust DB commands
│   │   │   └── types.ts         # TypeScript models mirroring Rust/SQLite entities
│   │   └── utils.ts             # Styling helpers (clsx, twMerge)
│   ├── pages/                   # View pages for all 8 application modules
│   │   ├── DashboardPage.tsx    # Home dashboard & Phase 0 architecture verification
│   │   ├── TasksPage.tsx        # Daily tasks & goals view
│   │   ├── MoviesPage.tsx       # Movie tracker view
│   │   ├── SeriesPage.tsx       # Series & episode tracker view
│   │   ├── ArchivePage.tsx      # Permanent entertainment archive
│   │   ├── PlanPage.tsx         # Multi-horizon PLAN module
│   │   ├── ActivityPage.tsx     # Chronological completion activity timeline
│   │   ├── StatisticsPage.tsx   # Recharts analytics & insights
│   │   └── SettingsPage.tsx     # Application settings and DB management
│   ├── styles/                  # Tailwind directives and desktop scrollbar styling
│   ├── App.tsx                  # Root application router and layout wrapper
│   └── main.tsx                 # React entrypoint
│
└── src-tauri/                   # Rust desktop engine & local SQLite database layer
    ├── Cargo.toml               # Rust dependencies (tauri, rusqlite, serde, chrono, uuid)
    ├── tauri.conf.json          # Tauri configuration (window, product name, bundle settings)
    ├── build.rs                 # Tauri build script
    ├── capabilities/            # Tauri v2 security capabilities and window permissions
    │   └── default.json
    ├── icons/                   # Multi-resolution application icons (Windows ICO, ICNS, PNG)
    └── src/
        ├── main.rs              # Desktop executable entrypoint
        ├── lib.rs               # Tauri app builder, plugin registration & setup hook
        ├── state.rs             # Thread-safe AppState with Mutex-wrapped SQLite connection
        ├── commands/            # Tauri IPC command handlers
        │   ├── mod.rs           # Command registry
        │   ├── db.rs            # Database status and query ping commands
        │   └── system.rs        # App information and environment telemetry
        └── db/                  # SQLite management layer
            ├── mod.rs           # AppData path resolution, WAL mode, foreign keys, tests
            ├── migrations.rs    # Transaction-safe schema migration runner
            ├── models.rs        # Rust structs matching SQLite entities
            └── schema.rs        # Normalized DDL schema (15 tables) and initial seed data
```

---

## 🗄️ SQLite Database Architecture

Daymark persists all data locally inside the Windows AppData directory:
`%APPDATA%\com.daymark.app\daymark.db`

The normalized schema features 15 relational tables with Write-Ahead Logging (`WAL`), foreign keys enabled (`PRAGMA foreign_keys = ON`), and automated migration tracking (`schema_migrations`):

| Table | Purpose |
|---|---|
| `schema_migrations` | Automated version tracking for database migrations |
| `app_settings` | Key-value store for application preferences and theme |
| `genres` | Normalized genres for movies and series (seeded with 15 standard genres) |
| `task_categories` | Categories for organizing tasks (Work, Personal, Fitness, etc.) |
| `tasks` | Daily tasks with priority, status, due dates, and completion timestamps |
| `subtasks` | Nested checklists belonging to tasks (`ON DELETE CASCADE`) |
| `daily_goals` | Daily task target count and planning notes |
| `movies` | Movies with status (planned, watching, completed), ratings, and notes |
| `movie_genres` | Many-to-many junction between movies and genres |
| `series` | Series metadata, season count, and status |
| `series_genres` | Many-to-many junction between series and genres |
| `seasons` | Individual season structures per series (`ON DELETE CASCADE`) |
| `episodes` | Episodes with titles, completion status, and timestamps (`ON DELETE CASCADE`) |
| `plan_items` | Multi-horizon objectives (weekly, monthly, yearly) linked to tasks/media |
| `activity_history` | Chronological audit log of all completions across the entire app |

---

## 🚀 Development Progress

- [x] **Phase 0 — Architecture & Project Initialization** *(Completed & Tested)*
- [ ] **Phase 1 — Design System & Application UI** *(Awaiting Approval)*
- [ ] **Phase 2 — Daily Tasks & Goals**
- [ ] **Phase 3 — Movie Tracker**
- [ ] **Phase 4 — Series & Episode Tracker**
- [ ] **Phase 5 — Entertainment Archive**
- [ ] **Phase 6 — PLAN Module**
- [ ] **Phase 7 — Activity History & Statistics**
- [ ] **Phase 8 — Final Polish, Testing & EXE Release**
