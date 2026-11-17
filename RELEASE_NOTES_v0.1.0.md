# DAYMARK — Version 0.1.0 Release Notes

**Tagline**: *Every day counts. Every completion stays.*  
**Release Date**: November 17, 2026  
**Target Platform**: Windows 10 / 11 (x64)  
**Binary Type**: Native Desktop Application & NSIS Installer  

---

## 1. Executive Summary

DAYMARK v0.1.0 is a 100% offline-first Windows desktop productivity and entertainment ledger built using Tauri v2, React 18, TypeScript, Vite, Tailwind CSS, and embedded SQLite with WAL (Write-Ahead Logging) journaling.

Unlike typical cloud-dependent todo apps or tracking sites, DAYMARK guarantees:
- **Zero Network Reliance**: Zero external telemetry, zero external API calls, zero cloud dependencies. Operates seamlessly in air-gapped environments or offline airplane mode.
- **Permanent Retention Guarantee**: Completed tasks, movies, series, episodes, and historical records are never automatically purged or erased.
- **Embedded Local SQLite Engine**: All user records are stored safely in Windows AppData (`%APPDATA%\com.daymark.desktop\daymark.db`).
- **Complete Data Ownership**: Full one-click JSON backup export and lossless snapshot restore right from the Settings view.

---

## 2. Release Deliverables

| Deliverable | Location | File Size | Description |
|---|---|---|---|
| **Windows NSIS Installer** | `src-tauri/target/release/bundle/nsis/DAYMARK_0.1.0_x64-setup.exe` | ~2.92 MB | Standard Windows desktop setup installer with desktop and start menu shortcuts. |
| **Standalone Executable** | `src-tauri/target/release/daymark.exe` | ~11.13 MB | Portable, highly optimized native Windows release binary with bundled SQLite engine. |
| **Local SQLite Database** | `%APPDATA%\com.daymark.desktop\daymark.db` | Auto-created | High-performance SQLite database operating in WAL mode with foreign keys enabled. |

---

## 3. Module Capabilities & Features

### 3.1 Daily Tasks & Goals
- **Task Management**: Quick inline add and modal dialogs with validation.
- **Smart Filtering**: Fast switching between **Today**, **Upcoming**, **Overdue**, and **Completed** smart views.
- **Priority System**: 4 distinct visual priorities (`Urgent`, `High`, `Medium`, `Low`) with subtle border badges.
- **Categories & Tags**: Custom category classification with customizable hex colors.
- **Nested Subtask Checklists**: Dynamic checklists with interactive completion percentages.
- **Daily Goals Tracker**: Configurable daily target goal (e.g. 5 tasks/day) with interactive progress ring and celebration states.
- **Undo & Timestamps**: Exact completion timestamps recorded for every completed task with one-click undo capability.

### 3.2 Movie Tracker
- **Movie Cataloging**: Add movies with release year, runtime, multi-genre tags, poster URLs/colors, and personal notes.
- **Status Workflow**: Filter and manage movies across `Planned`, `Watching`, and `Completed`.
- **Personal Ratings**: 1–10 rating scale with decimal precision and visual star score indicators.
- **Watch Dates**: Exact watch date recording with calendar integration.

### 3.3 Series & Episode Tracker
- **Hierarchical Management**: Full Series $\rightarrow$ Seasons $\rightarrow$ Episodes data structure.
- **Dynamic Configuration**: Configure custom episode counts and custom episode titles per season.
- **Interactive Checkboxes**: One-click episode marking with muted styling and completion timestamps.
- **Dual Progress Tracking**: Dynamic progress bars per season (e.g. `8/10 Episodes`) and cumulative series completion percentage.
- **Automatic Series Completion**: Marking the final episode automatically prompts for a 1–10 series rating and transitions status to `Completed`.
- **Dynamic Seasons & Episodes**: Add or remove seasons and episodes dynamically without losing watched progress on existing episodes.

### 3.4 Entertainment Archive
- **Unified Entertainment Ledger**: Combined historical ledger of all watched movies and finished TV series.
- **Direct-to-Archive Entry**: Add previously watched movies and completed TV series directly with approximate completion years and rating scores.
- **Duplicate Prevention**: Real-time title and year uniqueness verification prevents duplicate entries.
- **Multi-Criteria Search & Filtering**: Instant full-text search, genre filters, and rating sorting.
- **Permanent Record**: Guaranteed permanent storage with zero automated deletion.

