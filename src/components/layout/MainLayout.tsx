import React, { useState } from "react";
import { Sidebar, NavTab } from "./Sidebar";
import { Header } from "./Header";
import { StatusBar } from "./StatusBar";
import { useDatabase } from "../../hooks/useDatabase";
import { useAppInfo } from "../../hooks/useAppInfo";
import { useTheme } from "../../hooks/useTheme";

interface MainLayoutProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentTab,
  onSelectTab,
  children,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const { status: dbStatus, loading: dbLoading } = useDatabase();
  const { appInfo } = useAppInfo();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-charcoal-900 text-slate-100">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        dbConnected={!!dbStatus?.connected}
        dbPingMs={dbStatus?.ping_ms}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <Header
          currentTab={currentTab}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenSettings={() => onSelectTab("settings")}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-charcoal-900">
          {children}
        </main>

        <StatusBar
          dbStatus={dbStatus}
          appInfo={appInfo}
          loading={dbLoading}
        />
      </div>
    </div>
  );
};
