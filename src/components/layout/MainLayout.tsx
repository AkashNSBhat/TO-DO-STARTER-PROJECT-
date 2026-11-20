import React, { useState } from "react";
import { Sidebar, NavTab } from "./Sidebar";
import { Header } from "./Header";
import { StatusBar } from "./StatusBar";
import { MobileNav } from "./MobileNav";
import { ApkDownloadModal } from "../common/ApkDownloadModal";
import { useDatabase } from "../../hooks/useDatabase";
import { useAppInfo } from "../../hooks/useAppInfo";
import { useTheme } from "../../hooks/useTheme";
import { cn } from "../../lib/utils";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const { status: dbStatus, loading: dbLoading } = useDatabase();
  const { appInfo } = useAppInfo();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-charcoal-900 text-slate-900 dark:text-slate-100 transition-colors duration-150 relative">
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar: Desktop Static + Mobile Off-Canvas Drawer */}
      <div
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 transition-transform duration-300 md:relative md:translate-x-0 md:z-20 shrink-0",
          isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        )}
      >
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            onSelectTab(tab);
            setIsMobileMenuOpen(false);
          }}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          dbConnected={!!dbStatus?.connected}
          dbPingMs={dbStatus?.ping_ms}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <Header
          currentTab={currentTab}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenSettings={() => {
            onSelectTab("settings");
            setIsMobileMenuOpen(false);
          }}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onOpenApkModal={() => setIsApkModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pb-24 md:pb-6 bg-slate-50 dark:bg-charcoal-900 transition-colors">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>

        {/* Desktop Status Bar */}
        <div className="hidden md:block">
          <StatusBar
            dbStatus={dbStatus}
            appInfo={appInfo}
            loading={dbLoading}
          />
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (md:hidden) */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          onSelectTab(tab);
          setIsMobileMenuOpen(false);
        }}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenApkModal={() => setIsApkModalOpen(true)}
      />

      {/* Demo Mobile APK Download Modal */}
      <ApkDownloadModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />
    </div>
  );
};
