import React from "react";
import { Tabs, TabItem } from "../common/Tabs";
import { TaskFilter } from "../../lib/db/types";

export interface TaskFilterTabsProps {
  activeFilter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  counts: {
    all: number;
    today: number;
    upcoming: number;
    overdue: number;
    completed: number;
  };
}

export const TaskFilterTabs: React.FC<TaskFilterTabsProps> = ({
  activeFilter,
  onFilterChange,
  counts,
}) => {
  const tabs: TabItem[] = [
    { id: "today", label: "Today", count: counts.today },
    { id: "upcoming", label: "Upcoming", count: counts.upcoming },
    { id: "overdue", label: "Overdue", count: counts.overdue },
    { id: "completed", label: "Completed", count: counts.completed },
    { id: "all", label: "All Tasks", count: counts.all },
  ];

  return (
    <div className="overflow-x-auto pb-1">
      <Tabs
        tabs={tabs}
        activeTab={activeFilter}
        onChange={(id) => onFilterChange(id as TaskFilter)}
        variant="pills"
        size="md"
      />
    </div>
  );
};
