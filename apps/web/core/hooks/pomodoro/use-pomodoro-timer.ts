/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// plane types
import type { TCompletePomodoroResponse, TPomodoroSettings, TPomodoroTimer } from "@plane/types";
// store hooks
import { usePomodoroTimerStore } from "@/hooks/store/use-pomodoro-timer-store";
import type { TPomodoroPhase } from "@/store/pomodoro/pomodoro-timer.store";

export type { TPomodoroPhase } from "@/store/pomodoro/pomodoro-timer.store";

export type TPomodoroTimerReturn = {
  /** server-persisted focus session, if any is active */
  activeTimer: TPomodoroTimer | undefined;
  /** the user's pomodoro settings */
  settings: TPomodoroSettings;
  /** current pomodoro phase */
  phase: TPomodoroPhase;
  /** focus sessions completed in the current cycle */
  sessionCount: number;
  /** time left in the current phase (seconds) */
  remainingSeconds: number;
  /** total duration of the current phase (seconds) */
  totalSeconds: number;
  /** progress from 0..1 for the current phase */
  progress: number;
  isTimerRunning: boolean;
  isTimerPaused: boolean;
  hasActiveTimer: boolean;
  isBreak: boolean;
  isBreakRunning: boolean;
  isNextSessionReady: boolean;
  loader: "fetch" | "start" | "mutate" | undefined;
  startFocus: (issueId: string, resetSession?: boolean) => Promise<TPomodoroTimer>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  complete: () => Promise<TCompletePomodoroResponse>;
  discard: () => Promise<void>;
  discardToBreak: () => Promise<void>;
  skipBreak: () => void;
  startBreak: () => void;
  pauseBreak: () => void;
};

export const usePomodoroTimer = (): TPomodoroTimerReturn => {
  const store = usePomodoroTimerStore();
  const {
    activeTimer,
    settings,
    phase,
    sessionCount,
    isBreak,
    isBreakRunning,
    isNextSessionReady,
    hasActiveTimer,
    loader,
    breakSecondsLeft,
    focusIssueId,
  } = store;

  // focus countdown clock (server-authoritative elapsed time)
  const [now, setNow] = useState<number>(() => Date.now());

  // guards against double-completing a focus session
  const completingRef = useRef(false);

  useEffect(() => {
    void store.fetchTimers();
  }, [store]);

  // tick the clock only while a focus session is actually running
  useEffect(() => {
    if (phase !== "focus" || !activeTimer || activeTimer.status !== "running") return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, activeTimer?.id, activeTimer?.status]);

  // tick the break countdown
  useEffect(() => {
    if (!isBreakRunning) return;
    const interval = setInterval(() => store.tickBreak(), 1000);
    return () => clearInterval(interval);
  }, [isBreakRunning, store]);

  const elapsedSeconds = useMemo(() => {
    if (!activeTimer) return 0;
    if (activeTimer.status !== "running") return activeTimer.paused_seconds;
    const startedAt = Date.parse(activeTimer.started_at);
    return activeTimer.paused_seconds + Math.max(0, Math.floor((now - startedAt) / 1000));
  }, [activeTimer, now]);

  const totalSeconds = useMemo(() => {
    if (phase === "focus") return (activeTimer?.duration_minutes ?? settings.focus_minutes) * 60;
    if (phase === "short-break") return settings.short_break_minutes * 60;
    return settings.long_break_minutes * 60;
  }, [phase, activeTimer?.duration_minutes, settings]);

  const remainingSeconds = useMemo(() => {
    if (phase === "focus") return Math.max(0, totalSeconds - elapsedSeconds);
    return breakSecondsLeft ?? totalSeconds;
  }, [phase, totalSeconds, elapsedSeconds, breakSecondsLeft]);

  const progress = useMemo(
    () => (totalSeconds > 0 ? remainingSeconds / totalSeconds : 0),
    [remainingSeconds, totalSeconds]
  );

  const handleTimerComplete = useCallback(
    async (issueId: string): Promise<TCompletePomodoroResponse | undefined> => {
      if (!activeTimer || activeTimer.status !== "running") return undefined;
      if (completingRef.current) return undefined;
      completingRef.current = true;
      try {
        const response = await store.completeTimer(settings.auto_create_time_log);

        if (settings.auto_start_break) {
          store.transitionToBreak();
          store.startBreak(); // auto-start the break countdown
          store.focusIssueId = issueId;
        } else {
          store.phase = "focus";
          store.breakSecondsLeft = null;
          store.focusIssueId = null;
        }

        return response;
      } finally {
        completingRef.current = false;
      }
    },
    [activeTimer, settings, store]
  );

  // auto-complete the focus session the moment its countdown hits zero
  useEffect(() => {
    if (phase !== "focus" || !activeTimer || activeTimer.status !== "running") return;
    if (remainingSeconds > 0) return;
    void handleTimerComplete(activeTimer.issue);
  }, [remainingSeconds, phase, activeTimer, handleTimerComplete]);

  const startFocus = useCallback(
    async (issueId: string, resetSession: boolean = true): Promise<TPomodoroTimer> => {
      if (resetSession) {
        store.sessionCount = 0;
      }
      return store.startTimer({ issue_id: issueId, duration_minutes: settings.focus_minutes });
    },
    [settings.focus_minutes, store]
  );

  // when the break countdown reaches zero, start the next focus session (if enabled)
  useEffect(() => {
    if (phase === "focus") return;
    if (breakSecondsLeft === null || breakSecondsLeft > 0) return;

    const nextFocusIssueId = focusIssueId;
    store.skipBreak();

    if (settings.auto_start_focus && nextFocusIssueId) {
      void startFocus(nextFocusIssueId, false);
    }
  }, [breakSecondsLeft, phase, focusIssueId, settings.auto_start_focus, startFocus, store]);

  const pause = useCallback(async () => {
    if (phase !== "focus") return;
    await store.pauseTimer();
  }, [phase, store]);

  const resume = useCallback(async () => {
    if (phase !== "focus") return;
    await store.resumeTimer();
  }, [phase, store]);

  const complete = useCallback(async (): Promise<TCompletePomodoroResponse> => {
    if (!activeTimer) throw new Error("No active pomodoro timer");
    const response = await handleTimerComplete(activeTimer.issue);
    if (!response) throw new Error("No active pomodoro timer");
    return response;
  }, [activeTimer, handleTimerComplete]);

  const discard = useCallback(async () => {
    await store.discardTimer();
  }, [store]);

  const isTimerRunning = phase === "focus" && activeTimer?.status === "running";
  const isTimerPaused = phase === "focus" && activeTimer?.status === "paused";

  return {
    activeTimer,
    settings,
    phase,
    sessionCount,
    remainingSeconds,
    totalSeconds,
    progress,
    isTimerRunning,
    isTimerPaused,
    hasActiveTimer,
    isBreak,
    isBreakRunning,
    isNextSessionReady,
    loader,
    startFocus,
    pause,
    resume,
    complete,
    discard,
    discardToBreak: store.discardToBreak,
    skipBreak: store.skipBreak,
    startBreak: store.startBreak,
    pauseBreak: store.pauseBreak,
  };
};
