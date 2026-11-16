# DAYMARK — Development Master Plan

**Tagline**: *Every day counts. Every completion stays.*

DAYMARK is a production-quality, offline-first Windows desktop application that combines:
1. Personal daily task and goal management.
2. Movie and TV series tracking.
3. Permanent personal completion archive.
4. Comprehensive activity and statistics dashboard with planning capabilities.

---

## Development Rule
- Complete, test, and approve each phase before moving to the next.
- No skipping phases.
- No fake or mock functionality.
- Never delete completed records automatically.
- Store all data locally in a robust SQLite database located in the Windows AppData directory.

---

## Phase 0 — Architecture & Project Initialization
- [x] **0.1 Environment verification**: Verify Node.js, Rust/Cargo, MSVC Build Tools, and pnpm.
- [x] **0.2 Tauri 2 + React + TypeScript + Vite initialization**: Set up Tauri v2 desktop shell with React 18, TypeScript, and Vite bundler.
- [x] **0.3 Frontend and Rust backend configuration**: Configure Tailwind CSS (charcoal backgrounds, sage/teal accents, soft grey secondary text), PostCSS, tsconfig path aliases, and Tauri capabilities.
- [x] **0.4 SQLite integration**: Configure `rusqlite` (bundled engine) in Rust with WAL mode, foreign keys, and safe connection state management.
- [x] **0.5 Folder and file architecture**: Establish clean modular directory layout for frontend (`components`, `hooks`, `lib`, `pages`, `styles`, `types`) and backend (`commands`, `db`, `models`, `state`).
- [x] **0.6 Database schema and migrations**: Design normalized schema for Tasks, Subtasks, Goals, Movies, Series, Seasons, Episodes, Genres, Plans, Activity History, and Settings with automated migration runner.
- [x] **0.7 Git and README setup**: Set up version control, documentation, and architecture description.
- [x] **0.8 Initial desktop application launch**: Launch and verify the native Tauri desktop window connecting to SQLite.

---

## Phase 1 — Design System & Application UI
- [x] **1.1 Colour palette and design tokens**: Implement dark charcoal backgrounds, muted sage green/teal accents, subtle borders, and soft grey text.
- [x] **1.2 Typography and spacing**: Native desktop font stack, consistent spacing scale, and restrained rounded borders.
- [x] **1.3 Sidebar and navigation**: Polished collapsible sidebar with 8 primary routes + PLAN module.
- [x] **1.4 Top navigation and search**: Header with active route title, global search bar, current date, and status indicators.
- [x] **1.5 Reusable UI components**: Button, Input, Modal, Badge, Dropdown, Card, Tooltip, Progress bar, and Tab controls.
- [x] **1.6 Home dashboard layout**: Grid layout with summary metrics, daily progress bar, quick actions, and recent activity preview.
- [x] **1.7 Daily Tasks page layout**: View switcher (Today, Upcoming, Overdue, Completed), filter bar, and task list container.
- [x] **1.8 Movies page layout**: Grid/table views, status tabs (Planned, Watching, Completed), filter controls, and add modal.
- [x] **1.9 Series page layout**: Series cards, season/episode hierarchical view, and progress bars.
- [x] **1.10 Entertainment Archive layout**: Unified library view with Movies/Series tabs, genre filter pills, and rating sorting.
- [x] **1.11 PLAN page layout**: Multi-horizon views (Weekly, Monthly, Yearly) with categorized columns.
- [x] **1.12 Activity History and Statistics layouts**: Chronological activity timeline and Recharts analytics grid.
- [x] **1.13 Settings page**: General preferences, theme toggle, database backup/restore, and app metadata.
- [x] **1.14 Dark and light themes**: Seamless theme switching with persistent preference.
- [x] **1.15 Navigation and responsive desktop layouts**: Fluid layout transitions and minimum window constraints.

---

## Phase 2 — Daily Tasks & Goals
- [x] **2.1 Create tasks**: Modal & inline quick-add with validation.
- [x] **2.2 Edit and delete tasks**: Inline editing and modal management with deletion confirmation.
- [x] **2.3 Task priorities**: Urgent, High, Medium, Low with visual indicators.
- [x] **2.4 Task categories**: Custom categories/tags with color badges.
- [x] **2.5 Due dates and reminders**: Date picker, due date tags, and overdue detection.
- [x] **2.6 Subtasks**: Nested checklists with progress percentage.
- [x] **2.7 Daily goals**: Target daily completion goals with visual tracker.
- [x] **2.8 Today, Upcoming and Overdue sections**: Filtered smart lists based on target dates.
- [x] **2.9 Completed tasks section**: Dedicated section where completed tasks are moved and visually de-emphasized.
- [x] **2.10 Completion timestamps and undo**: Accurate completion timestamp recording and one-click undo capability.
- [x] **2.11 Search, filters and sorting**: Real-time title search, category filter, priority sort, and due date sort.
- [x] **2.12 SQLite persistence and testing**: Full CRUD verification and data survival across application restarts.

