import React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { TaskDetail } from "../../lib/db/types";

export interface TaskDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskDetail | null;
  onConfirmDelete: (taskId: string) => Promise<boolean>;
}

export const TaskDeleteDialog: React.FC<TaskDeleteDialogProps> = ({
  isOpen,
  onClose,
  task,
  onConfirmDelete,
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  if (!task) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onConfirmDelete(task.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Task"
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            icon={<Trash2 className="w-3.5 h-3.5" />}
          >
            {isDeleting ? "Deleting..." : "Delete Permanently"}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-rose-200">Are you sure?</p>
            <p className="leading-relaxed">
              This will permanently delete <span className="font-semibold text-white">"{task.title}"</span> and all {task.subtasksCount} associated subtask items from the local SQLite database.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
