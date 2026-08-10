/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// hooks
import { usePomodoroTimer } from "@/hooks/pomodoro/use-pomodoro-timer";
// local imports
import { PomodoroCountdown } from "./pomodoro-countdown";
import { PomodoroControls } from "./pomodoro-controls";

type Props = {
  /** when provided, an idle timer can be started for this work item */
  issueId?: string;
  /** invoked right after a focus session completes and a time log is created */
  onTimeLogCreated?: () => void;
};

export const PomodoroTimer = observer(function PomodoroTimer(props: Props) {
  const { issueId, onTimeLogCreated } = props;
  const { t } = useTranslation();
  const { settings, phase, sessionCount, remainingSeconds, progress, isBreak } = usePomodoroTimer();

  const phaseLabel = isBreak
    ? phase === "long-break"
      ? t("pomodoro.long_break")
      : t("pomodoro.short_break")
    : t("pomodoro.focus");

  const totalSessions = settings.sessions_before_long_break > 0 ? settings.sessions_before_long_break : 4;

  return (
    <div className="flex w-full flex-col gap-3">
      {/* Countdown + phase label */}
      <div className="flex items-baseline justify-between">
        <PomodoroCountdown seconds={remainingSeconds} size="lg" />
        <span className="text-xs font-medium text-secondary">{phaseLabel}</span>
      </div>

      {/* Linear progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-(--border-color-subtle)">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-300",
            isBreak ? "bg-(--color-violet-500)" : "bg-(--border-color-accent-strong)"
          )}
          style={{ width: `${(1 - progress) * 100}%` }}
        />
      </div>

      {/* Session dots */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSessions }, (__, i) => `dot-${i}`).map((dotKey, i) => (
            <span
              key={dotKey}
              className={cn(
                "size-2 rounded-full transition-colors",
                i < sessionCount ? "bg-accent-primary" : "bg-(--border-color-subtle)"
              )}
            />
          ))}
        </div>
        <span className="text-[11px] font-medium text-secondary">
          {t("pomodoro.session_count", { completed: sessionCount, total: totalSessions })}
        </span>
      </div>

      {/* Action buttons */}
      <PomodoroControls issueId={issueId} onTimeLogCreated={onTimeLogCreated} />
    </div>
  );
});
