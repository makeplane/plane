/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { useNavigate, useParams } from "react-router";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Spinner } from "@plane/ui";
// lucide
import { Check, Coffee, Pause, Play, Square, Timer } from "lucide-react";
// hooks
import { usePomodoroTimer } from "@/hooks/pomodoro/use-pomodoro-timer";
// local imports
import { formatCountdown } from "./helper";

export const GlobalPomodoroTimer = observer(function GlobalPomodoroTimer() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { workspaceSlug } = useParams();

  const {
    activeTimer,
    phase,
    isTimerRunning,
    isTimerPaused,
    isBreak,
    hasActiveTimer,
    loader,
    remainingSeconds,
    pause,
    resume,
    complete,
    discard,
    skipBreak,
  } = usePomodoroTimer();

  // hide the floating pill when nothing is running
  if (!hasActiveTimer && !isBreak) return null;

  const goToTimerIssue = () => {
    if (!activeTimer || !workspaceSlug) return;
    navigate(`/${workspaceSlug}/projects/${activeTimer.project}/issues/${activeTimer.issue}/`);
  };

  const phaseLabel = isBreak
    ? phase === "long-break"
      ? t("pomodoro.long_break")
      : t("pomodoro.short_break")
    : t("pomodoro.focus");

  const PhaseIcon = isBreak ? Coffee : Timer;

  return (
    <div className="shadow-lg fixed right-4 bottom-4 z-50 flex flex-col gap-2 rounded-md border border-subtle bg-surface-1 p-3 md:right-6 md:bottom-6">
      <button
        type="button"
        onClick={goToTimerIssue}
        className="flex cursor-pointer items-center gap-2.5 text-left hover:opacity-70"
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
            <IconButton
              label={t("pomodoro.skip_break")}
              disabled={loader === "mutate"}
              onClick={() => void skipBreak()}
            >
              <Check className="size-3.5" />
            </IconButton>
          ) : isTimerRunning ? (
            <>
              <IconButton label={t("pomodoro.pause")} disabled={loader === "mutate"} onClick={() => void pause()}>
                <Pause className="size-3.5" />
              </IconButton>
              <IconButton label={t("pomodoro.complete")} disabled={loader === "mutate"} onClick={() => void complete()}>
                <Check className="size-3.5" />
              </IconButton>
            </>
          ) : isTimerPaused ? (
            <>
              <IconButton label={t("pomodoro.resume")} disabled={loader === "mutate"} onClick={() => void resume()}>
                <Play className="size-3.5" />
              </IconButton>
              <IconButton label={t("pomodoro.complete")} disabled={loader === "mutate"} onClick={() => void complete()}>
                <Check className="size-3.5" />
              </IconButton>
            </>
          ) : null}
          <IconButton label={t("pomodoro.discard")} disabled={loader === "mutate"} onClick={() => void discard()}>
            <Square className="size-3.5" />
          </IconButton>
          {loader === "mutate" && <Spinner className="size-3.5" />}
        </div>
      </div>
    </div>
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
