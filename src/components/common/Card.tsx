import React from "react";
import { cn } from "../../lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  elevated = false,
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "rounded-xl p-5 border transition-all",
        elevated
          ? "bg-slate-50 dark:bg-charcoal-700 border-slate-200 dark:border-charcoal-600 shadow-md"
          : "bg-white dark:bg-charcoal-800/90 border-slate-200 dark:border-charcoal-600 shadow-sm",
        className
      )}
      {...props}
    >
      {(title || action) && (
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-charcoal-700">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
