import React from "react";
import { type LucideIcon, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon | React.ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-4.5 py-2.5 text-base gap-2.5",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const variantStyles = {
    primary:
      "bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-charcoal-950 font-semibold shadow-md shadow-blue-500/20",
    secondary:
      "bg-white dark:bg-charcoal-750 hover:bg-slate-100 dark:hover:bg-charcoal-700 active:bg-slate-200 dark:active:bg-charcoal-600 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-charcoal-600 shadow-xs",
    outline:
      "bg-transparent border border-slate-300 dark:border-charcoal-600 hover:border-slate-400 dark:hover:border-charcoal-500 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-charcoal-800",
    ghost:
      "bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-charcoal-800",
    danger:
      "bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30",
  };

  const renderIcon = () => {
    if (loading) {
      return <Loader2 className={cn("animate-spin shrink-0", iconSizes[size])} />;
    }
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return <span className="shrink-0">{icon}</span>;
    }
    const IconComp = icon as LucideIcon;
    return <IconComp className={cn("shrink-0", iconSizes[size])} />;
  };

  return (
    <button
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {renderIcon()}
      {children}
    </button>
  );
};
