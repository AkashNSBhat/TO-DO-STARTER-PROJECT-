import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export interface DropdownOption<T extends string | number> {
  label: string;
  value: T;
  icon?: LucideIcon;
}

export interface DropdownProps<T extends string | number> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (val: T) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Dropdown<T extends string | number>({
  options,
  value,
  onChange,
  placeholder = "Select...",
  label,
  disabled = false,
  size = "md",
  className,
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const currentIndex = options.findIndex((opt) => opt.value === value);
        const nextIndex = (currentIndex + 1) % options.length;
        onChange(options[nextIndex].value);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const currentIndex = options.findIndex((opt) => opt.value === value);
        const prevIndex = (currentIndex - 1 + options.length) % options.length;
        onChange(options[prevIndex].value);
      }
    }
  };

  const sizeStyles = {
    sm: "px-2.5 py-1 text-xs gap-1.5",
    md: "px-3 py-1.5 text-xs md:text-sm gap-2",
    lg: "px-4 py-2.5 text-sm gap-2.5",
  };

  return (
    <div className={cn("relative w-full space-y-1 select-none", className)} ref={containerRef}>
      {label && (
        <span className="block text-xs font-medium text-slate-700 dark:text-slate-300">
          {label}
        </span>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          "w-full flex items-center justify-between rounded-lg border transition-colors cursor-pointer",
          "bg-white dark:bg-charcoal-800 text-slate-800 dark:text-slate-100",
          "border-slate-200 dark:border-charcoal-600 hover:border-slate-300 dark:hover:border-charcoal-500",
          "focus:outline-none focus:ring-2 focus:ring-teal-500/40",
          disabled && "opacity-50 cursor-not-allowed",
          sizeStyles[size]
        )}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <selectedOption.icon className="w-4 h-4 text-slate-400 shrink-0" />
          )}
          <span className={selectedOption ? "" : "text-slate-400"}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Popover Menu */}
      {isOpen && !disabled && (
        <div
          role="listbox"
          className={cn(
            "absolute left-0 right-0 mt-1 z-50 rounded-xl shadow-lg border p-1 max-h-60 overflow-y-auto",
            "bg-white dark:bg-charcoal-800 border-slate-200 dark:border-charcoal-600 animate-in fade-in zoom-in-95 duration-100"
          )}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            const OptIcon = opt.icon;
            return (
              <div
                key={String(opt.value)}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors",
                  isSelected
                    ? "bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 font-medium"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-charcoal-700"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  {OptIcon && <OptIcon className="w-4 h-4 shrink-0 text-slate-400" />}
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-teal-500 shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
