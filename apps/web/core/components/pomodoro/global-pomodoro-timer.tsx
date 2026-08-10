/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useNavigate, useParams } from "react-router";
// plane imports
import { useTranslation } from "@plane/i18n";
import { AlertModalCore, Spinner } from "@plane/ui";
import { cn } from "@plane/utils";
import type { ISearchIssueResponse } from "@plane/types";
import { ExistingIssuesListModal } from "@/components/core/modals/existing-issues-list-modal";
// lucide
import { Coffee, Timer, X } from "lucide-react";
// hooks
import { usePomodoroTimer } from "@/hooks/pomodoro/use-pomodoro-timer";
// local imports
import { PomodoroCountdown } from "./pomodoro-countdown";
import { PomodoroControls } from "./pomodoro-controls";

export const GlobalPomodoroTimer = observer(function GlobalPomodoroTimer() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { workspaceSlug } = useParams();
  const [isHidden, setIsHidden] = useState(false);
  const [isHideConfirmOpen, setIsHideConfirmOpen] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const [isIssueSelectOpen, setIsIssueSelectOpen] = useState(false);

  const {
    activeTimer,
    phase,
    isTimerRunning,
    isTimerPaused,
    isBreak,
    isNextSessionReady,
    hasActiveTimer,
    loader,
    remainingSeconds,
    pause,
    resume,
    complete,
    startFocus,
  } = usePomodoroTimer();

  // Keyboard shortcut: Ctrl+Shift+P to toggle pause/resume
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "P") {
        e.preventDefault();
        if (isTimerRunning) void pause();
        else if (isTimerPaused) void resume();
      }
    },
    [isTimerRunning, isTimerPaused, pause, resume]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // show the bar while a timer is active, during a break, or right after a completed cycle
  const showBar = hasActiveTimer || isBreak || isNextSessionReady;
  useEffect(() => {
    if (showBar) setIsHidden(false);
  }, [showBar]);

  if (!showBar || isHidden) return null;

  const goToTimerIssue = () => {
    if (!activeTimer || !workspaceSlug) return;
    navigate(`/${workspaceSlug}/projects/${activeTimer.project}/issues/${activeTimer.issue}/`);
  };

  const handleHideClick = () => {
    if (hasActiveTimer) {
      setIsHideConfirmOpen(true);
      return;
    }
    setIsHidden(true);
  };

  const handleHideConfirm = async () => {
    setIsHiding(true);
    try {
      if (hasActiveTimer) await complete();
      setIsHidden(true);
      setIsHideConfirmOpen(false);
    } finally {
      setIsHiding(false);
    }
  };

  const handleStartFocus = async (issues: ISearchIssueResponse[]) => {
    if (issues.length > 0) {
      await startFocus(issues[0].id);
      setIsIssueSelectOpen(false);
    }
  };

  const phaseLabel = isBreak
    ? phase === "long-break"
      ? t("pomodoro.long_break")
      : t("pomodoro.short_break")
    : t("pomodoro.focus");

  const PhaseIcon = isBreak ? Coffee : Timer;

  return (
    <>
      {/* Slim bar pinned to bottom of content area */}
      <div className="fixed right-0 bottom-0 left-0 z-50 flex h-9 items-center justify-between border-t border-subtle bg-surface-1 px-4">
        <button
          type="button"
          onClick={goToTimerIssue}
          className="flex min-w-0 cursor-pointer items-center gap-2 text-left hover:opacity-70"
        >
          <span
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-full",
              isBreak ? "bg-violet-500/15 text-violet-500" : "bg-accent-subtle text-accent-primary"
            )}
          >
            <PhaseIcon className="size-3" />
          </span>
          <PomodoroCountdown seconds={remainingSeconds} size="sm" />
          <span className="text-xs max-w-48 truncate text-secondary">
            {phaseLabel}
            {activeTimer && <span> · {activeTimer.issue_detail.name}</span>}
          </span>
        </button>

        <div className="flex items-center gap-2">
          <PomodoroControls compact issueId={activeTimer?.issue} />
          {loader === "mutate" && <Spinner className="size-3.5" />}

          {isNextSessionReady && (
            <button
              type="button"
              onClick={() => setIsIssueSelectOpen(true)}
              className="flex size-7 items-center justify-center rounded text-secondary transition-colors hover:bg-layer-transparent-hover hover:text-primary"
              aria-label={t("pomodoro.start_focus")}
              title={t("pomodoro.start_focus")}
            >
              <Timer className="size-3.5" />
            </button>
          )}

          <button
            type="button"
            aria-label={t("pomodoro.hide")}
            title={t("pomodoro.hide")}
            onClick={handleHideClick}
            className="flex size-5 shrink-0 items-center justify-center rounded text-secondary transition-colors hover:bg-layer-transparent-hover hover:text-primary"
          >
            <X className="size-3" />
          </button>
        </div>
      </div>

      <AlertModalCore
        isOpen={isHideConfirmOpen}
        handleClose={() => setIsHideConfirmOpen(false)}
        handleSubmit={() => void handleHideConfirm()}
        isSubmitting={isHiding}
        variant="primary"
        title={t("pomodoro.hide_confirm_title")}
        content={t("pomodoro.hide_confirm_description")}
        primaryButtonText={{
          loading: t("pomodoro.hide_confirm_submit_loading"),
          default: t("pomodoro.hide_confirm_submit"),
        }}
        secondaryButtonText={t("pomodoro.hide_confirm_cancel")}
      />
      <ExistingIssuesListModal
        workspaceSlug={workspaceSlug}
        isOpen={isIssueSelectOpen}
        handleClose={() => setIsIssueSelectOpen(false)}
        searchParams={{}}
        handleOnSubmit={handleStartFocus}
        workspaceLevelToggle={true}
      />
    </>
  );
});