---

## Phase 3 — Movie Tracker
- [ ] **3.1 Add movies**: Comprehensive modal with title, release year, genres, notes, and poster.
- [ ] **3.2 Movie title and information**: Metadata display, overview, runtime, and directors.
- [ ] **3.3 Genre selection**: Multi-genre tagging per movie.
- [ ] **3.4 Release year**: Year validation and filtering.
- [ ] **3.5 Optional posters and descriptions**: Local image storage or URL handling.
- [ ] **3.6 Planned, Watching and Completed statuses**: Status workflow management.
- [ ] **3.7 Personal rating out of 10**: Star/numeric rating input with decimal support.
- [ ] **3.8 Completion date**: Exact watched date recording.
- [ ] **3.9 Movie details and editing**: Edit all movie metadata and status updates.
- [ ] **3.10 Movie library**: Filterable grid and list views.
- [ ] **3.11 Genre, rating and year filters**: Multi-attribute filtering.
- [ ] **3.12 Search and sorting**: Fast title search and sorting by rating, year, and date added.
- [ ] **3.13 Database persistence and testing**: Verify database foreign keys, cascade safety, and persistence.

---

## Phase 4 — Series & Episode Tracker
- [ ] **4.1 Add series**: Series name, genres, release year, poster, and total seasons.
- [ ] **4.2 Series information and genres**: Multi-genre tags and synopsis.
- [ ] **4.3 Configure total seasons**: Dynamic season creation.
- [ ] **4.4 Configure episodes separately for each season**: Individual episode count per season.
- [ ] **4.5 Automatically generate episode lists**: S01E01 numbering with default naming.
- [ ] **4.6 Default episode names**: Formatted `Episode {n}` naming convention.
- [ ] **4.7 Edit individual episode names**: Custom episode title editing.
- [ ] **4.8 Episode completion checkboxes**: One-click checkmark with muted grey completion style.
- [ ] **4.9 Completion timestamps**: Timestamp recorded per completed episode.
- [ ] **4.10 Season-wise progress**: Dynamic progress bars per season (e.g. 8/10 episodes).
- [ ] **4.11 Overall series progress**: Cumulative percentage across all seasons.
- [ ] **4.12 Add and remove seasons**: Safely add or remove seasons without losing existing progress.
- [ ] **4.13 Add and remove episodes**: Adjust episode count dynamically.
- [ ] **4.14 Preserve progress when editing**: Never erase watched episode status when modifying counts.
- [ ] **4.15 Automatic series completion**: Triggered when the final episode is checked.
- [ ] **4.16 Personal rating out of 10**: Rating prompt upon series completion.
- [ ] **4.17 Database integration and testing**: Verify hierarchical relations (Series -> Seasons -> Episodes) in SQLite.

---

## Phase 5 — Entertainment Archive
- [ ] **5.1 Combined entertainment library**: Unified archive view for all completed content.
- [ ] **5.2 Separate Movies and Series sections**: Dedicated sub-views.
- [ ] **5.3 Completed entertainment collection**: Permanent record of everything finished.
- [ ] **5.4 Genre organization**: Genre aggregations and distribution.
- [ ] **5.5 Personal ratings**: Rating badges and distribution overview.
- [ ] **5.6 Completion dates**: Sorting and grouping by completion year/month.
- [ ] **5.7 Historical movie addition**: Direct-to-archive entry for previously watched movies.
- [ ] **5.8 Historical series addition**: Direct-to-archive entry for previously completed series.
- [ ] **5.9 Optional approximate completion year**: Historical year picker without requiring exact day.
- [ ] **5.10 Optional historical season and episode information**: Record historical series stats.
- [ ] **5.11 Search and filters**: Full-text search and multi-criteria filters.
- [ ] **5.12 Editing archived records**: Update ratings, notes, and dates.
- [ ] **5.13 Duplicate prevention**: Title and year uniqueness checks.
- [ ] **5.14 Permanent archive persistence**: Guarantees that records are never purged automatically.

---

