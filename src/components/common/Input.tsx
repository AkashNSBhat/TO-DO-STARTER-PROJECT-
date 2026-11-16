import React from "react";
import { type LucideIcon, X } from "lucide-react";
import { cn } from "../../lib/utils";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  icon?: LucideIcon;
  clearable?: boolean;
  error?: string;
  label?: string;
  inputSize?: "sm" | "md" | "lg";
}

export const Input: React.FC<InputProps> = ({
  value,
  onChange,
  placeholder,
  icon: Icon,
  clearable = false,
  error,
  label,
  inputSize = "md",
  disabled,
  className,
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  const sizeStyles = {
    sm: "py-1 text-xs",
    md: "py-1.5 text-xs md:text-sm",
    lg: "py-2.5 text-sm",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-4.5 h-4.5",
  };

  return (
    <div className="w-full space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 pointer-events-none text-slate-400">
            <Icon className={iconSizes[inputSize]} />
          </div>
        )}
        <input
          id={inputId}
          type="text"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full rounded-lg transition-colors border",
            "bg-white dark:bg-charcoal-800 text-slate-800 dark:text-slate-100",
            "placeholder-slate-400 placeholder:text-xs",
            "focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            Icon ? "pl-9" : "pl-3",
            clearable && value ? "pr-9" : "pr-3",
            sizeStyles[inputSize],
            error
              ? "border-rose-500 focus:ring-rose-500/30 focus:border-rose-500"
              : "border-slate-200 dark:border-charcoal-600 hover:border-slate-300 dark:hover:border-charcoal-500",
            className
          )}
          {...props}
        />
        {clearable && value && !disabled && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title="Clear"
            aria-label="Clear input"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
    </div>
  );
};
