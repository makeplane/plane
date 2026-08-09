/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// plane types
import type { TCompletePomodoroResponse, TPomodoroSettings, TPomodoroTimer } from "@plane/types";
import { DEFAULT_POMODORO_SETTINGS } from "@plane/types";
// store hooks
import { usePomodoroTimerStore } from "@/hooks/store/use-pomodoro-timer-store";
import { useUserProfile } from "@/hooks/store/user";

export type TPomodoroPhase = "focus" | "short-break" | "long-break";

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
  loader: "fetch" | "start" | "mutate" | undefined;
  startFocus: (issueId: string) => Promise<TPomodoroTimer>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  complete: () => Promise<TCompletePomodoroResponse>;
  discard: () => Promise<void>;
  skipBreak: () => void;
};

export const usePomodoroTimer = (): TPomodoroTimerReturn => {
  const { activeTimer, loader, fetchTimers, startTimer, pauseTimer, resumeTimer, completeTimer, discardTimer } =
    usePomodoroTimerStore();
  const { data: userProfile } = useUserProfile();
  const settings = userProfile?.pomodoro_settings ?? DEFAULT_POMODORO_SETTINGS;

  // focus countdown clock (server-authoritative elapsed time)
  const [now, setNow] = useState<number>(() => Date.now());

  // client-side pomodoro phase state
  const [phase, setPhase] = useState<TPomodoroPhase>("focus");
  const [sessionCount, setSessionCount] = useState<number>(0);
  const [breakSecondsLeft, setBreakSecondsLeft] = useState<number | null>(null);
  const [focusIssueId, setFocusIssueId] = useState<string | null>(null);

  // guards against double-completing a focus session
  const completingRef = useRef(false);

  useEffect(() => {
    void fetchTimers();
  }, [fetchTimers]);

  // tick the clock only while a focus session is actually running
  useEffect(() => {
    if (phase !== "focus" || !activeTimer || activeTimer.status !== "running") return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, activeTimer?.id, activeTimer?.status]);

  // tick the break countdown
  useEffect(() => {
    if (phase === "focus" || breakSecondsLeft === null || breakSecondsLeft <= 0) return;
    const interval = setInterval(() => setBreakSecondsLeft((seconds) => (seconds === null ? 0 : seconds - 1)), 1000);
    return () => clearInterval(interval);
  }, [phase, breakSecondsLeft]);

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
        const response = await completeTimer(settings.auto_create_time_log);

        const nextCount = sessionCount + 1;
        const isLongBreak =
          settings.sessions_before_long_break > 0 && nextCount % settings.sessions_before_long_break === 0;

        if (settings.auto_start_break) {
          const breakMinutes = isLongBreak ? settings.long_break_minutes : settings.short_break_minutes;
          setSessionCount(nextCount);
          setPhase(isLongBreak ? "long-break" : "short-break");
          setBreakSecondsLeft(breakMinutes * 60);
          setFocusIssueId(issueId);
        } else {
          setSessionCount(nextCount);
          setPhase("focus");
          setFocusIssueId(null);
          setBreakSecondsLeft(null);
        }

        return response;
      } finally {
        completingRef.current = false;
      }
    },
    [activeTimer, settings, sessionCount, completeTimer]
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
        setSessionCount(0);
      }
      setFocusIssueId(issueId);
      setPhase("focus");
      setBreakSecondsLeft(null);
      return startTimer({ issue_id: issueId, duration_minutes: settings.focus_minutes });
    },
    [settings.focus_minutes, startTimer]
  );

  // when the break countdown reaches zero, start the next focus session (if enabled)
  useEffect(() => {
    if (phase === "focus") return;
    if (breakSecondsLeft === null || breakSecondsLeft > 0) return;

    const nextFocusIssueId = focusIssueId;
    setPhase("focus");
    setBreakSecondsLeft(null);

    if (settings.auto_start_focus && nextFocusIssueId) {
      void startFocus(nextFocusIssueId, false);
    }
  }, [breakSecondsLeft, phase, focusIssueId, settings.auto_start_focus, startFocus]);

  const pause = useCallback(async () => {
    if (phase !== "focus") return;
    await pauseTimer();
  }, [phase, pauseTimer]);

  const resume = useCallback(async () => {
    if (phase !== "focus") return;
    await resumeTimer();
  }, [phase, resumeTimer]);

  const complete = useCallback(async (): Promise<TCompletePomodoroResponse> => {
    if (!activeTimer) throw new Error("No active pomodoro timer");
    const response = await handleTimerComplete(activeTimer.issue);
    if (!response) throw new Error("No active pomodoro timer");
    return response;
  }, [activeTimer, handleTimerComplete]);

  const discard = useCallback(async () => {
    setPhase("focus");
    setBreakSecondsLeft(null);
    await discardTimer();
  }, [discardTimer]);

  const skipBreak = useCallback(() => {
    if (phase === "focus") return;
    const nextFocusIssueId = focusIssueId;
    setPhase("focus");
    setBreakSecondsLeft(null);
    if (nextFocusIssueId) {
      void startFocus(nextFocusIssueId, false);
    }
  }, [phase, focusIssueId, startFocus]);

  const isTimerRunning = phase === "focus" && activeTimer?.status === "running";
  const isTimerPaused = phase === "focus" && activeTimer?.status === "paused";
  const hasActiveTimer = !!activeTimer && (activeTimer.status === "running" || activeTimer.status === "paused");
  const isBreak = phase !== "focus";

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
    loader,
    startFocus,
    pause,
    resume,
    complete,
    discard,
    skipBreak,
  };
};
