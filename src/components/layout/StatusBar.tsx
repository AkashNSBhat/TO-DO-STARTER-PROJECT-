import React from "react";
import { Database, HardDrive, CheckCircle2, ShieldAlert, Cpu } from "lucide-react";
import { DbStatusResponse, AppInfoResponse } from "../../lib/db/types";

interface StatusBarProps {
  dbStatus: DbStatusResponse | null;
  appInfo: AppInfoResponse | null;
  loading: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({ dbStatus, appInfo, loading }) => {
  return (
    <footer className="h-7 bg-slate-100 dark:bg-charcoal-950 border-t border-slate-200 dark:border-charcoal-600/80 px-4 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 select-none shrink-0 z-10 transition-colors">
      {/* Left: DB Status & Path */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Database className="w-3 h-3 text-teal-600 dark:text-teal-400" />
          <span className="font-medium text-slate-700 dark:text-slate-300">SQLite:</span>
          {loading ? (
            <span className="text-amber-500 dark:text-amber-400">Connecting...</span>
          ) : dbStatus?.connected ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              Connected (WAL Mode)
            </span>
          ) : (
            <span className="flex items-center gap-1 text-rose-500 dark:text-rose-400 font-medium">
              <ShieldAlert className="w-3 h-3" />
              Disconnected
            </span>
          )}
        </div>

        {dbStatus?.path && (
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-mono truncate max-w-md hidden md:flex" title={dbStatus.path}>
            <HardDrive className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{dbStatus.path}</span>
          </div>
        )}
      </div>

      {/* Right: Architecture, Tables & Runtime Info */}
      <div className="flex items-center gap-4">
        {dbStatus && (
          <span>
            Schema Tables: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{dbStatus.tables_count}</strong> | Migrations: <strong className="text-slate-700 dark:text-slate-300">v{dbStatus.migration_version}</strong>
          </span>
        )}
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3 h-3 text-slate-400" />
          <span>{appInfo?.os || "Windows x86_64"}</span>
          <span>•</span>
          <span className="font-mono text-teal-600 dark:text-teal-400">DAYMARK v{appInfo?.version || "0.1.0"}</span>
        </div>
      </div>
    </footer>
  );
};
