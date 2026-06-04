import React, { useEffect, useState, useRef } from "react";
import { observer } from "mobx-react";
import { Play, Pause, Square, Clock, Plus } from "lucide-react";
import { useUser } from "@/hooks/store/user";
import { useProject } from "@/hooks/store/use-project";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { IssueTimerService } from "@/services/issue/issue_timer.service";
import type { TIssueTimer, TActiveTimer } from "@plane/types";
import { ModalCore } from "@plane/ui";
import { ManualTimeEntryModal } from "./manual-time-entry-modal";

const timerService = new IssueTimerService();

type TimerBarProps = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueTitle?: string;
  isClosed: boolean;
  onStart?: () => void;
};

export const TimerBar = observer(({ workspaceSlug, projectId, issueId, issueTitle, isClosed, onStart }: TimerBarProps) => {
  const { data: currentUser } = useUser();
  const [timer, setTimer] = useState<TIssueTimer | null>(null);
  const [otherActiveTimers, setOtherActiveTimers] = useState<TActiveTimer[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Conflict modal state
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"start" | "resume" | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [pendingTimerAction, setPendingTimerAction] = useState<"pause" | "stop" | null>(null);

  // Stop note state
  const [isStopNoteOpen, setIsStopNoteOpen] = useState(false);
  const [stopNote, setStopNote] = useState("");

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTimerState = async () => {
    try {
      const data = await timerService.getTimer(workspaceSlug, projectId, issueId);
      setTimer(data);
      if (data) {
        setElapsed(data.computed_duration_seconds);
      } else {
        setElapsed(0);
      }
    } catch (error) {
      console.error("Failed to fetch timer state", error);
    }
  };

  const fetchOtherTimers = async () => {
    try {
      const data = await timerService.getActiveTimers(workspaceSlug);
      // Filter for this issue, excluding current user
      const issueTimers = data.filter((t) => t.issue_id === issueId && t.user_id !== currentUser?.id);
      setOtherActiveTimers(issueTimers);
    } catch (error) {
      console.error("Failed to fetch active timers", error);
    }
  };

  const initialize = async () => {
    setIsLoading(true);
    await Promise.all([fetchTimerState(), fetchOtherTimers()]);
    setIsLoading(false);
  };

  // Mount/Unmount logic
  useEffect(() => {
    if (!workspaceSlug || !projectId || !issueId) return;
    initialize();

    // Polling every 10s
    pollIntervalRef.current = setInterval(() => {
      fetchTimerState();
      fetchOtherTimers();
    }, 30000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [workspaceSlug, projectId, issueId]);

  // Live ticking logic
  useEffect(() => {
    if (timer?.is_running) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timer?.is_running]);

  // Auto-stop detection
  const previousTimerRunningRef = useRef(timer?.is_running);
  const previousIsClosedRef = useRef(isClosed);

  useEffect(() => {
    if (isClosed && !previousIsClosedRef.current && previousTimerRunningRef.current) {
      setToast({
        type: TOAST_TYPE.WARNING,
        title: "Timer stopped automatically",
        message: `Issue marked as Done. Session logged: ${formatTime(elapsed)}`
      });
      fetchTimerState();
    }
    previousIsClosedRef.current = isClosed;
    previousTimerRunningRef.current = timer?.is_running;
  }, [isClosed, timer?.is_running, elapsed]);

  const handleAction = async (action: "start" | "pause" | "resume" | "stop", note?: string) => {
    // Optimistic UI update — immediately reflect state before API returns
    if (action === "start" || action === "resume") {
      setTimer((prev) => prev ? { ...prev, is_running: true, is_paused: false } : prev);
    } else if (action === "pause") {
      setTimer((prev) => prev ? { ...prev, is_running: false, is_paused: true } : prev);
    } else if (action === "stop") {
      setTimer((prev) => prev ? { ...prev, is_running: false, is_paused: false } : prev);
    }

    try {
      const updatedTimer = await timerService.actionTimer(workspaceSlug, projectId, issueId, action, note);
      
      if (action === "start" && onStart) {
        onStart();
      }

      setTimer(updatedTimer);
      setElapsed(updatedTimer.computed_duration_seconds);

      const actionText = {
        start: "started",
        pause: "paused",
        resume: "resumed",
        stop: "stopped"
      }[action];

      const displayTitle = issueTitle || issueId;

      let message = `Tracking time on ${displayTitle}`;
      if (action === "pause") {
        const d = new Date();
        const hhmmss = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
        message = `Paused at ${hhmmss}`;
      } else if (action === "stop") {
        message = `Session logged: ${formatTime(updatedTimer.computed_duration_seconds)}`;
      }

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: `Timer ${actionText}`,
        message,
      });
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Timer error",
        message: error?.error || "Something went wrong. Please try again.",
      });
    }
  };

  const checkConflictAndExecute = async (action: "start" | "resume") => {
    // Check if the user has any other running timer across the workspace
    try {
      const activeTimers = await timerService.getActiveTimers(workspaceSlug);
      const myOtherActive = activeTimers.find(t => t.user_id === currentUser?.id && t.issue_id !== issueId);
      
      if (myOtherActive) {
        setPendingAction(action);
        setIsConflictModalOpen(true);

      } else {
        handleAction(action);
      }
    } catch (e) {
      handleAction(action); // fallback
    }
  };

  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  if (isLoading) return null;

  const isRunning = timer?.is_running;
  const isPaused = timer?.is_paused;
  const hasTimer = !!timer;

  // Render disabled state if issue is closed
  if (isClosed) {
    return (
      <div className="flex items-center gap-3 py-2 px-4 bg-custom-background-90 border border-custom-border-200 rounded-md my-4">
        <Clock className="w-4 h-4 text-custom-text-400" />
        <span className="text-sm text-custom-text-400">Timer disabled — issue is closed</span>
        {hasTimer && timer.total_duration_seconds > 0 && (
          <span className="text-sm font-medium ml-auto">
            Total Logged: {formatTime(timer.total_duration_seconds)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col py-2 px-4 bg-custom-background-90 border border-custom-border-200 rounded-md my-4">
      <div className="flex items-center gap-4 w-full">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-custom-text-200" />
          <span className="text-sm font-medium w-20 font-mono text-custom-text-100">
            {formatTime(elapsed)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {(!hasTimer || (!isRunning && !isPaused)) && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                checkConflictAndExecute("start");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Start Timer
            </button>
          )}

          {isRunning && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isStopNoteOpen && pendingTimerAction === "pause") {
                  setIsStopNoteOpen(false);
                  setPendingTimerAction(null);
                } else {
                  setPendingTimerAction("pause");
                  setIsStopNoteOpen(true);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-custom-text-100 bg-custom-background-80 border border-custom-border-300 hover:bg-custom-background-100 rounded transition-colors"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              Pause
            </button>
          )}

          {isPaused && (
            <button
              onClick={() => checkConflictAndExecute("resume")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-custom-text-100 bg-custom-background-80 border border-custom-border-300 hover:bg-custom-background-100 rounded transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Resume
            </button>
          )}

          {(isRunning || isPaused) && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isStopNoteOpen && pendingTimerAction === "stop") {
                  setIsStopNoteOpen(false);
                  setPendingTimerAction(null);
                } else {
                  setPendingTimerAction("stop");
                  setIsStopNoteOpen(true);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              Stop
            </button>
          )}
          
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsManualModalOpen(true);
            }}
            className="flex items-center justify-center p-1.5 text-custom-text-300 hover:text-custom-text-100 bg-custom-background-80 border border-custom-border-300 hover:bg-custom-background-100 rounded transition-colors ml-1"
            title="Log Time Manually"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {otherActiveTimers.length > 0 && (
          <div className="flex items-center gap-2 ml-auto text-xs text-custom-text-400">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>
              {otherActiveTimers.map(t => t.user_display_name).join(", ")} {otherActiveTimers.length === 1 ? 'is' : 'are'} working on this
            </span>
          </div>
        )}
      </div>

      {isStopNoteOpen && (
        <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-custom-border-200 w-full">
          <span className="text-xs font-medium text-custom-text-200">
            Please add a note before {pendingTimerAction === "pause" ? "pausing" : "stopping"}
          </span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={stopNote}
              onChange={(e) => setStopNote(e.target.value)}
              className="flex-1 rounded-md border border-custom-border-200 bg-custom-background-90 px-3 py-1.5 text-sm text-custom-text-100 placeholder:text-custom-text-400 focus:border-custom-primary-100 focus:outline-none min-w-0"
              placeholder="What did you work on?"
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (pendingTimerAction) {
                  handleAction(pendingTimerAction, stopNote);
                }
                setIsStopNoteOpen(false);
                setPendingTimerAction(null);
                setStopNote("");
              }}
              disabled={stopNote.trim().length === 0}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-custom-primary-100 hover:bg-custom-primary-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pendingTimerAction === "pause" ? "Pause" : "Stop"} & Save
            </button>
          </div>
        </div>
      )}

      <ModalCore isOpen={isConflictModalOpen} handleClose={() => { setIsConflictModalOpen(false); setPendingAction(null); }}>
        <div className="flex flex-col items-center gap-4 p-5 sm:flex-row sm:items-start">
          <span className="grid size-12 flex-shrink-0 place-items-center rounded-full bg-accent-primary/20 text-accent-primary sm:size-10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </span>
          <div className="text-center sm:text-left">
            <h3 className="text-16 font-medium">Already on a Ticket</h3>
            <p className="mt-1 text-13 text-secondary">You already have an active timer running on another ticket. Do you want to work on multiple tickets simultaneously and start this timer too?</p>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t-[0.5px] border-subtle px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsConflictModalOpen(false); setPendingAction(null); }}
            className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium bg-custom-background-90 border border-custom-border-200 text-custom-text-200 hover:bg-custom-background-80 transition-colors"
          >Cancel</button>
          <button
            type="button"
            onClick={async (e) => { e.preventDefault(); e.stopPropagation(); if (pendingAction) await handleAction(pendingAction); setIsConflictModalOpen(false); setPendingAction(null); }}
            className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-white bg-custom-primary-100 hover:bg-custom-primary-200 transition-colors"
          >Start Timer</button>
        </div>
      </ModalCore>

      <ManualTimeEntryModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
        issueTitle={issueTitle}
        onSuccess={() => fetchTimerState()}
      />
    </div>
  );
});
