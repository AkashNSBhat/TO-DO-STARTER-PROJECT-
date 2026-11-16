import React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  badge?: string;
  icon?: LucideIcon;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: "pills" | "underline";
  size?: "sm" | "md";
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = "pills",
  size = "md",
  className,
}) => {
  if (variant === "underline") {
    return (
      <div
        role="tablist"
        className={cn("flex border-b border-slate-200 dark:border-charcoal-600 gap-6 select-none", className)}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={cn(
                "flex items-center gap-2 pb-2.5 font-medium border-b-2 -mb-px transition-colors cursor-pointer",
                size === "sm" ? "text-xs" : "text-sm",
                isActive
                  ? "border-teal-500 text-teal-600 dark:text-teal-400 font-semibold"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-charcoal-500"
              )}
            >
              {Icon && <Icon className="w-4 h-4 shrink-0" />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                    isActive
                      ? "bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400"
                      : "bg-slate-100 dark:bg-charcoal-700 text-slate-500 dark:text-slate-400"
                  )}
                >
                  {tab.count}
                </span>
              )}
              {tab.badge && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-sage-500/10 text-sage-400 border border-sage-500/20">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // variant === 'pills'
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex p-1 rounded-full border select-none gap-1",
        "bg-slate-100 dark:bg-charcoal-800/80 border-slate-200 dark:border-charcoal-600",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-2 rounded-full font-medium transition-all cursor-pointer",
              size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-xs md:text-sm",
              isActive
                ? "bg-teal-500 text-charcoal-950 font-semibold shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-charcoal-700/60"
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                  isActive
                    ? "bg-charcoal-950/20 text-charcoal-950"
                    : "bg-slate-200 dark:bg-charcoal-700 text-slate-600 dark:text-slate-300"
                )}
              >
                {tab.count}
              </span>
            )}
            {tab.badge && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-charcoal-950/20 text-charcoal-950">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