### 3.5 PLAN Module (Tactical & Strategic Horizons)
- **Multi-Horizon Planning**: Weekly, Monthly, and Macro-Yearly planning horizons.
- **Cycle Navigation**: Fast forward/backward cycle jumping and jumper modal.
- **Standard & Custom Categories**: `Projects`, `Learning`, `Personal Goals`, `Entertainment`, and user-defined custom categories with colored badges.
- **Priority Reordering**: 1..N order of importance with drag-and-drop and up/down priority shift.
- **Automatic Completion Sync**: Completing a linked task, movie, or series automatically marks the associated plan objective as completed.
- **Manual Rollover (Carry Forward)**: One-click rollover to transfer unfinished objectives into the next planning period.

### 3.6 Activity History & Statistics
- **Unified Chronological Timeline**: Real-time audit log tracking all completions (tasks, movies, episodes, series, and plan objectives) with timestamps and entity icons.
- **Activity & Date Range Filtering**: Filter by activity type (`All`, `Tasks`, `Movies`, `Episodes`, `Series`, `Plans`) and date range (`Today`, `This Week`, `This Month`, `All Time`).
- **Productivity KPI Metrics**: Total tasks completed, completion rate percentage, daily average, current streak, and longest streak.
- **Recharts Data Visualizations**:
  - 90-Day GitHub-style activity contribution calendar heatmap.
  - Day-of-Week completion distribution bar chart.
  - 6-Month multi-track comparative trend line chart (Tasks vs Media).
  - Entertainment genre distribution horizontal bar chart.
  - Personal 1–10 rating score frequency histogram.
- **Strict SQLite Analytics**: All metrics computed directly in SQLite using `strftime`, `COUNT`, and `AVG` without mock calculations.

### 3.7 Database Backup & Restore System
- **One-Click Export**: Dumps all 14 database tables (`app_settings`, `genres`, `task_categories`, `tasks`, `subtasks`, `daily_goals`, `movies`, `movie_genres`, `series`, `seasons`, `episodes`, `series_genres`, `plan_items`, `activity_history`) into an offline JSON snapshot file.
- **Lossless Restore**: Imports a `daymark-backup-*.json` file inside a safe SQLite transaction with reverse-topological wipe, schema validation, and audit entry logging.
- **Validation**: Rejects invalid, non-DAYMARK, or corrupted files before modifying state.

### 3.8 Resilience & Polish
- **React Error Boundary**: Catches unexpected rendering errors gracefully, displays an obsidian recovery card, and ensures the user's SQLite data on disk remains untouched.
- **Theme Support**: Persistent dark obsidian theme with sage/teal accents and high-contrast light mode toggle.
- **Window Constraints**: Responsive desktop window dimensions constrained to a minimum of 980x640 with default 1280x840.

---

## 4. Test Verification Summary

DAYMARK includes an automated offline test infrastructure executing 8 comprehensive test suites:
- `tests/smoke.test.ts`: Jest matchers, spy interception, React DOM matchers, and Tauri IPC mock bridge contracts.
- `tests/phase2.test.ts`: Tasks, subtasks, categories, daily goals, and UI interactions (17 tests).
- `tests/phase3.test.ts`: Movies CRUD, multi-genres, rating, status workflows, and UI filtering (9 tests).
- `tests/phase4.test.ts`: Hierarchical series, season/episode generation, progress bars, rate series, and UI (14 tests).
- `tests/phase5.test.ts`: Combined archive, direct-to-archive historical movies/series, duplicate checks (10 tests).
- `tests/phase6.test.ts`: Horizon stepping, plan items CRUD, priority reordering, auto completion sync, and rollover (17 tests).
- `tests/phase7.test.ts`: SQLite metric queries, day-of-week coverage, rating histogram, genre ranking, timeline audit (10 tests).
- `tests/phase8.test.ts`: Full backup JSON export, lossless restore, corrupted backup rejection, error boundary, settings UI, and offline guarantee (7 tests).

**Total Test Results**: **95 / 95 passing (0 failures)** across 43 test suites in ~2.0 seconds.

---

## 5. System Requirements & Installation

### Requirements:
- **Operating System**: Windows 10 (version 1809 or higher) or Windows 11 (x64).
- **Runtime**: Microsoft Edge WebView2 Evergreen Runtime (pre-installed on modern Windows 10 & 11).
- **Disk Space**: ~25 MB storage space.

### Installation:
1. Run `DAYMARK_0.1.0_x64-setup.exe`.
2. Follow the NSIS setup wizard prompts (CurrentUser or AllUsers).
3. Launch **DAYMARK** from the Start Menu or Desktop shortcut.
4. Alternatively, run `daymark.exe` directly as a standalone portable application.
