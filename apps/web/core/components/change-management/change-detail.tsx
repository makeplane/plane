import { useState, useEffect } from "react";
import { observer } from "mobx-react";
import type { IChangeRequest, IChangeTask, TChangeState } from "@/services/change-management.service";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { ChangeForm } from "./change-form";
import { StateProgress } from "./state-progress";
import { ActionBar } from "./action-bar";
import { ApprovalTable } from "./approval-table";
import { TaskTable } from "./task-table";
import { ActivityFeed } from "./activity-feed";
import { useChangeManagement } from "@/hooks/store/use-change-management";
import { useUser } from "@/hooks/store/user/user-user";
type Props = {
  change: IChangeRequest;
  workspaceSlug: string;
};

export const ChangeDetail = observer(({ change, workspaceSlug }: Props) => {
  const store = useChangeManagement();
  const userStore = useUser();
  const currentUserId = userStore.data?.id;
  const [activeTab, setActiveTab] = useState("details");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isUpdatingForm, setIsUpdatingForm] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [isApprovalActioning, setIsApprovalActioning] = useState(false);
  const [isTaskUpdating, setIsTaskUpdating] = useState(false);

  // Fetch approvals, tasks, activity when change loads
  useEffect(() => {
    if (workspaceSlug && change?.number) {
      store.fetchApprovals(workspaceSlug, change.number);
      store.fetchTasks(workspaceSlug, change.number);
      store.fetchActivity(workspaceSlug, change.number);
    }
  }, [workspaceSlug, change?.number, change?.state]);

  const handleUpdate = async (data: Partial<IChangeRequest>) => {
    try {
      setIsUpdatingForm(true);
      setTransitionError(null);
      await store.updateChange(workspaceSlug, change.number, data);
    } catch (err: any) {
      const msg = typeof err === "string" ? err
        : err?.error || err?.detail || JSON.stringify(err) || "Update failed.";
      setTransitionError(msg);
    } finally {
      setIsUpdatingForm(false);
    }
  };

  const handleTransition = async (newState: TChangeState) => {
    // ISSUE 1: Frontend validation for scheduled → implement
    if (change.state === "scheduled" && newState === "implement") {
      const missing: string[] = [];
      if (!change.actual_start_date) missing.push("Actual Start Date");
      if (!change.actual_end_date) missing.push("Actual End Date");
      if (missing.length > 0) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Missing required fields",
          message: `${missing.join(" and ")} ${missing.length === 1 ? "is" : "are"} required before beginning implementation.`,
        });
        return;
      }
      // Validate actual_end > actual_start
      if (new Date(change.actual_end_date) <= new Date(change.actual_start_date)) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Invalid dates",
          message: "Actual End Date must be after Actual Start Date.",
        });
        return;
      }
    }

    try {
      setIsTransitioning(true);
      setTransitionError(null);
      await store.transitionState(workspaceSlug, change.number, newState);
      // Refresh related data after transition
      await Promise.all([
        store.fetchApprovals(workspaceSlug, change.number),
        store.fetchTasks(workspaceSlug, change.number),
        store.fetchActivity(workspaceSlug, change.number),
      ]);
    } catch (err: any) {
      const msg = typeof err === "string" ? err
        : err?.error || err?.detail || JSON.stringify(err) || "Transition failed.";
      setTransitionError(msg);
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleCancel = async () => {
    try {
      setIsTransitioning(true);
      setTransitionError(null);
      await store.transitionState(workspaceSlug, change.number, "cancelled");
    } catch (err: any) {
      const msg = typeof err === "string" ? err
        : err?.error || err?.detail || JSON.stringify(err) || "Cancel failed.";
      setTransitionError(msg);
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleApprove = async (approvalId: string, note: string) => {
    try {
      setIsApprovalActioning(true);
      await store.approveChange(workspaceSlug, change.number, note);
      await store.fetchActivity(workspaceSlug, change.number);
    } catch (err: any) {
      const msg = typeof err === "string" ? err
        : err?.error || err?.detail || JSON.stringify(err) || "Approval failed.";
      setTransitionError(msg);
    } finally {
      setIsApprovalActioning(false);
    }
  };

  const handleReject = async (approvalId: string, note: string) => {
    try {
      setIsApprovalActioning(true);
      await store.rejectChange(workspaceSlug, change.number, note);
      await store.fetchActivity(workspaceSlug, change.number);
    } catch (err: any) {
      const msg = typeof err === "string" ? err
        : err?.error || err?.detail || JSON.stringify(err) || "Rejection failed.";
      setTransitionError(msg);
    } finally {
      setIsApprovalActioning(false);
    }
  };

  const handleUpdateTask = async (taskId: string, data: Partial<IChangeTask>) => {
    try {
      setIsTaskUpdating(true);
      await store.updateTask(workspaceSlug, change.number, taskId, data);
    } catch (err: any) {
      const msg = typeof err === "string" ? err
        : err?.error || err?.detail || JSON.stringify(err) || "Task update failed.";
      setTransitionError(msg);
    } finally {
      setIsTaskUpdating(false);
    }
  };

  const handleCreateTask = async (data: Partial<IChangeTask>) => {
    try {
      setIsTaskUpdating(true);
      await store.createTask(workspaceSlug, change.number, data);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Task created",
        message: "Implementation task created successfully.",
      });
    } catch (err: any) {
      const msg = typeof err === "string"
        ? (err.includes("<") ? "Unable to create task. Please try again." : err)
        : err?.error || err?.detail || "Unable to create task. Please try again.";
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Task creation failed",
        message: msg,
      });
    } finally {
      setIsTaskUpdating(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      setIsTaskUpdating(true);
      await store.deleteTask(workspaceSlug, change.number, taskId);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Task deleted",
        message: "Task has been removed.",
      });
    } catch (err: any) {
      const msg = typeof err === "string"
        ? (err.includes("<") ? "Unable to delete task. Please try again." : err)
        : err?.error || err?.detail || "Unable to delete task. Please try again.";
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Task deletion failed",
        message: msg,
      });
    } finally {
      setIsTaskUpdating(false);
    }
  };

  const isTerminal = change.state === "closed" || change.state === "cancelled";

  const tabs = [
    { id: "details", label: "Details", show: true },
    {
      id: "approvals", label: "Approvals",
      count: store.currentApprovals.length,
      show: true,
    },
    { id: "tasks", label: "Tasks", count: store.currentTasks.length, show: true },
    { id: "activity", label: "Activity", count: store.currentActivity.length, show: true },
  ].filter((t) => t.show);

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto pb-20 relative">
      <div className="px-6 py-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-primary">{change.number}</h1>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
            change.type === "normal"
              ? "bg-blue-500/15 text-blue-600 border border-blue-500/25"
              : "bg-purple-500/15 text-purple-600 border border-purple-500/25"
          }`}>
            {change.type === "normal" ? "Normal" : "Standard"}
          </span>
        </div>
        <p className="text-secondary mt-1">{change.short_description}</p>
      </div>

      <div className="px-6">
        <StateProgress state={change.state} type={change.type} />
      </div>

      <div className="flex items-center gap-6 px-6 border-b border-subtle mb-6">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 text-sm font-medium cursor-pointer flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-secondary hover:text-primary"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="bg-layer-1 px-2 py-0.5 rounded-full text-xs">
                {tab.count}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="flex-1 px-6 overflow-y-auto">
        {activeTab === "details" && (
          <ChangeForm
            change={change}
            type={change.type}
            onSubmit={handleUpdate}
            isSubmitting={isUpdatingForm}
            hideStateBar
          />
        )}

        {activeTab === "approvals" && (
          change.type === "standard" ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 mb-3">
                <span className="text-sm font-semibold text-purple-600">
                  Standard Change — Approvals Not Required
                </span>
              </div>
              <p className="text-sm text-tertiary max-w-md">
                Standard changes are pre-approved low-risk changes. They skip the
                Assess and Authorize stages and do not require peer review or CAB approval.
              </p>
            </div>
          ) : (
            <ApprovalTable
              approvals={store.currentApprovals}
              currentUserId={currentUserId}
              onApprove={handleApprove}
              onReject={handleReject}
              isActioning={isApprovalActioning}
            />
          )
        )}

        {activeTab === "tasks" && (
          <TaskTable
            tasks={store.currentTasks}
            changeState={change.state}
            onUpdateTask={handleUpdateTask}
            onCreateTask={handleCreateTask}
            onDeleteTask={handleDeleteTask}
            isUpdating={isTaskUpdating}
          />
        )}

        {activeTab === "activity" && (
          <div className="max-w-3xl">
            <ActivityFeed
              activities={store.currentActivity}
              onAddComment={(comment) => store.addComment(workspaceSlug, change.number, comment)}
              isAddingComment={false}
            />
          </div>
        )}
      </div>

      <ActionBar
        state={change.state}
        type={change.type}
        onTransition={handleTransition}
        onCancel={handleCancel}
        isTransitioning={isTransitioning}
        isUpdatingForm={isUpdatingForm}
        transitionError={transitionError}
        tasks={store.currentTasks}
        approvals={store.currentApprovals}
        closeCode={change.close_code}
        closeNotes={change.close_notes}
        onHold={change.on_hold}
        requestedBy={change.requested_by}
        currentUserId={currentUserId}
        plannedStartDate={change.planned_start_date}
      />
    </div>
  );
});
