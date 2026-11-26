import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
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

const getOffsetIsoDate = (daysOffset = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  categories,
  onSave,
}) => {
  const isEditing = Boolean(taskToEdit);
  const totalSteps = isEditing ? 2 : 3;

  const [step, setStep] = useState<number>(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState(() => getOffsetIsoDate(0));
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [titleError, setTitleError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    submittingRef.current = false;
    setStep(1);
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || "");
      setCategoryId(taskToEdit.categoryId || (categories[0]?.id ?? ""));
      setPriority(taskToEdit.priority || "medium");
      setDueDate(taskToEdit.dueDate || getOffsetIsoDate(0));
      setSubtasks([]);
    } else {
      setTitle("");
      setDescription("");
      setCategoryId(categories[0]?.id ?? "");
      setPriority("medium");
      setDueDate(getOffsetIsoDate(0));
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

  const handleNext = () => {
    if (step === 1 && !title.trim()) {
      setTitleError("Task title is required");
      return;
    }
    setStep((prev) => Math.min(totalSteps, prev + 1));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (submittingRef.current) return;
    if (!title.trim()) {
      setTitleError("Task title is required");
      setStep(1);
      return;
    }

    try {
      submittingRef.current = true;
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
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const selectedCategoryName =
    categories.find((c) => c.id === categoryId)?.name || "General";

  const stepLabels = isEditing
    ? ["Task Details", "Priority & Schedule"]
    : ["Task Details", "Priority & Schedule", "Checklist & Create"];

  const isFinalStep = step === totalSteps;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Task" : "Create New Task"}
      description={`Step ${step} of ${totalSteps} — ${stepLabels[step - 1]}`}
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            {step > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBack}
                disabled={isSubmitting}
                icon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Back
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            {!isFinalStep ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleNext}
                disabled={step === 1 && !title.trim()}
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => handleSubmit()}
                disabled={isSubmitting || !title.trim()}
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                {isEditing ? "Save Changes" : "Create Task"}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isFinalStep) {
            handleSubmit(e);
          } else {
            handleNext();
          }
        }}
        className="space-y-5"
      >
        {/* Simple Step Progress Indicator */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {stepLabels.map((label, idx) => {
              const sNum = idx + 1;
              const isCompleted = sNum < step;
              const isCurrent = sNum === step;
              return (
                <div key={label} className="flex-1 space-y-1">
                  <div
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-200",
                      isCurrent
                        ? "bg-primary-600"
                        : isCompleted
                          ? "bg-primary-400"
                          : "bg-slate-200 dark:bg-charcoal-700"
                    )}
                  />
                  <span
                    className={cn(
                      "block text-[10px] font-medium truncate",
                      isCurrent
                        ? "text-primary-600 dark:text-primary-300 font-semibold"
                        : "text-slate-400 dark:text-slate-500"
                    )}
                  >
                    {sNum}. {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===================================================== */}
        {/* STEP 1: Task Title & Description                      */}
        {/* ===================================================== */}
        {step === 1 && (
          <div className="space-y-4 py-1">
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

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add notes, links, or context..."
                rows={4}
                className="w-full text-xs p-3 rounded-lg bg-slate-100 dark:bg-charcoal-700 border border-slate-200 dark:border-charcoal-600 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
              />
            </div>
          </div>
        )}

        {/* ===================================================== */}
        {/* STEP 2: Priority, Category & Due Date                 */}
        {/* ===================================================== */}
        {step === 2 && (
          <div className="space-y-5 py-1">
            {/* Priority Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                Priority Level
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    { id: "urgent", label: "Urgent", color: "text-rose-500 dark:text-rose-400 border-rose-500/40 bg-rose-500/10" },
                    { id: "high", label: "High", color: "text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-500/10" },
                    { id: "medium", label: "Medium", color: "text-blue-600 dark:text-blue-400 border-blue-500/40 bg-blue-500/10" },
                    { id: "low", label: "Low", color: "text-slate-600 dark:text-slate-300 border-slate-400/40 bg-slate-500/10" },
                  ] as const
                ).map((p) => {
                  const isSelected = priority === p.id;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setPriority(p.id)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border text-xs font-medium transition-all cursor-pointer",
                        isSelected
                          ? cn("font-semibold shadow-xs ring-1", p.color)
                          : "border-slate-200 dark:border-charcoal-600 bg-slate-50 dark:bg-charcoal-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      )}
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category & Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Category Tag
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full text-xs py-2.5 px-3 rounded-lg bg-slate-100 dark:bg-charcoal-700 border border-slate-200 dark:border-charcoal-600 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-lg bg-slate-100 dark:bg-charcoal-700 border border-slate-200 dark:border-charcoal-600 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500 font-mono cursor-pointer"
                />
                <div className="flex items-center gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setDueDate(getOffsetIsoDate(0))}
                    className="text-[11px] px-2 py-1 rounded-md bg-slate-100 dark:bg-charcoal-700 text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-300 cursor-pointer"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setDueDate(getOffsetIsoDate(1))}
                    className="text-[11px] px-2 py-1 rounded-md bg-slate-100 dark:bg-charcoal-700 text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-300 cursor-pointer"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => setDueDate(getOffsetIsoDate(7))}
                    className="text-[11px] px-2 py-1 rounded-md bg-slate-100 dark:bg-charcoal-700 text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-300 cursor-pointer"
                  >
                    Next Week
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================== */}
        {/* STEP 3: Checklist Subtasks & Create (Create Mode)     */}
        {/* ===================================================== */}
        {step === 3 && !isEditing && (
          <div className="space-y-4 py-1">
            {/* Compact Summary Preview */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 space-y-1">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {title.trim()}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="capitalize">{priority} priority</span>
                <span>•</span>
                <span>{selectedCategoryName}</span>
                {dueDate && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {dueDate}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Subtasks Section */}
            <div className="space-y-2.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Checklist Subtasks (Optional — {subtasks.length})
              </label>

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
                  autoFocus
                  className="flex-1 text-xs py-2 px-3 rounded-lg bg-slate-100 dark:bg-charcoal-700 border border-slate-200 dark:border-charcoal-600 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
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

              {subtasks.length > 0 && (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pt-1">
                  {subtasks.map((st, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 text-xs"
                    >
                      <span className="text-slate-700 dark:text-slate-300 truncate pr-2">
                        {st}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtask(idx)}
                        className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
