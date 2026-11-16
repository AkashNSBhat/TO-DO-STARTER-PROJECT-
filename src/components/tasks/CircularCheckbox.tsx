import React from "react";
import { Check } from "lucide-react";

export interface CircularCheckboxProps {
  checked: boolean;
  onToggle: (checked: boolean) => void;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export const CircularCheckbox: React.FC<CircularCheckboxProps> = ({
  checked,
  onToggle,
  label,
  size = "md",
  className = "",
}) => {
  const sizeClasses = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const iconSize = size === "sm" ? "w-3 h-3 stroke-[3]" : "w-3.5 h-3.5 stroke-[3]";

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label || (checked ? "Mark incomplete" : "Mark complete")}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(!checked);
      }}
      className={`${sizeClasses} rounded-full flex items-center justify-center transition-all cursor-pointer border shrink-0 focus:outline-none focus:ring-2 focus:ring-teal-500/40 ${
        checked
          ? "bg-emerald-500 border-emerald-500 text-charcoal-950 shadow-xs"
          : "border-slate-300 dark:border-charcoal-500 hover:border-emerald-500 dark:hover:border-emerald-400 bg-white dark:bg-charcoal-800 text-transparent"
      } ${className}`}
    >
      <Check
        className={`${iconSize} transition-opacity duration-150 ${
          checked ? "opacity-100" : "opacity-0"
        }`}
      />
    </button>
  );
};
