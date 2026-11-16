import React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "teal" | "muted";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  className,
}) => {
  const variantStyles = {
    default: "bg-charcoal-700 text-slate-300 border-charcoal-600",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    teal: "bg-sage-500/10 text-sage-400 border-sage-500/20",
    muted: "bg-charcoal-800 text-slate-400 border-charcoal-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
