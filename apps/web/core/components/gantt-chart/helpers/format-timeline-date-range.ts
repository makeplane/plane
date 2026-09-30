/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { format, isSameDay } from "date-fns";
import { getDate } from "@plane/utils";

/** Format d.m.Y (kropki zamiast myślników wewnątrz daty — czytelniejszy zakres) */
const DATE_FULL = "dd.MM.yyyy";
/** Tylko dzień.miesiąc (gdy rok wspólny — rok tylko przy drugiej dacie) */
const DATE_DAY_MONTH = "dd.MM";

/**
 * Krótki opis zakresu dat bloku na osi czasu (sidebar Gantta).
 * Zwraca undefined, gdy brak obu dat.
 */
export function formatTimelineDateRange(
  startDate: string | Date | null | undefined,
  targetDate: string | Date | null | undefined
): string | undefined {
  const start = getDate(startDate ?? undefined);
  const end = getDate(targetDate ?? undefined);
  if (!start && !end) return undefined;
  if (start && end && isSameDay(start, end)) {
    return format(start, DATE_FULL);
  }
  if (start && end) {
    const sameYear = start.getFullYear() === end.getFullYear();
    if (sameYear) {
      return `${format(start, DATE_DAY_MONTH)} – ${format(end, DATE_FULL)}`;
    }
    return `${format(start, DATE_FULL)} – ${format(end, DATE_FULL)}`;
  }
  if (start) return format(start, DATE_FULL);
  if (end) return format(end, DATE_FULL);
}