## Phase 6 — PLAN Module
- [ ] **6.1 Monthly planning**: Monthly goal setting and milestone tracking.
- [ ] **6.2 Weekly planning**: Week-by-week tactical plans.
- [ ] **6.3 Yearly planning**: Long-term macro goals for the year.
- [ ] **6.4 Navigate between planning periods**: Next/previous cycle navigation and calendar jumpers.
- [ ] **6.5 Entertainment category**: Queue movies and series intended for the cycle.
- [ ] **6.6 Learning category**: Books, courses, skills, and certifications.
- [ ] **6.7 Personal Goals category**: Health, fitness, habits, and mindset.
- [ ] **6.8 Projects category**: Side projects, work initiatives, and home tasks.
- [ ] **6.9 Custom categories**: User-defined plan categories with custom color tags.
- [ ] **6.10 Add plan items**: Modal for adding plan objectives with targets.
- [ ] **6.11 Priority numbering**: Explicit 1..N order of importance.
- [ ] **6.12 Drag-and-drop priority reordering**: Smooth visual reordering.
- [ ] **6.13 Edit and delete plan items**: Full editing controls.
- [ ] **6.14 Link plan items with daily tasks**: Connect daily tasks to high-level plan goals.
- [ ] **6.15 Link movies and series with plans**: Connect entertainment targets directly to tracker items.
- [ ] **6.16 Automatic completion synchronization**: Complete linked task/movie/series -> auto-marks plan item.
- [ ] **6.17 Completed items remain visible and greyed out**: Finished items stay in place with checked, muted style.
- [ ] **6.18 Plan progress calculations**: Completion rate percentage per category and overall.
- [ ] **6.19 Historical plans**: Browse completed past cycles (previous months/years).
- [ ] **6.20 Carry unfinished items forward manually**: One-click rollover to the next period.
- [ ] **6.21 Plan statistics and testing**: Verification of planning cycles in SQLite.

---

## Phase 7 — Activity History & Statistics
- [ ] **7.1 Task completion history**: Audit log of every task finished.
- [ ] **7.2 Movie completion history**: Movie finish events with ratings.
- [ ] **7.3 Episode completion history**: Episode watching chronology.
- [ ] **7.4 Series completion history**: Full series completion records.
- [ ] **7.5 Plan completion history**: Milestone completion tracking.
- [ ] **7.6 Chronological activity timeline**: Unified feed sorted by timestamp.
- [ ] **7.7 Date-based filtering**: Range picker (Today, This Week, This Month, Custom).
- [ ] **7.8 Productivity statistics**: Total tasks, completion streak, and daily average.
- [ ] **7.9 Daily, weekly and monthly task statistics**: Recharts bar and line charts.
- [ ] **7.10 Movie statistics**: Total watched, total hours, average rating.
- [ ] **7.11 Series and episode statistics**: Total episodes, seasons, and series finished.
- [ ] **7.12 Genre distribution**: Recharts radar/pie chart of entertainment genres.
- [ ] **7.13 Average personal ratings**: Distribution histogram of 1-10 ratings.
- [ ] **7.14 Monthly and yearly charts**: Comparative output charts across months.
- [ ] **7.15 Activity calendar heatmap**: GitHub-style activity contribution map.
- [ ] **7.16 Plan completion statistics**: Percentage of planned goals achieved per cycle.
- [ ] **7.17 Verify calculations using real database records**: Strict SQLite queries for all metric calculations (no mock calculations).

---

## Phase 8 — Final Polish, Testing & EXE Release
- [ ] **8.1 Complete application testing**: Comprehensive end-to-end user workflow pass.
- [ ] **8.2 Navigation testing**: Deep routing and state preservation verification.
- [ ] **8.3 Forms and interaction testing**: Form validation, shortcuts, modal behaviors.
- [ ] **8.4 Database CRUD testing**: Verify every table's insert, update, query, and delete operations.
- [ ] **8.5 Persistence testing**: Data integrity checks across hard app kills.
- [ ] **8.6 Database migration testing**: Verify automatic schema migration on clean and existing databases.
- [ ] **8.7 Backup and restore functionality**: Export database to JSON/SQL file and restore from backup file.
- [ ] **8.8 Offline functionality testing**: Ensure zero network calls and full functionality in airplane mode.
- [ ] **8.9 UI and animation polishing**: Micro-interactions, transitions, and hover feedback.
- [ ] **8.10 Performance optimization**: Virtualization, fast query indexing, and instant tab transitions.
- [ ] **8.11 Error handling**: Graceful fallback UI and error boundaries.
- [ ] **8.12 Application icon and branding**: High-resolution Windows `.ico` and branding assets.
- [ ] **8.13 Application metadata and versioning**: App version, copyright, publisher info in Tauri config.
- [ ] **8.14 Tauri Windows bundling**: Configure Windows NSIS / MSI bundle settings.
- [ ] **8.15 Generate .exe installer**: Run `tauri build` to produce release Windows installer `.exe`.
- [ ] **8.16 Install on Windows independently**: Install via `.exe` and verify desktop shortcut.
- [ ] **8.17 Test without development tools**: Run without Node, terminal, or VS Code.
- [ ] **8.18 Test without internet**: Complete offline execution verification.
- [ ] **8.19 Verify data survives application restarts**: Complete restart test on production installer.
- [ ] **8.20 Final documentation and release**: User guide, developer guide, and release notes.

---

## Final Project Deliverables
1. Complete DAYMARK source code.
2. Fully functional Windows desktop application.
3. Downloadable `.exe` installer.
4. Local SQLite database with automated migrations.
5. 100% offline functionality.
6. Local backup and restore system.
7. Complete project documentation.
8. Git repository with clean commit history.
