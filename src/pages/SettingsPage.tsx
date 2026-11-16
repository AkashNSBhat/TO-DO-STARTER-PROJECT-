import React from "react";
import { HardDrive, RefreshCw } from "lucide-react";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { useDatabase } from "../hooks/useDatabase";
import { useAppInfo } from "../hooks/useAppInfo";

export const SettingsPage: React.FC = () => {
  const { status: dbStatus, refreshStatus } = useDatabase();
  const { appInfo } = useAppInfo();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="teal">Phase 0 Configured</Badge>
          <span className="text-xs text-slate-400">Settings and local database management</span>
        </div>
        <Button variant="secondary" size="sm" onClick={refreshStatus} icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Reload Info
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Application Metadata" subtitle="DAYMARK native build identity">
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-charcoal-700">
              <span className="text-slate-400">Application Name</span>
              <span className="font-semibold text-slate-200">{appInfo?.name || "DAYMARK"}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-charcoal-700">
              <span className="text-slate-400">Version</span>
              <span className="font-mono text-sage-400">v{appInfo?.version || "0.1.0"}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-charcoal-700">
              <span className="text-slate-400">Operating System</span>
              <span className="text-slate-200">{appInfo?.os || "Windows x86_64"}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-400">Architecture</span>
              <span className="text-slate-200">Offline-First Desktop</span>
            </div>
          </div>
        </Card>

        <Card title="Database Diagnostics" subtitle="Embedded SQLite storage engine">
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-charcoal-700">
              <span className="text-slate-400">Engine</span>
              <span className="font-semibold text-slate-200">{appInfo?.database_engine || "SQLite 3"}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-charcoal-700">
              <span className="text-slate-400">SQLite Core Version</span>
              <span className="font-mono text-slate-200">v{appInfo?.sqlite_version || "3.46"}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-charcoal-700">
              <span className="text-slate-400">Journal Mode</span>
              <span className="font-mono text-emerald-400">{dbStatus?.journal_mode?.toUpperCase() || "WAL"}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-400">Migration Version</span>
              <span className="font-mono text-sage-400">v{dbStatus?.migration_version ?? 1}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Database Location on Disk" subtitle="Persistent Windows %APPDATA% storage">
        <div className="p-3.5 rounded-lg bg-charcoal-900 border border-charcoal-600/70 font-mono text-xs text-slate-300 break-all flex items-center gap-3">
          <HardDrive className="w-4 h-4 text-sage-400 shrink-0" />
          <span>{dbStatus?.path || "Resolving Windows AppData directory..."}</span>
        </div>
      </Card>
    </div>
  );
};
