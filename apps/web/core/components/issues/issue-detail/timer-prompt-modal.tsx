import React, { useState, useEffect } from "react";
import { mutate } from "swr";
import { ModalCore } from "@plane/ui";
import { useActiveTimers } from "@/hooks/use-active-timers";
import { IssueTimerService } from "@/services/issue/issue_timer.service";
import { useUser } from "@/hooks/store/user";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";

const timerService = new IssueTimerService();

const skippedTimerPrompts = new Set<string>();

type TimerPromptModalProps = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  onDecide: () => void;
  onCancel?: () => void;
  onStart?: (userId?: string) => void;
};

export const TimerPromptModal = ({ workspaceSlug, projectId, issueId, onDecide, onCancel, onStart }: TimerPromptModalProps) => {
  const { activeTimers, isLoading } = useActiveTimers(workspaceSlug);
  const { data: currentUser } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasDecided, setHasDecided] = useState(false);
  const [conflictTitle, setConflictTitle] = useState("");

  useEffect(() => {
    if (isLoading || hasDecided || !currentUser) return;
    
    const skipKey = `${workspaceSlug}_${issueId}`;
    if (skippedTimerPrompts.has(skipKey)) {
      setHasDecided(true);
      onDecide();
      return;
    }
    
    const myTimers = activeTimers.filter((t: any) => t.user_id === currentUser.id);
    
    if (myTimers.some((t: any) => t.issue_id === issueId && t.is_running === true && t.is_paused === false)) {
      setIsOpen(false);
      setHasDecided(true);
      onDecide();
      return;
    }
    
    const otherTimer = myTimers.find((t: any) => t.issue_id !== issueId && t.is_running === true && t.is_paused === false);
    if (otherTimer) {
       setConflictTitle(otherTimer.issue_name || "another issue");
    }
    
    setIsOpen(true);
  }, [isLoading, activeTimers, currentUser, issueId, hasDecided, onDecide]);

  const handleStartTimer = async (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setIsSubmitting(true);
    try {
      const updatedTimer = await timerService.actionTimer(workspaceSlug, projectId, issueId, "start");
      // Instantly mutate the global SWR cache with the running timer to remove the 10-20s delay
      const activeTimerObj = {
        issue_id: issueId,
        user_id: currentUser?.id,
        user_display_name: currentUser?.display_name || currentUser?.email || "You",
        is_running: true,
        is_paused: false,
      };
      mutate(
        `WORKSPACE_ACTIVE_TIMERS_${workspaceSlug}`,
        (current: any) => {
          if (Array.isArray(current)) {
            return [...current.filter((t: any) => !(t.user_id === currentUser?.id && t.issue_id === issueId)), activeTimerObj];
          }
          return [activeTimerObj];
        },
        { revalidate: true }
      );
      if (onStart) onStart(currentUser?.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Timer started",
        message: "Tracking time on this issue"
      });
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Timer error",
        message: error?.error || "Something went wrong."
      });
    } finally {
      setIsSubmitting(false);
      setIsOpen(false);
      setHasDecided(true);
      onDecide();
    }
  };

  const handleCancel = (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (onCancel) {
      onCancel();
    }
  };

  if (isLoading || !isOpen) {
    return null;
  }

  let bodyText = "Viewing this ticket requires starting the timer. Do you want to begin tracking time now?";
  if (conflictTitle) {
    bodyText = `You already have an active timer running on "${conflictTitle}". Both timers will run simultaneously.\n\n` + bodyText;
  }

  return (
    <ModalCore isOpen={isOpen} handleClose={() => handleCancel()}>
      <div data-prevent-outside-click="true" className="w-full h-full">
        <div className="flex flex-col items-center gap-4 p-5 sm:flex-row sm:items-start">
          <span className="grid size-12 flex-shrink-0 place-items-center rounded-full bg-accent-primary/20 text-accent-primary sm:size-10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </span>
          <div className="text-center sm:text-left">
            <h3 className="text-16 font-medium">Start Timer?</h3>
            <p className="mt-1 text-13 text-secondary whitespace-pre-wrap">{bodyText}</p>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t-[0.5px] border-subtle px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={(e) => handleCancel(e)}
            className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium bg-custom-background-90 border border-custom-border-200 text-custom-text-200 hover:bg-custom-background-80 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={(e) => handleStartTimer(e)}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-on-color bg-accent-primary hover:bg-accent-primary/80 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Starting..." : "Start Timer"}
          </button>
        </div>
      </div>
    </ModalCore>
  );
};
