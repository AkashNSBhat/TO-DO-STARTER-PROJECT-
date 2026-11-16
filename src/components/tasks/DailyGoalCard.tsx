import React, { useState } from "react";
import { Target, Flame, Edit2 } from "lucide-react";
import { ProgressBar } from "../common/ProgressBar";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { cn } from "../../lib/utils";

export interface DailyGoalCardProps {
  completedCount: number;
  targetCount: number;
  notes?: string;
  onUpdateGoal: (targetCount: number, notes?: string) => Promise<boolean>;
}

export const DailyGoalCard: React.FC<DailyGoalCardProps> = ({
  completedCount,
  targetCount,
  notes,
  onUpdateGoal,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newTarget, setNewTarget] = useState(String(targetCount));
  const [newNotes, setNewNotes] = useState(notes || "");

  const percentage = Math.min(
    100,
    Math.round((completedCount / (targetCount || 1)) * 100)
  );
  const isGoalReached = completedCount >= targetCount && targetCount > 0;

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(newTarget, 10) || 5;
    await onUpdateGoal(count, newNotes);
    setIsEditModalOpen(false);
  };

  return (
    <>
      <div
        className={cn(
          "p-4 rounded-xl border transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4",
          isGoalReached
            ? "bg-gradient-to-r from-emerald-500/10 via-charcoal-800 to-charcoal-800 border-emerald-500/30"
            : "bg-white dark:bg-charcoal-800 border-slate-200 dark:border-charcoal-700"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-transform",
              isGoalReached
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 scale-105"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            )}
          >
            {isGoalReached ? (
              <Flame className="w-5 h-5 fill-emerald-400" />
            ) : (
              <Target className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Daily Completion Goal
              </h3>
              {isGoalReached && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Target Achieved!
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {`${completedCount} of ${targetCount} tasks finished today (${percentage}%)`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-72">
          <div className="flex-1">
            <ProgressBar
              value={completedCount}
              max={targetCount || 1}
              variant={isGoalReached ? "emerald" : "amber"}
              size="sm"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-charcoal-700 transition-colors cursor-pointer"
            title="Edit Daily Goal Target"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Edit Target Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Set Daily Completion Goal"
        description="Choose your target number of finished deliverables per day."
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveGoal}>
              Save Target
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveGoal} className="space-y-3">
          <Input
            label="Daily Target (Tasks)"
            value={newTarget}
            onChange={setNewTarget}
            type="number"
            min="1"
            max="30"
            required
            autoFocus
          />

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Focus Note
            </label>
            <input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="e.g. Focus on core deliverables and code reviews"
              className="w-full text-xs py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-charcoal-700 border border-slate-200 dark:border-charcoal-600 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </form>
      </Modal>
    </>
  );
};
