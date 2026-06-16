import { useState } from "react";
import { createPortal } from "react-dom";
import type { IChangeTask, TTaskState, TTaskType } from "@/services/change-management.service";
import { Button } from "@plane/propel/button";
import { format } from "date-fns";
import { Plus, Trash2, ChevronDown, X } from "lucide-react";

// Closed states set
const CLOSED_STATES = new Set(["closed_complete", "closed_incomplete", "closed_skipped"]);

// Status badge styles
const STATUS_STYLES: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700 border-gray-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  closed_complete: "bg-green-100 text-green-700 border-green-200",
  closed_incomplete: "bg-amber-100 text-amber-700 border-amber-200",
  closed_skipped: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  closed_complete: "Closed — Complete",
  closed_incomplete: "Closed — Incomplete",
  closed_skipped: "Closed — Skipped",
};

const TYPE_LABELS: Record<string, string> = {
  implementation: "Implementation",
  testing: "Testing",
  review: "Review",
  other: "Other",
};

const TYPE_BADGE_STYLES: Record<string, string> = {
  implementation: "bg-indigo-100 text-indigo-700",
  testing: "bg-teal-100 text-teal-700",
  review: "bg-purple-100 text-purple-700",
  other: "bg-gray-100 text-gray-600",
};

/**
 * Strips empty HTML from rich-text fields so textarea shows placeholder.
 * Converts values like "<p></p>", "<p><br></p>", whitespace-only to "".
 */
const sanitizeHtmlForTextarea = (value: string | null | undefined): string => {
  if (!value) return "";
  // Strip all HTML tags
  const stripped = value.replace(/<[^>]*>/g, "").trim();
  // If only whitespace remains after stripping, treat as empty
  return stripped;
};

type Props = {
  tasks: IChangeTask[];
  changeState: string;
  onUpdateTask: (id: string, data: Partial<IChangeTask>) => void;
  onCreateTask: (data: Partial<IChangeTask>) => Promise<void>;
  onDeleteTask: (id: string) => void;
  isUpdating: boolean;
};

