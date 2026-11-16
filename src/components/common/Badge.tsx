import React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "teal"
    | "violet"
    | "amber"
    | "muted";
  pill?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  pill = false,
  className,
}) => {
  const variantStyles = {
    default:
      "bg-slate-100 dark:bg-charcoal-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-charcoal-600",
    success:
      "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
    warning:
      "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
    danger:
      "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20",
    teal:
      "bg-teal-50 dark:bg-sage-500/10 text-teal-700 dark:text-sage-400 border-teal-200 dark:border-sage-500/20",
    violet:
      "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/20",
    amber:
      "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
    muted:
      "bg-slate-100 dark:bg-charcoal-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-charcoal-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-medium border select-none",
        pill ? "rounded-full" : "rounded-md",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
