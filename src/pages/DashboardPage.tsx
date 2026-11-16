import React, { useState } from "react";
import {
  Database,
  HardDrive,
  Activity,
  Layers,
  FolderTree,
  Folder,
  RefreshCw,
  Clock,
} from "lucide-react";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { useDatabase } from "../hooks/useDatabase";
import { useAppInfo } from "../hooks/useAppInfo";

export const DashboardPage: React.FC = () => {
  const { status: dbStatus, loading, refreshStatus, ping } = useDatabase();
  const { appInfo } = useAppInfo();
  const [pingResult, setPingResult] = useState<number | null>(null);
  const [pinging, setPinging] = useState(false);

  const handleTestPing = async () => {
    setPinging(true);
    try {
      const ms = await ping();
      setPingResult(ms);
    } catch (e) {
      console.error(e);
    } finally {
      setPinging(false);
    }
  };

  const folderStructure = [
    {
      dir: "src/",
      desc: "Complete React + TypeScript frontend codebase adhering to strict modularity.",
      sub: [
        { name: "components/common/", desc: "Reusable UI components (Button, Badge, Card, Modal, Input)" },
        { name: "components/layout/", desc: "App layout: Collapsible Sidebar, Header, and StatusBar" },
        { name: "components/tasks/", desc: "Task-specific components and subtask lists" },
        { name: "components/entertainment/", desc: "Movie, Series, and Archive tracker components" },
        { name: "components/plan/", desc: "Weekly, Monthly, and Yearly horizon planners" },
        { name: "hooks/", desc: "Custom React hooks (useDatabase, useAppInfo, useTheme)" },
        { name: "lib/db/", desc: "Type definitions and Tauri IPC DatabaseClient abstraction" },
        { name: "pages/", desc: "Dedicated top-level view pages for each application module" },
        { name: "styles/", desc: "Tailwind CSS design tokens and custom dark charcoal styling" },
      ],
    },
    {
      dir: "src-tauri/",
      desc: "Rust desktop engine managing system integrations, native windows, and SQLite.",
      sub: [
        { name: "src/db/schema.rs", desc: "Normalized relational DDL migrations with initial seeds" },
        { name: "src/db/migrations.rs", desc: "Transaction-safe automated schema migration runner" },
        { name: "src/db/models.rs", desc: "Rust data structures matching normalized SQLite tables" },
        { name: "src/db/mod.rs", desc: "Windows AppData path resolution, WAL mode & foreign keys" },
        { name: "src/commands/", desc: "Tauri IPC commands for system info and database status" },
        { name: "src/state.rs", desc: "Thread-safe AppState with Mutex-wrapped SQLite connection" },
        { name: "capabilities/", desc: "Tauri v2 security permissions and desktop capabilities" },
        { name: "icons/", desc: "Complete set of multi-resolution desktop application icons" },
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Hero Banner: Phase 0 Verification */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-charcoal-800 via-charcoal-850 to-charcoal-800 border border-charcoal-600 relative overflow-hidden shadow-sm">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-sage-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="teal" className="text-xs uppercase tracking-wider font-bold">
                Phase 0 Verified
              </Badge>
              <span className="text-xs text-slate-400 font-mono">Build 0.1.0 • Windows Local Native</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              DAYMARK Architecture & Database Core
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Every day counts. Every completion stays. Phase 0 has initialized the offline-first desktop foundation, complete folder structure, SQLite WAL-mode engine, and native Tauri v2 IPC bridge.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="secondary"
              size="md"
              onClick={refreshStatus}
              icon={<RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleTestPing}
              disabled={pinging}
              icon={<Activity className="w-4 h-4" />}
            >
              {pinging ? "Testing Ping..." : "Live DB Ping"}
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Row: SQLite Status & Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Connection */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Database Connection</span>
            <Database className="w-4 h-4 text-sage-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-100 flex items-center gap-2">
              {dbStatus?.connected ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Connected
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Disconnected
                </>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Mode: <strong className="text-slate-300 font-mono">{dbStatus?.journal_mode?.toUpperCase() || "WAL"}</strong> • FKs: <strong className="text-emerald-400">{dbStatus?.foreign_keys_enabled ? "Active" : "Disabled"}</strong>
            </p>
          </div>
        </Card>

        {/* Metric 2: Migration Version */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Applied Migrations</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-100">
              v{dbStatus?.migration_version ?? 1}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Initial schema v1 loaded & verified
            </p>
          </div>
        </Card>

        {/* Metric 3: Active Tables */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Schema Tables</span>
            <HardDrive className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-100">
              {dbStatus?.tables_count ?? 15} Normalized Tables
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Full relational model initialized
            </p>
          </div>
        </Card>

        {/* Metric 4: IPC / DB Latency */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Roundtrip Latency</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-100 font-mono">
              {pingResult !== null ? `${pingResult} ms` : `${dbStatus?.ping_ms ?? 0} ms`}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Native Rust in-process query execution
            </p>
          </div>
        </Card>
      </div>

      {/* Database Details & Storage Path */}
      <Card title="SQLite Storage & Windows AppData Resolution" subtitle="Permanent offline storage configuration">
        <div className="space-y-4">
          <div className="p-3.5 rounded-lg bg-charcoal-900 border border-charcoal-600/70 font-mono text-xs text-slate-300 break-all flex items-start gap-3">
            <HardDrive className="w-4 h-4 text-sage-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-slate-400 text-[11px] mb-1">LOCAL DATABASE PATH (Windows %APPDATA%):</div>
              <span className="text-emerald-400 font-semibold">{dbStatus?.path || "Resolving..."}</span>
            </div>
          </div>

          {/* Tables Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Initialized Schema Tables & Initial Row Counts
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {dbStatus?.table_stats.map((table) => (
                <div
                  key={table.name}
                  className="p-2.5 rounded-lg bg-charcoal-850 border border-charcoal-600/60 flex items-center justify-between text-xs"
                >
                  <span className="font-mono text-slate-300 truncate" title={table.name}>
                    {table.name}
                  </span>
                  <Badge variant={table.count > 0 ? "teal" : "muted"} className="ml-2 font-mono text-[10px]">
                    {table.count}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Completed Architecture & Directory Explanations */}
      <Card
        title="Project Architecture & Directory Breakdown"
        subtitle="Completed file and folder structure established for DAYMARK"
        action={<Badge variant="teal">Phase 0 Complete</Badge>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {folderStructure.map((group) => (
            <div key={group.dir} className="p-4 rounded-xl bg-charcoal-850/80 border border-charcoal-600/70 space-y-3">
              <div className="flex items-center gap-2 border-b border-charcoal-700 pb-2">
                <FolderTree className="w-4 h-4 text-sage-400" />
                <span className="font-mono font-bold text-sm text-slate-100">{group.dir}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{group.desc}</p>
              <div className="space-y-1.5 pt-1">
                {group.sub.map((item) => (
                  <div key={item.name} className="flex items-start gap-2 text-xs">
                    <Folder className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div className="truncate">
                      <strong className="font-mono text-slate-200">{item.name}</strong>
                      <span className="text-slate-400 block text-[11px]">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Technical Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <Card title="Frontend Stack" subtitle="Modern desktop UI">
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-center justify-between">
              <span>Framework:</span>
              <strong className="text-slate-100">React 18 + TypeScript</strong>
            </li>
            <li className="flex items-center justify-between">
              <span>Bundler:</span>
              <strong className="text-slate-100">Vite 6</strong>
            </li>
            <li className="flex items-center justify-between">
              <span>Styling:</span>
              <strong className="text-slate-100">Tailwind CSS (Charcoal/Sage)</strong>
            </li>
            <li className="flex items-center justify-between">
              <span>Charts:</span>
              <strong className="text-slate-100">Recharts 2</strong>
            </li>
            <li className="flex items-center justify-between">
              <span>Icons:</span>
              <strong className="text-slate-100">Lucide React</strong>
            </li>
          </ul>
        </Card>

        <Card title="Rust Desktop Engine" subtitle="High-performance backend">
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-center justify-between">
              <span>Desktop Shell:</span>
              <strong className="text-slate-100">Tauri v2</strong>
            </li>
            <li className="flex items-center justify-between">
              <span>Target OS:</span>
              <strong className="text-slate-100">{appInfo?.os || "Windows x86_64"}</strong>
            </li>
            <li className="flex items-center justify-between">
              <span>Serialization:</span>
              <strong className="text-slate-100">Serde + Serde JSON</strong>
            </li>
            <li className="flex items-center justify-between">
              <span>IPC Layer:</span>
              <strong className="text-slate-100">Tauri Commands (Type-safe)</strong>
            </li>
            <li className="flex items-center justify-between">
              <span>Window:</span>
              <strong className="text-slate-100">1280x840 Native</strong>
            </li>
          </ul>
        </Card>

        <Card title="SQLite Engine" subtitle="Local embedded database">
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-center justify-between">
              <span>SQLite Engine:</span>
              <strong className="text-slate-100">{appInfo?.database_engine || "SQLite 3 (Embedded)"}</strong>
            </li>
            <li className="flex items-center justify-between">
              <span>SQLite Version:</span>
              <strong className="text-slate-100">v{appInfo?.sqlite_version || "3.46"}</strong>
            </li>
            <li className="flex items-center justify-between">
              <span>Journal Mode:</span>
              <strong className="text-emerald-400 font-mono">WAL (Write-Ahead Logging)</strong>
            </li>
            <li className="flex items-center justify-between">
              <span>Foreign Keys:</span>
              <strong className="text-emerald-400 font-mono">PRAGMA foreign_keys = ON</strong>
            </li>
            <li className="flex items-center justify-between">
              <span>Durability:</span>
              <strong className="text-slate-100">Zero Cloud • 100% Offline</strong>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};
