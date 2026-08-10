/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// lucide
import { Check, Pause, Play, SkipForward, Square, Timer } from "lucide-react";
// hooks
import { usePomodoroTimer } from "@/hooks/pomodoro/use-pomodoro-timer";

type Props = {
  /** required to start a new focus session */
  issueId?: string;
  /** called after a focus session completes and a time log is created */
  onTimeLogCreated?: () => void;
  /** render compact icon-only buttons instead of labeled buttons */
  compact?: boolean;
};

export const PomodoroControls = observer(function PomodoroControls(props: Props) {
  const { issueId, onTimeLogCreated, compact = false } = props;
  const { t } = useTranslation();
  const {
    isTimerRunning,
    isTimerPaused,
    isBreak,
    isBreakRunning,
    isNextSessionReady,
    loader,
    startFocus,
    pause,
    resume,
    complete,
    discard,
    discardToBreak,
    skipBreak,
    startBreak,
    pauseBreak,
  } = usePomodoroTimer();

  const handleComplete = async () => {
    const response = await complete();
    if (response?.time_log) onTimeLogCreated?.();
  };

  const isLoading = loader === "mutate";

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {isBreak ? (
          <>
            {isBreakRunning ? (
              <IconButton label={t("pomodoro.pause_break")} disabled={isLoading} onClick={() => void pauseBreak()}>
                <Pause className="size-3.5" />
              </IconButton>
            ) : (
              <IconButton label={t("pomodoro.start_break")} disabled={isLoading} onClick={() => void startBreak()}>
                <Play className="size-3.5" />
              </IconButton>
            )}
            <IconButton label={t("pomodoro.skip_break")} disabled={isLoading} onClick={() => void skipBreak()}>
              <SkipForward className="size-3.5" />
            </IconButton>
          </>
        ) : isTimerRunning ? (
          <>
            <IconButton label={t("pomodoro.pause")} disabled={isLoading} onClick={() => void pause()}>
              <Pause className="size-3.5" />
            </IconButton>
            <IconButton label={t("pomodoro.complete")} disabled={isLoading} onClick={() => void handleComplete()}>
              <Check className="size-3.5" />
            </IconButton>
            <IconButton label={t("pomodoro.discard")} disabled={isLoading} onClick={() => void discardToBreak()}>
              <Square className="size-3.5" />
            </IconButton>
          </>
        ) : isTimerPaused ? (
          <>
            <IconButton label={t("pomodoro.resume")} disabled={isLoading} onClick={() => void resume()}>
              <Play className="size-3.5" />
            </IconButton>
            <IconButton label={t("pomodoro.complete")} disabled={isLoading} onClick={() => void handleComplete()}>
              <Check className="size-3.5" />
            </IconButton>
            <IconButton label={t("pomodoro.discard")} disabled={isLoading} onClick={() => void discardToBreak()}>
              <Square className="size-3.5" />
            </IconButton>
          </>
        ) : isNextSessionReady ? (
          <IconButton
            label={t("pomodoro.start_focus")}
            disabled={isLoading}
            onClick={() => issueId && void startFocus(issueId)}
          >
            <Timer className="size-3.5" />
          </IconButton>
        ) : null}
      </div>
    );
  }

  // Full-size labeled buttons
  return (
    <div className="flex items-center justify-center gap-2">
      {isBreak ? (
        <>
          {isBreakRunning ? (
            <Button variant="secondary" size="base" prependIcon={<Pause />} onClick={pauseBreak} loading={isLoading}>
              {t("pomodoro.pause_break")}
            </Button>
          ) : (
            <Button variant="secondary" size="base" prependIcon={<Play />} onClick={startBreak} loading={isLoading}>
              {t("pomodoro.start_break")}
            </Button>
          )}
          <Button variant="tertiary" size="base" prependIcon={<SkipForward />} onClick={skipBreak} loading={isLoading}>
            {t("pomodoro.skip_break")}
          </Button>
        </>
      ) : isTimerRunning ? (
        <>
          <Button variant="secondary" size="base" prependIcon={<Pause />} onClick={pause} loading={isLoading}>
            {t("pomodoro.pause")}
          </Button>
          <Button variant="tertiary" size="base" prependIcon={<Check />} onClick={handleComplete} loading={isLoading}>
            {t("pomodoro.complete")}
          </Button>
          <Button variant="ghost" size="base" prependIcon={<Square />} onClick={discard} loading={isLoading}>
            {t("pomodoro.discard")}
          </Button>
        </>
      ) : isTimerPaused ? (
        <>
          <Button variant="secondary" size="base" prependIcon={<Play />} onClick={resume} loading={isLoading}>
            {t("pomodoro.resume")}
          </Button>
          <Button variant="tertiary" size="base" prependIcon={<Check />} onClick={handleComplete} loading={isLoading}>
            {t("pomodoro.complete")}
          </Button>
          <Button variant="ghost" size="base" prependIcon={<Square />} onClick={discard} loading={isLoading}>
            {t("pomodoro.discard")}
          </Button>
        </>
      ) : (
        <Button
          variant="primary"
          size="base"
          prependIcon={<Timer />}
          onClick={() => issueId && void startFocus(issueId)}
          disabled={!issueId}
          loading={loader === "start"}
        >
          {t("pomodoro.start_focus")}
        </Button>
      )}
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
