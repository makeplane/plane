/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { cn, formatElapsed, getElapsedSeconds } from "@plane/utils";

/** The current time, refreshed every `intervalMs`. */
export const useNow = (intervalMs = 1000) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
};

type Props = {
  startedAt: string;
  clockOffsetMs: number;
  className?: string;
};

/** A running timer's "1:23:45". Ticks on its own so only this text re-renders every second. */
export function ElapsedTime({ startedAt, clockOffsetMs, className }: Props) {
  const now = useNow(1000);
  return (
    <span className={cn("tabular-nums", className)}>
      {formatElapsed(getElapsedSeconds(startedAt, now, clockOffsetMs))}
    </span>
  );
}
