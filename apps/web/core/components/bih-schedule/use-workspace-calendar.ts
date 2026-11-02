/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { buildCalendar } from "@/components/gantt-chart/dependencies/scheduling";
import { scheduleService } from "./schedule-service";
import type { TScheduleSettings } from "./schedule-service";

type TCalendarState = {
  calendar: { weekdays: Set<number>; holidays: Set<string> } | null;
  settings: TScheduleSettings | null;
  supported: boolean;
};
type TCalendarEntry = {
  state: TCalendarState;
  loaded: boolean;
  pending?: Promise<void>;
  listeners: Set<() => void>;
};

const emptyState: TCalendarState = { calendar: null, settings: null, supported: false };
const cache = new Map<string, TCalendarEntry>();

function getEntry(slug: string): TCalendarEntry {
  let entry = cache.get(slug);
  if (!entry) {
    entry = { state: emptyState, loaded: false, listeners: new Set() };
    cache.set(slug, entry);
  }
  return entry;
}

async function loadCalendar(slug: string, reload = false): Promise<void> {
  if (!slug) return;
  const entry = getEntry(slug);
  if (entry.pending) return entry.pending;
  if (entry.loaded && !reload) return;
  entry.pending = (async () => {
    try {
      const settings = await scheduleService.getSettings(slug);
      const calendar = buildCalendar(
        settings.working_weekdays,
        settings.holidays.map((holiday) => holiday.date)
      );
      entry.state = { calendar, settings, supported: true };
    } catch {
      entry.state = emptyState;
    } finally {
      entry.loaded = true;
      entry.pending = undefined;
      entry.listeners.forEach((listener) => listener());
    }
  })();
  return entry.pending;
}

export function useWorkspaceCalendar(workspaceSlug?: string) {
  const slug = workspaceSlug ?? "";
  const subscribe = useCallback(
    (listener: () => void) => {
      const entry = getEntry(slug);
      entry.listeners.add(listener);
      return () => entry.listeners.delete(listener);
    },
    [slug]
  );
  const getSnapshot = useCallback(() => getEntry(slug).state, [slug]);
  const state = useSyncExternalStore(subscribe, getSnapshot, () => emptyState);
  useEffect(() => {
    void loadCalendar(slug);
  }, [slug]);
  const reload = useCallback(() => loadCalendar(slug, true), [slug]);
  return { ...state, reload };
}
