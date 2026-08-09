/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { cn } from "@plane/utils";
// lucide
import { Check, Pause, Play, SkipForward, Square, Timer } from "lucide-react";
// hooks
import { usePomodoroTimer } from "@/hooks/pomodoro/use-pomodoro-timer";
// local imports
import { formatCountdown } from "./helper";

const RING_SIZE = 160;
const RING_STROKE = 10;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

type Props = {
  /** when provided, an idle timer can be started for this work item */
  issueId?: string;
  /** invoked right after a focus session completes and a time log is created */
  onTimeLogCreated?: () => void;
};

export const PomodoroTimer = observer(function PomodoroTimer(props: Props) {
  const { issueId, onTimeLogCreated } = props;
  const { t } = useTranslation();
  const {
    settings,
    phase,
    sessionCount,
    remainingSeconds,
    progress,
    isTimerRunning,
    isTimerPaused,
    isBreak,
    loader,
    startFocus,
    pause,
    resume,
    complete,
    discard,
    skipBreak,
  } = usePomodoroTimer();

  const handleComplete = async () => {
    const response = await complete();
    if (response?.time_log) onTimeLogCreated?.();
  };

  const phaseLabel = isBreak
    ? phase === "long-break"
      ? t("pomodoro.long_break")
      : t("pomodoro.short_break")
    : t("pomodoro.focus");

  const totalSessions = settings.sessions_before_long_break > 0 ? settings.sessions_before_long_break : 4;
  const isBreakAccent = isBreak;

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="relative shrink-0">
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          className="-rotate-90"
          role="img"
          aria-label={phaseLabel}
        >
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            className="stroke-(--border-color-subtle)"
            strokeWidth={RING_STROKE}
            fill="none"
          />
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            className={cn(
              "transition-[stroke-dashoffset] duration-300",
              isBreakAccent ? "stroke-(--color-violet-500)" : "stroke-(--border-color-accent-strong)"
            )}
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className="text-2xl font-medium tracking-tight text-primary">{formatCountdown(remainingSeconds)}</span>
          <span className="text-xs font-medium text-secondary">{phaseLabel}</span>
        </div>
      </div>

      <SessionDots total={totalSessions} completed={sessionCount} />

      <div className="flex items-center justify-center gap-2">
        {isBreak ? (
          <Button
            variant="secondary"
            size="base"
            prependIcon={<SkipForward />}
            onClick={skipBreak}
            loading={loader === "mutate"}
          >
            {t("pomodoro.skip_break")}
          </Button>
        ) : isTimerRunning ? (
          <>
            <Button
              variant="secondary"
              size="base"
              prependIcon={<Pause />}
              onClick={pause}
              loading={loader === "mutate"}
            >
              {t("pomodoro.pause")}
            </Button>
            <Button
              variant="tertiary"
              size="base"
              prependIcon={<Check />}
              onClick={handleComplete}
              loading={loader === "mutate"}
            >
              {t("pomodoro.complete")}
            </Button>
            <Button
              variant="ghost"
              size="base"
              prependIcon={<Square />}
              onClick={discard}
              loading={loader === "mutate"}
            >
              {t("pomodoro.discard")}
            </Button>
          </>
        ) : isTimerPaused ? (
          <>
            <Button
              variant="secondary"
              size="base"
              prependIcon={<Play />}
              onClick={resume}
              loading={loader === "mutate"}
            >
              {t("pomodoro.resume")}
            </Button>
            <Button
              variant="tertiary"
              size="base"
              prependIcon={<Check />}
              onClick={handleComplete}
              loading={loader === "mutate"}
            >
              {t("pomodoro.complete")}
            </Button>
            <Button
              variant="ghost"
              size="base"
              prependIcon={<Square />}
              onClick={discard}
              loading={loader === "mutate"}
            >
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
    </div>
  );
});

type SessionDotsProps = {
  total: number;
  completed: number;
};

const SessionDots = ({ total, completed }: SessionDotsProps) => {
  const { t } = useTranslation();
  return (
    <div className="text-[11px] font-medium text-secondary">{t("pomodoro.session_count", { completed, total })}</div>
  );
};
