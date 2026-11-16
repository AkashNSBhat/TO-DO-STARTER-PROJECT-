import React, { useState } from "react";
import { Plus, CornerDownLeft } from "lucide-react";
import { Button } from "../common/Button";

export interface TaskQuickAddProps {
  onQuickAdd: (title: string) => Promise<unknown>;
}

export const TaskQuickAdd: React.FC<TaskQuickAddProps> = ({ onQuickAdd }) => {
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onQuickAdd(title.trim());
      setTitle("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 p-1.5 rounded-xl bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700/80 shadow-xs focus-within:border-teal-500/50 transition-all"
    >
      <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
        <Plus className="w-4 h-4" />
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Quick add a task for today... (Press Enter to save)"
        disabled={isSubmitting}
        className="flex-1 text-xs bg-transparent border-0 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
      />

      <Button
        type="submit"
        variant="primary"
        size="sm"
        disabled={!title.trim() || isSubmitting}
        icon={<CornerDownLeft className="w-3 h-3" />}
      >
        Add
      </Button>
    </form>
  );
};
