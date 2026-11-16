import React from "react";
import { TaskDetail, TaskFilter } from "../../lib/db/types";
import { TaskCard } from "./TaskCard";

export interface TaskListProps {
  tasks: TaskDetail[];
  filter: TaskFilter;
  onToggle: (taskId: string, isCompleted: boolean) => void;
  onEdit?: (task: TaskDetail) => void;
  onDelete?: (task: TaskDetail) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onToggle,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="space-y-2.5">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
