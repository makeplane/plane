/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// hooks
import { usePomodoroTimer } from "@/hooks/pomodoro/use-pomodoro-timer";
// local imports
import { formatCountdown } from "./helper";

type Props = {
  issueId: string;
};

/** Compact live pomodoro countdown shown next to the Time tracking property. */
export const PomodoroSidebarIndicator = observer(function PomodoroSidebarIndicator(props: Props) {
  const { issueId } = props;
  const { activeTimer, isBreak, remainingSeconds } = usePomodoroTimer();

  const isRelevant =
    !!activeTimer &&
    activeTimer.issue === issueId &&
    (activeTimer.status === "running" || activeTimer.status === "paused" || isBreak);

  if (!isRelevant) return null;

  return (
    <span className="text-caption flex shrink-0 items-center gap-1 text-secondary">
      <span className="size-1.5 animate-pulse rounded-full bg-accent-primary" />
      {formatCountdown(remainingSeconds)}
    </span>
  );
});
