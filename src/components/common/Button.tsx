import React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "primary",
  size = "md",
  icon,
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-sage-500/50 disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const sizeStyles = {
    sm: "px-2.5 py-1.5 text-xs gap-1.5",
    md: "px-3.5 py-2 text-sm gap-2",
    lg: "px-4.5 py-2.5 text-base gap-2.5",
  };

  const variantStyles = {
    primary: "bg-sage-500 hover:bg-sage-600 text-charcoal-950 font-semibold shadow-sm",
    secondary: "bg-charcoal-800 hover:bg-charcoal-700 text-slate-200 border border-charcoal-600",
    outline: "border border-charcoal-600 hover:border-charcoal-500 text-slate-300 hover:bg-charcoal-800",
    ghost: "text-slate-400 hover:text-slate-100 hover:bg-charcoal-800",
    danger: "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30",
  };

  return (
    <button
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
