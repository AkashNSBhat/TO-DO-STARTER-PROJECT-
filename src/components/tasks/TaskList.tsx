import React from "react";
import { TaskDetail, TaskFilter } from "../../lib/db/types";
import { TaskCard } from "./TaskCard";

export interface TaskListProps {
  tasks: TaskDetail[];
  filter: TaskFilter;
  onToggle: (taskId: string, isCompleted: boolean) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onToggle,
}) => {
  return (
    <div className="space-y-2.5">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onToggle={onToggle} />
      ))}
    </div>
  );
};
