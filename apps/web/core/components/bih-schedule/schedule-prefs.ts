/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useSyncExternalStore } from "react";

export type TScheduleMode = "calendar" | "working";
type TSchedulePrefs = { mode: TScheduleMode; pullEarlier: boolean };

const modeKey = "bih-gantt-schedule-mode";
const pullEarlierKey = "bih-gantt-pull-earlier";
const defaults: TSchedulePrefs = { mode: "calendar", pullEarlier: false };
const listeners = new Set<() => void>();

function readPrefs(): TSchedulePrefs {
  try {
    return {
      mode: localStorage.getItem(modeKey) === "working" ? "working" : "calendar",
      pullEarlier: localStorage.getItem(pullEarlierKey) === "1",
    };
  } catch {
    return defaults;
  }
}

let prefs = readPrefs();
const getSnapshot = () => prefs;
const getServerSnapshot = () => defaults;

function publish(next: TSchedulePrefs) {
  if (next.mode === prefs.mode && next.pullEarlier === prefs.pullEarlier) return;
  prefs = next;
  listeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent) {
  if (event.key === null || event.key === modeKey || event.key === pullEarlierKey) publish(readPrefs());
}

if (typeof window !== "undefined") window.addEventListener("storage", onStorage);

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setScheduleMode(mode: TScheduleMode) {
  try {
    localStorage.setItem(modeKey, mode);
  } catch {
    // Keep preferences usable when browser storage is unavailable.
  }
  publish({ ...prefs, mode });
}

export function setPullEarlier(pullEarlier: boolean) {
  try {
    localStorage.setItem(pullEarlierKey, pullEarlier ? "1" : "0");
  } catch {
    // Keep preferences usable when browser storage is unavailable.
  }
  publish({ ...prefs, pullEarlier });
}

export function useSchedulePrefs() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
