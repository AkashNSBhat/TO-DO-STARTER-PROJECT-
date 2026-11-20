import React from "react";
import {
  LayoutGrid,
  CheckSquare,
  Compass,
  CalendarRange,
  Film,
  Settings,
  Download,
} from "lucide-react";
import { NavTab } from "./Sidebar";
import { cn } from "../../lib/utils";

interface MobileNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenMobileMenu: () => void;
  onOpenApkModal: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenMobileMenu,
  onOpenApkModal,
}) => {
  const navItems = [
    { id: "dashboard" as NavTab, label: "Home", icon: LayoutGrid },
    { id: "tasks" as NavTab, label: "Tasks", icon: CheckSquare },
    { id: "plan" as NavTab, label: "Plan", icon: CalendarRange },
    { id: "movies" as NavTab, label: "Movies", icon: Film },
    { id: "discover" as NavTab, label: "Discover", icon: Compass },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#131518]/95 backdrop-blur-md border-t border-slate-200 dark:border-[#22252c] px-2 py-1.5 flex items-center justify-around shadow-lg safe-bottom">
      {navItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = currentTab === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectTab(item.id)}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer relative",
              isActive
                ? "text-blue-600 dark:text-blue-400 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-transform",
                isActive && "bg-blue-500/10 scale-105"
              )}
            >
              <IconComponent className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="text-[10px] mt-0.5 leading-none">{item.label}</span>
            {isActive && (
              <span className="w-1 h-1 rounded-full bg-blue-500 absolute bottom-0.5" />
            )}
          </button>
        );
      })}

      {/* APK Demo Download Button */}
      <button
        type="button"
        onClick={onOpenApkModal}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-teal-600 dark:text-teal-400 hover:text-teal-500 cursor-pointer"
        title="Download Android APK"
      >
        <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
          <Download className="w-4 h-4 stroke-[2.2] animate-bounce" />
        </div>
        <span className="text-[10px] mt-0.5 font-bold leading-none">APK</span>
      </button>

      {/* More / Settings Menu */}
      <button
        type="button"
        onClick={onOpenMobileMenu}
        className={cn(
          "flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer",
          currentTab === "settings" && "text-blue-600 dark:text-blue-400 font-bold"
        )}
        title="Open Full Navigation Menu"
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center">
          <Settings className="w-4 h-4 stroke-[2.2]" />
        </div>
        <span className="text-[10px] mt-0.5 leading-none">More</span>
      </button>
    </nav>
  );
};
