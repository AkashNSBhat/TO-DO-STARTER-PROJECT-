import React, { useState } from "react";
import {
  Settings,
  HardDrive,
  RefreshCw,
  Sun,
  Moon,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  User,
  Smartphone,
} from "lucide-react";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { Modal } from "../components/common/Modal";
import { useDatabase } from "../hooks/useDatabase";
import { useAppInfo } from "../hooks/useAppInfo";
import { useSettings } from "../hooks/useSettings";
import { useTheme } from "../hooks/useTheme";
import { DatabaseClient } from "../lib/db/client";
import { CatalogueClient } from "../lib/catalog/client";
import { cn } from "../lib/utils";

export const SettingsPage: React.FC = () => {
  const { status: dbStatus, refreshStatus } = useDatabase();
  const { appInfo } = useAppInfo();
  const { settings, updateSetting } = useSettings();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const [userName, setUserName] = useState(settings.user_name || "Akash");
  const [dailyGoalTarget, setDailyGoalTarget] = useState(
    settings.daily_goal_target || "5"
  );
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreContent, setRestoreContent] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [tmdbApiKey, setTmdbApiKey] = useState(CatalogueClient.getTmdbApiKey());
  const [tmdbKeySaved, setTmdbKeySaved] = useState(false);

  const handleSaveTmdbKey = (e: React.FormEvent) => {
    e.preventDefault();
    CatalogueClient.setTmdbApiKey(tmdbApiKey);
    setTmdbKeySaved(true);
    setTimeout(() => setTmdbKeySaved(false), 2500);
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSetting("user_name", userName);
    await updateSetting("daily_goal_target", dailyGoalTarget);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      const jsonBackup = await DatabaseClient.exportBackup();
      const blob = new Blob([jsonBackup], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement("a");
      downloadAnchor.href = url;
      downloadAnchor.download = `daymark-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
      setIsBackupModalOpen(false);
    } catch (err) {
      console.error("Export backup error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreError(null);
    setRestoreSuccess(false);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.app !== "DAYMARK") {
          setRestoreError("The selected file is not a valid DAYMARK database snapshot.");
          return;
        }
        setRestoreContent(text);
      } catch {
        setRestoreError("Failed to parse JSON backup file.");
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (!restoreContent) return;
    try {
      setIsRestoring(true);
      setRestoreError(null);
      await DatabaseClient.restoreBackup(restoreContent);
      setRestoreSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setRestoreError(err instanceof Error ? err.message : "Failed to restore database backup.");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Settings className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Settings & Preferences
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure desktop appearance, daily productivity targets, and local SQLite data backups.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={refreshStatus}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Telemetry
        </Button>
      </div>

      {/* Preferences & Appearance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appearance & Themes */}
        <Card
          title="Desktop Appearance"
          subtitle="Customize dark obsidian or light mode"
        >
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={cn(
                  "p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer",
                  isDark
                    ? "bg-charcoal-850 border-teal-500 text-teal-400 shadow-md ring-1 ring-teal-500"
                    : "bg-slate-50 dark:bg-charcoal-900 border-slate-200 dark:border-charcoal-700 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <Moon className="w-6 h-6" />
                <span className="text-xs font-bold">Obsidian Dark</span>
                <span className="text-[10px] text-slate-400">Default Palette</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("light")}
                className={cn(
                  "p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer",
                  !isDark
                    ? "bg-white border-teal-500 text-teal-600 shadow-md ring-1 ring-teal-500"
                    : "bg-slate-50 dark:bg-charcoal-900 border-slate-200 dark:border-charcoal-700 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <Sun className="w-6 h-6" />
                <span className="text-xs font-bold">Clean Light</span>
                <span className="text-[10px] text-slate-400">Daytime High Contrast</span>
              </button>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-charcoal-850 border border-slate-200 dark:border-charcoal-700 text-[11px] text-slate-500 dark:text-slate-400">
              Active mode: <span className="font-semibold text-teal-400 capitalize">{theme}</span>. Theme choice is persistently remembered across app launches.
            </div>
          </div>
        </Card>

        {/* User Profile & Daily Goals */}
        <Card
          title="General Preferences"
          subtitle="Customize productivity targets"
        >
          <form onSubmit={handleSavePreferences} className="space-y-4 pt-2">
            <Input
              label="Display Name"
              value={userName}
              onChange={setUserName}
              placeholder="Your name"
              icon={User}
            />

            <Input
              label="Daily Target Goals (Tasks)"
              value={dailyGoalTarget}
              onChange={setDailyGoalTarget}
              type="number"
              min="1"
              max="20"
              placeholder="5"
            />

            <div className="flex items-center justify-between pt-2">
              {saveSuccess ? (
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Preferences Saved
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">
                  Stored in local app settings
                </span>
              )}

              <Button variant="primary" size="sm" type="submit">
                Save Preferences
              </Button>
            </div>
          </form>
        </Card>

        {/* TMDB Metadata API Integration */}
        <Card
          title="Metadata & Provider API Keys"
          subtitle="Connect TMDB API for live global movie & series search"
        >
          <form onSubmit={handleSaveTmdbKey} className="space-y-4 pt-2">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs text-charcoal-400">Status</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  CatalogueClient.hasTmdbApiKey()
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-charcoal-800 text-charcoal-400"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    CatalogueClient.hasTmdbApiKey()
                      ? "bg-emerald-400 animate-pulse"
                      : "bg-charcoal-500"
                  }`}
                />
                {CatalogueClient.hasTmdbApiKey()
                  ? "Live API Connected"
                  : "Offline Mode Only"}
              </span>
            </div>

            <Input
              label="The Movie Database (TMDB) API Key (v3 auth)"
              value={tmdbApiKey}
              onChange={setTmdbApiKey}
              placeholder="e.g. 1762c1e57ef221da5cfd62d1e4badee5"
              type="text"
            />

            <div className="flex items-center justify-between pt-1">
              {tmdbKeySaved ? (
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> API Key Saved
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">
                  Enables live global search in Discover
                </span>
              )}

              <Button variant="primary" size="sm" type="submit">
                Save API Key
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Database Backup & Restore */}
      <Card
        title="Backup & Restore"
        subtitle="Manage complete offline database backups"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              100% Offline SQLite Data Ownership
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
              All your daily tasks, ratings, watch history, and planning horizon milestones are stored solely on your machine. You can export a snapshot backup at any time.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsBackupModalOpen(true)}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              Export Backup
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsRestoreModalOpen(true)}
              icon={<Upload className="w-3.5 h-3.5" />}
            >
              Restore Data
            </Button>
          </div>
        </div>
      </Card>

      {/* Database Engine Diagnostics */}
      <Card
        title="Database Diagnostics & File Storage"
        subtitle="Embedded SQLite engine running with WAL journaling"
      >
        <div className="space-y-4 pt-2">
          {/* Location Bar */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-charcoal-900 border border-slate-200 dark:border-charcoal-700 font-mono text-xs text-slate-700 dark:text-slate-300 break-all flex items-center gap-3">
            <HardDrive className="w-4 h-4 text-teal-400 shrink-0" />
            <span>{dbStatus?.path || "Resolving Windows AppData path..."}</span>
          </div>

          {/* Diagnostic Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-charcoal-850 border border-slate-200 dark:border-charcoal-700">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Journal Mode
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {dbStatus?.journal_mode?.toUpperCase() || "WAL"}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-charcoal-850 border border-slate-200 dark:border-charcoal-700">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Foreign Keys
              </span>
              <span className="font-mono font-bold text-teal-400">
                {dbStatus?.foreign_keys_enabled ? "Enabled" : "Disabled"}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-charcoal-850 border border-slate-200 dark:border-charcoal-700">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Schema Migrations
              </span>
              <span className="font-mono font-bold text-teal-400">
                v{dbStatus?.migration_version ?? 2}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-charcoal-850 border border-slate-200 dark:border-charcoal-700">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                SQLite Core
              </span>
              <span className="font-mono font-bold text-slate-300">
                {appInfo?.sqlite_version || "v3.45.0"}
              </span>
            </div>
          </div>

          {/* Table Counts */}
          {dbStatus?.table_stats && dbStatus.table_stats.length > 0 && (
            <div>
              <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Live Table Record Counts
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {dbStatus.table_stats.map((t) => (
                  <div
                    key={t.name}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-charcoal-850 border border-slate-200 dark:border-charcoal-700 text-center"
                  >
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {t.name}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {t.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* App Metadata Card */}
      <Card
        title="Application Identity"
        subtitle="Desktop build information & copyright"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Application</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {appInfo?.name || "DAYMARK"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Version</span>
            <span className="font-mono text-teal-400 font-bold">
              v{appInfo?.version || "0.1.0"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Architecture</span>
            <span className="text-slate-300">Tauri v2 + SQLite Bundled</span>
          </div>
        </div>
      </Card>

      {/* Mobile Companion & Android APK Card */}
      <Card
        title="Mobile Companion & Android APK"
        subtitle="Download the touch-optimized mobile APK preview for Android"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  DAYMARK Mobile Companion (APK)
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  v0.1.0-preview
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Universal APK build for Android devices. Responsive touch navigation with offline SQLite sync.
              </p>
            </div>
          </div>

          <a
            href="/downloads/daymark-mobile-preview.apk"
            download="daymark-mobile-preview.apk"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/25 transition-all cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Download Demo APK</span>
          </a>
        </div>
      </Card>

      {/* Backup Confirmation Modal */}
      <Modal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        title="Export Database Backup"
        description="Download a local snapshot of your SQLite database tables."
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsBackupModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportBackup}
              disabled={isExporting}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              {isExporting ? "Exporting..." : "Download Backup JSON"}
            </Button>
          </div>
        }
      >
        <p className="text-xs text-slate-300 leading-relaxed">
          This will export all your daily tasks, subtasks, movies, TV series, watch progress, and planning horizon records into an offline JSON backup file.
        </p>
      </Modal>

      {/* Restore Confirmation Modal */}
      <Modal
        isOpen={isRestoreModalOpen}
        onClose={() => {
          setIsRestoreModalOpen(false);
          setRestoreContent(null);
          setRestoreError(null);
          setRestoreSuccess(false);
        }}
        title="Restore Database Backup"
        description="Import records from a previous DAYMARK backup file."
        size="sm"
        footer={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsRestoreModalOpen(false);
                setRestoreContent(null);
                setRestoreError(null);
                setRestoreSuccess(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExecuteRestore}
              disabled={!restoreContent || isRestoring}
              icon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              {isRestoring ? "Restoring..." : "Restore Snapshot"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-300 leading-relaxed">
            Select a <code className="text-teal-400">daymark-backup-*.json</code> file to restore your offline database.
          </p>
          <input
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-500/10 file:text-teal-400 hover:file:bg-teal-500/20 cursor-pointer"
          />

          {restoreContent && !restoreError && (
            <div className="p-2.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-xs text-teal-400">
              Valid DAYMARK backup ready for restore.
            </div>
          )}

          {restoreError && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
              {restoreError}
            </div>
          )}

          {restoreSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
              Database restored successfully! Reloading workspace...
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
