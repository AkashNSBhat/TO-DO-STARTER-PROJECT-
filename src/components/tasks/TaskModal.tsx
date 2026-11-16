import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Flag,
  Plus,
  X,
} from "lucide-react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import {
  TaskDetail,
  CreateTaskInput,
  UpdateTaskInput,
  CategoryDetail,
  Priority,
} from "../../lib/db/types";
import { cn } from "../../lib/utils";

export interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: TaskDetail | null;
  categories: CategoryDetail[];
  onSave: (task: CreateTaskInput | UpdateTaskInput) => Promise<boolean | TaskDetail | null>;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  categories,
  onSave,
}) => {
  const isEditing = Boolean(taskToEdit);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("2026-11-16");
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [titleError, setTitleError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || "");
      setCategoryId(taskToEdit.categoryId || (categories[0]?.id ?? ""));
      setPriority(taskToEdit.priority || "medium");
      setDueDate(taskToEdit.dueDate || "2026-11-16");
      setSubtasks([]);
    } else {
      setTitle("");
      setDescription("");
      setCategoryId(categories[0]?.id ?? "");
      setPriority("medium");
      setDueDate("2026-11-16");
      setSubtasks([]);
    }
    setTitleError("");
    setNewSubtaskTitle("");
  }, [taskToEdit, categories, isOpen]);

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks((prev) => [...prev, newSubtaskTitle.trim()]);
    setNewSubtaskTitle("");
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError("Task title is required");
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEditing && taskToEdit) {
        const updatePayload: UpdateTaskInput = {
          id: taskToEdit.id,
          title: title.trim(),
          description: description.trim() || undefined,
          categoryId: categoryId || undefined,
          priority,
          dueDate: dueDate || undefined,
        };
        await onSave(updatePayload);
      } else {
        const createPayload: CreateTaskInput = {
          title: title.trim(),
          description: description.trim() || undefined,
          categoryId: categoryId || undefined,
          priority,
          dueDate: dueDate || undefined,
          subtasks: subtasks.length > 0 ? subtasks : undefined,
        };
        await onSave(createPayload);
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const setQuickDate = (dateVal: string) => {
    setDueDate(dateVal);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Task" : "Create New Task"}
      description={
        isEditing
          ? "Update deliverables, schedule, or priority tags."
          : "Define your task deliverables with subtasks and target due dates."
      }
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim()}
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            {isEditing ? "Save Changes" : "Create Task"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <Input
          label="Task Title *"
          value={title}
          onChange={(val) => {
            setTitle(val);
            if (val.trim()) setTitleError("");
          }}
          placeholder="e.g. Implement SQLite foreign key cascade handlers"
          error={titleError}
          autoFocus
          required
        />

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key acceptance criteria or context..."
            rows={2}
            className="w-full text-xs p-2.5 rounded-lg bg-slate-100 dark:bg-charcoal-700 border border-slate-200 dark:border-charcoal-600 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
          />
        </div>

        {/* Priority Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Priority Level
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(
              [
                { id: "urgent", label: "Urgent", color: "text-rose-400 border-rose-500/30 bg-rose-500/10" },
                { id: "high", label: "High", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
                { id: "medium", label: "Medium", color: "text-teal-400 border-teal-500/30 bg-teal-500/10" },
                { id: "low", label: "Low", color: "text-slate-400 border-slate-500/30 bg-slate-500/10" },
              ] as const
            ).map((p) => {
              const isSelected = priority === p.id;
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPriority(p.id)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs font-medium transition-all cursor-pointer",
                    isSelected
                      ? cn("font-bold shadow-xs ring-1", p.color)
                      : "border-slate-200 dark:border-charcoal-600 bg-slate-50 dark:bg-charcoal-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  )}
                >
                  <Flag className="w-3 h-3" />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Category & Due Date Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Category Tag
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-lg bg-slate-100 dark:bg-charcoal-700 border border-slate-200 dark:border-charcoal-600 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date Picker */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-xs py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-charcoal-700 border border-slate-200 dark:border-charcoal-600 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono cursor-pointer"
            />
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 mt-1.5">
              <button
                type="button"
                onClick={() => setQuickDate("2026-11-16")}
                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-charcoal-700 text-slate-500 dark:text-slate-400 hover:text-teal-400"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setQuickDate("2026-11-17")}
                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-charcoal-700 text-slate-500 dark:text-slate-400 hover:text-teal-400"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => setQuickDate("2026-11-23")}
                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-charcoal-700 text-slate-500 dark:text-slate-400 hover:text-teal-400"
              >
                Next Week
              </button>
            </div>
          </div>
        </div>

        {/* Subtasks (Only when creating, or for adding quick checklist) */}
        {!isEditing && (
          <div className="pt-2 border-t border-slate-200 dark:border-charcoal-700 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Checklist Subtasks ({subtasks.length})
              </label>
            </div>

            {/* Subtask Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Add subtask item (press Enter)..."
                className="flex-1 text-xs py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-charcoal-700 border border-slate-200 dark:border-charcoal-600 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddSubtask}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add
              </Button>
            </div>

            {/* Subtask chips */}
            {subtasks.length > 0 && (
              <div className="space-y-1.5 max-h-32 overflow-y-auto pt-1">
                {subtasks.map((st, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 text-xs"
                  >
                    <span className="text-slate-700 dark:text-slate-300 truncate pr-2">
                      {st}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(idx)}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
};
