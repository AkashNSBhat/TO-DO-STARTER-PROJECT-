import React, { useState, useRef } from "react";
import { cn } from "../../lib/utils";

export interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delayMs?: number;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
  delayMs = 150,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delayMs);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const positionStyles = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const caretStyles = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-slate-800 dark:border-t-charcoal-950 border-x-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-slate-800 dark:border-b-charcoal-950 border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-slate-800 dark:border-l-charcoal-950 border-y-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-slate-800 dark:border-r-charcoal-950 border-y-transparent border-l-transparent",
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={cn(
            "absolute z-50 pointer-events-none px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap shadow-lg",
            "bg-slate-900 dark:bg-charcoal-950 text-white dark:text-slate-100 border border-slate-700 dark:border-charcoal-600",
            positionStyles[position],
            className
          )}
        >
          {content}
          <div className={cn("absolute w-0 h-0 border-4", caretStyles[position])} />
        </div>
      )}
    </div>
  );
};