// Inline task edit modal
const TaskEditModal = ({
  task,
  onClose,
  onSave,
  isSaving,
}: {
  task: IChangeTask;
  onClose: () => void;
  onSave: (data: Partial<IChangeTask>) => void;
  isSaving: boolean;
}) => {
  const [shortDesc, setShortDesc] = useState(task.short_description);
  const [description, setDescription] = useState(sanitizeHtmlForTextarea(task.description));
  const [taskState, setTaskState] = useState<TTaskState>(task.state);
  const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.slice(0, 16) : "");

  const handleSave = () => {
    const data: Partial<IChangeTask> = {};
    if (shortDesc !== task.short_description) data.short_description = shortDesc;
    const sanitizedOriginal = sanitizeHtmlForTextarea(task.description);
    if (description !== sanitizedOriginal) data.description = description;
    if (taskState !== task.state) data.state = taskState;
    if (dueDate !== (task.due_date ? task.due_date.slice(0, 16) : "")) {
      data.due_date = dueDate ? new Date(dueDate).toISOString() : null;
    }
    onSave(data);
  };

  if (typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Opaque backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Solid modal panel */}
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-subtle bg-surface-1 shadow-2xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
          <h3 className="text-base font-semibold text-primary">Edit Task</h3>
          <button onClick={onClose} className="rounded-md p-1 text-tertiary transition-colors hover:bg-layer-1 hover:text-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Short description */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Short Description</label>
            <input
              type="text"
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-subtle bg-transparent text-sm text-primary focus:outline-none focus:border-primary transition-colors placeholder:text-placeholder"
            />
          </div>

          {/* Type + Group (read-only) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1.5">Task Type</label>
              <span className={`inline-flex items-center px-2.5 py-1.5 rounded text-xs font-medium ${TYPE_BADGE_STYLES[task.task_type] || TYPE_BADGE_STYLES.other}`}>
                {TYPE_LABELS[task.task_type] || task.task_type}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1.5">Assignment Group</label>
              <span className="text-sm text-tertiary">{task.assignment_group_display || "Inherited"}</span>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Status</label>
            <div className="relative">
              <select
                value={taskState}
                onChange={(e) => setTaskState(e.target.value as TTaskState)}
                className="w-full px-3 py-2 rounded-lg border border-subtle bg-surface-1 text-sm text-primary appearance-none focus:outline-none focus:border-primary pr-8 transition-colors"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="closed_complete">Closed — Complete</option>
                <option value="closed_incomplete">Closed — Incomplete</option>
                <option value="closed_skipped">Closed — Skipped</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none" />
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Due Date</label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-subtle bg-transparent text-sm text-primary focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Work notes */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Work Notes</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add implementation details or work notes..."
              className="w-full px-3 py-2 rounded-lg border border-subtle bg-transparent text-sm text-primary resize-none focus:outline-none focus:border-primary transition-colors placeholder:text-placeholder"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-subtle">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSave} loading={isSaving}>Save</Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Add Task modal
const AddTaskModal = ({
  onClose,
  onSubmit,
  isSubmitting,
}: {
  onClose: () => void;
  onSubmit: (data: Partial<IChangeTask>) => Promise<void>;
  isSubmitting: boolean;
}) => {
  const [shortDesc, setShortDesc] = useState("");
  const [taskType, setTaskType] = useState<TTaskType>("other");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const canSubmit = shortDesc.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onSubmit({
      short_description: shortDesc.trim(),
      task_type: taskType,
      description: description || null,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
    });
    onClose();
  };

  if (typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Opaque backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Solid modal panel */}
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-subtle bg-surface-1 shadow-2xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
          <h3 className="text-base font-semibold text-primary">Add Task</h3>
          <button onClick={onClose} className="rounded-md p-1 text-tertiary transition-colors hover:bg-layer-1 hover:text-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">
              Short Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder="e.g. Deploy configuration change"
              autoFocus
              className="w-full px-3 py-2 rounded-lg border border-subtle bg-transparent text-sm text-primary focus:outline-none focus:border-primary transition-colors placeholder:text-placeholder"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Task Type</label>
            <div className="relative">
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as TTaskType)}
                className="w-full px-3 py-2 rounded-lg border border-subtle bg-surface-1 text-sm text-primary appearance-none focus:outline-none focus:border-primary pr-8 transition-colors"
              >
                <option value="implementation">Implementation</option>
                <option value="testing">Testing</option>
                <option value="review">Review</option>
                <option value="other">Other</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Due Date</label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-subtle bg-transparent text-sm text-primary focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Work Notes</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add implementation details or work notes..."
              className="w-full px-3 py-2 rounded-lg border border-subtle bg-transparent text-sm text-primary resize-none focus:outline-none focus:border-primary transition-colors placeholder:text-placeholder"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-subtle">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} loading={isSubmitting} disabled={!canSubmit}>
            Add Task
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export const TaskTable = ({ tasks, changeState, onUpdateTask, onCreateTask, onDeleteTask, isUpdating }: Props) => {
  const [editingTask, setEditingTask] = useState<IChangeTask | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const closedCount = tasks.filter((t) => CLOSED_STATES.has(t.state)).length;
  const totalCount = tasks.length;
  const isImplementState = changeState === "implement";

  return (
    <div className="space-y-4">
      {/* Header with progress and Add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-primary">Change Tasks</h3>
          {totalCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 rounded-full bg-layer-1 overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-300"
                  style={{ width: `${totalCount > 0 ? (closedCount / totalCount) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs font-medium text-tertiary">
                {closedCount} of {totalCount} tasks closed
              </span>
            </div>
          )}
        </div>
        {isImplementState && (
          <Button variant="secondary" size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Task
          </Button>
        )}
      </div>

      {/* Empty state */}
      {tasks.length === 0 ? (
        <div className="w-full py-12 text-center rounded-lg border border-dashed border-subtle bg-layer-1/50">
          <p className="text-sm text-tertiary">No implementation tasks created yet.</p>
          {isImplementState && (
            <p className="text-xs text-placeholder mt-1">Tasks will be auto-created when entering the Implement stage.</p>
          )}
        </div>
      ) : (
        /* Task table */
        <div className="w-full overflow-x-auto rounded-lg border border-subtle">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-layer-1 text-secondary">
              <tr>
                <th className="px-4 py-3 font-medium w-10">#</th>
                <th className="px-4 py-3 font-medium">Short Description</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle bg-surface-1">
              {tasks.map((task) => {
                const isClosed = CLOSED_STATES.has(task.state);

                return (
                  <tr
                    key={task.id}
                    className="hover:bg-layer-1/50 cursor-pointer transition-colors"
                    onClick={() => setEditingTask(task)}
                  >
                    <td className="px-4 py-3 text-tertiary font-mono text-xs">{task.order}</td>
                    <td className="px-4 py-3 font-medium text-primary max-w-[250px] truncate">
                      {task.short_description || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${TYPE_BADGE_STYLES[task.task_type] || TYPE_BADGE_STYLES.other}`}>
                        {TYPE_LABELS[task.task_type] || task.task_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${STATUS_STYLES[task.state] || STATUS_STYLES.pending}`}>
                        {STATUS_LABELS[task.state] || task.state}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-tertiary">
                      {task.due_date ? format(new Date(task.due_date), "MMM d, yyyy h:mm a") : "—"}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {!isClosed && isImplementState && (
                          <>
                            {task.state === "pending" && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => onUpdateTask(task.id, { state: "in_progress" })}
                                loading={isUpdating}
                              >
                                Start
                              </Button>
                            )}
                            {(task.state === "pending" || task.state === "in_progress") && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => onUpdateTask(task.id, { state: "closed_complete" })}
                                loading={isUpdating}
                              >
                                Complete
                              </Button>
                            )}
                          </>
                        )}
                        {isImplementState && (
                          <button
                            onClick={() => onDeleteTask(task.id)}
                            className="p-1 text-red-400 hover:text-red-600 transition-colors"
                            title="Delete task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal — portalled to document.body */}
      {editingTask && (
        <TaskEditModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={(data) => {
            onUpdateTask(editingTask.id, data);
            setEditingTask(null);
          }}
          isSaving={isUpdating}
        />
      )}

      {/* Add Modal — portalled to document.body */}
      {showAddModal && (
        <AddTaskModal
          onClose={() => setShowAddModal(false)}
          onSubmit={onCreateTask}
          isSubmitting={isUpdating}
        />
      )}
    </div>
  );
};
