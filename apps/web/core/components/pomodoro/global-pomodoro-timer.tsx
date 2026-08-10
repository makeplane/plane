/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useNavigate, useParams } from "react-router";
// plane imports
import { useTranslation } from "@plane/i18n";
import { AlertModalCore, Spinner } from "@plane/ui";
import { ExistingIssuesListModal } from "@/components/core/modals/existing-issues-list-modal";
import type { ISearchIssueResponse } from "@plane/types";
// lucide
import { Check, Coffee, Pause, Play, SkipForward, Timer, Trash2, X } from "lucide-react";
// hooks
import { usePomodoroTimer } from "@/hooks/pomodoro/use-pomodoro-timer";
// local imports
import { formatCountdown } from "./helper";

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
    isBreakRunning,
    isNextSessionReady,
    hasActiveTimer,
    loader,
    remainingSeconds,
    pause,
    resume,
    startBreak,
    pauseBreak,
    complete,
    discardToBreak,
    skipBreak,
    startFocus,
  } = usePomodoroTimer();

  // show the floating pill while a timer is active, during a break, or right after a completed cycle
  const showPill = hasActiveTimer || isBreak || isNextSessionReady;
  useEffect(() => {
    if (showPill) setIsHidden(false);
  }, [showPill]);

  if (!showPill || isHidden) return null;

  const goToTimerIssue = () => {
    if (!activeTimer || !workspaceSlug) return;
    navigate(`/${workspaceSlug}/projects/${activeTimer.project}/issues/${activeTimer.issue}/`);
  };

  // hide: if a focus session is running, confirm that the timer is stopped and its time saved first
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
      <div className="shadow-lg fixed right-4 bottom-4 z-50 flex flex-col gap-2 rounded-md border border-subtle bg-surface-1 p-3 md:right-6 md:bottom-6">
        <div className="flex items-start justify-between gap-1">
          <button
            type="button"
            onClick={goToTimerIssue}
            className="flex min-w-0 cursor-pointer items-center gap-2.5 text-left hover:opacity-70"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-accent-primary">
              <PhaseIcon className="size-4" />
            </span>
            <span className="flex flex-col">
              <span className="text-2xl leading-none font-semibold tracking-tight text-primary tabular-nums">
                {formatCountdown(remainingSeconds)}
              </span>
              <span className="mt-1 max-w-48 truncate text-10 leading-3 text-secondary">
                {phaseLabel}
                {activeTimer && <span> · {activeTimer.issue_detail.name}</span>}
              </span>
            </span>
          </button>
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

        <div className="flex items-center justify-between gap-2 border-t border-subtle pt-2">
          <button
            type="button"
            onClick={goToTimerIssue}
            className="max-w-40 truncate text-10 font-medium text-secondary hover:text-primary"
          >
            {t("pomodoro.open_work_item")}
          </button>
          <div className="flex items-center gap-1">
            {isBreak ? (
              <>
                {isBreakRunning ? (
                  <IconButton
                    label={t("pomodoro.pause_break")}
                    disabled={loader === "mutate"}
                    onClick={() => void pauseBreak()}
                  >
                    <Pause className="size-3.5" />
                  </IconButton>
                ) : (
                  <IconButton
                    label={t("pomodoro.start_break")}
                    disabled={loader === "mutate"}
                    onClick={() => void startBreak()}
                  >
                    <Play className="size-3.5" />
                  </IconButton>
                )}
                <IconButton
                  label={t("pomodoro.skip_break")}
                  disabled={loader === "mutate"}
                  onClick={() => void skipBreak()}
                >
                  <SkipForward className="size-3.5" />
                </IconButton>
              </>
            ) : isTimerRunning ? (
              <>
                <IconButton label={t("pomodoro.pause")} disabled={loader === "mutate"} onClick={() => void pause()}>
                  <Pause className="size-3.5" />
                </IconButton>
                <IconButton
                  label={t("pomodoro.complete")}
                  disabled={loader === "mutate"}
                  onClick={() => void complete()}
                >
                  <Check className="size-3.5" />
                </IconButton>
                <IconButton
                  label={t("pomodoro.discard")}
                  disabled={loader === "mutate"}
                  onClick={() => void discardToBreak()}
                >
                  <Trash2 className="size-3.5" />
                </IconButton>
              </>
            ) : isTimerPaused ? (
              <>
                <IconButton label={t("pomodoro.resume")} disabled={loader === "mutate"} onClick={() => void resume()}>
                  <Play className="size-3.5" />
                </IconButton>
                <IconButton
                  label={t("pomodoro.complete")}
                  disabled={loader === "mutate"}
                  onClick={() => void complete()}
                >
                  <Check className="size-3.5" />
                </IconButton>
                <IconButton
                  label={t("pomodoro.discard")}
                  disabled={loader === "mutate"}
                  onClick={() => void discardToBreak()}
                >
                  <Trash2 className="size-3.5" />
                </IconButton>
              </>
            ) : isNextSessionReady ? (
              <button
                type="button"
                onClick={() => setIsIssueSelectOpen(true)}
                className="flex size-7 items-center justify-center rounded text-secondary transition-colors hover:bg-layer-transparent-hover hover:text-primary"
                aria-label={t("pomodoro.start_focus")}
                title={t("pomodoro.start_focus")}
              >
                <Timer className="size-3.5" />
              </button>
            ) : null}
            {loader === "mutate" && <Spinner className="size-3.5" />}
          </div>
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

const IconButton = ({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    disabled={disabled}
    className="flex size-7 items-center justify-center rounded text-secondary transition-colors hover:bg-layer-transparent-hover hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
  >
    {children}
  </button>
);
