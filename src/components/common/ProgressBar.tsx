import React from "react";
import { cn } from "../../lib/utils";

export interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  variant?: "teal" | "emerald" | "violet" | "amber" | "orange" | "blue";
  showPercent?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  variant = "teal",
  showPercent = false,
  size = "md",
  className,
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const sizeStyles = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  const fillVariants = {
    teal: "bg-[#3b66ff]",
    blue: "bg-[#3b66ff]",
    orange: "bg-[#ff783e]",
    emerald: "bg-[#22c55e]",
    violet: "bg-[#6366f1]",
    amber: "bg-[#f59e0b]",
  };

  return (
    <div className={cn("w-full space-y-1.5 select-none", className)}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
          {label && <span>{label}</span>}
          {showPercent && (
            <span className="font-mono text-slate-800 dark:text-slate-200 ml-auto">
              {percentage}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          "w-full bg-slate-200 dark:bg-charcoal-700 rounded-full overflow-hidden",
          sizeStyles[size]
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            fillVariants[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
