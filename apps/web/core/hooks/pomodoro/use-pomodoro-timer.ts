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
import { claimPomodoroTransition } from "@/store/pomodoro/pomodoro-timer.store";
import { notifyPomodoroPhaseEnd } from "@/components/pomodoro/notify-phase-end";

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
  /** work item to resume after a break / skip */
  focusIssueId: string | null;
  focusIssueName: string | null;
  focusProjectId: string | null;
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
    isNextSessionReady,
    hasActiveTimer,
    loader,
    breakSecondsLeft,
    breakEndsAt,
    breakRunning,
    focusIssueId,
    focusIssueName,
    focusProjectId,
    awaitingFocusStart,
  } = store;

  // shared clock for focus + break remaining (absolute times stay aligned across tabs)
  const [now, setNow] = useState<number>(() => Date.now());

  // guards against double-completing a focus session / double break-end handling
  const completingRef = useRef(false);
  const breakEndHandledRef = useRef(false);

  useEffect(() => {
    const teardown = store.initCrossTabSync();
    void store.fetchTimers();
    return teardown;
  }, [store]);

  // tick while focus is running or a break countdown is running
  useEffect(() => {
    const shouldTick =
      (phase === "focus" && !!activeTimer && activeTimer.status === "running") ||
      (isBreak && breakRunning && breakEndsAt !== null);
    if (!shouldTick) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, activeTimer?.id, activeTimer?.status, isBreak, breakRunning, breakEndsAt]);

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
    if (phase === "focus") {
      if (awaitingFocusStart && !activeTimer) return totalSeconds;
      return Math.max(0, totalSeconds - elapsedSeconds);
    }
    if (breakRunning && breakEndsAt !== null) {
      return Math.max(0, Math.floor((breakEndsAt - now) / 1000));
    }
    return breakSecondsLeft ?? totalSeconds;
  }, [
    phase,
    totalSeconds,
    elapsedSeconds,
    breakRunning,
    breakEndsAt,
    breakSecondsLeft,
    now,
    awaitingFocusStart,
    activeTimer,
  ]);

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
        const issueName = activeTimer.issue_detail?.name ?? store.focusIssueName;
        const response = await store.completeTimer(settings.auto_create_time_log);

        void notifyPomodoroPhaseEnd({
          phase: "focus",
          issueName,
          settings,
          timerId: activeTimer.id,
        });

        if (settings.auto_start_break) {
          store.focusIssueId = issueId;
          store.transitionToBreak();
          store.startBreak();
        } else {
          store.clearBreakState();
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
    if (!claimPomodoroTransition(`complete:${activeTimer.id}`)) return;
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
    if (phase === "focus") {
      breakEndHandledRef.current = false;
      return;
    }
    if (remainingSeconds > 0) {
      breakEndHandledRef.current = false;
      return;
    }
    if (breakSecondsLeft === null && breakEndsAt === null) return;
    if (breakEndHandledRef.current) return;
    breakEndHandledRef.current = true;

    const claimToken = `break-end:${phase}:${sessionCount}:${breakEndsAt ?? breakSecondsLeft}`;
    if (!claimPomodoroTransition(claimToken)) return;

    void notifyPomodoroPhaseEnd({
      phase: "break",
      issueName: focusIssueName,
      settings,
      timerId: activeTimer?.id,
    });

    const nextFocusIssueId = focusIssueId;

    if (settings.auto_start_focus && nextFocusIssueId) {
      store.skipBreak();
      void startFocus(nextFocusIssueId, false);
    } else {
      store.markAwaitingFocusStart();
    }
  }, [
    remainingSeconds,
    phase,
    focusIssueId,
    focusIssueName,
    settings,
    startFocus,
    store,
    breakSecondsLeft,
    breakEndsAt,
    sessionCount,
    activeTimer?.id,
  ]);

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
  const derivedIsBreakRunning = isBreak && breakRunning && remainingSeconds > 0;

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
    isBreakRunning: derivedIsBreakRunning,
    isNextSessionReady,
    focusIssueId,
    focusIssueName,
    focusProjectId,
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
