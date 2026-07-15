/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { EUserPermissions } from "@plane/constants";
// icons
import { Clock, Pencil, Plus, Trash2, X } from "lucide-react";
// ui
import { Tooltip } from "@plane/propel/tooltip";
// components
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useUser, useUserPermissions } from "@/hooks/store/user";
// components
import { WORKING_HOURS_TIMER_STOPPED_EVENT } from "@/components/workspace/working-hours-notifications-poller";
// services
import { IssueService } from "@/services/issue";

type TIssueWorklogProperty = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
  // included so the worklog refetches when the issue's state changes elsewhere
  // (e.g. the auto timer starting/stopping) without requiring a full page reload
  stateId?: string | null;
  // the issue's server-confirmed updated_at — changes only once the state-change
  // request (and its timer start/stop side effect) has actually landed on the
  // backend, unlike stateId which flips optimistically before that happens
  updatedAt?: string | null;
};

type TimeLog = {
  id: string;
  user_id: string | null;
  date: string;
  created_at: string;
  started_at: string;
  stopped_at: string | null;
  duration_seconds: number;
  duration_formatted: string;
};

type TTimeLogFormValues = {
  date: string;
  hours: string;
  minutes: string;
  userId: string;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
};

const formatElapsedHHMMSS = (startedAt: string, now: number): string => {
  const elapsedSeconds = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const durationToForm = (log: TimeLog, fallbackUserId: string): TTimeLogFormValues => ({
  date: log.date,
  hours: String(Math.floor(log.duration_seconds / 3600)),
  minutes: String(Math.floor((log.duration_seconds % 3600) / 60)),
  userId: log.user_id ?? fallbackUserId,
});

const formToPayload = (form: TTimeLogFormValues) => ({
  date: form.date,
  duration_seconds: (Number(form.hours) || 0) * 3600 + (Number(form.minutes) || 0) * 60,
  user_id: form.userId,
});

export const IssueWorklogProperty = observer(function IssueWorklogProperty(props: TIssueWorklogProperty) {
  const { workspaceSlug, projectId, issueId, disabled, stateId, updatedAt } = props;
  const { project: projectMember, getUserDetails } = useMember();
  const { data: currentUser } = useUser();
  const { getProjectRoleByWorkspaceSlugAndProjectId } = useUserPermissions();
  const currentUserId = currentUser?.id ?? "";
  const isAdmin = getProjectRoleByWorkspaceSlugAndProjectId(workspaceSlug, projectId) === EUserPermissions.ADMIN;

  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [totalTime, setTotalTime] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState<TTimeLogFormValues>(() => ({
    date: todayISO(),
    hours: "0",
    minutes: "0",
    userId: currentUserId,
  }));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<TTimeLogFormValues | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const activeLog = timeLogs.find((log) => !log.stopped_at);

  const issueService = new IssueService();
  const memberIds = projectMember.getProjectMemberIds(projectId, false) ?? [];

  const fetchTimeLogs = async () => {
    try {
      const response = await issueService.getTimeLogs(workspaceSlug, projectId, issueId);
      setTimeLogs(response || []);
      const total = (response || []).reduce((acc: number, log: TimeLog) => acc + log.duration_seconds, 0);
      setTotalTime(total);
    } catch (err) {
      console.error("Failed to fetch time logs:", err);
    }
  };

  useEffect(() => {
    if (workspaceSlug && projectId && issueId) {
      fetchTimeLogs();
    }
    // stateId covers the optimistic change, updatedAt covers the server-confirmed
    // one (once the timer start/stop side effect has actually landed) — depending on
    // both avoids a race where we'd refetch before the backend has stopped the timer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug, projectId, issueId, stateId, updatedAt]);

  useEffect(() => {
    if (!activeLog) return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
    // only restart the interval when the active log itself changes, not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLog?.id, activeLog?.started_at]);

  // Safety net for working-hours auto-stop: while a timer is running, poll every
  // 30s and also refetch immediately when the workspace poller signals a stop, so
  // the "Time Running" display clears once the backend closes the timer.
  useEffect(() => {
    if (!activeLog) return undefined;
    const poll = setInterval(() => {
      fetchTimeLogs();
    }, 30_000);
    const onStopped = () => fetchTimeLogs();
    window.addEventListener(WORKING_HOURS_TIMER_STOPPED_EVENT, onStopped);
    return () => {
      clearInterval(poll);
      window.removeEventListener(WORKING_HOURS_TIMER_STOPPED_EVENT, onStopped);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLog?.id]);

  const handleCreate = async () => {
    setError(null);
    const payload = formToPayload(isAdmin ? addForm : { ...addForm, userId: currentUserId });
    if (payload.duration_seconds <= 0) {
      setError("Duration must be greater than zero");
      return;
    }
    try {
      await issueService.createTimeLog(workspaceSlug, projectId, issueId, payload);
      setIsAdding(false);
      await fetchTimeLogs();
    } catch (err: any) {
      setError(err?.error || "Failed to add time log");
    }
  };

  const handleUpdate = async (logId: string) => {
    if (!editForm) return;
    const timeLog = timeLogs.find((log) => log.id === logId);
    if (!timeLog || (!isAdmin && timeLog.user_id !== currentUserId)) return;
    setError(null);
    const payload = formToPayload(isAdmin ? editForm : { ...editForm, userId: currentUserId });
    if (payload.duration_seconds <= 0) {
      setError("Duration must be greater than zero");
      return;
    }
    try {
      await issueService.updateTimeLog(workspaceSlug, projectId, issueId, logId, payload);
      setEditingId(null);
      await fetchTimeLogs();
    } catch (err: any) {
      setError(err?.error || "Failed to update time log");
    }
  };

  const handleDelete = async (logId: string) => {
    const timeLog = timeLogs.find((log) => log.id === logId);
    if (!timeLog || (!isAdmin && timeLog.user_id !== currentUserId)) return;
    setError(null);
    try {
      await issueService.deleteTimeLog(workspaceSlug, projectId, issueId, logId);
      await fetchTimeLogs();
    } catch (err: any) {
      setError(err?.error || "Failed to delete time log");
    }
  };

  const renderUserSelect = (value: string, onChange: (userId: string) => void) => (
    <select
      className="border-custom-border-200 text-xs rounded border bg-transparent px-1 py-0.5"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {memberIds.map((memberId) => (
        <option key={memberId} value={memberId}>
          {getUserDetails(memberId)?.display_name ?? memberId}
        </option>
      ))}
    </select>
  );

  const logsByDate = timeLogs.reduce<Record<string, TimeLog[]>>((acc, log) => {
    if (!acc[log.date]) acc[log.date] = [];
    acc[log.date].push(log);
    return acc;
  }, {});

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm flex items-center gap-2 font-medium">
          <Clock className="h-4 w-4" />
          <span>{timeLogs.length > 0 ? `Total: ${formatDuration(totalTime)}` : "No time logged"}</span>
        </div>
        {!disabled && !isAdding && (
          <Tooltip tooltipContent="Add manual time entry">
            <button
              type="button"
              className="text-xs text-custom-primary-100 flex items-center gap-1 hover:underline"
              onClick={() => {
                setAddForm({ date: todayISO(), hours: "0", minutes: "0", userId: currentUserId });
                setError(null);
                setIsAdding(true);
              }}
            >
              <Plus className="h-3 w-3" />
              Add time
            </button>
          </Tooltip>
        )}
      </div>

      {error && <div className="text-xs text-red-500">{error}</div>}

      {isAdding && (
        <div className="border-custom-border-200 flex flex-wrap items-center gap-1.5 rounded border p-1.5">
          <input
            type="date"
            className="border-custom-border-200 text-xs w-28 rounded border bg-transparent px-1 py-0.5"
            value={addForm.date}
            onChange={(e) => setAddForm((f) => ({ ...f, date: e.target.value }))}
          />
          <input
            type="number"
            min={0}
            className="border-custom-border-200 text-xs w-12 rounded border bg-transparent px-1 py-0.5"
            value={addForm.hours}
            onChange={(e) => setAddForm((f) => ({ ...f, hours: e.target.value }))}
          />
          <span className="text-xs text-secondary">h</span>
          <input
            type="number"
            min={0}
            max={59}
            className="border-custom-border-200 text-xs w-12 rounded border bg-transparent px-1 py-0.5"
            value={addForm.minutes}
            onChange={(e) => setAddForm((f) => ({ ...f, minutes: e.target.value }))}
          />
          <span className="text-xs text-secondary">m</span>
          {isAdmin && renderUserSelect(addForm.userId, (userId) => setAddForm((f) => ({ ...f, userId })))}
          <button type="button" className="text-xs text-custom-primary-100 ml-auto" onClick={handleCreate}>
            Save
          </button>
          <button type="button" className="text-secondary" onClick={() => setIsAdding(false)}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {activeLog && (
        <div className="text-sm text-custom-primary-100 flex items-center gap-2 font-medium">
          <span className="relative flex h-2 w-2">
            <span className="bg-custom-primary-100 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
            <span className="bg-custom-primary-100 relative inline-flex h-2 w-2 rounded-full" />
          </span>
          <span>Time Running: {formatElapsedHHMMSS(activeLog.started_at, now)}</span>
        </div>
      )}

      {timeLogs.length > 0 && (
        <div className="max-h-48 space-y-1 overflow-y-auto">
          {Object.entries(logsByDate)
            // toSorted() isn't available under this project's TS lib target; Object.entries()
            // always returns a fresh array, so sorting it in place here is safe
            // eslint-disable-next-line unicorn/no-array-sort
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, logs]) => {
              const dayTotal = logs.reduce((acc, log) => acc + log.duration_seconds, 0);
              return (
                <div key={date} className="space-y-0.5">
                  <div className="text-xs flex items-center justify-between">
                    <span className="text-secondary">{formatDate(date)}</span>
                    <span className="font-medium">{formatDuration(dayTotal)}</span>
                  </div>
                  {logs.map((log) =>
                    editingId === log.id && editForm ? (
                      <div key={log.id} className="flex flex-wrap items-center gap-1.5 pl-2">
                        <input
                          type="number"
                          min={0}
                          className="border-custom-border-200 text-xs w-10 rounded border bg-transparent px-1 py-0.5"
                          value={editForm.hours}
                          onChange={(e) => setEditForm((f) => (f ? { ...f, hours: e.target.value } : f))}
                        />
                        <span className="text-xs text-secondary">h</span>
                        <input
                          type="number"
                          min={0}
                          max={59}
                          className="border-custom-border-200 text-xs w-10 rounded border bg-transparent px-1 py-0.5"
                          value={editForm.minutes}
                          onChange={(e) => setEditForm((f) => (f ? { ...f, minutes: e.target.value } : f))}
                        />
                        <span className="text-xs text-secondary">m</span>
                        {isAdmin &&
                          renderUserSelect(editForm.userId, (userId) => setEditForm((f) => (f ? { ...f, userId } : f)))}
                        <button
                          type="button"
                          className="text-xs text-custom-primary-100 ml-auto"
                          onClick={() => handleUpdate(log.id)}
                        >
                          Save
                        </button>
                        <button type="button" className="text-secondary" onClick={() => setEditingId(null)}>
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div key={log.id} className="text-xs flex items-center justify-between pl-2 text-secondary">
                        <div className="flex items-center gap-1.5">
                          <span className="text-secondary">{formatTime(log.created_at)}</span>
                          <ButtonAvatars showTooltip userIds={log.user_id ? [log.user_id] : []} size="sm" />
                          <span>{log.user_id ? getUserDetails(log.user_id)?.display_name : "Someone"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatDuration(log.duration_seconds)}</span>
                          {!disabled && (isAdmin || log.user_id === currentUserId) && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(log.id);
                                  setEditForm(durationToForm(log, currentUserId));
                                  setError(null);
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button type="button" onClick={() => handleDelete(log.id)}>
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
});
